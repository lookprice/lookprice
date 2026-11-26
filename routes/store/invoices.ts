import express from "express";
import { pool, addStockMovement } from "../../models/db";
import { getAuthorizedStoreId } from "../../middleware/auth";
import { getEInvoiceService } from "../einvoice";
import { getTurkishSearchSnippet, normalizeTurkishParam } from "./utils";
import { findMatchingProduct, findOrCreateProductForInvoiceItem, deduplicateInitialStockOnInvoiceMatch, transferAndCleanupInvoiceGeneratedProduct, saveSupplierMapping, sanitizeInvoiceItemCodes, isValidStandardBarcode, resolveExpenseClassification, revertInvoiceStockAndProducts, detectExpenseCategory, generateTempBarcode, hasProductMatchConflict, invalidateStoreProductsCache, extractModelTokens, isShopLPStore, isNonStockFeeOrServiceItem, DEFAULT_EXPENSE_CENTERS } from "./invoiceMatching";
import { mergeProducts } from "./products";
import { recalculateProductReservedStock, syncProductStockToMarketplaces } from "../../src/services/marketplaceSync";
import { recordInboundToStore, reconcileProductDefaultLocation } from "../../src/services/backend/warehouseService";
import {
  ensureTreasurySchema,
  isTermOrUnpaidMethod,
  isCancelledOrDraftStatus,
  isSettlementPaid,
  syncPurchaseInvoiceTreasury,
  syncSalesInvoiceTreasury,
  deletePortfolioTxForSource,
  deleteCheckNoteForSource,
  healInvoicePaymentTransactions
} from "./treasurySync";

const router = express.Router();

export async function initPurchaseInvoiceSchema() {
  try {
    await pool.query(`ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS variant_id VARCHAR(255);`);
    await pool.query(`ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS product_code VARCHAR(255);`);
    await pool.query(`ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS suggested_product_id INT;`);
    await pool.query(`ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS match_status VARCHAR(32);`);
    await pool.query(`ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS match_note TEXT;`);
    await pool.query(`ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS reserved_quantity NUMERIC DEFAULT 0;`);
    await pool.query(`ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS reserved_for TEXT;`);
    await pool.query(`ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS operator_status VARCHAR(32) DEFAULT 'completed';`);
    await pool.query(`ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS operator_processed_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS suggested_is_expense BOOLEAN;`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock NUMERIC DEFAULT 0;`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_details JSONB DEFAULT '[]'::jsonb;`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_expense_centers (
        id SERIAL PRIMARY KEY,
        store_id INT NOT NULL,
        key VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_store_expense_centers_store_key
      ON store_expense_centers (store_id, key);
    `);
    await pool.query(`
      UPDATE purchase_invoices
      SET operator_status = 'completed'
      WHERE operator_status IS NULL;
    `);
    await pool.query(`ALTER TABLE sales_invoice_items ADD COLUMN IF NOT EXISTS variant_id VARCHAR(255);`);
    await pool.query(`ALTER TABLE sales_invoice_items ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE sales_invoice_items ADD COLUMN IF NOT EXISTS product_code VARCHAR(255);`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR(255);`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(255);`);
    await pool.query(`ALTER TABLE supplier_product_mappings ADD COLUMN IF NOT EXISTS supplier_product_code VARCHAR(255);`);
    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS company_title VARCHAR(255);`);
    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS gi_exemption_reason_text TEXT;`);
    await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS company_id INT;`);
    await pool.query(`
      UPDATE sales_invoices
      SET invoice_number = document_number
      WHERE (invoice_number IS NULL OR TRIM(invoice_number) = '')
        AND document_number IS NOT NULL AND TRIM(document_number) != '';
    `);
    await pool.query(`
      UPDATE purchase_invoices
      SET invoice_number = document_number
      WHERE (invoice_number IS NULL OR TRIM(invoice_number) = '')
        AND document_number IS NOT NULL AND TRIM(document_number) != '';
    `);
  } catch (e) {
    console.error("Failed to alter purchase_invoice_items / sales_invoices table columns:", e);
  }

  try {
    // 1. Auto-repair sales_invoice_items missing product_id where barcode, code or exact name exists
    await pool.query(`
      UPDATE sales_invoice_items sii
      SET product_id = p.id
      FROM sales_invoices si, products p
      WHERE sii.sales_invoice_id = si.id
        AND p.store_id = si.store_id
        AND (sii.product_id IS NULL OR sii.product_id = 0)
        AND (
          (p.barcode = sii.barcode AND sii.barcode IS NOT NULL AND sii.barcode != '')
          OR (p.product_code IS NOT NULL AND p.product_code != '' AND (p.product_code = sii.product_code OR p.product_code = sii.barcode))
          OR (p.sku IS NOT NULL AND p.sku != '' AND (p.sku = sii.product_code OR p.sku = sii.barcode))
          OR (LOWER(TRIM(p.name)) = LOWER(TRIM(sii.product_name)) AND LENGTH(TRIM(p.name)) >= 3)
        )
    `);

    // 2. Self-Healing 5-Gate Product Matching & Stock Reconciliation for purchase_invoice_items
    // a) Unlink & heal any existing purchase_invoice_items that violate the 5-Gate Conflict Veto (e.g. Kingston matched to TwinMOS)
    // b) Match any unmatched purchase_invoice_items using the 5-Gate findMatchingProduct engine
    try {
      const piiCheckRes = await pool.query(`
        SELECT pii.id, pii.purchase_invoice_id, pi.store_id, pi.invoice_number, pi.document_number, pi.supplier_name, pi.tax_number, pi.currency, pi.invoice_date, pi.created_at,
               pii.product_name, pii.barcode, pii.product_code, pii.product_id, pii.quantity, pii.system_quantity, pii.unit_price,
               p.name as cur_prod_name, p.barcode as cur_prod_barcode, COALESCE(p.product_code, p.sku, '') as cur_prod_code, p.brand as cur_prod_brand
        FROM purchase_invoice_items pii
        JOIN purchase_invoices pi ON pii.purchase_invoice_id = pi.id
        LEFT JOIN products p ON pii.product_id = p.id
        WHERE COALESCE(pi.is_expense, FALSE) = FALSE
          AND COALESCE(pi.operator_status, 'completed') = 'completed'
        ORDER BY pii.id ASC
      `);

      // Also clean up any poisoned supplier_product_mappings that violate 5-Gate Conflict Veto
      const spmRes = await pool.query(`
        SELECT spm.id, spm.supplier_product_name, p.name as prod_name, p.brand as prod_brand
        FROM supplier_product_mappings spm
        JOIN products p ON spm.product_id = p.id
      `);
      for (const spm of spmRes.rows) {
        if (hasProductMatchConflict(spm.supplier_product_name, spm.prod_name, { productBrand: spm.prod_brand })) {
          await pool.query("DELETE FROM supplier_product_mappings WHERE id = $1", [spm.id]);
          console.log(`[5-Gate Veto] Deleted poisoned supplier mapping #${spm.id}: "${spm.supplier_product_name}" != "${spm.prod_name}"`);
        }
      }
      invalidateStoreProductsCache();

      for (const item of piiCheckRes.rows) {
        const hasConflict = item.product_id
          ? hasProductMatchConflict(item.product_name, item.cur_prod_name, { productBrand: item.cur_prod_brand })
          : false;

        if (!hasConflict && item.product_id) {
          continue; // Validly matched, untouched
        }

        const qty = item.system_quantity != null ? Number(item.system_quantity) : Number(item.quantity || 1);
        const invNum = item.document_number || item.invoice_number || '';

        // If there was a false-positive match, revert the wrong product's stock & delete its wrong stock movement
        if (hasConflict && item.product_id) {
          console.log(`[5-Gate Self-Heal] Vetoing false match on Invoice #${invNum} Item #${item.id}: "${item.product_name}" was wrongly linked to #${item.product_id} "${item.cur_prod_name}"`);
          const delMov = await pool.query(
            `DELETE FROM stock_movements
             WHERE store_id = $1 AND product_id = $2
               AND (source = 'purchase_invoice' OR invoice_type = 'purchase')
               AND (invoice_id = $3 OR invoice_number = $4 OR description LIKE $5)
             RETURNING quantity`,
            [item.store_id, item.product_id, item.purchase_invoice_id, invNum, `%${invNum}%`]
          );
          if (delMov.rows.length > 0 && qty > 0) {
            await pool.query(
              "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
              [qty, item.product_id, item.store_id]
            );
          }
        }

        // Now run the 5-Gate Matching Engine to find the true inventory product (if one exists)
        // Strip barcode/product_code if they were overwritten by the wrong product's barcode/code
        const cleanBarcode = hasConflict && item.barcode === item.cur_prod_barcode ? null : item.barcode;
        const cleanCode = hasConflict && item.product_code === item.cur_prod_code ? null : item.product_code;

        const match = await findMatchingProduct(pool, item.store_id, {
          supplierVkn: item.tax_number,
          productName: item.product_name,
          barcode: cleanBarcode,
          productCode: cleanCode
        });

        if (match) {
          await pool.query(
            "UPDATE purchase_invoice_items SET product_id = $1, barcode = COALESCE($2, $3), product_code = COALESCE($4, $5) WHERE id = $6",
            [match.productId, match.barcode, cleanBarcode, match.productCode, cleanCode, item.id]
          );

          if (item.tax_number && item.product_name) {
            await saveSupplierMapping(pool, item.store_id, item.tax_number, item.product_name, match.productId, match.productCode || cleanCode);
          }

          // Ensure stock movement and stock_quantity are credited to the matched product
          const movExists = await pool.query(
            `SELECT 1 FROM stock_movements
             WHERE store_id = $1 AND product_id = $2
               AND (source = 'purchase_invoice' OR invoice_type = 'purchase')
               AND invoice_id = $3
             LIMIT 1`,
            [item.store_id, match.productId, item.purchase_invoice_id]
          );
          if (movExists.rows.length === 0 && qty > 0) {
            await pool.query(
              "UPDATE products SET stock_quantity = COALESCE(stock_quantity, 0) + $1::numeric, cost_price = CASE WHEN COALESCE($2::numeric, 0) > 0 THEN $2::numeric ELSE cost_price END, cost_currency = COALESCE($3, cost_currency) WHERE id = $4 AND store_id = $5",
              [Math.round(qty), Number(item.unit_price || 0), item.currency || 'TRY', match.productId, item.store_id]
            );
            await pool.query(
              `INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, customer_info, currency, created_at, invoice_id, invoice_type, invoice_number)
               VALUES ($1, $2, 'in', $3, 'purchase_invoice', $4, $5, $6, $7, $8, $9, 'purchase', $10)`,
              [
                item.store_id,
                match.productId,
                Math.round(qty),
                `Alış Faturası: ${invNum}`,
                Number(item.unit_price || 0),
                item.supplier_name || 'Tedarikçi',
                item.currency || 'TRY',
                item.invoice_date || item.created_at || new Date(),
                item.purchase_invoice_id,
                invNum
              ]
            );
          }
          console.log(`[5-Gate Self-Heal] Linked Invoice #${invNum} Item #${item.id} ("${item.product_name}") -> Product #${match.productId} ("${match.name}") [${match.matchType}]`);
        } else if (hasConflict) {
          // Restore clean unmatched state without corrupt barcode from the wrong product
          const extractedTokens = extractModelTokens(item.product_name);
          const restoredCode = cleanCode || (extractedTokens.length > 0 ? extractedTokens[0] : null);
          await pool.query(
            "UPDATE purchase_invoice_items SET product_id = NULL, barcode = $1, product_code = $2 WHERE id = $3",
            [cleanBarcode, restoredCode, item.id]
          );
          console.log(`[5-Gate Self-Heal] Unlinked Invoice #${invNum} Item #${item.id} ("${item.product_name}") to clean unmatched state (code: ${restoredCode || '-'})`);
        }
      }
    } catch (healErr) {
      console.error("[5-Gate Self-Heal] Error during purchase invoice item reconciliation:", healErr);
    }

    // 2.5 Auto-repair products table names where product name is HB code, barcode or code, using actual product names from purchase invoices
    await pool.query(`
      UPDATE products p
      SET name = pii.product_name,
          updated_at = CURRENT_TIMESTAMP
      FROM purchase_invoice_items pii, purchase_invoices pi
      WHERE pii.purchase_invoice_id = pi.id
        AND pi.store_id = p.store_id
        AND (pii.product_id = p.id OR (pii.barcode IS NOT NULL AND pii.barcode != '' AND pii.barcode = p.barcode))
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
        AND NOT (pii.product_name ~ '^\\d+$');
    `);

    // 2.6 Clean up bad or orphaned stock movements with product_id 0 or NULL
    await pool.query("DELETE FROM stock_movements WHERE product_id IS NULL OR product_id = 0");


    // 4. Auto-repair existing products & purchase_invoice_items where non-standard barcode strings (e.g., TRU16977, letters, AUTO-) were placed in barcode
    const invalidProds = await pool.query(
      `SELECT id, store_id, barcode, product_code, sku FROM products 
       WHERE barcode IS NOT NULL AND barcode != '' 
         AND (barcode ~ '[^0-9]' OR LENGTH(barcode) < 8 OR LENGTH(barcode) > 14 OR barcode LIKE 'AUTO-%')`
    );
    for (const prod of invalidProds.rows) {
      const oldBarcode = prod.barcode ? prod.barcode.trim() : '';
      if (!oldBarcode) continue;
      
      const newProdCode = prod.product_code || prod.sku || (oldBarcode.startsWith("AUTO-") ? null : oldBarcode);
      // Generate temp 13-digit numeric barcode
      const timeStr = Date.now().toString().slice(-9);
      const randDigit = Math.floor(Math.random() * 10).toString();
      const tempBarcode = `200${timeStr}${randDigit}`;

      await pool.query(
        `UPDATE products 
         SET barcode = $1, 
             product_code = COALESCE(product_code, $2), 
             sku = COALESCE(sku, $2) 
         WHERE id = $3`,
        [tempBarcode, newProdCode, prod.id]
      );

      await pool.query(
        `UPDATE purchase_invoice_items 
         SET barcode = $1, 
             product_code = COALESCE(product_code, $2) 
         WHERE product_id = $3 OR barcode = $4`,
        [tempBarcode, newProdCode, prod.id, oldBarcode]
      );
    }

    // 4b. Auto-consolidate high-confidence duplicate products (temporary barcodes matching real inventory products)
    try {
      const dupQuery = await pool.query(`
        SELECT 
          t.id as source_id, t.store_id, t.name as source_name, t.barcode as source_barcode,
          r.id as target_id, r.name as target_name, r.barcode as target_barcode
        FROM products t
        JOIN products r ON t.store_id = r.store_id AND t.id != r.id
        WHERE (t.barcode LIKE '200%' OR t.barcode LIKE 'TEMP%')
          AND r.barcode NOT LIKE '200%' AND r.barcode NOT LIKE 'TEMP%'
          AND (
            (t.product_code IS NOT NULL AND t.product_code != '' AND (t.product_code = r.product_code OR t.product_code = r.sku))
            OR (t.sku IS NOT NULL AND t.sku != '' AND (t.sku = r.sku OR t.sku = r.product_code))
            OR (LOWER(TRIM(t.name)) = LOWER(TRIM(r.name)))
          )
        ORDER BY t.id ASC
      `);

      for (const pair of dupQuery.rows) {
        try {
          await mergeProducts(pool, pair.source_id, pair.target_id, pair.store_id);
          console.log(`[Auto-Consolidate] Merged duplicate product #${pair.source_id} (${pair.source_name}) -> #${pair.target_id} (${pair.target_name})`);
        } catch (mErr: any) {
          console.warn(`[Auto-Consolidate] Skipped #${pair.source_id}:`, mErr.message);
        }
      }
    } catch (dupErr) {
      console.error("Auto-consolidate duplicates error:", dupErr);
    }

    // 5. Auto-link missing company_id on purchase_invoices by tax_number or supplier_name
    await pool.query(`
      UPDATE purchase_invoices pi
      SET company_id = c.id
      FROM companies c
      WHERE pi.company_id IS NULL 
        AND pi.tax_number IS NOT NULL AND pi.tax_number != ''
        AND c.store_id = pi.store_id
        AND c.tax_number = pi.tax_number
    `);

    await pool.query(`
      UPDATE purchase_invoices pi
      SET company_id = c.id
      FROM companies c
      WHERE pi.company_id IS NULL 
        AND pi.supplier_name IS NOT NULL AND pi.supplier_name != ''
        AND c.store_id = pi.store_id
        AND LOWER(TRIM(c.title)) = LOWER(TRIM(pi.supplier_name))
    `);

    // 6. Auto-repair missing transactions in current_account_transactions & heal erroneous open-account payments
    await ensureTreasurySchema(pool);
    await healInvoicePaymentTransactions(pool);

    // a) Ensure credit transaction exists for all linked non-draft/non-cancelled purchase_invoices
    await pool.query(`
      INSERT INTO current_account_transactions 
        (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, transaction_date)
      SELECT 
        pi.store_id, 
        pi.company_id, 
        pi.id, 
        'credit', 
        COALESCE(NULLIF(pi.grand_total, 0), pi.total_amount, 0),
        COALESCE(pi.currency, 'TRY'),
        COALESCE(pi.exchange_rate, 1),
        'Alış Faturası: ' || COALESCE(NULLIF(pi.document_number, ''), pi.invoice_number),
        COALESCE(pi.invoice_date::timestamp, pi.created_at)
      FROM purchase_invoices pi
      WHERE pi.company_id IS NOT NULL 
        AND COALESCE(NULLIF(pi.grand_total, 0), pi.total_amount, 0) > 0
        AND LOWER(TRIM(COALESCE(pi.status, ''))) NOT IN ('draft', 'taslak', 'cancelled', 'canceled', 'iptal', 'iptal edildi')
        AND NOT EXISTS (
          SELECT 1 FROM current_account_transactions cat
          WHERE cat.purchase_invoice_id = pi.id AND cat.type = 'credit'
        )
    `);

    // b) Ensure debt (payment) transaction exists ONLY for genuinely paid purchase invoices (never open-account/term/cancelled/draft)
    await pool.query(`
      INSERT INTO current_account_transactions 
        (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date)
      SELECT 
        pi.store_id, 
        pi.company_id, 
        pi.id, 
        'debt', 
        COALESCE(NULLIF(pi.grand_total, 0), pi.total_amount, 0),
        COALESCE(pi.currency, 'TRY'),
        COALESCE(pi.exchange_rate, 1),
        'Alış Faturası Ödemesi: ' || COALESCE(NULLIF(pi.document_number, ''), pi.invoice_number) || CASE WHEN pi.payment_method IS NOT NULL THEN ' (' || pi.payment_method || ')' ELSE '' END,
        COALESCE(NULLIF(TRIM(pi.payment_method), ''), 'cash'),
        COALESCE(pi.invoice_date::timestamp, pi.created_at)
      FROM purchase_invoices pi
      WHERE pi.company_id IS NOT NULL 
        AND COALESCE(NULLIF(pi.grand_total, 0), pi.total_amount, 0) > 0
        AND LOWER(TRIM(COALESCE(pi.status, ''))) NOT IN ('draft', 'taslak', 'cancelled', 'canceled', 'iptal', 'iptal edildi')
        AND LOWER(TRIM(COALESCE(pi.payment_method, ''))) NOT IN ('term', 'open_account', 'open', 'unpaid', 'vadeli', 'acik_hesap', 'acik hesap', 'açık hesap', 'açık hesap-cari', 'cari')
        AND (
          LOWER(TRIM(COALESCE(pi.payment_status, ''))) IN ('paid', 'odendi', 'ödendi')
          OR COALESCE(TRIM(pi.payment_method), '') <> ''
        )
        AND NOT EXISTS (
          SELECT 1 FROM current_account_transactions cat
          WHERE cat.purchase_invoice_id = pi.id AND cat.type = 'debt'
        )
    `);

    // c) Auto-repair sales invoices missing company_id, sync titles from companies
    try {
      // 1. Re-link sales invoices by tax_number to real companies
      await pool.query(`
        UPDATE sales_invoices si
        SET company_id = c.id,
            company_title = c.title,
            customer_name = c.title
        FROM companies c
        WHERE c.store_id = si.store_id 
          AND c.tax_number = si.tax_number
          AND c.tax_number IS NOT NULL
          AND c.tax_number != ''
          AND c.tax_number != '11111111111'
          AND c.title != 'Bireysel Web Müşterisi'
          AND (si.company_id IS NULL OR si.company_title = 'Bireysel Web Müşterisi');
      `);

      // 2. Sync company_title and customer_name from existing valid company_id
      await pool.query(`
        UPDATE sales_invoices si
        SET company_title = c.title,
            customer_name = c.title
        FROM companies c
        WHERE si.company_id = c.id 
          AND c.title != 'Bireysel Web Müşterisi'
          AND (si.company_title IS NULL OR si.company_title = 'Bireysel Web Müşterisi' OR si.customer_name = 'Bireysel Web Müşterisi');
      `);

      // 3. For invoices and customers, sync full AD+SOYAD names
      await pool.query(`
        UPDATE customers
        SET full_name = TRIM(CONCAT_WS(' ', name, surname))
        WHERE surname IS NOT NULL AND surname != '' 
          AND (full_name IS NULL OR full_name = '' OR full_name = name);
      `);

      await pool.query(`
        UPDATE customers cust
        SET full_name = s.customer_name,
            surname = COALESCE(NULLIF(cust.surname, ''), SPLIT_PART(s.customer_name, ' ', 2))
        FROM sales s
        WHERE s.customer_id = cust.id
          AND s.customer_name LIKE '% %'
          AND (cust.full_name IS NULL OR cust.full_name NOT LIKE '% %' OR cust.full_name = 'Müşteri' OR cust.full_name = 'Bireysel Web Müşterisi');
      `);

      await pool.query(`
        UPDATE sales_invoices si
        SET customer_name = COALESCE(
              NULLIF(s.customer_name, ''),
              NULLIF(TRIM(CONCAT_WS(' ', cust.name, cust.surname)), ''),
              NULLIF(cust.full_name, ''),
              si.customer_name
            ),
            company_title = COALESCE(
              NULLIF(s.customer_name, ''),
              NULLIF(TRIM(CONCAT_WS(' ', cust.name, cust.surname)), ''),
              NULLIF(cust.full_name, ''),
              si.company_title
            )
        FROM sales s
        LEFT JOIN customers cust ON cust.id = s.customer_id
        WHERE si.sale_id = s.id
          AND (
            si.customer_name IS NULL 
            OR si.customer_name = 'Bireysel Web Müşterisi'
            OR si.customer_name = 'Müşteri'
            OR (si.customer_name NOT LIKE '% %' AND s.customer_name LIKE '% %')
          );
      `);

      await pool.query(`
        UPDATE sales_invoices si
        SET customer_name = COALESCE(
              NULLIF(TRIM(CONCAT_WS(' ', cust.name, cust.surname)), ''),
              NULLIF(cust.full_name, ''),
              si.customer_name
            ),
            company_title = COALESCE(
              NULLIF(TRIM(CONCAT_WS(' ', cust.name, cust.surname)), ''),
              NULLIF(cust.full_name, ''),
              si.company_title
            )
        FROM customers cust
        WHERE si.customer_id = cust.id
          AND (
            si.customer_name IS NULL 
            OR si.customer_name = 'Bireysel Web Müşterisi'
            OR si.customer_name = 'Müşteri'
            OR (si.customer_name NOT LIKE '% %' AND cust.surname IS NOT NULL AND cust.surname != '')
          );
      `);
    } catch (err) {
      console.error("Failed to sync sales invoices with companies:", err);
    }

      // d) Ensure debt transaction exists for all linked non-draft/non-cancelled sales_invoices
      await pool.query(`
        INSERT INTO current_account_transactions 
          (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, transaction_date)
        SELECT 
          si.store_id, 
          si.company_id, 
          si.id, 
          'debt', 
          COALESCE(NULLIF(si.grand_total, 0), si.total_amount, 0),
          COALESCE(si.currency, 'TRY'),
          COALESCE(si.exchange_rate, 1),
          'Satış Faturası: ' || COALESCE(NULLIF(si.document_number, ''), si.invoice_number),
          COALESCE(si.invoice_date::timestamp, si.created_at)
        FROM sales_invoices si
        WHERE si.company_id IS NOT NULL 
          AND COALESCE(NULLIF(si.grand_total, 0), si.total_amount, 0) > 0
          AND LOWER(TRIM(COALESCE(si.status, ''))) NOT IN ('draft', 'taslak', 'cancelled', 'canceled', 'iptal', 'iptal edildi')
          AND NOT EXISTS (
            SELECT 1 FROM current_account_transactions cat
            WHERE cat.sales_invoice_id = si.id AND cat.type = 'debt'
          )
      `);

      // e) Ensure credit (collection) transaction exists ONLY for paid non-draft/non-cancelled sales invoices
      await pool.query(`
        INSERT INTO current_account_transactions 
          (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date)
        SELECT 
          si.store_id, 
          si.company_id, 
          si.id, 
          'credit', 
          COALESCE(NULLIF(si.grand_total, 0), si.total_amount, 0),
          COALESCE(si.currency, 'TRY'),
          COALESCE(si.exchange_rate, 1),
          'Satış Faturası Tahsilatı: ' || COALESCE(NULLIF(si.document_number, ''), si.invoice_number) || CASE WHEN si.payment_method IS NOT NULL THEN ' (' || si.payment_method || ')' ELSE '' END,
          COALESCE(NULLIF(TRIM(si.payment_method), ''), 'cash'),
          COALESCE(si.invoice_date::timestamp, si.created_at)
        FROM sales_invoices si
        WHERE si.company_id IS NOT NULL 
          AND COALESCE(NULLIF(si.grand_total, 0), si.total_amount, 0) > 0
          AND LOWER(TRIM(COALESCE(si.status, ''))) NOT IN ('draft', 'taslak', 'cancelled', 'canceled', 'iptal', 'iptal edildi')
          AND LOWER(TRIM(COALESCE(si.payment_method, ''))) NOT IN ('', 'term', 'open_account', 'open', 'unpaid', 'vadeli', 'acik_hesap', 'acik hesap', 'açık hesap', 'açık hesap-cari', 'cari')
          AND NOT EXISTS (
            SELECT 1 FROM current_account_transactions cat
            WHERE cat.sales_invoice_id = si.id AND cat.type = 'credit'
          )
      `);

      // f) If there are sale_id current_account_transactions with type='credit' where no debt exists, create the corresponding debt!
      await pool.query(`
        INSERT INTO current_account_transactions 
          (store_id, company_id, sale_id, type, amount, currency, exchange_rate, description, transaction_date)
        SELECT 
          cat.store_id,
          cat.company_id,
          cat.sale_id,
          'debt',
          COALESCE(s.total_amount, cat.amount),
          COALESCE(s.currency, cat.currency, 'TRY'),
          COALESCE(s.exchange_rate, cat.exchange_rate, 1),
          'Satış #' || cat.sale_id,
          COALESCE(s.created_at, cat.transaction_date, NOW())
        FROM current_account_transactions cat
        LEFT JOIN sales s ON cat.sale_id = s.id
        WHERE cat.sale_id IS NOT NULL 
          AND cat.type = 'credit'
          AND NOT EXISTS (
            SELECT 1 FROM current_account_transactions debt_cat
            WHERE debt_cat.sale_id = cat.sale_id AND debt_cat.type = 'debt'
          )
      `);

      // g) Repair null store_id in current_account_transactions
      await pool.query(`
        UPDATE current_account_transactions cat
        SET store_id = c.store_id
        FROM companies c
        WHERE cat.company_id = c.id AND (cat.store_id IS NULL OR cat.store_id = 0)
      `);

      // h) Auto-repair products with stock_quantity that lack ANY stock_movements or invoice items
      await pool.query(`
        INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, currency, created_at)
        SELECT 
          p.store_id,
          p.id,
          'in',
          p.stock_quantity,
          'initial_stock',
          'Açılış Stok / Devir Kaydı',
          COALESCE(NULLIF(p.cost_price, 0), p.price, 0),
          COALESCE(p.currency, 'TRY'),
          COALESCE(p.created_at, CURRENT_TIMESTAMP)
        FROM products p
        WHERE p.stock_quantity > 0
          AND NOT EXISTS (
            SELECT 1 FROM stock_movements sm
            WHERE sm.product_id = p.id
          )
          AND NOT EXISTS (
            SELECT 1 FROM purchase_invoice_items pii
            WHERE pii.product_id = p.id
          )
          AND NOT EXISTS (
            SELECT 1 FROM sales_invoice_items sii
            WHERE sii.product_id = p.id
          )
      `);
  } catch (e) {
    console.error("Failed to alter purchase_invoice_items schema / stock sync:", e);
  }
}

async function resolveProductInfo(clientOrPool: any, storeId: number, productId: any, barcode: any, productCode?: any, productName?: string | null) {
  let resolvedId = productId ? Number(productId) : null;
  let rawBarcode = barcode ? String(barcode).trim() : '';
  let rawCode = productCode ? String(productCode).trim() : '';

  if ((!resolvedId || isNaN(resolvedId))) {
    // 1. Try matching barcode or product_code by barcode (guarded by 5-Gate Conflict Veto)
    if (rawBarcode) {
      const pRes = await clientOrPool.query(
        "SELECT id, barcode, COALESCE(product_code, sku, '') as product_code, name, brand FROM products WHERE store_id = $1 AND (barcode = $2 OR product_code = $2 OR sku = $2) LIMIT 5",
        [storeId, rawBarcode]
      );
      for (const row of pRes.rows) {
        if (productName && hasProductMatchConflict(productName, row.name, { productBrand: row.brand })) continue;
        resolvedId = row.id;
        rawBarcode = row.barcode || rawBarcode;
        rawCode = row.product_code || rawCode;
        break;
      }
    }
    // 2. Try matching by productCode / SKU if still unresolved (guarded by 5-Gate Conflict Veto)
    if ((!resolvedId || isNaN(resolvedId)) && rawCode) {
      const pRes = await clientOrPool.query(
        "SELECT id, barcode, COALESCE(product_code, sku, '') as product_code, name, brand FROM products WHERE store_id = $1 AND (LOWER(product_code) = LOWER($2) OR LOWER(sku) = LOWER($2) OR barcode = $2) LIMIT 5",
        [storeId, rawCode]
      );
      for (const row of pRes.rows) {
        if (productName && hasProductMatchConflict(productName, row.name, { productBrand: row.brand })) continue;
        resolvedId = row.id;
        rawBarcode = row.barcode || rawBarcode;
        rawCode = row.product_code || rawCode;
        break;
      }
    }
  } else if (resolvedId && (!rawBarcode || !rawCode)) {
    const pRes = await clientOrPool.query(
      "SELECT barcode, COALESCE(product_code, sku, '') as product_code FROM products WHERE id = $1 LIMIT 1",
      [resolvedId]
    );
    if (pRes.rows.length > 0) {
      if (!rawBarcode) rawBarcode = pRes.rows[0].barcode || '';
      if (!rawCode) rawCode = pRes.rows[0].product_code || '';
    }
  }

  // Sanitize to prevent non-standard strings like "TRU16977" from becoming barcode
  const sanitized = sanitizeInvoiceItemCodes(rawBarcode, null, null, rawCode);

  return { 
    productId: resolvedId, 
    barcode: sanitized.barcode, 
    productCode: sanitized.productCode || rawCode || null 
  };
}

// --- Sales Invoices ---

router.get("/sales", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const { startDate, endDate, status, search } = req.query;

    let query = `
       SELECT si.*, 
             COALESCE(NULLIF(TRIM(si.invoice_number), ''), NULLIF(TRIM(si.document_number), '')) as invoice_number,
             COALESCE(si.company_id, comp_match.id) as company_id,
             COALESCE(
               NULLIF(c.title, 'Bireysel Web Müşterisi'),
               NULLIF(comp_match.title, 'Bireysel Web Müşterisi'),
               NULLIF(NULLIF(NULLIF(TRIM(CONCAT_WS(' ', cust.name, cust.surname)), ''), 'Amazon Müşterisi'), 'Bireysel Web Müşterisi'),
               NULLIF(NULLIF(NULLIF(cust.full_name, ''), 'Amazon Müşterisi'), 'Bireysel Web Müşterisi'),
               NULLIF(NULLIF(s.customer_name, ''), 'Amazon Müşterisi'),
               NULLIF(NULLIF(si.customer_name, ''), 'Amazon Müşterisi'),
               NULLIF(si.company_title, 'Bireysel Web Müşterisi'),
               NULLIF(s.customer_name, 'Amazon Müşterisi'),
               NULLIF(si.customer_name, 'Amazon Müşterisi'),
               'Müşteri'
             ) as company_title,
             COALESCE(
               NULLIF(c.title, 'Bireysel Web Müşterisi'),
               NULLIF(comp_match.title, 'Bireysel Web Müşterisi'),
               NULLIF(NULLIF(NULLIF(TRIM(CONCAT_WS(' ', cust.name, cust.surname)), ''), 'Amazon Müşterisi'), 'Bireysel Web Müşterisi'),
               NULLIF(NULLIF(NULLIF(cust.full_name, ''), 'Amazon Müşterisi'), 'Bireysel Web Müşterisi'),
               NULLIF(NULLIF(s.customer_name, ''), 'Amazon Müşterisi'),
               NULLIF(NULLIF(si.customer_name, ''), 'Amazon Müşterisi'),
               NULLIF(si.company_title, 'Bireysel Web Müşterisi'),
               NULLIF(si.customer_name, 'Amazon Müşterisi'),
               'Müşteri'
             ) as customer_name,
             s.customer_name as sale_customer_name,
             s.status as sale_status,
             s.cancellation_reason as sale_cancellation_reason,
             COALESCE(NULLIF(si.tax_number, ''), c.tax_number, comp_match.tax_number, cust.tc_id, cust.tax_number, '11111111111') as resolved_tax_number,
             COALESCE(NULLIF(si.tax_office, ''), c.tax_office, cust.tax_office) as tax_office,
             COALESCE(NULLIF(si.address, ''), c.address, cust.address) as address,
             cust.address as customer_address,
             cust.city as customer_city,
             cust.phone as customer_phone,
             cust.email as customer_email,
             cust.tax_number as customer_tax_number,
             cust.tax_office as customer_tax_office,
             (
               SELECT COALESCE(json_agg(json_build_object(
                 'id', sii.id,
                 'product_id', sii.product_id,
                 'product_name', sii.product_name,
                 'barcode', sii.barcode,
                 'product_code', sii.product_code,
                 'variant_name', sii.variant_name,
                 'quantity', sii.quantity,
                 'unit_price', sii.unit_price,
                 'tax_rate', sii.tax_rate,
                 'tax_amount', sii.tax_amount,
                 'total_price', sii.total_price
               ) ORDER BY sii.id), '[]'::json)
               FROM sales_invoice_items sii 
               WHERE sii.sales_invoice_id = si.id
             ) as items
      FROM sales_invoices si 
      LEFT JOIN companies c ON si.company_id = c.id 
      LEFT JOIN customers cust ON si.customer_id = cust.id
      LEFT JOIN sales s ON si.sale_id = s.id
      LEFT JOIN LATERAL (
        SELECT cm.id, cm.title, cm.tax_number
        FROM companies cm
        WHERE cm.store_id = si.store_id
          AND si.company_id IS NULL
          AND (
            (COALESCE(NULLIF(TRIM(si.tax_number), ''), NULLIF(TRIM(cust.tax_number), ''), NULLIF(TRIM(cust.tc_id), '')) IS NOT NULL
             AND COALESCE(NULLIF(TRIM(si.tax_number), ''), NULLIF(TRIM(cust.tax_number), ''), NULLIF(TRIM(cust.tc_id), '')) NOT IN ('11111111111', '2222222222')
             AND TRIM(cm.tax_number) = COALESCE(NULLIF(TRIM(si.tax_number), ''), NULLIF(TRIM(cust.tax_number), ''), NULLIF(TRIM(cust.tc_id), '')))
            OR (
              COALESCE(NULLIF(TRIM(si.company_title), ''), NULLIF(TRIM(si.customer_name), ''), NULLIF(TRIM(cust.full_name), '')) IS NOT NULL
              AND LOWER(TRIM(cm.title)) = LOWER(COALESCE(NULLIF(TRIM(si.company_title), ''), NULLIF(TRIM(si.customer_name), ''), NULLIF(TRIM(cust.full_name), '')))
            )
          )
        ORDER BY cm.id ASC
        LIMIT 1
      ) comp_match ON true
      WHERE si.store_id = $1
    `;
    const params: any[] = [storeId];

    if (startDate && (!search || search.trim() === '')) {
      params.push(startDate);
      query += ` AND si.invoice_date >= $${params.length}`;
    }
    if (endDate && (!search || search.trim() === '')) {
      params.push(endDate + ' 23:59:59');
      query += ` AND si.invoice_date <= $${params.length}`;
    }
    if (status && status !== 'all') {
      params.push(status);
      query += ` AND si.status = $${params.length}`;
    }
    if (search && String(search).trim() !== '') {
      const searchTerms = String(search).split(/\s+/).filter(Boolean);
      searchTerms.forEach(rawTerm => {
        const term = rawTerm.replace(/^#+/, '') || rawTerm;
        const pLen = params.length + 1;
        query += ` AND (
          si.id::text LIKE $${pLen} OR
          ${getTurkishSearchSnippet('si.invoice_number', pLen)} OR 
          ${getTurkishSearchSnippet('si.document_number', pLen)} OR
          ${getTurkishSearchSnippet('si.return_invoice_number', pLen)} OR
          ${getTurkishSearchSnippet('si.ettn', pLen)} OR
          ${getTurkishSearchSnippet('si.notes', pLen)} OR
          ${getTurkishSearchSnippet('si.waybill_number', pLen)} OR
          ${getTurkishSearchSnippet('si.customer_name', pLen)} OR
          ${getTurkishSearchSnippet('si.company_title', pLen)} OR
          ${getTurkishSearchSnippet('si.tax_number', pLen)} OR
          ${getTurkishSearchSnippet('si.tax_office', pLen)} OR
          ${getTurkishSearchSnippet('si.address', pLen)} OR
          ${getTurkishSearchSnippet('si.customer_email', pLen)} OR
          ${getTurkishSearchSnippet('si.payment_method', pLen)} OR
          ${getTurkishSearchSnippet('si.status', pLen)} OR
          ${getTurkishSearchSnippet('si.integration_status', pLen)} OR
          ${getTurkishSearchSnippet('si.e_document_type', pLen)} OR
          ${getTurkishSearchSnippet('si.invoice_profile', pLen)} OR
          ${getTurkishSearchSnippet('si.invoice_type', pLen)} OR
          ${getTurkishSearchSnippet('si.gi_invoice_type', pLen)} OR
          ${getTurkishSearchSnippet('si.currency', pLen)} OR
          si.total_amount::text LIKE $${pLen} OR
          si.tax_amount::text LIKE $${pLen} OR
          si.grand_total::text LIKE $${pLen} OR
          TO_CHAR(si.invoice_date, 'DD.MM.YYYY') LIKE $${pLen} OR
          TO_CHAR(si.invoice_date, 'DD/MM/YYYY') LIKE $${pLen} OR
          TO_CHAR(si.invoice_date, 'DD/MM/YY') LIKE $${pLen} OR
          si.invoice_date::text LIKE $${pLen} OR
          ${getTurkishSearchSnippet('c.title', pLen)} OR
          ${getTurkishSearchSnippet('c.tax_number', pLen)} OR
          ${getTurkishSearchSnippet('c.tax_office', pLen)} OR
          ${getTurkishSearchSnippet('c.address', pLen)} OR
          ${getTurkishSearchSnippet('c.phone', pLen)} OR
          ${getTurkishSearchSnippet('c.email', pLen)} OR
          ${getTurkishSearchSnippet('comp_match.title', pLen)} OR
          ${getTurkishSearchSnippet('comp_match.tax_number', pLen)} OR
          ${getTurkishSearchSnippet('cust.full_name', pLen)} OR
          ${getTurkishSearchSnippet("CONCAT_WS(' ', cust.name, cust.surname)", pLen)} OR
          ${getTurkishSearchSnippet('cust.tax_number', pLen)} OR
          ${getTurkishSearchSnippet('cust.tc_id', pLen)} OR
          ${getTurkishSearchSnippet('cust.tax_office', pLen)} OR
          ${getTurkishSearchSnippet('cust.address', pLen)} OR
          ${getTurkishSearchSnippet('cust.city', pLen)} OR
          ${getTurkishSearchSnippet('cust.phone', pLen)} OR
          ${getTurkishSearchSnippet('cust.email', pLen)} OR
          ${getTurkishSearchSnippet('s.customer_name', pLen)} OR
          EXISTS (
            SELECT 1 FROM sales_invoice_items sub_sii 
            WHERE sub_sii.sales_invoice_id = si.id 
            AND (
              ${getTurkishSearchSnippet('sub_sii.product_name', pLen)} OR
              ${getTurkishSearchSnippet('sub_sii.barcode', pLen)} OR
              ${getTurkishSearchSnippet('sub_sii.product_code', pLen)} OR
              ${getTurkishSearchSnippet('sub_sii.variant_name', pLen)} OR
              sub_sii.unit_price::text LIKE $${pLen} OR
              sub_sii.total_price::text LIKE $${pLen}
            )
          )
        )`;
        params.push(normalizeTurkishParam(term));
      });
    }

    query += " ORDER BY si.invoice_date DESC, si.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/sales/:id", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const isSuperAdmin = req.user?.role === "superadmin";
    const invoiceResult = await pool.query(
      `SELECT si.*, 
              c.title as company_title,
              c.tax_number as company_tax_number,
              c.tax_office as company_tax_office,
              c.address as company_address,
              NULL::text as company_city,
              c.email as company_email,
              COALESCE(
                NULLIF(NULLIF(TRIM(CONCAT_WS(' ', cust.name, cust.surname)), ''), 'Amazon Müşterisi'),
                NULLIF(NULLIF(TRIM(cust.full_name), ''), 'Amazon Müşterisi'),
                NULLIF(NULLIF(s.customer_name, ''), 'Amazon Müşterisi'),
                NULLIF(NULLIF(si.customer_name, ''), 'Amazon Müşterisi'),
                si.customer_name
              ) as customer_name,
              cust.tax_number as customer_tax_number,
              cust.tax_office as customer_tax_office,
              cust.address as customer_address,
              cust.city as customer_city,
              cust.email as customer_email_fallback,
              s.customer_name as sale_customer_name,
              s.status as sale_status,
              s.cancellation_reason as sale_cancellation_reason
       FROM sales_invoices si 
       LEFT JOIN companies c ON si.company_id = c.id 
       LEFT JOIN customers cust ON si.customer_id = cust.id
       LEFT JOIN sales s ON si.sale_id = s.id
       WHERE si.id = $1 AND (si.store_id = $2 OR $3 = TRUE)`,
      [req.params.id, storeId, isSuperAdmin]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    
    const itemsResult = await pool.query(
      "SELECT * FROM sales_invoice_items WHERE sales_invoice_id = $1",
      [req.params.id]
    );
    
    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;

    const resolvedCustomer = invoice.sale_customer_name || invoice.customer_name || (invoice.company_title !== 'Bireysel Web Müşterisi' ? invoice.company_title : null) || 'Müşteri';

    if (invoice.company_id && invoice.company_title && invoice.company_title !== 'Bireysel Web Müşterisi') {
      invoice.customer_name = invoice.company_title;
      invoice.company_title = invoice.company_title;
      invoice.tax_number = invoice.tax_number || invoice.company_tax_number;
      invoice.tax_office = invoice.tax_office || invoice.company_tax_office;
      invoice.address = invoice.address || invoice.company_address;
      invoice.customer_email = invoice.customer_email || invoice.company_email;
    } else if (invoice.customer_id) {
      invoice.customer_name = resolvedCustomer;
      invoice.company_title = resolvedCustomer;
      invoice.tax_number = invoice.tax_number || invoice.customer_tax_number;
      invoice.tax_office = invoice.tax_office || invoice.customer_tax_office;
      invoice.address = invoice.address || invoice.customer_address;
      invoice.customer_email = invoice.customer_email || invoice.customer_email_fallback;
    }

    invoice.customer_name = resolvedCustomer;
    invoice.company_title = resolvedCustomer;
    if (!invoice.tax_number || (invoice.tax_number.length !== 10 && invoice.tax_number.length !== 11)) {
      invoice.tax_number = '11111111111';
    }
    
    res.json(invoice);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/sales", async (req: any, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { 
      storeId: bodyStoreId, 
      sale_id,
      quotation_id,
      company_id, 
      customer_id, 
      invoice_number, 
      waybill_number,
      invoice_date, 
      invoice_time,
      items, 
      notes, 
      currency, 
      exchange_rate,
      payment_method,
      invoice_type,
      invoice_profile,
      status,
      is_tax_inclusive,
      e_document_type: req_e_document_type,
      tax_number: req_tax_number,
      tax_office,
      address,
      customer_email,
      gi_invoice_type,
      gi_exemption_reason_code,
      gi_withholding_tax_code,
      financial_account_id,
      financial_account_name,
      check_note_no,
      check_due_date,
      check_instrument_type,
      check_bank_name
    } = req.body;
    
    const storeId = getAuthorizedStoreId(req, bodyStoreId);

    if (!storeId) throw new Error("Store ID is required");

    if (invoice_number) {
      const existing = await client.query(
        "SELECT id FROM sales_invoices WHERE store_id = $1 AND LOWER(TRIM(invoice_number)) = LOWER(TRIM($2))",
        [storeId, invoice_number]
      );
      if (existing.rows.length > 0) {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ 
          error: `"${invoice_number}" seri/fatura numarası ile sistemde daha önce kayıtlı bir fatura bulunmaktadır. Mükerrer fatura numarası ile giriş yapılamaz.` 
        });
      }
    }

    const finalIsTaxInclusive = is_tax_inclusive !== undefined ? is_tax_inclusive : true;

    const storeRes = await client.query("SELECT branding, einvoice_settings FROM stores WHERE id = $1", [storeId]);
    const branding = storeRes.rows[0]?.branding || {};
    const einvoiceSettings = storeRes.rows[0]?.einvoice_settings || { is_active: false };
    
    let e_document_type = req_e_document_type || null;

    if (invoice_type === 'TEMELFATURA' || invoice_type === 'TICARIFATURA' || invoice_profile === 'TEMELFATURA' || invoice_profile === 'TICARIFATURA') {
      e_document_type = 'E-FATURA';
    } else if (invoice_type === 'EARSIVFATURA' || invoice_profile === 'EARSIVFATURA') {
      e_document_type = 'E-ARŞİV';
    }
    
    let tax_number = null;
    
    if (einvoiceSettings.is_active && !e_document_type) {
      if (company_id) {
         const cRes = await client.query("SELECT tax_number FROM companies WHERE id = $1", [company_id]);
         if (cRes.rows.length) tax_number = cRes.rows[0].tax_number;
      } else if (customer_id) {
         const cRes = await client.query("SELECT tax_number FROM customers WHERE id = $1", [customer_id]);
         if (cRes.rows.length) tax_number = cRes.rows[0].tax_number;
      }

      if (tax_number) {
         try {
           const { MySoftService } = await import("../../src/services/backend/mysoftService");
           const mysoft = new MySoftService(einvoiceSettings);
           const taxResult = await mysoft.checkTaxpayer(tax_number);
           e_document_type = taxResult.documentType === 'E-ARSIV' ? 'E-ARŞİV' : taxResult.documentType; 
         } catch (err) {
           console.error("E-Invoice check failed during invoice creation", err);
           e_document_type = 'E-ARŞİV'; 
         }
      } else {
         e_document_type = 'E-ARŞİV'; 
      }
    } else if (e_document_type === 'E-ARSIV') {
      e_document_type = 'E-ARŞİV';
    }
    
    let total_amount = 0; 
    let tax_amount = 0;
    let grand_total = 0;
    
    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      
      if (finalIsTaxInclusive) {
        const lineIncl = Math.round(qty * price * 100) / 100;
        const lineExcl = Math.round((lineIncl / (1 + (taxRate / 100))) * 100) / 100;
        const lineTax = Math.round((lineIncl - lineExcl) * 100) / 100;
        
        total_amount += lineExcl;
        tax_amount += lineTax;
        grand_total += lineIncl;
      } else {
        const lineExcl = Math.round(qty * price * 100) / 100;
        const lineTax = Math.round((lineExcl * (taxRate / 100)) * 100) / 100;
        const lineIncl = Math.round((lineExcl + lineTax) * 100) / 100;
        
        total_amount += lineExcl;
        tax_amount += lineTax;
        grand_total += lineIncl;
      }
    }
    total_amount = Math.round(total_amount * 100) / 100;
    tax_amount = Math.round(tax_amount * 100) / 100;
    grand_total = Math.round(grand_total * 100) / 100;

    const bankDetails = (branding?.payment_settings?.bank_details || branding?.payment_settings?.hotel_bank_details || '').trim();
    let finalNotes = (notes || req.body.notes || '').trim();
    if (!finalNotes) {
      finalNotes = ["İrsaliye Yerine Geçer.", bankDetails ? `Banka Hesap ve IBAN Bilgileri:\n${bankDetails}` : ""].filter(Boolean).join("\n\n");
    } else {
      if (!finalNotes.includes("İrsaliye Yerine Geçer")) {
        finalNotes = `İrsaliye Yerine Geçer.\n\n${finalNotes}`;
      }
      if (bankDetails && !finalNotes.includes(bankDetails.substring(0, 8))) {
        finalNotes = `${finalNotes}\n\nBanka Hesap ve IBAN Bilgileri:\n${bankDetails}`;
      }
    }
    
    // Resolve Due Date & Terms for Term / Credit Invoices
    let inputDueDate = req.body.due_date || null;
    let inputDueDays = Math.max(0, parseInt(req.body.due_days, 10) || 0);
    let inputLateRate = Math.max(0, parseFloat(req.body.late_interest_rate) || 0);

    if (company_id && (inputDueDays === 0 || inputLateRate === 0 || !inputDueDate)) {
      try {
        const compTermsRes = await client.query("SELECT due_days, late_interest_rate FROM companies WHERE id = $1", [company_id]);
        if (compTermsRes.rows.length > 0) {
          const cRow = compTermsRes.rows[0];
          if (inputDueDays === 0 && cRow.due_days) inputDueDays = Number(cRow.due_days);
          if (inputLateRate === 0 && cRow.late_interest_rate) inputLateRate = Number(cRow.late_interest_rate);
        }
      } catch (e) {
        console.error("Error reading company payment terms:", e);
      }
    }

    if (!inputDueDate && inputDueDays > 0) {
      try {
        const baseDate = invoice_date ? new Date(invoice_date) : new Date();
        baseDate.setDate(baseDate.getDate() + inputDueDays);
        inputDueDate = baseDate.toISOString().split('T')[0];
      } catch {
        inputDueDate = null;
      }
    }

    const salesPaidOnCreate = isSettlementPaid(payment_method || 'cash', null, status || 'draft');
    const invoiceResult = await client.query(
      `INSERT INTO sales_invoices 
        (store_id, sale_id, company_id, customer_id, invoice_number, waybill_number, invoice_date, invoice_time, total_amount, tax_amount, grand_total, currency, exchange_rate, notes, invoice_type, status, payment_method, quotation_id, e_document_type, invoice_profile, is_tax_inclusive, customer_email, tax_number, tax_office, address, gi_invoice_type, gi_exemption_reason_code, gi_withholding_tax_code, return_invoice_number, return_invoice_date, gi_exemption_reason_text, due_date, due_days, late_interest_rate, financial_account_id, financial_account_name, check_note_no, check_due_date, check_instrument_type, check_bank_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40) RETURNING id`,
      [
        storeId, 
        sale_id || null, 
        company_id || null, 
        customer_id || null, 
        invoice_number, 
        waybill_number || null, 
        invoice_date || new Date(), 
        invoice_time || new Date().toLocaleTimeString('tr-TR', { hour12: false }),
        total_amount, 
        tax_amount, 
        grand_total, 
        currency || branding?.default_currency || 'TRY', 
        exchange_rate || 1, 
        finalNotes, 
        invoice_type || 'manual', 
        status || 'draft', 
        payment_method || 'cash', 
        quotation_id || null, 
        e_document_type, 
        invoice_profile || (e_document_type === 'E-FATURA' ? 'TICARIFATURA' : 'EARSIVFATURA'), 
        finalIsTaxInclusive,
        req.body.customer_email || null,
        req.body.tax_number || tax_number || null,
        req.body.tax_office || null,
        req.body.address || null,
        req.body.gi_invoice_type || 'SATIS',
        req.body.gi_exemption_reason_code || null,
        req.body.gi_withholding_tax_code || null,
        req.body.return_invoice_number ? String(req.body.return_invoice_number).toUpperCase().replace(/[^A-Z0-9]/g, '').trim() : null,
        req.body.return_invoice_date || null,
        req.body.gi_exemption_reason_text || req.body.tax_exemption_reason || null,
        inputDueDate || null,
        inputDueDays || 0,
        inputLateRate || 0,
        salesPaidOnCreate && financial_account_id ? Number(financial_account_id) : null,
        salesPaidOnCreate && financial_account_name ? String(financial_account_name).trim() : null,
        salesPaidOnCreate && check_note_no ? String(check_note_no).trim() : null,
        salesPaidOnCreate && check_due_date ? check_due_date : null,
        salesPaidOnCreate && check_instrument_type ? check_instrument_type : null,
        salesPaidOnCreate && check_bank_name ? String(check_bank_name).trim() : null
      ]
    );
    
    const invoiceId = invoiceResult.rows[0].id;

    const currentTaxNum = req.body.tax_number || null;
    const currentTaxOffice = req.body.tax_office || null;
    const currentAddress = req.body.address || null;
    const currentEmail = req.body.customer_email || null;

    if (company_id) {
      const compRes = await client.query("SELECT * FROM companies WHERE id = $1", [company_id]);
      if (compRes.rows.length > 0) {
        const comp = compRes.rows[0];
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let valIdx = 1;

        if (currentTaxNum && (!comp.tax_number || comp.tax_number.trim() === "")) {
          updateFields.push(`tax_number = $${valIdx++}`);
          updateValues.push(currentTaxNum);
        }
        if (currentTaxOffice && (!comp.tax_office || comp.tax_office.trim() === "")) {
          updateFields.push(`tax_office = $${valIdx++}`);
          updateValues.push(currentTaxOffice);
        }
        if (currentAddress && (!comp.address || comp.address.trim() === "")) {
          updateFields.push(`address = $${valIdx++}`);
          updateValues.push(currentAddress);
        }
        if (currentEmail && (!comp.email || comp.email.trim() === "")) {
          updateFields.push(`email = $${valIdx++}`);
          updateValues.push(currentEmail);
        }

        if (updateFields.length > 0) {
          updateValues.push(company_id);
          await client.query(
            `UPDATE companies SET ${updateFields.join(', ')} WHERE id = $${valIdx}`,
            updateValues
          );
        }
      }
    } else if (customer_id) {
      const custRes = await client.query("SELECT * FROM customers WHERE id = $1", [customer_id]);
      if (custRes.rows.length > 0) {
        const cust = custRes.rows[0];
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let valIdx = 1;

        if (currentTaxNum && (!cust.tax_number || cust.tax_number.trim() === "")) {
          updateFields.push(`tax_number = $${valIdx++}`);
          updateValues.push(currentTaxNum);
        }
        if (currentTaxOffice && (!cust.tax_office || cust.tax_office.trim() === "")) {
          updateFields.push(`tax_office = $${valIdx++}`);
          updateValues.push(currentTaxOffice);
        }
        if (currentAddress && (!cust.address || cust.address.trim() === "")) {
          updateFields.push(`address = $${valIdx++}`);
          updateValues.push(currentAddress);
        }
        if (currentEmail && (!cust.email || cust.email.trim() === "")) {
          updateFields.push(`email = $${valIdx++}`);
          updateValues.push(currentEmail);
        }

        if (updateFields.length > 0) {
          updateValues.push(customer_id);
          await client.query(
            `UPDATE customers SET ${updateFields.join(', ')} WHERE id = $${valIdx}`,
            updateValues
          );
        }
      }
    }
    
    let displayName = 'Müşteri';
    if (company_id) {
      const companyRes = await client.query("SELECT title FROM companies WHERE id = $1", [company_id]);
      if (companyRes.rows.length > 0) displayName = companyRes.rows[0].title;
    } else if (customer_id) {
      const custRes = await client.query("SELECT full_name FROM customers WHERE id = $1", [customer_id]);
      if (custRes.rows.length > 0) displayName = custRes.rows[0].full_name;
    }

    const affectedProductIds: number[] = [];
    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      
      let itemTax = 0;
      let itemTotal = 0; 

      if (finalIsTaxInclusive) {
        const lineIncl = Math.round(qty * price * 100) / 100;
        itemTotal = Math.round((lineIncl / (1 + (taxRate / 100))) * 100) / 100;
        itemTax = Math.round((lineIncl - itemTotal) * 100) / 100;
      } else {
        itemTotal = Math.round(qty * price * 100) / 100;
        itemTax = Math.round((itemTotal * (taxRate / 100)) * 100) / 100;
      }

      const { productId: resolvedProductId, barcode: resolvedBarcode } = await resolveProductInfo(client, storeId, item.product_id, item.barcode);
      
      await client.query(
        `INSERT INTO sales_invoice_items 
          (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [invoiceId, resolvedProductId, item.product_name, resolvedBarcode, item.quantity, item.unit_price, item.tax_rate, itemTax, itemTotal]
      );
      
      if (resolvedProductId) {
        affectedProductIds.push(Number(resolvedProductId));
        const productRes = await client.query("SELECT product_type FROM products WHERE id = $1", [resolvedProductId]);
        const productType = productRes.rows.length > 0 ? productRes.rows[0].product_type : 'product';

        if (productType !== 'service') {
          await client.query(
            "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
            [item.quantity, resolvedProductId, storeId]
          );
          const effectiveSalesInvNo = (invoice_number && String(invoice_number).trim()) || `#${invoiceId}`;
          await addStockMovement(client, storeId, resolvedProductId, 'out', item.quantity, 'sales_invoice', `Satış Faturası: ${effectiveSalesInvNo}`, item.unit_price, displayName, currency, null, invoiceId, 'sales', (invoice_number && String(invoice_number).trim()) || null, invoice_date || new Date());
        }
      }
    }
    
    const salesTreasuryRes = await syncSalesInvoiceTreasury(client, {
      storeId,
      invoiceId: Number(invoiceId),
      invoiceNumber: invoice_number || `INV-${invoiceId}`,
      invoiceDate: invoice_date || new Date(),
      grandTotal: grand_total,
      currency: currency || branding?.default_currency || 'TRY',
      exchangeRate: Number(exchange_rate || 1) || 1,
      paymentMethod: payment_method || 'cash',
      status: status || 'draft',
      companyId: company_id || null,
      customerName: displayName,
      financialAccountId: financial_account_id ? Number(financial_account_id) : null,
      financialAccountName: financial_account_name || null,
      checkNoteNo: check_note_no || null,
      checkDueDate: check_due_date || null,
      checkInstrumentType: check_instrument_type || null,
      checkBankName: check_bank_name || null
    });

    await client.query(
      `UPDATE sales_invoices
       SET financial_account_id = $1, financial_account_name = $2, check_note_id = $3
       WHERE id = $4`,
      [salesTreasuryRes.financialAccountId, salesTreasuryRes.financialAccountName, salesTreasuryRes.checkNoteId, invoiceId]
    );

    if (company_id && !isCancelledOrDraftStatus(status)) {
      if (quotation_id || sale_id) {
        await client.query("DELETE FROM current_account_transactions WHERE (quotation_id = $1 OR sale_id = $2) AND sales_invoice_id IS NULL", [quotation_id || null, sale_id || null]);
      }

      const defaultCurrency = branding?.default_currency || 'TRY';

      await client.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, transaction_date, due_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [storeId, company_id, invoiceId, 'debt', grand_total, currency || defaultCurrency, exchange_rate || 1, `Satış Faturası: ${invoice_number}`, invoice_date || new Date(), inputDueDate || null]
      );

      if (salesTreasuryRes.isPaid) {
        await client.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date, financial_account_id, financial_account_name, check_note_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [storeId, company_id, invoiceId, 'credit', grand_total, currency || defaultCurrency, exchange_rate || 1, `Satış Faturası Tahsilatı: ${invoice_number} (${payment_method})`, payment_method, invoice_date || new Date(), salesTreasuryRes.financialAccountId, salesTreasuryRes.financialAccountName, salesTreasuryRes.checkNoteId]
        );
      }
    }
    
    await client.query("COMMIT");

    if (affectedProductIds.length > 0) {
      syncProductStockToMarketplaces(affectedProductIds, storeId, { reason: `sales_invoice_${invoice_number}` }).catch(err =>
        console.error("[Sales Invoice Marketplace Sync Error]:", err?.message || err)
      );
    }
    res.json({ success: true, id: invoiceId });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.put("/sales/:id", async (req: any, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const storeId = getAuthorizedStoreId(req, req.body.storeId);
    const { 
      company_id, customer_id, invoice_number, waybill_number, invoice_date, invoice_time,
      notes, items, payment_method, currency, exchange_rate, 
      invoice_type, invoice_profile, status, is_tax_inclusive,
      tax_number, tax_office, address,
      gi_invoice_type, gi_exemption_reason_code, gi_withholding_tax_code,
      customer_name: reqCustomerName, company_title: reqCompanyTitle, customer_title: reqCustomerTitle,
      financial_account_id, financial_account_name,
      check_note_no, check_due_date, check_instrument_type, check_bank_name
    } = req.body;

    const finalIsTaxInclusive = is_tax_inclusive !== undefined ? is_tax_inclusive : true;

    const oldInvoiceResult = await client.query(
      "SELECT * FROM sales_invoices WHERE id = $1 AND store_id = $2",
      [req.params.id, storeId]
    );
    
    if (oldInvoiceResult.rows.length === 0) throw new Error("Invoice not found");

    if (invoice_number) {
      const existing = await client.query(
        "SELECT id FROM sales_invoices WHERE store_id = $1 AND id <> $2 AND LOWER(TRIM(invoice_number)) = LOWER(TRIM($3))",
        [storeId, req.params.id, invoice_number]
      );
      if (existing.rows.length > 0) {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ 
          error: `"${invoice_number}" seri/fatura numarası ile sistemde daha önce kayıtlı başka bir fatura bulunmaktadır. Mükerrer fatura numarası kullanılamaz.` 
        });
      }
    }
    
    const oldInvoice = oldInvoiceResult.rows[0];
    const oldItemsResult = await client.query(
      "SELECT * FROM sales_invoice_items WHERE sales_invoice_id = $1",
      [req.params.id]
    );

    let finalCustomerTitle = (reqCustomerTitle || reqCustomerName || reqCompanyTitle || '').trim();
    if (!finalCustomerTitle || finalCustomerTitle.startsWith('Amazon Kurumsal Alıcı') || finalCustomerTitle.startsWith('Amazon Alıcısı') || finalCustomerTitle === 'Müşteri') {
      if (company_id) {
        const companyRes = await client.query("SELECT title FROM companies WHERE id = $1", [company_id]);
        if (companyRes.rows.length > 0 && companyRes.rows[0].title) {
          finalCustomerTitle = companyRes.rows[0].title;
        }
      }
      if ((!finalCustomerTitle || finalCustomerTitle.startsWith('Amazon Kurumsal Alıcı') || finalCustomerTitle.startsWith('Amazon Alıcısı')) && customer_id) {
        const custRes = await client.query("SELECT full_name, name, surname FROM customers WHERE id = $1", [customer_id]);
        if (custRes.rows.length > 0) {
          const cName = custRes.rows[0].full_name || `${custRes.rows[0].name || ''} ${custRes.rows[0].surname || ''}`.trim();
          if (cName && !cName.startsWith('Amazon Kurumsal Alıcı') && !cName.startsWith('Amazon Alıcısı')) {
            finalCustomerTitle = cName;
          }
        }
      }
    }
    if (!finalCustomerTitle) finalCustomerTitle = oldInvoice.company_title || oldInvoice.customer_name || 'Müşteri';
    
    let displayName = finalCustomerTitle;

    const affectedProductIds: number[] = [];
    for (const item of oldItemsResult.rows) {
      const { productId: oldResolvedId } = await resolveProductInfo(client, storeId, item.product_id, item.barcode);
      if (oldResolvedId) {
        affectedProductIds.push(Number(oldResolvedId));
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, oldResolvedId, storeId]
        );
      }
    }
    
    const oldInvNumClean = (oldInvoice.invoice_number || '').trim();
    const oldDocNumClean = (oldInvoice.document_number || oldInvoice.invoice_number || '').trim();
    await client.query(
      `DELETE FROM stock_movements
       WHERE store_id = $1
         AND (
           (invoice_id = $2 AND (type = 'out' OR invoice_type = 'sales' OR source = 'sales_invoice'))
           OR ($3::int IS NOT NULL AND sale_id = $3)
           OR (
             source IN ('sales_invoice', 'AMAZON', 'hepsiburada', 'trendyol', 'n11', 'pazarama')
             AND (
               ($4::text <> '' AND invoice_number = $4)
               OR ($4::text <> '' AND description LIKE ('%' || $4 || '%'))
               OR ($5::text <> '' AND description LIKE ('%' || $5 || '%'))
             )
           )
         )`,
      [storeId, req.params.id, oldInvoice.sale_id || null, oldInvNumClean, oldDocNumClean]
    );

    await client.query("DELETE FROM sales_invoice_items WHERE sales_invoice_id = $1", [req.params.id]);
    await client.query("DELETE FROM current_account_transactions WHERE sales_invoice_id = $1", [req.params.id]);

    if (oldInvoice.quotation_id || oldInvoice.sale_id) {
       await client.query("DELETE FROM current_account_transactions WHERE (quotation_id = $1 OR sale_id = $2) AND sales_invoice_id IS NULL", [oldInvoice.quotation_id || null, oldInvoice.sale_id || null]);
    }

    let total_amount = 0; 
    let tax_amount = 0;
    let grand_total = 0;
    
    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      
      if (finalIsTaxInclusive) {
        const lineIncl = Math.round(qty * price * 100) / 100;
        const lineExcl = Math.round((lineIncl / (1 + (taxRate / 100))) * 100) / 100;
        const lineTax = Math.round((lineIncl - lineExcl) * 100) / 100;
        
        total_amount += lineExcl;
        tax_amount += lineTax;
        grand_total += lineIncl;
      } else {
        const lineExcl = Math.round(qty * price * 100) / 100;
        const lineTax = Math.round((lineExcl * (taxRate / 100)) * 100) / 100;
        const lineIncl = Math.round((lineExcl + lineTax) * 100) / 100;
        
        total_amount += lineExcl;
        tax_amount += lineTax;
        grand_total += lineIncl;
      }
    }
    total_amount = Math.round(total_amount * 100) / 100;
    tax_amount = Math.round(tax_amount * 100) / 100;
    grand_total = Math.round(grand_total * 100) / 100;
    
    const storeResAuto = await client.query("SELECT branding, einvoice_settings FROM stores WHERE id = $1", [storeId]);
    const einvoiceSettings = storeResAuto.rows[0]?.einvoice_settings || { is_active: false };
    
    let e_document_type = req.body.e_document_type || oldInvoice.e_document_type; 
    
    if (invoice_type === 'TEMELFATURA' || invoice_type === 'TICARIFATURA' || invoice_profile === 'TEMELFATURA' || invoice_profile === 'TICARIFATURA') {
      e_document_type = 'E-FATURA';
    } else if (invoice_type === 'EARSIVFATURA' || invoice_profile === 'EARSIVFATURA') {
      e_document_type = 'E-ARŞİV';
    }

    if (einvoiceSettings.is_active && !req.body.e_document_type && !e_document_type) {
      let tax_number = null;
      if (company_id) {
         const cRes = await client.query("SELECT tax_number FROM companies WHERE id = $1", [company_id]);
         if (cRes.rows.length) tax_number = cRes.rows[0].tax_number;
      } else if (customer_id) {
         const cRes = await client.query("SELECT tax_number FROM customers WHERE id = $1", [customer_id]);
         if (cRes.rows.length) tax_number = cRes.rows[0].tax_number;
      }

      if (tax_number) {
         try {
           const { MySoftService } = await import("../../src/services/backend/mysoftService");
           const mysoft = new MySoftService(einvoiceSettings);
           const taxResult = await mysoft.checkTaxpayer(tax_number);
           e_document_type = taxResult.documentType === 'E-ARSIV' ? 'E-ARŞİV' : taxResult.documentType; 
         } catch (err) {
           console.error("E-Invoice check failed during invoice update", err);
           e_document_type = 'E-ARŞİV'; 
         }
      } else {
         e_document_type = 'E-ARŞİV';
      }
    } else if (e_document_type === 'E-ARSIV') {
      e_document_type = 'E-ARŞİV';
    }

    const storeBrandingRes = await client.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
    const updateBranding = storeBrandingRes.rows[0]?.branding || {};
    const bankDetails = (updateBranding?.payment_settings?.bank_details || updateBranding?.payment_settings?.hotel_bank_details || '').trim();
    let finalNotes = (notes || req.body.notes || '').trim();
    if (!finalNotes) {
      finalNotes = ["İrsaliye Yerine Geçer.", bankDetails ? `Banka Hesap ve IBAN Bilgileri:\n${bankDetails}` : ""].filter(Boolean).join("\n\n");
    } else {
      if (!finalNotes.includes("İrsaliye Yerine Geçer")) {
        finalNotes = `İrsaliye Yerine Geçer.\n\n${finalNotes}`;
      }
      if (bankDetails && !finalNotes.includes(bankDetails.substring(0, 8))) {
        finalNotes = `${finalNotes}\n\nBanka Hesap ve IBAN Bilgileri:\n${bankDetails}`;
      }
    }

    // Resolve Due Date & Terms for Term / Credit Invoices
    let inputDueDate = req.body.due_date || null;
    let inputDueDays = Math.max(0, parseInt(req.body.due_days, 10) || 0);
    let inputLateRate = Math.max(0, parseFloat(req.body.late_interest_rate) || 0);

    if (company_id && (inputDueDays === 0 || inputLateRate === 0 || !inputDueDate)) {
      try {
        const compTermsRes = await client.query("SELECT due_days, late_interest_rate FROM companies WHERE id = $1", [company_id]);
        if (compTermsRes.rows.length > 0) {
          const cRow = compTermsRes.rows[0];
          if (inputDueDays === 0 && cRow.due_days) inputDueDays = Number(cRow.due_days);
          if (inputLateRate === 0 && cRow.late_interest_rate) inputLateRate = Number(cRow.late_interest_rate);
        }
      } catch (e) {
        console.error("Error reading company payment terms on update:", e);
      }
    }

    if (!inputDueDate && inputDueDays > 0) {
      try {
        const baseDate = invoice_date ? new Date(invoice_date) : new Date();
        baseDate.setDate(baseDate.getDate() + inputDueDays);
        inputDueDate = baseDate.toISOString().split('T')[0];
      } catch {
        inputDueDate = null;
      }
    }

    const salesPaidOnUpdate = isSettlementPaid(payment_method, null, status);
    await client.query(
      `UPDATE sales_invoices 
       SET company_id = $1, customer_id = $2, invoice_number = $3, waybill_number = $4, invoice_date = $5, 
           total_amount = $6, tax_amount = $7, grand_total = $8, currency = $9, exchange_rate = $10, 
           notes = $11, payment_method = $12, invoice_type = $13, status = $14, e_document_type = $15, 
           invoice_profile = $16, is_tax_inclusive = $17,
        customer_email = $18,
        tax_number = $19, tax_office = $20, address = $21,
        gi_invoice_type = $22, gi_exemption_reason_code = $23, gi_withholding_tax_code = $24,
        invoice_time = $25,
        return_invoice_number = $26,
        return_invoice_date = $27,
        gi_exemption_reason_text = $28,
        integration_status = CASE WHEN integration_status = 'HATALI' THEN 'DRAFT' ELSE integration_status END,
        integration_message = CASE WHEN integration_status = 'HATALI' THEN NULL ELSE integration_message END,
        due_date = $29,
        due_days = $30,
        late_interest_rate = $31,
        customer_name = $32,
        company_title = $33,
        financial_account_id = $34,
        financial_account_name = $35,
        check_note_no = $36,
        check_due_date = $37,
        check_instrument_type = $38,
        check_bank_name = $39
    WHERE id = $40 AND store_id = $41`,
    [
      company_id || null, customer_id || null, invoice_number, waybill_number || null, invoice_date, 
      total_amount, tax_amount, grand_total, currency || 'TRY', exchange_rate || 1, 
      finalNotes, payment_method, invoice_type, status, e_document_type, 
      invoice_profile || (e_document_type === 'E-FATURA' ? 'TICARIFATURA' : 'EARSIVFATURA'), 
      finalIsTaxInclusive,
      req.body.customer_email || null,
      req.body.tax_number || null, tax_office || null, address || null,
      gi_invoice_type || 'SATIS', gi_exemption_reason_code || null, gi_withholding_tax_code || null,
      invoice_time || null,
      req.body.return_invoice_number ? String(req.body.return_invoice_number).toUpperCase().replace(/[^A-Z0-9]/g, '').trim() : null,
      req.body.return_invoice_date || null,
      req.body.gi_exemption_reason_text || req.body.tax_exemption_reason || null,
      inputDueDate || null,
      inputDueDays || 0,
      inputLateRate || 0,
      finalCustomerTitle,
      finalCustomerTitle,
      salesPaidOnUpdate && financial_account_id ? Number(financial_account_id) : null,
      salesPaidOnUpdate && financial_account_name ? String(financial_account_name).trim() : null,
      salesPaidOnUpdate && check_note_no ? String(check_note_no).trim() : null,
      salesPaidOnUpdate && check_due_date ? check_due_date : null,
      salesPaidOnUpdate && check_instrument_type ? check_instrument_type : null,
      salesPaidOnUpdate && check_bank_name ? String(check_bank_name).trim() : null,
      req.params.id, storeId
    ]
    );

    const currentTaxNum = tax_number || null;
    const currentTaxOffice = tax_office || null;
    const currentAddress = address || null;
    const currentEmail = req.body.customer_email || null;

    if (company_id) {
      const compRes = await client.query("SELECT * FROM companies WHERE id = $1", [company_id]);
      if (compRes.rows.length > 0) {
        const comp = compRes.rows[0];
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let valIdx = 1;

        if (finalCustomerTitle && (!comp.title || comp.title.trim() === "" || comp.title.startsWith('Amazon Kurumsal Alıcı') || comp.title.startsWith('Amazon Alıcısı'))) {
          updateFields.push(`title = $${valIdx++}`);
          updateValues.push(finalCustomerTitle);
        }
        if (currentTaxNum && (!comp.tax_number || comp.tax_number.trim() === "")) {
          updateFields.push(`tax_number = $${valIdx++}`);
          updateValues.push(currentTaxNum);
        }
        if (currentTaxOffice && (!comp.tax_office || comp.tax_office.trim() === "")) {
          updateFields.push(`tax_office = $${valIdx++}`);
          updateValues.push(currentTaxOffice);
        }
        if (currentAddress && (!comp.address || comp.address.trim() === "")) {
          updateFields.push(`address = $${valIdx++}`);
          updateValues.push(currentAddress);
        }
        if (currentEmail && (!comp.email || comp.email.trim() === "")) {
          updateFields.push(`email = $${valIdx++}`);
          updateValues.push(currentEmail);
        }

        if (updateFields.length > 0) {
          updateValues.push(company_id);
          await client.query(
            `UPDATE companies SET ${updateFields.join(', ')} WHERE id = $${valIdx}`,
            updateValues
          );
        }
      }
    } else if (customer_id) {
      const custRes = await client.query("SELECT * FROM customers WHERE id = $1", [customer_id]);
      if (custRes.rows.length > 0) {
        const cust = custRes.rows[0];
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let valIdx = 1;

        if (finalCustomerTitle && (!cust.full_name || cust.full_name.trim() === "" || cust.full_name.startsWith('Amazon Kurumsal Alıcı') || cust.full_name.startsWith('Amazon Alıcısı'))) {
          updateFields.push(`full_name = $${valIdx++}`);
          updateValues.push(finalCustomerTitle);
        }
        if (currentTaxNum && (!cust.tax_number || cust.tax_number.trim() === "")) {
          updateFields.push(`tax_number = $${valIdx++}`);
          updateValues.push(currentTaxNum);
        }
        if (currentTaxOffice && (!cust.tax_office || cust.tax_office.trim() === "")) {
          updateFields.push(`tax_office = $${valIdx++}`);
          updateValues.push(currentTaxOffice);
        }
        if (currentAddress && (!cust.address || cust.address.trim() === "")) {
          updateFields.push(`address = $${valIdx++}`);
          updateValues.push(currentAddress);
        }
        if (currentEmail && (!cust.email || cust.email.trim() === "")) {
          updateFields.push(`email = $${valIdx++}`);
          updateValues.push(currentEmail);
        }

        if (updateFields.length > 0) {
          updateValues.push(customer_id);
          await client.query(
            `UPDATE customers SET ${updateFields.join(', ')} WHERE id = $${valIdx}`,
            updateValues
          );
        }
      }
    }

    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      
      let itemTax = 0;
      let itemTotal = 0; 

      if (finalIsTaxInclusive) {
        const lineIncl = Math.round(qty * price * 100) / 100;
        itemTotal = Math.round((lineIncl / (1 + (taxRate / 100))) * 100) / 100;
        itemTax = Math.round((lineIncl - itemTotal) * 100) / 100;
      } else {
        itemTotal = Math.round(qty * price * 100) / 100;
        itemTax = Math.round((itemTotal * (taxRate / 100)) * 100) / 100;
      }

      const { productId: resolvedProductId, barcode: resolvedBarcode } = await resolveProductInfo(client, storeId, item.product_id, item.barcode);
      
      await client.query(
        `INSERT INTO sales_invoice_items 
          (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [req.params.id, resolvedProductId, item.product_name, resolvedBarcode, item.quantity, item.unit_price, item.tax_rate, itemTax, itemTotal]
      );
      
      if (resolvedProductId) {
        affectedProductIds.push(Number(resolvedProductId));
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, resolvedProductId, storeId]
        );
        const effectiveUpdInvNo = (invoice_number && String(invoice_number).trim()) || (oldInvoice.document_number && String(oldInvoice.document_number).trim()) || `#${req.params.id}`;
        await addStockMovement(client, storeId, resolvedProductId, 'out', item.quantity, 'sales_invoice', `Satış Faturası: ${effectiveUpdInvNo}`, item.unit_price, displayName, currency, null, req.params.id, 'sales', (invoice_number && String(invoice_number).trim()) || (oldInvoice.document_number && String(oldInvoice.document_number).trim()) || null, invoice_date || new Date());
      }
    }

    const salesUpdTreasuryRes = await syncSalesInvoiceTreasury(client, {
      storeId,
      invoiceId: Number(req.params.id),
      invoiceNumber: invoice_number || oldInvoice.invoice_number || `INV-${req.params.id}`,
      invoiceDate: invoice_date || new Date(),
      grandTotal: grand_total,
      currency: currency || 'TRY',
      exchangeRate: Number(exchange_rate || 1) || 1,
      paymentMethod: payment_method,
      status,
      companyId: company_id || null,
      customerName: displayName,
      financialAccountId: financial_account_id ? Number(financial_account_id) : null,
      financialAccountName: financial_account_name || null,
      checkNoteNo: check_note_no || null,
      checkDueDate: check_due_date || null,
      checkInstrumentType: check_instrument_type || null,
      checkBankName: check_bank_name || null
    });

    await client.query(
      `UPDATE sales_invoices
       SET financial_account_id = $1, financial_account_name = $2, check_note_id = $3
       WHERE id = $4 AND store_id = $5`,
      [salesUpdTreasuryRes.financialAccountId, salesUpdTreasuryRes.financialAccountName, salesUpdTreasuryRes.checkNoteId, req.params.id, storeId]
    );

    if (company_id && !isCancelledOrDraftStatus(status)) {
      const defaultCurrency = updateBranding?.default_currency || 'TRY';

      await client.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, transaction_date, due_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [storeId, company_id, req.params.id, 'debt', grand_total, currency || defaultCurrency, exchange_rate || 1, `Satış Faturası: ${invoice_number}`, invoice_date || new Date(), inputDueDate || null]
      );

      if (salesUpdTreasuryRes.isPaid) {
        await client.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date, financial_account_id, financial_account_name, check_note_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [storeId, company_id, req.params.id, 'credit', grand_total, currency || defaultCurrency, exchange_rate || 1, `Satış Faturası Tahsilatı: ${invoice_number} (${payment_method})`, payment_method, invoice_date || new Date(), salesUpdTreasuryRes.financialAccountId, salesUpdTreasuryRes.financialAccountName, salesUpdTreasuryRes.checkNoteId]
        );
      }
    }

    await client.query("COMMIT");

    if (affectedProductIds.length > 0) {
      syncProductStockToMarketplaces(affectedProductIds, storeId, { reason: `sales_invoice_updated_${invoice_number}` }).catch(err =>
        console.error("[Sales Invoice Update Marketplace Sync Error]:", err?.message || err)
      );
    }
    res.json({ success: true });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.post("/sales/:id/create-from-sale", async (req: any, res) => {
  const { id } = req.params;
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const saleRes = await client.query("SELECT * FROM sales WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (saleRes.rows.length === 0) throw new Error("Sale not found");
    const sale = saleRes.rows[0];

    // Check if invoice already exists for this sale
    const existingInv = await client.query("SELECT id, invoice_number FROM sales_invoices WHERE sale_id = $1 AND store_id = $2", [id, storeId]);
    if (existingInv.rows.length > 0) {
      await client.query("COMMIT");
      return res.json({ success: true, invoiceId: existingInv.rows[0].id, invoiceNumber: existingInv.rows[0].invoice_number, alreadyExists: true });
    }

    let customerEmail = sale.customer_email || '';
    let customerTaxNumber = '';
    let customerTaxOffice = '';
    let customerAddress = sale.customer_address || '';

    // Extract details from notes if formatted
    if (sale.notes) {
      const emailMatch = sale.notes.match(/E-posta:\s*([^\s|]+)/i);
      if (emailMatch && !customerEmail) customerEmail = emailMatch[1].trim();
      const tcMatch = sale.notes.match(/TC\/VKN:\s*([^\s|]+)/i);
      if (tcMatch) customerTaxNumber = tcMatch[1].trim();
      const taxOfficeMatch = sale.notes.match(/Vergi Dairesi:\s*([^|]+)/i);
      if (taxOfficeMatch) customerTaxOffice = taxOfficeMatch[1].trim();
    }

    if (sale.customer_id) {
      const custRes = await client.query("SELECT * FROM customers WHERE id = $1", [sale.customer_id]);
      if (custRes.rows.length > 0) {
        const c = custRes.rows[0];
        if (!customerEmail) customerEmail = c.email || '';
        if (!customerTaxNumber) customerTaxNumber = c.tax_number || c.tc_id || '';
        if (!customerTaxOffice) customerTaxOffice = c.tax_office || '';
        if (!customerAddress) customerAddress = c.address || '';
      }
    }

    const itemsRes = await client.query("SELECT * FROM sale_items WHERE sale_id = $1", [id]);
    
    let total_amount = 0;
    let tax_amount = 0;
    let grand_total = 0;

    const invoiceItems = [];
    for (const item of itemsRes.rows) {
      let taxRate = 20; 
      if (item.product_id) {
        const prodRes = await client.query("SELECT tax_rate FROM products WHERE id = $1", [item.product_id]);
        if (prodRes.rows.length > 0 && prodRes.rows[0].tax_rate != null) {
          taxRate = Number(prodRes.rows[0].tax_rate);
        }
      } else if (item.tax_rate != null) {
        taxRate = Number(item.tax_rate);
      }

      const kdvDahilTotal = Number(item.quantity) * Number(item.unit_price);
      const kdvHaricTotal = kdvDahilTotal / (1 + taxRate / 100);
      const itemTax = kdvDahilTotal - kdvHaricTotal;
      
      total_amount += kdvHaricTotal;
      tax_amount += itemTax;
      grand_total += kdvDahilTotal;

      const kdvHaricPrice = Number(item.unit_price) / (1 + taxRate / 100);

      invoiceItems.push({
        product_id: item.product_id,
        product_name: item.product_name,
        barcode: item.barcode,
        quantity: item.quantity,
        unit_price: kdvHaricPrice,
        tax_rate: taxRate,
        tax_amount: itemTax,
        total_price: kdvHaricTotal
      });
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}${String(sale.id).padStart(6, '0')}`;

    const invoiceResult = await client.query(
      `INSERT INTO sales_invoices 
        (store_id, sale_id, company_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, exchange_rate, notes, invoice_type, status, payment_method, is_tax_inclusive, customer_email, tax_number, tax_office, address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING id, invoice_number`,
      [
        storeId, id, sale.company_id || null, sale.customer_id || null, invoiceNumber, new Date(),
        total_amount, tax_amount, grand_total, sale.currency || 'TRY', sale.exchange_rate || 1,
        `Web Satışı #${id} üzerinden otomatik oluşturuldu.`, 'manual', 'draft', sale.payment_method || 'credit_card',
        true, customerEmail, customerTaxNumber, customerTaxOffice, customerAddress
      ]
    );

    const invoiceId = invoiceResult.rows[0].id;

    for (const item of invoiceItems) {
      await client.query(
        `INSERT INTO sales_invoice_items 
          (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [invoiceId, item.product_id, item.product_name, item.barcode, item.quantity, item.unit_price, item.tax_rate, item.tax_amount, item.total_price]
      );
    }

    // Link back to sales record
    await client.query(
      "UPDATE sales SET sales_invoice_id = $1, sales_invoice_number = $2 WHERE id = $3",
      [invoiceId, invoiceNumber, id]
    );

    await client.query("COMMIT");
    res.json({ success: true, invoiceId, invoiceNumber });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// --- Purchase Invoices ---

async function ensureStoreExpenseCenters(storeId: number) {
  const existing = await pool.query(
    "SELECT COUNT(*)::int as cnt FROM store_expense_centers WHERE store_id = $1",
    [storeId]
  );
  if ((existing.rows[0]?.cnt || 0) === 0) {
    for (const def of DEFAULT_EXPENSE_CENTERS) {
      await pool.query(
        `INSERT INTO store_expense_centers (store_id, key, name, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (store_id, key) DO NOTHING`,
        [storeId, def.key, def.name]
      );
    }
  }
}

function slugifyExpenseCenterKey(name: string): string {
  const trMap: Record<string, string> = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'I': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
  };
  const replaced = String(name || '')
    .split('')
    .map(ch => trMap[ch] || ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
  return replaced || `center_${Date.now()}`;
}

router.get("/purchase/expense-centers", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    await ensureStoreExpenseCenters(storeId);
    const result = await pool.query(
      "SELECT id, store_id, key, name, is_active, created_at FROM store_expense_centers WHERE store_id = $1 AND COALESCE(is_active, true) = true ORDER BY id ASC",
      [storeId]
    );
    res.json(result.rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/purchase/expense-centers", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
    const rawName = String(req.body?.name || '').trim();
    if (!rawName) {
      return res.status(400).json({ error: "Gider yeri adı zorunludur." });
    }
    await ensureStoreExpenseCenters(storeId);

    const existingByName = await pool.query(
      "SELECT id, store_id, key, name, is_active, created_at FROM store_expense_centers WHERE store_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) LIMIT 1",
      [storeId, rawName]
    );
    if (existingByName.rows.length > 0) {
      if (!existingByName.rows[0].is_active) {
        const reactivated = await pool.query(
          "UPDATE store_expense_centers SET is_active = true WHERE id = $1 RETURNING *",
          [existingByName.rows[0].id]
        );
        return res.json(reactivated.rows[0]);
      }
      return res.json(existingByName.rows[0]);
    }

    let baseKey = req.body?.key ? slugifyExpenseCenterKey(req.body.key) : slugifyExpenseCenterKey(rawName);
    let finalKey = baseKey;
    const keyConflict = await pool.query(
      "SELECT 1 FROM store_expense_centers WHERE store_id = $1 AND key = $2 LIMIT 1",
      [storeId, finalKey]
    );
    if (keyConflict.rows.length > 0) {
      finalKey = `${baseKey}_${Date.now().toString().slice(-4)}`;
    }

    const ins = await pool.query(
      `INSERT INTO store_expense_centers (store_id, key, name, is_active)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [storeId, finalKey, rawName]
    );
    res.status(201).json(ins.rows[0]);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/purchase/expense-centers/:key", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body?.storeId);
    const key = String(req.params.key || '').trim();
    if (!key) return res.status(400).json({ error: "Gider yeri anahtarı zorunludur." });
    const isDefault = DEFAULT_EXPENSE_CENTERS.some(d => d.key === key);
    if (isDefault) {
      return res.status(400).json({ error: "Varsayılan gider yerleri silinemez." });
    }
    const delRes = await pool.query(
      "DELETE FROM store_expense_centers WHERE store_id = $1 AND key = $2 RETURNING id, key, name",
      [storeId, key]
    );
    if (delRes.rows.length === 0) {
      return res.status(404).json({ error: "Gider yeri bulunamadı." });
    }
    res.json({ success: true, deleted: delRes.rows[0] });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/purchase", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const { search, startDate, endDate } = req.query;

    let query = `
      SELECT pi.*, 
             COALESCE(pi.operator_status, 'completed') as operator_status,
             COALESCE(NULLIF(TRIM(pi.invoice_number), ''), NULLIF(TRIM(pi.document_number), '')) as invoice_number,
             c.title as company_name,
             COALESCE((
               SELECT SUM(COALESCE(r_pii.reserved_quantity, 0))
               FROM purchase_invoice_items r_pii
               WHERE r_pii.purchase_invoice_id = pi.id
             ), 0) as total_reserved_qty,
             EXISTS (
               SELECT 1 FROM purchase_invoice_items r_pii
               WHERE r_pii.purchase_invoice_id = pi.id AND COALESCE(r_pii.reserved_quantity, 0) > 0
             ) as has_reserved_items,
             (
               SELECT COALESCE(json_agg(json_build_object(
                 'id', pii.id,
                 'product_id', pii.product_id,
                 'suggested_product_id', pii.suggested_product_id,
                 'suggested_product_name', p_sug.name,
                 'suggested_product_barcode', p_sug.barcode,
                 'suggested_product_code', COALESCE(p_sug.product_code, p_sug.sku, ''),
                 'suggested_product_stock', p_sug.stock_quantity,
                 'match_status', pii.match_status,
                 'match_note', pii.match_note,
                 'reserved_quantity', COALESCE(pii.reserved_quantity, 0),
                 'reserved_for', pii.reserved_for,
                 'product_name', pii.product_name,
                 'barcode', pii.barcode,
                 'product_code', pii.product_code,
                 'matched_product_name', p_match.name,
                 'matched_product_barcode', p_match.barcode,
                 'matched_product_code', COALESCE(p_match.product_code, p_match.sku, ''),
                 'matched_product_stock', p_match.stock_quantity,
                 'quantity', pii.quantity,
                 'unit_code', pii.unit_code,
                 'system_quantity', pii.system_quantity,
                 'system_unit_code', pii.system_unit_code,
                 'unit_price', pii.unit_price,
                 'tax_rate', pii.tax_rate,
                 'tax_amount', pii.tax_amount,
                 'total_price', pii.total_price,
                 'variant_id', pii.variant_id,
                 'variant_name', pii.variant_name
               ) ORDER BY pii.id), '[]'::json)
               FROM purchase_invoice_items pii
               LEFT JOIN products p_match ON pii.product_id = p_match.id
               LEFT JOIN products p_sug ON pii.suggested_product_id = p_sug.id
               WHERE pii.purchase_invoice_id = pi.id
             ) as items,
              EXISTS (
                SELECT 1 FROM purchase_invoices pi_older
                WHERE pi_older.store_id = pi.store_id
                  AND pi_older.id != pi.id
                  AND pi_older.invoice_date::date > pi.invoice_date::date
                  AND (
                    pi_older.created_at < pi.created_at
                    OR ((pi.status = 'pending' OR COALESCE(pi.operator_status, 'completed') = 'pending') AND pi_older.status IN ('approved', 'completed') AND COALESCE(pi_older.operator_status, 'completed') = 'completed')
                  )
              ) as is_out_of_sequence,
              (
                DATE_TRUNC('month', pi.invoice_date::date) < DATE_TRUNC('month', CURRENT_DATE)
                AND (
                  pi.status = 'pending'
                  OR COALESCE(pi.operator_status, 'completed') = 'pending'
                  OR DATE_TRUNC('month', pi.invoice_date::date) < DATE_TRUNC('month', COALESCE(pi.created_at, CURRENT_TIMESTAMP)::date)
                )
              ) as is_prev_month_carryover
       FROM purchase_invoices pi 
       LEFT JOIN companies c ON pi.company_id = c.id 
       WHERE pi.store_id = $1
     `;
     const params: any[] = [storeId];
 
     if (search && String(search).trim() !== '') {
       const searchTerms = String(search).split(/\s+/).filter(Boolean);
       searchTerms.forEach(rawTerm => {
         const term = rawTerm.replace(/^#+/, '') || rawTerm;
         const pLen = params.length + 1;
         query += ` AND (
           pi.id::text LIKE $${pLen} OR
           ${getTurkishSearchSnippet('pi.invoice_number', pLen)} OR 
           ${getTurkishSearchSnippet('pi.document_number', pLen)} OR
           ${getTurkishSearchSnippet('pi.supplier_name', pLen)} OR
           ${getTurkishSearchSnippet('pi.ettn', pLen)} OR
           ${getTurkishSearchSnippet('pi.notes', pLen)} OR
           ${getTurkishSearchSnippet('pi.waybill_number', pLen)} OR
           ${getTurkishSearchSnippet('pi.tax_number', pLen)} OR
           ${getTurkishSearchSnippet('pi.tax_office', pLen)} OR
           ${getTurkishSearchSnippet('pi.address', pLen)} OR
           ${getTurkishSearchSnippet('pi.payment_method', pLen)} OR
           ${getTurkishSearchSnippet('pi.payment_status', pLen)} OR
           ${getTurkishSearchSnippet('pi.status', pLen)} OR
           ${getTurkishSearchSnippet('pi.integration_status', pLen)} OR
           ${getTurkishSearchSnippet('pi.e_document_type', pLen)} OR
           ${getTurkishSearchSnippet('pi.expense_category', pLen)} OR
           ${getTurkishSearchSnippet('pi.expense_center', pLen)} OR
           ${getTurkishSearchSnippet('pi.currency', pLen)} OR
           pi.total_amount::text LIKE $${pLen} OR
           pi.tax_amount::text LIKE $${pLen} OR
           pi.grand_total::text LIKE $${pLen} OR
           TO_CHAR(pi.invoice_date, 'DD.MM.YYYY') LIKE $${pLen} OR
           TO_CHAR(pi.invoice_date, 'DD/MM/YYYY') LIKE $${pLen} OR
           TO_CHAR(pi.invoice_date, 'DD/MM/YY') LIKE $${pLen} OR
           pi.invoice_date::text LIKE $${pLen} OR
           ${getTurkishSearchSnippet('c.title', pLen)} OR
           ${getTurkishSearchSnippet('c.tax_number', pLen)} OR
           ${getTurkishSearchSnippet('c.tax_office', pLen)} OR
           ${getTurkishSearchSnippet('c.address', pLen)} OR
           ${getTurkishSearchSnippet('c.phone', pLen)} OR
           ${getTurkishSearchSnippet('c.email', pLen)} OR
           EXISTS (
             SELECT 1 FROM purchase_invoice_items sub_pii 
             WHERE sub_pii.purchase_invoice_id = pi.id 
             AND (
               ${getTurkishSearchSnippet('sub_pii.product_name', pLen)} OR
               ${getTurkishSearchSnippet('sub_pii.barcode', pLen)} OR
               ${getTurkishSearchSnippet('sub_pii.product_code', pLen)} OR
               ${getTurkishSearchSnippet('sub_pii.variant_name', pLen)} OR
               ${getTurkishSearchSnippet("COALESCE(sub_pii.reserved_for, '')", pLen)} OR
               sub_pii.unit_price::text LIKE $${pLen} OR
               sub_pii.total_price::text LIKE $${pLen}
             )
           )
         )`;
         params.push(normalizeTurkishParam(term));
       });
     }
 
     if (startDate && (!search || search.trim() === '')) {
       params.push(startDate);
       query += ` AND (pi.invoice_date >= $${params.length} OR pi.status = 'pending' OR COALESCE(pi.operator_status, 'completed') = 'pending')`;
     }

    if (endDate && (!search || search.trim() === '')) {
      params.push(endDate + ' 23:59:59');
      query += ` AND (pi.invoice_date <= $${params.length} OR COALESCE(pi.operator_status, 'completed') = 'pending')`;
    }

    query += `
      ORDER BY
        CASE WHEN COALESCE(pi.operator_status, 'completed') = 'pending' THEN 0 ELSE 1 END ASC,
        CASE WHEN COALESCE(pi.operator_status, 'completed') = 'pending' AND EXISTS (
          SELECT 1 FROM purchase_invoices pi_older
          WHERE pi_older.store_id = pi.store_id
            AND pi_older.id != pi.id
            AND pi_older.invoice_date::date > pi.invoice_date::date
            AND COALESCE(pi_older.operator_status, 'completed') = 'completed'
        ) THEN 0 ELSE 1 END ASC,
        pi.invoice_date DESC,
        pi.created_at DESC,
        pi.id DESC
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/purchase/:id", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const isSuperAdmin = req.user?.role === "superadmin";
    let query = `
      SELECT pi.*, COALESCE(pi.operator_status, 'completed') as operator_status, c.title as company_name 
      FROM purchase_invoices pi 
      LEFT JOIN companies c ON pi.company_id = c.id 
      WHERE pi.id = $1 AND (pi.store_id = $2 OR $3 = TRUE)
    `;
    let params = [req.params.id, storeId, isSuperAdmin];
    
    const invoiceResult = await pool.query(query, params);
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    
    const invoice = invoiceResult.rows[0];
    
    let itemsResult = await pool.query(
      `SELECT pii.*,
              p.product_code as system_product_code, p.sku as system_sku,
              p.name as matched_product_name, p.barcode as matched_product_barcode, p.stock_quantity as matched_product_stock,
              p_sug.name as suggested_product_name, p_sug.barcode as suggested_product_barcode,
              COALESCE(p_sug.product_code, p_sug.sku, '') as suggested_product_code,
              p_sug.stock_quantity as suggested_product_stock
       FROM purchase_invoice_items pii
       LEFT JOIN products p ON pii.product_id = p.id
       LEFT JOIN products p_sug ON pii.suggested_product_id = p_sug.id
       WHERE pii.purchase_invoice_id = $1
       ORDER BY pii.id ASC`,
      [req.params.id]
    );
    
    let items = itemsResult.rows;

    // Only fetch from e-invoice service if there are NO items yet recorded for this invoice!
    if (invoice.ettn && (!items || items.length === 0)) {
       try {
         const isShopLp = await isShopLPStore(pool, invoice.store_id);
         const service = await getEInvoiceService(invoice.store_id);
         if (service) {
           const details = await service.getInvoiceDetailsByUuid(invoice.ettn);
           if (details) {
              // Verify expense classification first
              let isInvoiceExpense = invoice.is_expense === true;
              let invExpenseCategory = invoice.expense_category;
              let invExpenseCenter = invoice.expense_center;
              const stageForOperatorApproval = isShopLp && invoice.operator_status === 'pending';

              if (!isInvoiceExpense) {
                const expenseCheck = await resolveExpenseClassification(pool, invoice.store_id, {
                  supplierTitle: invoice.supplier_name,
                  supplierVkn: invoice.tax_number,
                  companyId: invoice.company_id,
                  pinToCompany: !stageForOperatorApproval
                });
                if (expenseCheck.isExpense) {
                  invExpenseCategory = invExpenseCategory || expenseCheck.expenseCategory;
                  invExpenseCenter = invExpenseCenter || expenseCheck.expenseCenter;
                  if (stageForOperatorApproval) {
                    await pool.query(
                      "UPDATE purchase_invoices SET suggested_is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE id = $3",
                      [invExpenseCategory, invExpenseCenter, invoice.id]
                    );
                    invoice.suggested_is_expense = true;
                    invoice.expense_category = invExpenseCategory;
                    invoice.expense_center = invExpenseCenter;
                  } else {
                    isInvoiceExpense = true;
                    await pool.query(
                      "UPDATE purchase_invoices SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE id = $3",
                      [invExpenseCategory, invExpenseCenter, invoice.id]
                    );
                    invoice.is_expense = true;
                    invoice.expense_category = invExpenseCategory;
                    invoice.expense_center = invExpenseCenter;
                  }
                }
              }

              let rawLines = details.detailList || details.InvoiceLines || details.lines || details.InvoiceLine || details.Lines || details.invoiceLines || [];
              if (rawLines && !Array.isArray(rawLines)) {
                rawLines = [rawLines];
              }
              if (Array.isArray(rawLines) && rawLines.length > 0) {
                 for (const line of rawLines) {
                   const productName = line.detailItem?.itemName || line.itemName || line.Item?.Name?.['#text'] || line.Item?.Name || line.Name || line.name || 'Bilinmeyen Ürün';
                   
                   const sellerCodeRaw = line.detailItem?.sellersItemIdentificationId || line.detailItem?.sellersItemIdentification || line.Item?.SellersItemIdentification?.ID?.['#text'] || line.Item?.SellersItemIdentification?.ID || line.sellersItemIdentification;
                   const sellerCode = typeof sellerCodeRaw === 'string' ? sellerCodeRaw.trim() : (typeof sellerCodeRaw === 'number' ? String(sellerCodeRaw) : null);

                   const buyerCodeRaw = line.detailItem?.buyersItemIdentificationId || line.detailItem?.buyersItemIdentification || line.Item?.BuyersItemIdentification?.ID?.['#text'] || line.Item?.BuyersItemIdentification?.ID || line.buyersItemIdentification;
                   const buyerCode = typeof buyerCodeRaw === 'string' ? buyerCodeRaw.trim() : (typeof buyerCodeRaw === 'number' ? String(buyerCodeRaw) : null);

                   const barcodeRaw = line.Item?.StandardItemIdentification?.ID?.['#text'] || line.Item?.StandardItemIdentification?.ID || line.Item?.ItemInstance?.ProductTraceID;
                   const barcode = typeof barcodeRaw === 'string' ? barcodeRaw.trim() : (typeof barcodeRaw === 'number' ? String(barcodeRaw) : null);

                   const qtyRaw = line.invoicedQuantity || line.Quantity || line.quantity || line.InvoicedQuantity?.['#text'] || line.InvoicedQuantity || 1;
                   const qty = Number(String(qtyRaw).replace(',', '.')) || 1;
                   
                   const upRaw = line.unitPrice || line.Price?.PriceAmount?.['#text'] || line.Price?.PriceAmount || line.Price || line.unitPrice || line.unit_price || 0;
                   const up = Number(String(upRaw).replace(',', '.')) || 0;
                   
                   const trRaw = line.taxTotal?.taxSubtotalList?.[0]?.percent || line.TaxTotal?.TaxSubtotal?.Percent?.['#text'] || line.TaxTotal?.TaxSubtotal?.Percent || line.TaxRate || line.taxRate || line.tax_rate || 20;
                   const tr = Number(String(trRaw).replace(',', '.')) || 20;
                   
                   const lineTotal = qty * up;
                   const taxAmount = (lineTotal * tr) / 100;

                   if (stageForOperatorApproval) {
                     // Read-only match hint ONLY on pending shopLP invoice (no product create, no stock update)
                     const sanitized = sanitizeInvoiceItemCodes(barcode, sellerCode, buyerCode, sellerCode || buyerCode);
                     const match = await findMatchingProduct(pool, invoice.store_id, {
                       supplierVkn: invoice.tax_number,
                       productName,
                       barcode: sanitized.barcode,
                       productCode: sanitized.productCode,
                       sellerCode,
                       buyerCode
                     });
                     const isFee = !match && isNonStockFeeOrServiceItem(productName);
                     const matchNote = match
                       ? `Önerilen Eşleşme (${match.matchType}): ${match.name}`
                       : (isFee ? 'Hizmet / Kargo / Masraf Kalemi' : 'Yeni / Eşleşmemiş Kalem');

                     await pool.query(
                       `INSERT INTO purchase_invoice_items
                        (purchase_invoice_id, product_id, suggested_product_id, match_status, match_note, product_name, barcode, product_code, quantity, unit_price, tax_rate, tax_amount, total_price)
                        VALUES ($1, NULL, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                       [invoice.id, match?.productId || null, matchNote, productName, sanitized.barcode, sanitized.productCode, qty, up, tr, taxAmount, lineTotal]
                     );
                     continue;
                   }

                   if (isInvoiceExpense) {
                     // EXPENSE INVOICE: NEVER match/create products, NEVER alter stock!
                     await pool.query(
                       `INSERT INTO purchase_invoice_items 
                        (purchase_invoice_id, product_id, match_status, product_name, barcode, product_code, quantity, unit_price, tax_rate, tax_amount, total_price) 
                        VALUES ($1, $2, 'skipped', $3, $4, $5, $6, $7, $8, $9, $10)`,
                       [invoice.id, null, productName, null, null, qty, up, tr, taxAmount, lineTotal]
                     );
                     continue;
                   }

                   // 5-Tier Intelligent matching or automatic invoice product creation:
                   const resolved = await findOrCreateProductForInvoiceItem(pool, invoice.store_id, {
                     supplierVkn: invoice.tax_number,
                     productName,
                     barcode,
                     productCode: sellerCode || buyerCode,
                     sellerCode,
                     buyerCode,
                     unitPrice: up,
                     taxRate: tr,
                     currency: invoice.currency || 'TRY'
                   });

                   const productId = resolved.productId;
                   const finalBarcode = resolved.barcode;
                   const finalProductCode = resolved.productCode;

                   // Auto save supplier mapping when matched to an existing inventory product
                   if (invoice.tax_number && productName && productId && !resolved.autoCreated) {
                     await saveSupplierMapping(pool, invoice.store_id, invoice.tax_number, productName, productId, finalProductCode);
                   }

                   await pool.query(
                     `INSERT INTO purchase_invoice_items 
                      (purchase_invoice_id, product_id, match_status, product_name, barcode, product_code, quantity, unit_price, tax_rate, tax_amount, total_price) 
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                     [invoice.id, productId, productId ? 'matched' : 'unmatched', productName, finalBarcode, finalProductCode, qty, up, tr, taxAmount, lineTotal]
                   );

                   // Check if stock movement already recorded for this product on this invoice to prevent double addition
                   const existingMov = await pool.query(
                     "SELECT 1 FROM stock_movements WHERE store_id = $1 AND invoice_id = $2 AND source = 'purchase_invoice' AND product_id = $3 LIMIT 1",
                     [invoice.store_id, invoice.id, productId]
                   );
                   if (productId && existingMov.rows.length === 0) {
                     await pool.query(
                       "UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2, cost_currency = $3 WHERE id = $4",
                       [qty, up, invoice.currency || 'TRY', productId]
                     );
                     await addStockMovement(
                       pool,
                       invoice.store_id,
                       productId,
                       'in',
                       qty,
                       'purchase_invoice',
                       `Alış Faturası: ${invoice.invoice_number}`,
                       up,
                       invoice.supplier_name || invoice.company_name,
                       invoice.currency,
                       null,
                       invoice.id,
                       'purchase',
                       invoice.invoice_number,
                       invoice.invoice_date || invoice.created_at || new Date()
                     );
                   }
                 }

                 const refetched = await pool.query(
                   `SELECT pii.*,
                           p.product_code as system_product_code, p.sku as system_sku,
                           p.name as matched_product_name, p.barcode as matched_product_barcode, p.stock_quantity as matched_product_stock,
                           p_sug.name as suggested_product_name, p_sug.barcode as suggested_product_barcode,
                           COALESCE(p_sug.product_code, p_sug.sku, '') as suggested_product_code,
                           p_sug.stock_quantity as suggested_product_stock
                    FROM purchase_invoice_items pii
                    LEFT JOIN products p ON pii.product_id = p.id
                    LEFT JOIN products p_sug ON pii.suggested_product_id = p_sug.id
                    WHERE pii.purchase_invoice_id = $1
                    ORDER BY pii.id ASC`,
                   [invoice.id]
                 );
                 items = refetched.rows;
              }
           }
         }
       } catch (err: any) {
         console.error("[ON-THE-FLY-ITEMS-SYNC] Error:", err);
       }
    }
    
    invoice.items = items;
    res.json(invoice);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/purchase", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
    const {
      invoice_number, invoice_date, company_id, waybill_number, tax_number, tax_office,
      address, total_amount, tax_amount, grand_total, currency, exchange_rate, notes,
      supplier_name, is_expense, expense_category, expense_center, items, status, is_tax_inclusive,
      payment_method, payment_status,
      financial_account_id, financial_account_name,
      check_note_no, check_due_date, check_instrument_type, check_bank_name
    } = req.body;

    const explicitNonExpense = is_expense === false || is_expense === 'false';
    let finalIsExpense = is_expense === true || is_expense === 'true';
    let finalExpenseCategory = expense_category || null;
    let finalExpenseCenter = expense_center || null;

    if (!finalIsExpense && !explicitNonExpense) {
      const expenseCheck = await resolveExpenseClassification(pool, storeId, {
        supplierTitle: supplier_name,
        supplierVkn: tax_number,
        companyId: company_id,
        pinToCompany: true
      });
      if (expenseCheck.isExpense) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || expenseCheck.expenseCategory;
        finalExpenseCenter = finalExpenseCenter || expenseCheck.expenseCenter;
      }
    } else if (finalIsExpense) {
      // Pin manual expense to company
      if (company_id || tax_number) {
        try {
          if (company_id) {
            await pool.query(
              "UPDATE companies SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE id = $3",
              [finalExpenseCategory, finalExpenseCenter, company_id]
            );
          } else if (tax_number) {
            await pool.query(
              "UPDATE companies SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE store_id = $3 AND tax_number = $4",
              [finalExpenseCategory, finalExpenseCenter, storeId, tax_number]
            );
          }
        } catch (e) {
          console.error("Error pinning manual expense to company:", e);
        }
      }
    }

    const finalIsTaxInclusive = is_tax_inclusive === true || is_tax_inclusive === 'true';

    // Calculate total_amount, tax_amount, grand_total if they are 0 or not provided
    let calculatedTotalAmount = Number(total_amount) || 0;
    let calculatedTaxAmount = Number(tax_amount) || 0;
    let calculatedGrandTotal = Number(grand_total) || 0;

    if ((calculatedGrandTotal === 0 || calculatedTotalAmount === 0) && items && Array.isArray(items)) {
      let subtotal = 0;
      let taxTotal = 0;
      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        const taxRate = Number(item.tax_rate) || 0;
        
        if (finalIsTaxInclusive) {
          const itemTotalIncl = qty * price;
          const itemTotalExcl = itemTotalIncl / (1 + (taxRate / 100));
          const itemTax = itemTotalIncl - itemTotalExcl;
          subtotal += itemTotalExcl;
          taxTotal += itemTax;
        } else {
          const itemTotal = qty * price;
          const itemTax = itemTotal * (taxRate / 100);
          subtotal += itemTotal;
          taxTotal += itemTax;
        }
      }
      calculatedTotalAmount = Number(subtotal.toFixed(2));
      calculatedTaxAmount = Number(taxTotal.toFixed(2));
      calculatedGrandTotal = Number((subtotal + taxTotal).toFixed(2));
    }

    const rawRate = req.body.exchange_rate ?? req.body.exchangeRate;
    let cleanExchangeRate = 1;
    if (rawRate !== undefined && rawRate !== null) {
      const parsed = parseFloat(String(rawRate).replace(',', '.').trim());
      if (!isNaN(parsed) && parsed > 0) {
        cleanExchangeRate = parsed;
      }
    }
    const finalCurrency = (currency || 'TRY').toUpperCase();

    const effectivePaymentMethod = payment_method || (payment_status === 'paid' ? 'cash' : 'term');
    const effectiveIsPaid = isSettlementPaid(effectivePaymentMethod, payment_status, status);
    const effectivePaymentStatus = effectiveIsPaid ? 'paid' : 'unpaid';

    const invoiceRes = await pool.query(
      `INSERT INTO purchase_invoices 
       (store_id, company_id, invoice_number, waybill_number, tax_number, tax_office, address, 
        invoice_date, total_amount, tax_amount, grand_total, currency, exchange_rate, notes, 
        supplier_name, is_expense, expense_category, expense_center, status, is_tax_inclusive, payment_method, payment_status, operator_status, operator_processed_at,
        financial_account_id, financial_account_name, check_note_no, check_due_date, check_instrument_type, check_bank_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'completed', NOW(), $23, $24, $25, $26, $27, $28) RETURNING *`,
      [
        storeId, company_id || null, invoice_number || `P-${Date.now()}`, waybill_number || null,
        tax_number || null, tax_office || null, address || null, invoice_date || new Date(),
        calculatedTotalAmount, calculatedTaxAmount, calculatedGrandTotal, finalCurrency, cleanExchangeRate,
        notes || null, supplier_name || null, finalIsExpense, finalExpenseCategory, finalExpenseCenter, status || 'pending',
        finalIsTaxInclusive, effectivePaymentMethod, effectivePaymentStatus,
        effectiveIsPaid && financial_account_id ? Number(financial_account_id) : null,
        effectiveIsPaid && financial_account_name ? String(financial_account_name).trim() : null,
        effectiveIsPaid && check_note_no ? String(check_note_no).trim() : null,
        effectiveIsPaid && check_due_date ? check_due_date : null,
        effectiveIsPaid && check_instrument_type ? check_instrument_type : null,
        effectiveIsPaid && check_bank_name ? String(check_bank_name).trim() : null
      ]
    );

    let invoice = invoiceRes.rows[0];

    // Add transaction to current account if company exists
    let finalCompanyId = company_id || null;
    if (!finalCompanyId && tax_number) {
      const compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND tax_number = $2 LIMIT 1", [storeId, String(tax_number).trim()]);
      if (compRes.rows.length > 0) finalCompanyId = compRes.rows[0].id;
    }
    if (!finalCompanyId && supplier_name) {
      const compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2)) LIMIT 1", [storeId, String(supplier_name).trim()]);
      if (compRes.rows.length > 0) finalCompanyId = compRes.rows[0].id;
    }

    if (finalCompanyId && !company_id) {
      await pool.query("UPDATE purchase_invoices SET company_id = $1 WHERE id = $2", [finalCompanyId, invoice.id]);
      invoice.company_id = finalCompanyId;
    }

    const purchTreasuryRes = await syncPurchaseInvoiceTreasury(pool, {
      storeId: Number(storeId),
      invoiceId: Number(invoice.id),
      invoiceNumber: invoice.invoice_number,
      invoiceDate: invoice_date || new Date(),
      grandTotal: calculatedGrandTotal,
      currency: finalCurrency,
      exchangeRate: cleanExchangeRate,
      paymentMethod: effectivePaymentMethod,
      paymentStatus: effectivePaymentStatus,
      status: status || 'pending',
      isExpense: finalIsExpense,
      companyId: finalCompanyId || null,
      supplierName: supplier_name || null,
      financialAccountId: financial_account_id ? Number(financial_account_id) : null,
      financialAccountName: financial_account_name || null,
      checkNoteNo: check_note_no || null,
      checkDueDate: check_due_date || null,
      checkInstrumentType: check_instrument_type || null,
      checkBankName: check_bank_name || null
    });

    const effectiveSyncedPayMethod = purchTreasuryRes.marketplacePlatform
      ? (purchTreasuryRes.resolvedPaymentMethod || 'marketplace_vault')
      : effectivePaymentMethod;
    const effectiveSyncedPayStatus = purchTreasuryRes.marketplacePlatform
      ? 'paid'
      : effectivePaymentStatus;

    const updInvTreasury = await pool.query(
      `UPDATE purchase_invoices
       SET financial_account_id = $1, financial_account_name = $2, check_note_id = $3,
           payment_method = $4, payment_status = $5
       WHERE id = $6 RETURNING *`,
      [
        purchTreasuryRes.financialAccountId,
        purchTreasuryRes.financialAccountName,
        purchTreasuryRes.checkNoteId,
        effectiveSyncedPayMethod,
        effectiveSyncedPayStatus,
        invoice.id
      ]
    );
    if (updInvTreasury.rows.length > 0) invoice = updInvTreasury.rows[0];

    if (finalCompanyId && !isCancelledOrDraftStatus(status)) {
      console.log(`Adding current account transaction for company ${finalCompanyId}, invoice ${invoice.id}, amount ${calculatedGrandTotal}`);
      await pool.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, transaction_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [storeId, finalCompanyId, invoice.id, 'credit', calculatedGrandTotal, finalCurrency, cleanExchangeRate, `Alış Faturası: ${invoice_number || invoice.invoice_number}`, invoice_date || new Date()]
      );

      if (purchTreasuryRes.isPaid) {
        await pool.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date, financial_account_id, financial_account_name, check_note_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            storeId, finalCompanyId, invoice.id, 'debt', calculatedGrandTotal, finalCurrency, cleanExchangeRate,
            purchTreasuryRes.marketplacePlatform
              ? `Pazaryeri Hakediş Mahsubu: ${invoice_number || invoice.invoice_number}`
              : `Alış Faturası Ödemesi: ${invoice_number || invoice.invoice_number}${effectiveSyncedPayMethod ? ` (${effectiveSyncedPayMethod})` : ''}`,
            effectiveSyncedPayMethod, invoice_date || new Date(),
            purchTreasuryRes.financialAccountId, purchTreasuryRes.financialAccountName, purchTreasuryRes.checkNoteId
          ]
        );
      }
    }

    const affectedProductIds: number[] = [];
    if (items && Array.isArray(items) && items.length > 0) {
      const processedInvoiceItems: any[] = [];
      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        const taxRate = Number(item.tax_rate) || 0;
        
        let itemTaxAmount = 0;
        let itemTotalPrice = 0;
        
        if (finalIsTaxInclusive) {
          const itemTotalIncl = qty * price;
          const itemTotalExcl = itemTotalIncl / (1 + (taxRate / 100));
          itemTaxAmount = itemTotalIncl - itemTotalExcl;
          itemTotalPrice = itemTotalExcl;
        } else {
          const itemTotalExcl = qty * price;
          itemTaxAmount = itemTotalExcl * (taxRate / 100);
          itemTotalPrice = itemTotalExcl;
        }

        let resolvedProductId = null;
        let resolvedBarcode = null;
        let resolvedProductCode = null;
        if (!finalIsExpense) {
          const resProd = await resolveProductInfo(pool, storeId, item.product_id, item.barcode, item.product_code, item.product_name);
          resolvedProductId = resProd.productId;
          resolvedBarcode = resProd.barcode;
          resolvedProductCode = resProd.productCode || item.product_code || null;

          if (!resolvedProductId && item.product_name) {
            const resolved = await findOrCreateProductForInvoiceItem(pool, storeId, {
              supplierVkn: tax_number,
              productName: item.product_name,
              barcode: item.barcode,
              productCode: item.product_code,
              unitPrice: price,
              taxRate,
              currency: currency || 'TRY',
              unitCode: item.unit_code || 'Adet'
            });
            if (resolved.productId) {
              resolvedProductId = resolved.productId;
              resolvedBarcode = resolved.barcode || resolvedBarcode;
              resolvedProductCode = resolved.productCode || resolvedProductCode;
            }
          }
        }

        processedInvoiceItems.push({
          rawItem: item,
          resolvedProductId,
          resolvedBarcode,
          resolvedProductCode,
          qty,
          price,
          taxRate,
          itemTaxAmount,
          itemTotalPrice
        });
      }

      if (processedInvoiceItems.length > 0) {
        const valueStrings: string[] = [];
        const queryParams: any[] = [];
        let pIdx = 1;

        for (const pItem of processedInvoiceItems) {
          const item = pItem.rawItem;
          const resQty = !finalIsExpense && Number(item.reserved_quantity) > 0 ? Number(item.reserved_quantity) : 0;
          const resFor = !finalIsExpense && resQty > 0 && item.reserved_for ? String(item.reserved_for).trim() : null;
          valueStrings.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
          queryParams.push(
            invoice.id,
            pItem.resolvedProductId,
            item.product_name || 'Bilinmeyen Ürün',
            pItem.resolvedBarcode || null,
            pItem.resolvedProductCode,
            pItem.qty,
            item.unit_code || 'Adet',
            item.system_quantity || null,
            item.system_unit_code || null,
            pItem.price,
            pItem.taxRate,
            pItem.itemTaxAmount,
            pItem.itemTotalPrice,
            item.variant_id || null,
            item.variant_name || null,
            resQty,
            resFor
          );
        }

        await pool.query(
          `INSERT INTO purchase_invoice_items 
           (purchase_invoice_id, product_id, product_name, barcode, product_code, quantity, unit_code, system_quantity, system_unit_code, unit_price, tax_rate, tax_amount, total_price, variant_id, variant_name, reserved_quantity, reserved_for)
           VALUES ${valueStrings.join(", ")}`,
          queryParams
        );
      }

      for (const pItem of processedInvoiceItems) {
        const item = pItem.rawItem;
        const resolvedProductId = pItem.resolvedProductId;
        const resolvedProductCode = pItem.resolvedProductCode;

        if (resolvedProductId && !finalIsExpense) {
          affectedProductIds.push(Number(resolvedProductId));
          if (tax_number && item.product_name) {
            await saveSupplierMapping(pool, storeId, tax_number, item.product_name, resolvedProductId, resolvedProductCode);
          }

          const qtyToStock = item.system_quantity != null ? Number(item.system_quantity) : Number(item.quantity || 1);
          await pool.query(
            "UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2, cost_currency = $3 WHERE id = $4",
            [qtyToStock, item.unit_price || 0, currency || 'TRY', resolvedProductId]
          );

          if (item.variant_id || item.variant_name) {
            try {
              const prodRes = await pool.query("SELECT variants FROM products WHERE id = $1", [resolvedProductId]);
              if (prodRes.rows.length > 0) {
                let vList = prodRes.rows[0].variants;
                if (typeof vList === 'string') {
                  try { vList = JSON.parse(vList); } catch (e) { vList = []; }
                }
                if (Array.isArray(vList)) {
                  let updated = false;
                  const updatedVariants = vList.map((v: any) => {
                    const matchId = item.variant_id && String(v.id) === String(item.variant_id);
                    const matchName = item.variant_name && String(v.name).trim().toLowerCase() === String(item.variant_name).trim().toLowerCase();
                    if (matchId || matchName) {
                      updated = true;
                      const currentStock = Number(v.stock_quantity ?? v.stock ?? 0);
                      return { ...v, stock_quantity: String(currentStock + qtyToStock) };
                    }
                    return v;
                  });
                  if (updated) {
                    await pool.query("UPDATE products SET variants = $1::jsonb WHERE id = $2", [JSON.stringify(updatedVariants), resolvedProductId]);
                  }
                }
              }
            } catch (err) {
              console.error("Error updating variant stock in purchase invoice:", err);
            }
          }
          
          await addStockMovement(
            pool, storeId, resolvedProductId, 'in', qtyToStock, 'purchase_invoice',
            `Alış Faturası: ${invoice.invoice_number}${item.variant_name ? ` (${item.variant_name})` : ''}`, item.unit_price || 0, invoice.supplier_name || supplier_name || 'Tedarikçi', invoice.currency || currency || 'TRY',
            null, invoice.id, 'purchase', invoice.invoice_number, invoice.invoice_date || invoice_date || new Date()
          );

          if (Number(item.reserved_quantity) > 0) {
            await recalculateProductReservedStock(pool, Number(resolvedProductId), storeId);
          }
        }
      }
    }

    if (affectedProductIds.length > 0) {
      syncProductStockToMarketplaces(affectedProductIds, storeId, { reason: `purchase_invoice_created_${invoice.id}` }).catch(err =>
        console.error("[Purchase Invoice Create Marketplace Sync Error]:", err?.message || err)
      );
    }

    res.status(201).json(invoice);
  } catch (e: any) {
    console.error("Error in POST /purchase:", e);
    res.status(400).json({ error: e.message });
  }
});

router.put("/purchase/:id", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
    const { id } = req.params;
    const {
      invoice_number, invoice_date, company_id, waybill_number, tax_number, tax_office,
      address, total_amount, tax_amount, grand_total, currency, exchange_rate, notes,
      supplier_name, is_expense, expense_category, expense_center, items, status, is_tax_inclusive,
      payment_method, payment_status,
      financial_account_id, financial_account_name,
      check_note_no, check_due_date, check_instrument_type, check_bank_name
    } = req.body;

    const isSuperAdmin = req.user?.role === "superadmin";
    const checkRes = await pool.query(
      "SELECT id, store_id, is_expense, currency, exchange_rate, payment_method, payment_status, status, invoice_number, document_number, company_id FROM purchase_invoices WHERE id = $1 AND (store_id = $2 OR $3 = TRUE)",
      [id, storeId, isSuperAdmin]
    );
    if (checkRes.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
    const oldPurchaseRow = checkRes.rows[0];
    const targetStoreId = oldPurchaseRow.store_id || storeId;
    const wasExpense = oldPurchaseRow?.is_expense === true;

    const rawRate = req.body.exchange_rate ?? req.body.exchangeRate;
    let cleanExchangeRate = checkRes.rows[0]?.exchange_rate ? Number(checkRes.rows[0].exchange_rate) : 1;
    if (rawRate !== undefined && rawRate !== null) {
      const parsed = parseFloat(String(rawRate).replace(',', '.').trim());
      if (!isNaN(parsed) && parsed > 0) {
        cleanExchangeRate = parsed;
      }
    }
    const finalCurrency = (currency || checkRes.rows[0]?.currency || 'TRY').toUpperCase();

    let finalIsExpense: boolean;
    let finalExpenseCategory = expense_category || null;
    let finalExpenseCenter = expense_center || null;

    if (is_expense !== undefined) {
      // User explicitly specified their preference in the form / request!
      finalIsExpense = is_expense === true || is_expense === 'true';
      if (!finalIsExpense) {
        finalExpenseCategory = null;
        finalExpenseCenter = null;
        // Unpin company from being expense so future syncs/queries treat it as stock supplier
        if (company_id || tax_number) {
          try {
            if (company_id) {
              await pool.query(
                "UPDATE companies SET is_expense = false, expense_category = NULL, expense_center = NULL WHERE id = $1 AND store_id = $2",
                [company_id, storeId]
              );
            }
            if (tax_number) {
              await pool.query(
                "UPDATE companies SET is_expense = false, expense_category = NULL, expense_center = NULL WHERE store_id = $1 AND tax_number = $2",
                [storeId, tax_number]
              );
            }
          } catch (e) {
            console.error("Error unpinning company from expense in PUT /purchase:", e);
          }
        }
      } else {
        // Pin manual expense to company
        if (company_id || tax_number) {
          try {
            if (company_id) {
              await pool.query(
                "UPDATE companies SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE id = $3",
                [finalExpenseCategory, finalExpenseCenter, company_id]
              );
            } else if (tax_number) {
              await pool.query(
                "UPDATE companies SET is_expense = true, expense_category = COALESCE(expense_category, $1), expense_center = COALESCE(expense_center, $2) WHERE store_id = $3 AND tax_number = $4",
                [finalExpenseCategory, finalExpenseCenter, storeId, tax_number]
              );
            }
          } catch (e) {
            console.error("Error pinning manual expense to company:", e);
          }
        }
      }
    } else {
      finalIsExpense = wasExpense;
      if (!finalIsExpense) {
        const expenseCheck = await resolveExpenseClassification(pool, storeId, {
          supplierTitle: supplier_name,
          supplierVkn: tax_number,
          companyId: company_id,
          pinToCompany: true
        });
        if (expenseCheck.isExpense) {
          finalIsExpense = true;
          finalExpenseCategory = finalExpenseCategory || expenseCheck.expenseCategory;
          finalExpenseCenter = finalExpenseCenter || expenseCheck.expenseCenter;
        }
      }
    }

    // If invoice converted from regular to expense, clean up any stock and auto-created products:
    if (!wasExpense && finalIsExpense) {
      await revertInvoiceStockAndProducts(pool, storeId, Number(id));
    }

    const finalIsTaxInclusive = is_tax_inclusive === true || is_tax_inclusive === 'true';

    // Calculate total_amount, tax_amount, grand_total if they are 0 or not provided
    let calculatedTotalAmount = Number(total_amount) || 0;
    let calculatedTaxAmount = Number(tax_amount) || 0;
    let calculatedGrandTotal = Number(grand_total) || 0;

    if (items && Array.isArray(items) && items.length > 0) {
      let subtotal = 0;
      let taxTotal = 0;
      let grandTotal = 0;
      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        const taxRate = Number(item.tax_rate) || 0;
        
        if (finalIsTaxInclusive) {
          const lineIncl = Math.round(qty * price * 100) / 100;
          const lineExcl = Math.round((lineIncl / (1 + (taxRate / 100))) * 100) / 100;
          const lineTax = Math.round((lineIncl - lineExcl) * 100) / 100;
          
          grandTotal += lineIncl;
          taxTotal += lineTax;
          subtotal += lineExcl;
        } else {
          const lineExcl = Math.round(qty * price * 100) / 100;
          const lineTax = Math.round((lineExcl * (taxRate / 100)) * 100) / 100;
          const lineIncl = Math.round((lineExcl + lineTax) * 100) / 100;
          
          subtotal += lineExcl;
          taxTotal += lineTax;
          grandTotal += lineIncl;
        }
      }
      if (calculatedGrandTotal === 0) {
        calculatedGrandTotal = Math.round(grandTotal * 100) / 100;
      }
      if (calculatedTaxAmount === 0) {
        calculatedTaxAmount = Math.round(taxTotal * 100) / 100;
      }
      if (calculatedTotalAmount === 0) {
        calculatedTotalAmount = finalIsTaxInclusive 
          ? Math.round((calculatedGrandTotal - calculatedTaxAmount) * 100) / 100
          : Math.round(subtotal * 100) / 100;
      }
    }

    // Deduct old items stock before replacing them (and remember old reserves if form omitted them)
    const affectedProductIds: number[] = [];
    const oldItems = await pool.query("SELECT id, product_id, barcode, product_code, product_name, quantity, system_quantity, variant_id, variant_name, reserved_quantity, reserved_for FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [id]);
    const oldReserveByKey = new Map<string, { reserved_quantity: number; reserved_for: string | null }>();
    for (const oldItem of oldItems.rows) {
      if (Number(oldItem.reserved_quantity || 0) > 0) {
        const key = `${oldItem.product_id || ''}:${String(oldItem.product_name || '').trim().toLowerCase()}`;
        oldReserveByKey.set(key, {
          reserved_quantity: Number(oldItem.reserved_quantity || 0),
          reserved_for: oldItem.reserved_for || null
        });
      }
      let oldResolvedId = oldItem.product_id;
      if (!oldResolvedId) {
        const { productId } = await resolveProductInfo(pool, storeId, null, oldItem.barcode, oldItem.product_code);
        oldResolvedId = productId;
      }
      if (oldResolvedId) {
        affectedProductIds.push(Number(oldResolvedId));
        const qtyToRevert = oldItem.system_quantity != null ? Number(oldItem.system_quantity) : Number(oldItem.quantity || 1);
        await pool.query("UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2", [qtyToRevert, oldResolvedId]);

        if (oldItem.variant_id || oldItem.variant_name) {
          try {
            const prodRes = await pool.query("SELECT variants FROM products WHERE id = $1", [oldResolvedId]);
            if (prodRes.rows.length > 0) {
              let vList = prodRes.rows[0].variants;
              if (typeof vList === 'string') {
                try { vList = JSON.parse(vList); } catch (e) { vList = []; }
              }
              if (Array.isArray(vList)) {
                let updated = false;
                const revertedVariants = vList.map((v: any) => {
                  const matchId = oldItem.variant_id && String(v.id) === String(oldItem.variant_id);
                  const matchName = oldItem.variant_name && String(v.name).trim().toLowerCase() === String(oldItem.variant_name).trim().toLowerCase();
                  if (matchId || matchName) {
                    updated = true;
                    const currentStock = Number(v.stock_quantity ?? v.stock ?? 0);
                    return { ...v, stock_quantity: String(Math.max(0, currentStock - qtyToRevert)) };
                  }
                  return v;
                });
                if (updated) {
                  await pool.query("UPDATE products SET variants = $1::jsonb WHERE id = $2", [JSON.stringify(revertedVariants), oldResolvedId]);
                }
              }
            }
          } catch (err) {
            console.error("Error reverting variant stock in purchase invoice:", err);
          }
        }
      }
    }

    await pool.query("DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [id]);
    const cleanPurchInvNo = (invoice_number || '').trim();
    await pool.query(
      `DELETE FROM stock_movements
       WHERE store_id = $1
         AND (source = 'purchase_invoice' OR invoice_type = 'purchase')
         AND (
           invoice_id = $2
           OR ($3::text <> '' AND invoice_number = $3)
           OR ($3::text <> '' AND description LIKE ('%' || $3 || '%'))
         )`,
      [targetStoreId, id, cleanPurchInvNo]
    );

    const effectivePaymentMethod = payment_method !== undefined ? payment_method : (oldPurchaseRow.payment_method || (payment_status === 'paid' ? 'cash' : 'term'));
    const effectiveIsPaid = isSettlementPaid(effectivePaymentMethod, payment_status, status || oldPurchaseRow.status);
    const effectivePaymentStatus = effectiveIsPaid ? 'paid' : 'unpaid';

    const invoiceRes = await pool.query(
      `UPDATE purchase_invoices 
       SET company_id = $1, invoice_number = $2, waybill_number = $3, tax_number = $4, tax_office = $5, address = $6, 
           invoice_date = $7, total_amount = $8, tax_amount = $9, grand_total = $10, currency = $11, exchange_rate = $12, 
           notes = $13, supplier_name = $14, is_expense = $15, expense_category = $16, expense_center = $17, status = $18, is_tax_inclusive = $19,
           payment_method = $20, payment_status = $21, operator_status = 'completed', operator_processed_at = COALESCE(operator_processed_at, NOW()),
           financial_account_id = $22, financial_account_name = $23, check_note_no = $24, check_due_date = $25, check_instrument_type = $26, check_bank_name = $27
       WHERE id = $28 AND store_id = $29 RETURNING *`,
      [
        company_id || null, invoice_number, waybill_number || null, tax_number || null, tax_office || null, address || null,
        invoice_date, calculatedTotalAmount, calculatedTaxAmount, calculatedGrandTotal, finalCurrency, cleanExchangeRate,
        notes || null, supplier_name || null, finalIsExpense, finalExpenseCategory, finalExpenseCenter, status || oldPurchaseRow.status || 'pending',
        finalIsTaxInclusive, effectivePaymentMethod, effectivePaymentStatus,
        effectiveIsPaid && financial_account_id ? Number(financial_account_id) : null,
        effectiveIsPaid && financial_account_name ? String(financial_account_name).trim() : null,
        effectiveIsPaid && check_note_no ? String(check_note_no).trim() : null,
        effectiveIsPaid && check_due_date ? check_due_date : null,
        effectiveIsPaid && check_instrument_type ? check_instrument_type : null,
        effectiveIsPaid && check_bank_name ? String(check_bank_name).trim() : null,
        id, targetStoreId
      ]
    );

    let invoice = invoiceRes.rows[0];

    // Delete old transaction and add new one
    let finalCompanyId = company_id || null;
    if (!finalCompanyId && tax_number) {
      const compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND tax_number = $2 LIMIT 1", [targetStoreId, String(tax_number).trim()]);
      if (compRes.rows.length > 0) finalCompanyId = compRes.rows[0].id;
    }
    if (!finalCompanyId && supplier_name) {
      const compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2)) LIMIT 1", [targetStoreId, String(supplier_name).trim()]);
      if (compRes.rows.length > 0) finalCompanyId = compRes.rows[0].id;
    }

    if (finalCompanyId && !company_id) {
      await pool.query("UPDATE purchase_invoices SET company_id = $1 WHERE id = $2", [finalCompanyId, id]);
      invoice.company_id = finalCompanyId;
    }

    await pool.query("DELETE FROM current_account_transactions WHERE purchase_invoice_id = $1", [id]);
    const oldInvNoTrimmed = String(oldPurchaseRow.document_number || oldPurchaseRow.invoice_number || invoice_number || '').trim();
    if (oldInvNoTrimmed && (finalCompanyId || oldPurchaseRow.company_id)) {
      await pool.query(
        `DELETE FROM current_account_transactions
         WHERE purchase_invoice_id IS NULL
           AND store_id = $1
           AND company_id = $2
           AND type = 'debt'
           AND (TRIM(description) = $3 OR description LIKE 'Alış Faturası Ödemesi: ' || $3 || '%')`,
        [targetStoreId, finalCompanyId || oldPurchaseRow.company_id, oldInvNoTrimmed]
      );
    }

    const purchUpdTreasuryRes = await syncPurchaseInvoiceTreasury(pool, {
      storeId: Number(targetStoreId),
      invoiceId: Number(invoice.id),
      invoiceNumber: invoice.invoice_number || invoice_number,
      invoiceDate: invoice_date || invoice.invoice_date || new Date(),
      grandTotal: calculatedGrandTotal,
      currency: finalCurrency,
      exchangeRate: cleanExchangeRate,
      paymentMethod: effectivePaymentMethod,
      paymentStatus: effectivePaymentStatus,
      status: status || oldPurchaseRow.status || 'pending',
      isExpense: finalIsExpense,
      companyId: finalCompanyId || null,
      supplierName: supplier_name || invoice.supplier_name || null,
      financialAccountId: financial_account_id ? Number(financial_account_id) : null,
      financialAccountName: financial_account_name || null,
      checkNoteNo: check_note_no || null,
      checkDueDate: check_due_date || null,
      checkInstrumentType: check_instrument_type || null,
      checkBankName: check_bank_name || null
    });

    const updSyncedPayMethod = purchUpdTreasuryRes.marketplacePlatform
      ? (purchUpdTreasuryRes.resolvedPaymentMethod || 'marketplace_vault')
      : effectivePaymentMethod;
    const updSyncedPayStatus = purchUpdTreasuryRes.marketplacePlatform
      ? 'paid'
      : effectivePaymentStatus;

    const updInvTreasury2 = await pool.query(
      `UPDATE purchase_invoices
       SET financial_account_id = $1, financial_account_name = $2, check_note_id = $3,
           payment_method = $4, payment_status = $5
       WHERE id = $6 RETURNING *`,
      [
        purchUpdTreasuryRes.financialAccountId,
        purchUpdTreasuryRes.financialAccountName,
        purchUpdTreasuryRes.checkNoteId,
        updSyncedPayMethod,
        updSyncedPayStatus,
        invoice.id
      ]
    );
    if (updInvTreasury2.rows.length > 0) invoice = updInvTreasury2.rows[0];
    
    if (finalCompanyId && !isCancelledOrDraftStatus(status || oldPurchaseRow.status)) {
      await pool.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, transaction_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [targetStoreId, finalCompanyId, invoice.id, 'credit', calculatedGrandTotal, finalCurrency, cleanExchangeRate, `Alış Faturası: ${invoice_number}`, invoice_date || new Date()]
      );

      if (purchUpdTreasuryRes.isPaid) {
        await pool.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date, financial_account_id, financial_account_name, check_note_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            targetStoreId, finalCompanyId, invoice.id, 'debt', calculatedGrandTotal, finalCurrency, cleanExchangeRate,
            purchUpdTreasuryRes.marketplacePlatform
              ? `Pazaryeri Hakediş Mahsubu: ${invoice_number}`
              : `Alış Faturası Ödemesi: ${invoice_number}${updSyncedPayMethod ? ` (${updSyncedPayMethod})` : ''}`,
            updSyncedPayMethod, invoice_date || new Date(),
            purchUpdTreasuryRes.financialAccountId, purchUpdTreasuryRes.financialAccountName, purchUpdTreasuryRes.checkNoteId
          ]
        );
      }
    }

    if (items && Array.isArray(items) && items.length > 0) {
      const processedInvoiceItems: any[] = [];
      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        const taxRate = Number(item.tax_rate) || 0;
        
        let itemTaxAmount = 0;
        let itemTotalPrice = 0;
        
        if (finalIsTaxInclusive) {
          const itemTotalIncl = qty * price;
          const itemTotalExcl = itemTotalIncl / (1 + (taxRate / 100));
          itemTaxAmount = itemTotalIncl - itemTotalExcl;
          itemTotalPrice = itemTotalExcl;
        } else {
          const itemTotalExcl = qty * price;
          itemTaxAmount = itemTotalExcl * (taxRate / 100);
          itemTotalPrice = itemTotalExcl;
        }

        let resolvedProductId = null;
        let resolvedBarcode = null;
        let resolvedProductCode = null;
        if (!finalIsExpense) {
          const resProd = await resolveProductInfo(pool, storeId, item.product_id, item.barcode, item.product_code, item.product_name);
          resolvedProductId = resProd.productId;
          resolvedBarcode = resProd.barcode;
          resolvedProductCode = resProd.productCode || item.product_code || null;

          if (!resolvedProductId && item.product_name) {
            const resolved = await findOrCreateProductForInvoiceItem(pool, storeId, {
              supplierVkn: tax_number,
              productName: item.product_name,
              barcode: item.barcode,
              productCode: item.product_code,
              unitPrice: price,
              taxRate,
              currency: currency || 'TRY',
              unitCode: item.unit_code || 'Adet'
            });
            if (resolved.productId) {
              resolvedProductId = resolved.productId;
              resolvedBarcode = resolved.barcode || resolvedBarcode;
              resolvedProductCode = resolved.productCode || resolvedProductCode;
            }
          }
        }

        processedInvoiceItems.push({
          rawItem: item,
          resolvedProductId,
          resolvedBarcode,
          resolvedProductCode,
          qty,
          price,
          taxRate,
          itemTaxAmount,
          itemTotalPrice
        });
      }

      if (processedInvoiceItems.length > 0) {
        const valueStrings: string[] = [];
        const queryParams: any[] = [];
        let pIdx = 1;

        for (const pItem of processedInvoiceItems) {
          const item = pItem.rawItem;
          const fallbackRes = oldReserveByKey.get(`${pItem.resolvedProductId || item.product_id || ''}:${String(item.product_name || '').trim().toLowerCase()}`);
          const resQty = !finalIsExpense
            ? (item.reserved_quantity !== undefined ? Math.max(0, Number(item.reserved_quantity) || 0) : (fallbackRes?.reserved_quantity || 0))
            : 0;
          const resFor = resQty > 0 ? ((item.reserved_for !== undefined ? item.reserved_for : fallbackRes?.reserved_for) || null) : null;
          valueStrings.push(`($${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++}, $${pIdx++})`);
          queryParams.push(
            id,
            pItem.resolvedProductId,
            item.product_name || 'Bilinmeyen Ürün',
            pItem.resolvedBarcode || null,
            pItem.resolvedProductCode,
            pItem.qty,
            item.unit_code || 'Adet',
            item.system_quantity || null,
            item.system_unit_code || null,
            pItem.price,
            pItem.taxRate,
            pItem.itemTaxAmount,
            pItem.itemTotalPrice,
            item.variant_id || null,
            item.variant_name || null,
            resQty,
            resFor
          );
        }

        await pool.query(
          `INSERT INTO purchase_invoice_items 
           (purchase_invoice_id, product_id, product_name, barcode, product_code, quantity, unit_code, system_quantity, system_unit_code, unit_price, tax_rate, tax_amount, total_price, variant_id, variant_name, reserved_quantity, reserved_for)
           VALUES ${valueStrings.join(", ")}`,
          queryParams
        );
      }

      for (const pItem of processedInvoiceItems) {
        const item = pItem.rawItem;
        const resolvedProductId = pItem.resolvedProductId;
        const resolvedProductCode = pItem.resolvedProductCode;

        if (resolvedProductId && !finalIsExpense) {
          affectedProductIds.push(Number(resolvedProductId));
          if (tax_number && item.product_name) {
            await saveSupplierMapping(pool, storeId, tax_number, item.product_name, resolvedProductId, resolvedProductCode);
          }

          const qtyToStock = item.system_quantity != null ? Number(item.system_quantity) : Number(item.quantity || 1);
          await pool.query(
            "UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2, cost_currency = $3 WHERE id = $4",
            [qtyToStock, item.unit_price || 0, currency || 'TRY', resolvedProductId]
          );

          if (item.variant_id || item.variant_name) {
            try {
              const prodRes = await pool.query("SELECT variants FROM products WHERE id = $1", [resolvedProductId]);
              if (prodRes.rows.length > 0) {
                let vList = prodRes.rows[0].variants;
                if (typeof vList === 'string') {
                  try { vList = JSON.parse(vList); } catch (e) { vList = []; }
                }
                if (Array.isArray(vList)) {
                  let updated = false;
                  const updatedVariants = vList.map((v: any) => {
                    const matchId = item.variant_id && String(v.id) === String(item.variant_id);
                    const matchName = item.variant_name && String(v.name).trim().toLowerCase() === String(item.variant_name).trim().toLowerCase();
                    if (matchId || matchName) {
                      updated = true;
                      const currentStock = Number(v.stock_quantity ?? v.stock ?? 0);
                      return { ...v, stock_quantity: String(currentStock + qtyToStock) };
                    }
                    return v;
                  });
                  if (updated) {
                    await pool.query("UPDATE products SET variants = $1::jsonb WHERE id = $2", [JSON.stringify(updatedVariants), resolvedProductId]);
                  }
                }
              }
            } catch (err) {
              console.error("Error updating variant stock in purchase invoice:", err);
            }
          }
          
          await addStockMovement(
            pool, storeId, resolvedProductId, 'in', qtyToStock, 'purchase_invoice',
            `Alış Faturası: ${invoice.invoice_number}${item.variant_name ? ` (${item.variant_name})` : ''}`, item.unit_price || 0, invoice.supplier_name || supplier_name || 'Tedarikçi', invoice.currency || currency || 'TRY',
            null, invoice.id, 'purchase', invoice.invoice_number, invoice.invoice_date || invoice_date || new Date()
          );
        }
      }
    }

    const uniqueAffected = Array.from(new Set(affectedProductIds));
    for (const pid of uniqueAffected) {
      await recalculateProductReservedStock(pool, pid, targetStoreId);
    }

    if (uniqueAffected.length > 0) {
      syncProductStockToMarketplaces(uniqueAffected, targetStoreId, { reason: `purchase_invoice_updated_${id}` }).catch(err =>
        console.error("[Purchase Invoice Update Marketplace Sync Error]:", err?.message || err)
      );
    }

    res.json(invoice);
  } catch (e: any) {
    console.error("Error in PUT /purchase/:id:", e);
    res.status(400).json({ error: e.message });
  }
});

router.delete("/sales/:id", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const { id } = req.params;

    const checkRes = await pool.query("SELECT id, invoice_number, quotation_id, sale_id FROM sales_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (checkRes.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
    const invoice = checkRes.rows[0];

    // Revert stock
    const affectedProductIds: number[] = [];
    const oldItems = await pool.query("SELECT product_id, quantity FROM sales_invoice_items WHERE sales_invoice_id = $1", [id]);
    for (const item of oldItems.rows) {
      if (item.product_id) {
        affectedProductIds.push(Number(item.product_id));
        await pool.query("UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3", [item.quantity, item.product_id, storeId]);
      }
    }

    const delSalesInvNo = (invoice.invoice_number || '').trim();
    await pool.query(
      `DELETE FROM stock_movements
       WHERE store_id = $1
         AND (
           (invoice_id = $2 AND (type = 'out' OR invoice_type = 'sales' OR source = 'sales_invoice'))
           OR ($3::int IS NOT NULL AND sale_id = $3)
           OR ($4::text <> '' AND invoice_number = $4)
           OR ($4::text <> '' AND source = 'sales_invoice' AND description LIKE ('%' || $4 || '%'))
         )`,
      [storeId, id, invoice.sale_id || null, delSalesInvNo]
    );
    await pool.query("DELETE FROM sales_invoice_items WHERE sales_invoice_id = $1", [id]);
    await pool.query("DELETE FROM current_account_transactions WHERE sales_invoice_id = $1", [id]);
    if (invoice.quotation_id || invoice.sale_id) {
      await pool.query("DELETE FROM current_account_transactions WHERE (quotation_id = $1 OR sale_id = $2) AND sales_invoice_id IS NULL", [invoice.quotation_id || null, invoice.sale_id || null]);
    }
    await deletePortfolioTxForSource(pool, storeId, 'sales_invoice', Number(id));
    await deleteCheckNoteForSource(pool, storeId, 'sales_invoice', Number(id));
    await pool.query("DELETE FROM sales_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);

    if (affectedProductIds.length > 0) {
      syncProductStockToMarketplaces(affectedProductIds, storeId, { reason: `sales_invoice_deleted_${id}` }).catch(err =>
        console.error("[Sales Invoice Delete Marketplace Sync Error]:", err?.message || err)
      );
    }

    res.json({ success: true, message: "Sales invoice deleted successfully" });
  } catch (e: any) {
    console.error("Error in DELETE /sales/:id:", e);
    res.status(400).json({ error: e.message });
  }
});

router.delete("/purchase/:id", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const { id } = req.params;

    const checkRes = await pool.query("SELECT id, invoice_number, document_number, company_id FROM purchase_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (checkRes.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
    const invoice = checkRes.rows[0];

    // Adjust stocks back
    const affectedProductIds: number[] = [];
    const oldItems = await pool.query("SELECT product_id, quantity, system_quantity, variant_id, variant_name FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [id]);
    for (const oldItem of oldItems.rows) {
      if (oldItem.product_id) {
        affectedProductIds.push(Number(oldItem.product_id));
        const qtyToRevert = oldItem.system_quantity != null ? Number(oldItem.system_quantity) : Number(oldItem.quantity || 1);
        await pool.query("UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2", [qtyToRevert, oldItem.product_id]);

        if (oldItem.variant_id || oldItem.variant_name) {
          try {
            const prodRes = await pool.query("SELECT variants FROM products WHERE id = $1", [oldItem.product_id]);
            if (prodRes.rows.length > 0) {
              let vList = prodRes.rows[0].variants;
              if (typeof vList === 'string') {
                try { vList = JSON.parse(vList); } catch (e) { vList = []; }
              }
              if (Array.isArray(vList)) {
                let updated = false;
                const revertedVariants = vList.map((v: any) => {
                  const matchId = oldItem.variant_id && String(v.id) === String(oldItem.variant_id);
                  const matchName = oldItem.variant_name && String(v.name).trim().toLowerCase() === String(oldItem.variant_name).trim().toLowerCase();
                  if (matchId || matchName) {
                    updated = true;
                    const currentStock = Number(v.stock_quantity ?? v.stock ?? 0);
                    return { ...v, stock_quantity: String(Math.max(0, currentStock - qtyToRevert)) };
                  }
                  return v;
                });
                if (updated) {
                  await pool.query("UPDATE products SET variants = $1::jsonb WHERE id = $2", [JSON.stringify(revertedVariants), oldItem.product_id]);
                }
              }
            }
          } catch (err) {
            console.error("Error reverting variant stock on purchase invoice delete:", err);
          }
        }
      }
    }

    // Clean up related stock movements, current account transactions, treasury/check rows, and invoice items
    const delPurchInvNo = (invoice.invoice_number || '').trim();
    const delPurchDocNo = (invoice.document_number || invoice.invoice_number || '').trim();
    await pool.query(
      `DELETE FROM stock_movements
       WHERE store_id = $1
         AND (source = 'purchase_invoice' OR invoice_type = 'purchase')
         AND (
           invoice_id = $2
           OR ($3::text <> '' AND invoice_number = $3)
           OR ($3::text <> '' AND description LIKE ('%' || $3 || '%'))
         )`,
      [storeId, id, delPurchInvNo]
    );
    await pool.query("DELETE FROM current_account_transactions WHERE purchase_invoice_id = $1", [id]);
    if (delPurchDocNo && invoice.company_id) {
      await pool.query(
        `DELETE FROM current_account_transactions
         WHERE purchase_invoice_id IS NULL
           AND store_id = $1
           AND company_id = $2
           AND type = 'debt'
           AND (TRIM(description) = $3 OR description LIKE 'Alış Faturası Ödemesi: ' || $3 || '%')`,
        [storeId, invoice.company_id, delPurchDocNo]
      );
    }
    await deletePortfolioTxForSource(pool, storeId, 'purchase_invoice', Number(id));
    await deleteCheckNoteForSource(pool, storeId, 'purchase_invoice', Number(id));
    await pool.query("DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [id]);
    await pool.query("DELETE FROM purchase_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);

    const uniqueDeletedProdIds = Array.from(new Set(affectedProductIds));
    for (const pid of uniqueDeletedProdIds) {
      await recalculateProductReservedStock(pool, pid, storeId);
    }

    if (uniqueDeletedProdIds.length > 0) {
      syncProductStockToMarketplaces(uniqueDeletedProdIds, storeId, { reason: `purchase_invoice_deleted_${id}` }).catch(err =>
        console.error("[Purchase Invoice Delete Marketplace Sync Error]:", err?.message || err)
      );
    }

    res.json({ success: true, message: "Purchase invoice deleted successfully" });
  } catch (e: any) {
    console.error("Error in DELETE /purchase/:id:", e);
    res.status(400).json({ error: e.message });
  }
});

router.post("/purchase/:id/status", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE purchase_invoices SET status = $1 WHERE id = $2 AND store_id = $3 RETURNING *",
      [status, id, storeId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/purchase/:id/read", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE purchase_invoices SET status = 'read' WHERE id = $1 AND store_id = $2 RETURNING *",
      [id, storeId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/purchase/:id/payment-status", async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
    const { id } = req.params;
    const {
      status,
      payment_method,
      financial_account_id,
      financial_account_name,
      check_note_no,
      check_due_date,
      check_instrument_type,
      check_bank_name
    } = req.body;

    const existingRes = await pool.query(
      "SELECT * FROM purchase_invoices WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );
    if (existingRes.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
    const existing = existingRes.rows[0];

    const isSettingPaid = status === 'paid';
    const targetMethod = isSettingPaid
      ? ((payment_method && !isTermOrUnpaidMethod(payment_method))
          ? payment_method
          : (existing.payment_method && !isTermOrUnpaidMethod(existing.payment_method) ? existing.payment_method : 'cash'))
      : 'term';
    const targetPaymentStatus = isSettingPaid ? 'paid' : 'unpaid';

    // Resolve company_id if missing
    let compId = existing.company_id;
    if (!compId && existing.tax_number) {
      const compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND tax_number = $2 LIMIT 1", [storeId, String(existing.tax_number).trim()]);
      if (compRes.rows.length > 0) compId = compRes.rows[0].id;
    }
    if (!compId && existing.supplier_name) {
      const compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2)) LIMIT 1", [storeId, String(existing.supplier_name).trim()]);
      if (compRes.rows.length > 0) compId = compRes.rows[0].id;
    }

    const treasuryRes = await syncPurchaseInvoiceTreasury(pool, {
      storeId: Number(storeId),
      invoiceId: Number(existing.id),
      invoiceNumber: existing.invoice_number,
      invoiceDate: existing.invoice_date || existing.created_at || new Date(),
      grandTotal: Number(existing.grand_total || existing.total_amount || 0),
      currency: existing.currency || 'TRY',
      exchangeRate: Number(existing.exchange_rate || 1) || 1,
      paymentMethod: targetMethod,
      paymentStatus: targetPaymentStatus,
      status: existing.status,
      isExpense: Boolean(existing.is_expense),
      companyId: compId || null,
      supplierName: existing.supplier_name || null,
      financialAccountId: isSettingPaid ? (financial_account_id !== undefined ? (financial_account_id ? Number(financial_account_id) : null) : existing.financial_account_id) : null,
      financialAccountName: isSettingPaid ? (financial_account_name !== undefined ? financial_account_name : existing.financial_account_name) : null,
      checkNoteNo: isSettingPaid ? (check_note_no || existing.check_note_no) : null,
      checkDueDate: isSettingPaid ? (check_due_date || existing.check_due_date) : null,
      checkInstrumentType: isSettingPaid ? (check_instrument_type || existing.check_instrument_type) : null,
      checkBankName: isSettingPaid ? (check_bank_name || existing.check_bank_name) : null
    });

    const result = await pool.query(
      `UPDATE purchase_invoices
       SET company_id = COALESCE($1, company_id),
           payment_status = $2,
           payment_method = $3,
           financial_account_id = $4,
           financial_account_name = $5,
           check_note_id = $6,
           check_note_no = $7,
           check_due_date = $8,
           check_instrument_type = $9,
           check_bank_name = $10
       WHERE id = $11 AND store_id = $12 RETURNING *`,
      [
        compId || null,
        targetPaymentStatus,
        targetMethod,
        treasuryRes.financialAccountId,
        treasuryRes.financialAccountName,
        treasuryRes.checkNoteId,
        isSettingPaid ? (check_note_no || existing.check_note_no || null) : null,
        isSettingPaid ? (check_due_date || existing.check_due_date || null) : null,
        isSettingPaid ? (check_instrument_type || existing.check_instrument_type || null) : null,
        isSettingPaid ? (check_bank_name || existing.check_bank_name || null) : null,
        id,
        storeId
      ]
    );

    const invoice = result.rows[0];

    if (compId) {
      // Remove any existing debt (payment) transaction for this invoice first (including orphan rows)
      await pool.query(
        "DELETE FROM current_account_transactions WHERE purchase_invoice_id = $1 AND type = 'debt'",
        [id]
      );
      const docKey = String(invoice.document_number || invoice.invoice_number || '').trim();
      if (docKey) {
        await pool.query(
          `DELETE FROM current_account_transactions
           WHERE purchase_invoice_id IS NULL
             AND store_id = $1
             AND company_id = $2
             AND type = 'debt'
             AND (TRIM(description) = $3 OR description LIKE 'Alış Faturası Ödemesi: ' || $3 || '%')`,
          [storeId, compId, docKey]
        );
      }

      // Ensure credit transaction exists for non-draft/non-cancelled
      if (!isCancelledOrDraftStatus(invoice.status)) {
        const creditRes = await pool.query("SELECT 1 FROM current_account_transactions WHERE purchase_invoice_id = $1 AND type = 'credit'", [id]);
        if (creditRes.rows.length === 0) {
          await pool.query(
            `INSERT INTO current_account_transactions 
              (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, transaction_date) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              storeId, compId, id, 'credit', Number(invoice.grand_total || invoice.total_amount || 0),
              invoice.currency || 'TRY', invoice.exchange_rate || 1,
              `Alış Faturası: ${invoice.invoice_number}`, invoice.invoice_date || invoice.created_at || new Date()
            ]
          );
        }

        if (treasuryRes.isPaid) {
          await pool.query(
            `INSERT INTO current_account_transactions 
              (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date, financial_account_id, financial_account_name, check_note_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              storeId, compId, id, 'debt', Number(invoice.grand_total || invoice.total_amount || 0),
              invoice.currency || 'TRY', invoice.exchange_rate || 1,
              `Alış Faturası Ödemesi: ${invoice.invoice_number} (${targetMethod})`,
              targetMethod, new Date(),
              treasuryRes.financialAccountId, treasuryRes.financialAccountName, treasuryRes.checkNoteId
            ]
          );
        }
      }
    }

    res.json(invoice);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Explicitly convert an existing invoice to an expense, cleanly reverting stocks and pinning supplier
router.post("/purchase/:id/convert-to-expense", async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
  const { id } = req.params;
  const { expense_category, expense_center } = req.body;

  try {
    const invRes = await pool.query("SELECT * FROM purchase_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı." });
    const inv = invRes.rows[0];

    const detected = detectExpenseCategory(inv.supplier_name, inv.tax_number, null);
    const finalCategory = expense_category || inv.expense_category || detected.expenseCategory || 'diger';
    const finalCenter = expense_center || inv.expense_center || detected.expenseCenter || 'office';

    const oldLinkedProds = await pool.query(
      "SELECT DISTINCT product_id FROM purchase_invoice_items WHERE purchase_invoice_id = $1 AND product_id IS NOT NULL",
      [id]
    );

    // 1. Revert any stock movements and auto-created products
    const { revertedCount, deletedProductsCount } = await revertInvoiceStockAndProducts(pool, storeId, Number(id));

    // 2. Unlink item records from products & clear reserves so they are purely expense lines
    await pool.query(
      "UPDATE purchase_invoice_items SET product_id = NULL, barcode = NULL, product_code = NULL, match_status = 'skipped', reserved_quantity = 0, reserved_for = NULL WHERE purchase_invoice_id = $1",
      [id]
    );

    for (const r of oldLinkedProds.rows) {
      await recalculateProductReservedStock(pool, Number(r.product_id), storeId);
    }

    // 3. Mark invoice as expense
    await pool.query(
      "UPDATE purchase_invoices SET is_expense = true, expense_category = $1, expense_center = $2, operator_status = 'completed', operator_processed_at = COALESCE(operator_processed_at, NOW()) WHERE id = $3",
      [finalCategory, finalCenter, id]
    );

    // 4. Pin supplier company as permanent expense
    if (inv.company_id) {
      await pool.query(
        "UPDATE companies SET is_expense = true, expense_category = $1, expense_center = $2 WHERE id = $3",
        [finalCategory, finalCenter, inv.company_id]
      );
    }
    if (inv.tax_number) {
      await pool.query(
        "UPDATE companies SET is_expense = true, expense_category = $1, expense_center = $2 WHERE store_id = $3 AND tax_number = $4",
        [finalCategory, finalCenter, storeId, inv.tax_number]
      );
    }

    // 5. Auto-deduct from Marketplace Vault if this expense invoice belongs to a marketplace on shopLP
    const convInvNo = inv.invoice_number || inv.document_number || `PI-${inv.id}`;
    const convGrandTotal = Number(inv.grand_total || inv.total_amount || 0);
    const convTreasury = await syncPurchaseInvoiceTreasury(pool, {
      storeId: Number(storeId),
      invoiceId: Number(inv.id),
      invoiceNumber: convInvNo,
      invoiceDate: inv.invoice_date || inv.created_at || new Date(),
      grandTotal: convGrandTotal,
      currency: inv.currency || 'TRY',
      exchangeRate: Number(inv.exchange_rate || 1) || 1,
      paymentMethod: inv.payment_method || 'term',
      paymentStatus: inv.payment_status || 'unpaid',
      status: inv.status || 'approved',
      isExpense: true,
      companyId: inv.company_id ? Number(inv.company_id) : null,
      supplierName: inv.supplier_name || null,
      taxNumber: inv.tax_number || null,
      financialAccountId: inv.financial_account_id ? Number(inv.financial_account_id) : null,
      financialAccountName: inv.financial_account_name || null,
    });
    if (convTreasury.marketplacePlatform && convTreasury.isPaid && convTreasury.financialAccountId) {
      await pool.query(
        `UPDATE purchase_invoices
         SET payment_method = 'marketplace_vault',
             payment_status = 'paid',
             financial_account_id = $1,
             financial_account_name = $2
         WHERE id = $3 AND store_id = $4`,
        [convTreasury.financialAccountId, convTreasury.financialAccountName, Number(inv.id), storeId]
      );
      if (inv.company_id && !isCancelledOrDraftStatus(inv.status)) {
        const exDebt = await pool.query(
          "SELECT id FROM current_account_transactions WHERE store_id = $1 AND purchase_invoice_id = $2 AND type = 'debt' LIMIT 1",
          [storeId, Number(inv.id)]
        );
        if (exDebt.rows.length === 0) {
          await pool.query(
            `INSERT INTO current_account_transactions
              (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date, financial_account_id, financial_account_name)
             VALUES ($1, $2, $3, 'debt', $4, $5, $6, $7, 'marketplace_vault', $8, $9, $10)`,
            [
              storeId, Number(inv.company_id), Number(inv.id), convGrandTotal,
              (inv.currency || 'TRY').toUpperCase(), Number(inv.exchange_rate || 1) || 1,
              `Pazaryeri Hakediş Mahsubu: ${convInvNo}`, inv.invoice_date || new Date(),
              convTreasury.financialAccountId, convTreasury.financialAccountName
            ]
          );
        }
      }
    }

    res.json({
      success: true,
      message: convTreasury.marketplacePlatform
        ? `Fatura gidere dönüştürüldü ve ${convTreasury.financialAccountName} bakiyesinden düşüldü.`
        : "Fatura başarıyla gidere dönüştürüldü, açılan stoklar iptal edildi ve tedarikçi gider olarak sabitlendi.",
      revertedStockMovements: revertedCount,
      deletedProductsCount: deletedProductsCount,
      is_expense: true,
      expense_category: finalCategory,
      expense_center: finalCenter,
      marketplace_vault_name: convTreasury.marketplacePlatform ? convTreasury.financialAccountName : null
    });
  } catch (err: any) {
    console.error("Error converting invoice to expense:", err);
    res.status(500).json({ error: err.message });
  }
});

// Manually match, re-match, or unlink a purchase invoice item to an inventory product (with full stock & supplier mapping reconciliation)
router.post("/purchase/:invoiceId/items/:itemId/match-product", async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
  const { invoiceId, itemId } = req.params;
  const { product_id } = req.body; // number or null (null = unlink)

  try {
    const invRes = await pool.query("SELECT * FROM purchase_invoices WHERE id = $1 AND store_id = $2", [invoiceId, storeId]);
    if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı." });
    const inv = invRes.rows[0];
    const invNum = inv.document_number || inv.invoice_number || '';

    const itemRes = await pool.query(
      "SELECT * FROM purchase_invoice_items WHERE id = $1 AND purchase_invoice_id = $2",
      [itemId, invoiceId]
    );
    if (itemRes.rows.length === 0) return res.status(404).json({ error: "Fatura kalemi bulunamadı." });
    const item = itemRes.rows[0];
    const qty = item.system_quantity != null ? Number(item.system_quantity) : Number(item.quantity || 1);
    const oldProductId = item.product_id ? Number(item.product_id) : null;
    const newProductId = product_id ? Number(product_id) : null;

    // 1. If previously matched to a different product, revert old product's stock and clean up temporary invoice-generated product if applicable
    let deletedOldProductId: number | null = null;
    if (oldProductId && oldProductId !== newProductId) {
      const cleanupRes = await transferAndCleanupInvoiceGeneratedProduct(pool, storeId, {
        oldProductId,
        newProductId,
        invoiceId: Number(invoiceId),
        invoiceItemId: Number(itemId),
        invNum,
        itemQty: qty,
        unitPrice: Number(item.unit_price || 0),
        supplierVkn: inv.tax_number,
        itemProductName: item.product_name
      });
      deletedOldProductId = cleanupRes.deletedOldProductId;
    }

    // 2. If unlinking (newProductId is null)
    if (!newProductId) {
      const extractedTokens = extractModelTokens(item.product_name);
      const restoredCode = extractedTokens.length > 0 ? extractedTokens[0] : null;
      await pool.query(
        "UPDATE purchase_invoice_items SET product_id = NULL, barcode = NULL, product_code = $1, match_status = 'unmatched', reserved_quantity = 0, reserved_for = NULL WHERE id = $2",
        [restoredCode, itemId]
      );
      if (oldProductId) {
        await recalculateProductReservedStock(pool, oldProductId, storeId);
        syncProductStockToMarketplaces([oldProductId], storeId, { reason: `purchase_item_unlinked_${itemId}` }).catch(() => {});
      }
      invalidateStoreProductsCache(storeId);
      return res.json({
        success: true,
        message: "Ürün eşleştirmesi kaldırıldı ve stok hareketleri güncellendi.",
        product_id: null,
        barcode: null,
        product_code: restoredCode
      });
    }

    // 3. Linking to newProductId
    const prodRes = await pool.query(
      "SELECT id, name, barcode, COALESCE(product_code, sku, '') as product_code, stock_quantity FROM products WHERE id = $1 AND store_id = $2",
      [newProductId, storeId]
    );
    if (prodRes.rows.length === 0) return res.status(404).json({ error: "Hedef envanter ürünü bulunamadı." });
    const targetProd = prodRes.rows[0];

    await pool.query(
      "UPDATE purchase_invoice_items SET product_id = $1, match_status = 'matched', barcode = $2, product_code = COALESCE(NULLIF($3, ''), product_code) WHERE id = $4",
      [targetProd.id, targetProd.barcode, targetProd.product_code, itemId]
    );

    if (inv.tax_number && item.product_name) {
      await saveSupplierMapping(pool, storeId, inv.tax_number, item.product_name, targetProd.id, targetProd.product_code);
    }

    if (!inv.is_expense && qty > 0) {
      // Remove any redundant 'initial_stock' movement that was created for this exact invoice item quantity/cost
      await deduplicateInitialStockOnInvoiceMatch(pool, storeId, targetProd.id, qty, Number(item.unit_price || 0));

      const movCheck = await pool.query(
        `SELECT 1 FROM stock_movements
         WHERE store_id = $1 AND product_id = $2
           AND (source = 'purchase_invoice' OR invoice_type = 'purchase')
           AND invoice_id = $3
         LIMIT 1`,
        [storeId, targetProd.id, invoiceId]
      );
      if (movCheck.rows.length === 0) {
        await pool.query(
          "UPDATE products SET stock_quantity = COALESCE(stock_quantity, 0) + $1::numeric, cost_price = CASE WHEN COALESCE($2::numeric, 0) > 0 THEN $2::numeric ELSE cost_price END, cost_currency = COALESCE($3, cost_currency) WHERE id = $4 AND store_id = $5",
          [Math.round(qty), Number(item.unit_price || 0), inv.currency || 'TRY', targetProd.id, storeId]
        );
        await addStockMovement(
          pool, storeId, targetProd.id, 'in', Math.round(qty), 'purchase_invoice',
          `Alış Faturası: ${invNum}`, Number(item.unit_price || 0), inv.supplier_name || 'Tedarikçi', inv.currency || 'TRY',
          null, Number(invoiceId), 'purchase', invNum, inv.invoice_date || inv.created_at || new Date()
        );
      }
    }

    if (oldProductId && oldProductId !== targetProd.id) {
      await recalculateProductReservedStock(pool, oldProductId, storeId);
    }
    if (Number(item.reserved_quantity || 0) > 0) {
      await recalculateProductReservedStock(pool, targetProd.id, storeId);
    }
    syncProductStockToMarketplaces([targetProd.id], storeId, { reason: `purchase_item_matched_${itemId}` }).catch(() => {});

    invalidateStoreProductsCache(storeId);
    return res.json({
      success: true,
      message: deletedOldProductId
        ? `"${item.product_name}" kalemi "${targetProd.name}" ürününe taşındı ve geçici fatura ürün kartı envanterden kaldırıldı.`
        : `"${item.product_name}" kalemi "${targetProd.name}" ürünü ile eşleştirildi ve stoklara işlendi.`,
      product_id: targetProd.id,
      barcode: targetProd.barcode,
      product_code: targetProd.product_code,
      matched_product_name: targetProd.name,
      deleted_old_product_id: deletedOldProductId
    });
  } catch (err: any) {
    console.error("Error matching purchase invoice item:", err);
    res.status(500).json({ error: err.message });
  }
});

// Explicitly convert an existing expense invoice to a stock/commercial purchase
router.post("/purchase/:id/convert-to-stock", async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
  const { id } = req.params;

  try {
    const invRes = await pool.query("SELECT * FROM purchase_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı." });
    const inv = invRes.rows[0];

    // 1. Mark invoice as NOT expense (if previously auto-settled via marketplace_vault, revert to term/unpaid and clean up vault deduction)
    const wasMpVault = String(inv.payment_method || '').toLowerCase() === 'marketplace_vault';
    await pool.query(
      wasMpVault
        ? `UPDATE purchase_invoices
           SET is_expense = false, expense_category = NULL, expense_center = NULL,
               payment_method = 'term', payment_status = 'unpaid',
               financial_account_id = NULL, financial_account_name = NULL,
               operator_status = 'completed', operator_processed_at = COALESCE(operator_processed_at, NOW())
           WHERE id = $1`
        : "UPDATE purchase_invoices SET is_expense = false, expense_category = NULL, expense_center = NULL, operator_status = 'completed', operator_processed_at = COALESCE(operator_processed_at, NOW()) WHERE id = $1",
      [id]
    );
    if (wasMpVault) {
      await deletePortfolioTxForSource(pool, Number(storeId), 'purchase_invoice', Number(id));
      await pool.query(
        "DELETE FROM current_account_transactions WHERE store_id = $1 AND purchase_invoice_id = $2 AND type = 'debt' AND LOWER(COALESCE(payment_method, '')) = 'marketplace_vault'",
        [storeId, Number(id)]
      );
    }

    // 2. Unpin company from being expense so future syncs/queries treat it as stock supplier
    if (inv.company_id) {
      await pool.query(
        "UPDATE companies SET is_expense = false, expense_category = NULL, expense_center = NULL WHERE id = $1 AND store_id = $2",
        [inv.company_id, storeId]
      );
    }
    if (inv.tax_number) {
      await pool.query(
        "UPDATE companies SET is_expense = false, expense_category = NULL, expense_center = NULL WHERE store_id = $1 AND tax_number = $2",
        [storeId, inv.tax_number]
      );
    }

    // 3. Process items and restore / create product stock links
    const itemsRes = await pool.query(
      "SELECT * FROM purchase_invoice_items WHERE purchase_invoice_id = $1 ORDER BY id ASC",
      [id]
    );

    let processedItemsCount = 0;
    let addedStockCount = 0;
    const convertedProductIds: number[] = [];

    for (const item of itemsRes.rows) {
      let resolvedProductId = item.product_id;
      let resolvedBarcode = item.barcode;
      let resolvedProductCode = item.product_code;

      if (!resolvedProductId) {
        const resolved = await findOrCreateProductForInvoiceItem(pool, storeId, {
          supplierVkn: inv.tax_number,
          productName: item.product_name,
          barcode: item.barcode,
          productCode: item.product_code,
          sellerCode: item.seller_code,
          buyerCode: item.buyer_code,
          unitPrice: Number(item.unit_price || 0),
          taxRate: Number(item.tax_rate || 20),
          currency: inv.currency || 'TRY',
          unitCode: item.unit_code || 'Adet'
        });
        resolvedProductId = resolved.productId;
        resolvedBarcode = resolved.barcode;
        resolvedProductCode = resolved.productCode;
      }

      if (resolvedProductId) {
        // Update purchase invoice item record
        await pool.query(
          "UPDATE purchase_invoice_items SET product_id = $1, barcode = COALESCE($2, barcode), product_code = COALESCE($3, product_code) WHERE id = $4",
          [resolvedProductId, resolvedBarcode, resolvedProductCode, item.id]
        );

        if (inv.tax_number && item.product_name) {
          await saveSupplierMapping(pool, storeId, inv.tax_number, item.product_name, resolvedProductId, resolvedProductCode);
        }

        const qtyToStock = item.system_quantity != null ? Number(item.system_quantity) : Number(item.quantity || 1);
        if (qtyToStock > 0) {
          // Check if stock movement already recorded
          const movCheck = await pool.query(
            "SELECT 1 FROM stock_movements WHERE store_id = $1 AND invoice_id = $2 AND product_id = $3 AND source = 'purchase_invoice' LIMIT 1",
            [storeId, id, resolvedProductId]
          );

          if (movCheck.rows.length === 0) {
            convertedProductIds.push(Number(resolvedProductId));
            await pool.query(
              "UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2, cost_currency = $3 WHERE id = $4 AND store_id = $5",
              [qtyToStock, item.unit_price || 0, inv.currency || 'TRY', resolvedProductId, storeId]
            );

            await addStockMovement(
              pool, storeId, resolvedProductId, 'in', qtyToStock, 'purchase_invoice',
              `Alış Faturası: ${inv.invoice_number || inv.document_number}`, item.unit_price || 0, inv.supplier_name || 'Tedarikçi', inv.currency || 'TRY',
              null, Number(id), 'purchase', inv.invoice_number || inv.document_number, inv.invoice_date || inv.created_at || new Date()
            );
            addedStockCount++;
          }
        }
        processedItemsCount++;
      }
    }

    if (convertedProductIds.length > 0) {
      syncProductStockToMarketplaces(convertedProductIds, storeId, { reason: `convert_to_stock_invoice_${id}` }).catch(err =>
        console.error("[Convert To Stock Marketplace Sync Error]:", err?.message || err)
      );
    }

    res.json({
      success: true,
      message: "Fatura başarıyla Stoklu Alım statüsüne geçirildi ve ürün stokları sisteme işlendi.",
      is_expense: false,
      processedItemsCount,
      addedStockCount
    });
  } catch (err: any) {
    console.error("Error converting invoice to stock:", err);
    res.status(500).json({ error: err.message });
  }
});

// Auto-fix misclassified Bimel invoices & unpin Bimel from companies
(async function repairMisclassifiedBimel() {
  try {
    // 1. Unpin any company with name containing Bimel from being expense
    await pool.query(
      "UPDATE companies SET is_expense = false, expense_category = NULL, expense_center = NULL WHERE (LOWER(title) LIKE '%bimel%' OR LOWER(title) LIKE '%bimel elektronik%') AND is_expense = true"
    );

    // 2. Convert BML2026000019517 or any BML/Bimel invoice if marked as expense
    const bmlInvs = await pool.query(
      "SELECT id, store_id, invoice_number, supplier_name, tax_number, currency FROM purchase_invoices WHERE (invoice_number LIKE '%BML2026000019517%' OR UPPER(invoice_number) = 'BML2026000019517' OR LOWER(supplier_name) LIKE '%bimel%') AND is_expense = true AND COALESCE(operator_status, 'completed') = 'completed'"
    );

    for (const row of bmlInvs.rows) {
      console.log(`[AUTO-REPAIR] Converting Bimel invoice #${row.invoice_number} (ID: ${row.id}) to stock purchase...`);
      await pool.query(
        "UPDATE purchase_invoices SET is_expense = false, expense_category = NULL, expense_center = NULL WHERE id = $1",
        [row.id]
      );
      
      const itemsRes = await pool.query("SELECT * FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [row.id]);
      for (const item of itemsRes.rows) {
        let prodId = item.product_id;
        if (!prodId) {
          const { productId, barcode, productCode } = await resolveProductInfo(pool, row.store_id, null, item.barcode, item.product_code);
          if (productId) {
            prodId = productId;
            await pool.query("UPDATE purchase_invoice_items SET product_id = $1, barcode = COALESCE($2, barcode), product_code = COALESCE($3, product_code) WHERE id = $4", [productId, barcode, productCode, item.id]);
          } else {
            prodId = null;
          }
        }
        if (prodId) {
          const qty = item.system_quantity != null ? Number(item.system_quantity) : Number(item.quantity || 1);
          const movCheck = await pool.query("SELECT 1 FROM stock_movements WHERE store_id = $1 AND invoice_id = $2 AND product_id = $3 AND source = 'purchase_invoice' LIMIT 1", [row.store_id, row.id, prodId]);
          if (movCheck.rows.length === 0 && qty > 0) {
            await pool.query("UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2, cost_currency = $3 WHERE id = $4 AND store_id = $5", [qty, item.unit_price || 0, row.currency || 'TRY', prodId, row.store_id]);
            await addStockMovement(pool, row.store_id, prodId, 'in', qty, 'purchase_invoice', `Alış Faturası: ${row.invoice_number}`, item.unit_price || 0, row.supplier_name || 'Bimel', row.currency || 'TRY', null, row.id, 'purchase', row.invoice_number, row.invoice_date || row.created_at || new Date());
          }
        }
      }
    }
  } catch (err) {
    console.error("[AUTO-REPAIR-BIMEL] Error:", err);
  }
})();

// Auto-repair all historical expense invoices in the store that were mistakenly treated as inventory
router.post("/purchase/auto-repair-expenses", async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);

  try {
    const invRes = await pool.query(
      "SELECT id, invoice_number, supplier_name, tax_number, company_id, is_expense, expense_category, expense_center FROM purchase_invoices WHERE store_id = $1 AND COALESCE(operator_status, 'completed') = 'completed'",
      [storeId]
    );

    let repairedInvoices = 0;
    let totalRevertedMovements = 0;
    let totalDeletedProducts = 0;

    for (const inv of invRes.rows) {
      const expenseCheck = await resolveExpenseClassification(pool, storeId, {
        supplierTitle: inv.supplier_name,
        supplierVkn: inv.tax_number,
        companyId: inv.company_id,
        pinToCompany: true
      });

      if (expenseCheck.isExpense) {
        const finalCategory = inv.expense_category || expenseCheck.expenseCategory || 'diger';
        const finalCenter = inv.expense_center || expenseCheck.expenseCenter || 'office';

        // Revert stock and products if it wasn't marked as expense or still has products/stock
        const { revertedCount, deletedProductsCount } = await revertInvoiceStockAndProducts(pool, storeId, Number(inv.id));
        
        await pool.query(
          "UPDATE purchase_invoice_items SET product_id = NULL, barcode = NULL, product_code = NULL WHERE purchase_invoice_id = $1",
          [inv.id]
        );

        await pool.query(
          "UPDATE purchase_invoices SET is_expense = true, expense_category = $1, expense_center = $2 WHERE id = $3",
          [finalCategory, finalCenter, inv.id]
        );

        repairedInvoices++;
        totalRevertedMovements += revertedCount;
        totalDeletedProducts += deletedProductsCount;
      }
    }

    res.json({
      success: true,
      message: `${repairedInvoices} adet gider faturası tespit edildi ve onarıldı.`,
      repairedInvoices,
      totalRevertedMovements,
      totalDeletedProducts
    });
  } catch (err: any) {
    console.error("Error auto-repairing expense invoices:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update a purchase invoice item's matched product_id, barcode or product_code with complete stock movement & inventory synchronization
router.put("/purchase/items/:itemId", async (req: any, res) => {
  const client = await pool.connect();
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
    const itemId = req.params.itemId;
    const { product_id, barcode, product_code, adjust_stock = true } = req.body;

    await client.query("BEGIN");

    const itemRes = await client.query(
      `SELECT pii.*, pi.invoice_number, pi.store_id, pi.is_expense, pi.tax_number as supplier_vkn, pi.currency, pi.supplier_name
       FROM purchase_invoice_items pii
       JOIN purchase_invoices pi ON pii.purchase_invoice_id = pi.id
       WHERE pii.id = $1 AND pi.store_id = $2`,
      [itemId, storeId]
    );

    if (itemRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Fatura kalemi bulunamadı." });
    }

    const currentItem = itemRes.rows[0];
    const oldProductId = currentItem.product_id ? Number(currentItem.product_id) : null;
    const newProductId = product_id !== undefined ? (product_id ? Number(product_id) : null) : oldProductId;
    const itemQty = currentItem.system_quantity != null ? Number(currentItem.system_quantity) : Number(currentItem.quantity || 1);
    const unitPrice = Number(currentItem.unit_price) || 0;
    const isExpense = currentItem.is_expense === true;

    const targetBarcode = newProductId
      ? (barcode !== undefined ? barcode : currentItem.barcode)
      : (barcode !== undefined ? barcode : null);
    const extractedTokens = extractModelTokens(currentItem.product_name || '');
    const targetCode = newProductId
      ? (product_code !== undefined ? product_code : currentItem.product_code)
      : (product_code !== undefined ? product_code : (extractedTokens.length > 0 ? extractedTokens[0] : null));

    await client.query(
      `UPDATE purchase_invoice_items 
       SET product_id = $1, 
           barcode = $2, 
           product_code = $3 
       WHERE id = $4`,
      [newProductId, targetBarcode, targetCode, itemId]
    );

    // If not expense invoice and product link changed, synchronize inventory & stock movements!
    let deletedOldProductId: number | null = null;
    if (!isExpense && adjust_stock && oldProductId !== newProductId) {
      // 1. Revert stock from old product and clean up if it was an invoice-generated product
      if (oldProductId) {
        const cleanupRes = await transferAndCleanupInvoiceGeneratedProduct(client, storeId, {
          oldProductId,
          newProductId,
          invoiceId: Number(currentItem.purchase_invoice_id),
          invoiceItemId: Number(itemId),
          invNum: currentItem.invoice_number || String(currentItem.purchase_invoice_id),
          itemQty,
          unitPrice,
          supplierVkn: currentItem.supplier_vkn,
          itemProductName: currentItem.product_name
        });
        deletedOldProductId = cleanupRes.deletedOldProductId;
      }

      // 2. Add stock to new product
      if (newProductId) {
        const prodInfo = await client.query("SELECT barcode, COALESCE(product_code, sku, '') as product_code FROM products WHERE id = $1 AND store_id = $2", [newProductId, storeId]);
        if (prodInfo.rows.length > 0) {
          await client.query(
            "UPDATE purchase_invoice_items SET barcode = COALESCE($1, barcode), product_code = COALESCE(NULLIF($2, ''), product_code) WHERE id = $3",
            [prodInfo.rows[0].barcode, prodInfo.rows[0].product_code, itemId]
          );
        }

        // Remove any redundant 'initial_stock' movement that was created for this exact invoice item quantity/cost
        await deduplicateInitialStockOnInvoiceMatch(client, storeId, newProductId, itemQty, unitPrice);

        const existingMovCheck = await client.query(
          `SELECT 1 FROM stock_movements
           WHERE store_id = $1 AND product_id = $2
             AND (source = 'purchase_invoice' OR invoice_type = 'purchase')
             AND invoice_id = $3
           LIMIT 1`,
          [storeId, newProductId, currentItem.purchase_invoice_id]
        );

        if (existingMovCheck.rows.length === 0) {
          await client.query(
            "UPDATE products SET stock_quantity = COALESCE(stock_quantity, 0) + $1::numeric, cost_price = CASE WHEN $2::numeric > 0 THEN $2::numeric ELSE cost_price END, cost_currency = $3 WHERE id = $4 AND store_id = $5",
            [Math.round(itemQty), unitPrice, currentItem.currency || 'TRY', newProductId, storeId]
          );
          // Insert new stock movement
          await client.query(
            `INSERT INTO stock_movements 
             (store_id, product_id, type, quantity, source, description, unit_price, customer_info, currency, created_at, invoice_id, invoice_type, invoice_number) 
             VALUES ($1, $2, 'in', $3, 'purchase_invoice', $4, $5, $6, $7, $8, $9, 'purchase', $10)`,
            [
              storeId,
              newProductId,
              Math.round(itemQty),
              `Alış Faturası: ${currentItem.invoice_number || currentItem.purchase_invoice_id}`,
              unitPrice,
              currentItem.supplier_name || 'Tedarikçi',
              currentItem.currency || 'TRY',
              currentItem.invoice_date || currentItem.created_at || new Date(),
              currentItem.purchase_invoice_id,
              currentItem.invoice_number
            ]
          );
        }
      }

      // 3. Update supplier product mapping for future invoices
      if (currentItem.supplier_vkn && currentItem.product_name && newProductId) {
        await saveSupplierMapping(
          client,
          storeId,
          currentItem.supplier_vkn,
          currentItem.product_name,
          newProductId,
          targetCode || currentItem.product_code
        );
      }
    }
    invalidateStoreProductsCache(storeId);

    await client.query("COMMIT");
    res.json({
      success: true,
      deleted_old_product_id: deletedOldProductId,
      message: deletedOldProductId
        ? "Fatura kalemi hedef ürüne taşındı ve geçici fatura ürün kartı envanterden kaldırıldı."
        : "Fatura kalemi ve stok eşleştirmesi başarıyla güncellendi."
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error updating purchase invoice item:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Create a dedicated product directly from an invoice item and link it
router.post("/purchase/items/:itemId/create-product", async (req: any, res) => {
  const client = await pool.connect();
  try {
    const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
    const itemId = req.params.itemId;
    const { name, barcode, product_code, price, cost_price } = req.body;

    await client.query("BEGIN");

    const itemRes = await client.query(
      `SELECT pii.*, pi.invoice_number, pi.store_id, pi.is_expense, pi.tax_number as supplier_vkn, pi.currency, pi.supplier_name
       FROM purchase_invoice_items pii
       JOIN purchase_invoices pi ON pii.purchase_invoice_id = pi.id
       WHERE pii.id = $1 AND pi.store_id = $2`,
      [itemId, storeId]
    );

    if (itemRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Fatura kalemi bulunamadı." });
    }

    const currentItem = itemRes.rows[0];
    const oldProductId = currentItem.product_id ? Number(currentItem.product_id) : null;
    const itemQty = currentItem.system_quantity != null ? Number(currentItem.system_quantity) : Number(currentItem.quantity || 1);
    const unitPrice = cost_price != null ? Number(cost_price) : (Number(currentItem.unit_price) || 0);
    const sellingPrice = price != null ? Number(price) : (unitPrice * 1.25);
    const taxRate = Number(currentItem.tax_rate) || 20;

    const prodName = (name || currentItem.product_name || 'Yeni Ürün').trim();
    const finalBarcode = (barcode || currentItem.barcode || generateTempBarcode()).trim();
    const finalCode = (product_code || currentItem.product_code || null);

    // Create new product
    const newProdRes = await client.query(
      `INSERT INTO products 
       (store_id, name, barcode, product_code, sku, price, cost_price, tax_rate, stock_quantity, currency, product_type, labels) 
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, 'product', JSON.stringify(["fatura_kalem_revizyon"])) 
       RETURNING id`,
      [storeId, prodName, finalBarcode, finalCode, sellingPrice, unitPrice, taxRate, itemQty, currentItem.currency || 'TRY']
    );

    const newProductId = newProdRes.rows[0].id;

    // Update purchase_invoice_items
    await client.query(
      `UPDATE purchase_invoice_items 
       SET product_id = $1, barcode = $2, product_code = $3, product_name = $4 
       WHERE id = $5`,
      [newProductId, finalBarcode, finalCode, prodName, itemId]
    );

    // If old product existed, deduct stock
    if (oldProductId && oldProductId !== newProductId) {
      await client.query(
        "UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2 AND store_id = $3",
        [itemQty, oldProductId, storeId]
      );
      await client.query(
        `DELETE FROM stock_movements 
         WHERE id IN (
           SELECT id FROM stock_movements 
           WHERE store_id = $1 AND invoice_id = $2 AND product_id = $3 AND source = 'purchase_invoice' 
           LIMIT 1
         )`,
        [storeId, currentItem.purchase_invoice_id, oldProductId]
      );
    }

    // Insert stock movement for new product
    await client.query(
      `INSERT INTO stock_movements 
       (store_id, product_id, type, quantity, source, description, unit_price, customer_info, currency, created_at, invoice_id, invoice_type, invoice_number) 
       VALUES ($1, $2, 'in', $3, 'purchase_invoice', $4, $5, $6, $7, $8, $9, 'purchase', $10)`,
      [
        storeId,
        newProductId,
        itemQty,
        `Alış Faturası: ${currentItem.invoice_number || currentItem.purchase_invoice_id}`,
        unitPrice,
        currentItem.supplier_name || 'Tedarikçi',
        currentItem.currency || 'TRY',
        currentItem.invoice_date || currentItem.created_at || new Date(),
        currentItem.purchase_invoice_id,
        currentItem.invoice_number
      ]
    );

    // Update supplier product mapping
    if (currentItem.supplier_vkn && prodName) {
      await saveSupplierMapping(
        client,
        storeId,
        currentItem.supplier_vkn,
        prodName,
        newProductId,
        finalCode
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, product_id: newProductId, message: "Yeni ürün kartı oluşturuldu ve fatura kalemi başarıyla bağlandı." });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error creating product from purchase invoice item:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Re-sync an existing purchase invoice lines and matching from official e-invoice service details
router.post("/purchase/:id/re-sync-matching", async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
  const { id } = req.params;

  try {
    const invRes = await pool.query("SELECT * FROM purchase_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı." });
    const invoice = invRes.rows[0];

    if (!invoice.ettn) {
      return res.status(400).json({ error: "Bu faturaya ait ETTN numarası bulunamadı." });
    }

    const service = await getEInvoiceService(storeId);
    if (!service) {
      return res.status(400).json({ error: "E-Fatura entegratör servisi bulunamadı." });
    }

    const details = await service.getInvoiceDetailsByUuid(invoice.ettn);
    if (!details) {
      return res.status(404).json({ error: "Entegratörden fatura kalemleri çekilemedi." });
    }

    let rawLines = details.detailList || details.InvoiceLines || details.lines || details.InvoiceLine || details.Lines || details.invoiceLines || [];
    if (rawLines && !Array.isArray(rawLines)) rawLines = [rawLines];

    if (!Array.isArray(rawLines) || rawLines.length === 0) {
      return res.status(400).json({ error: "Fatura içerisinde ürün satırı bulunamadı." });
    }

    // Revert existing stock movements and auto-created products for this invoice
    await revertInvoiceStockAndProducts(pool, storeId, Number(invoice.id));
    await pool.query("DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [invoice.id]);

    let processedCount = 0;
    for (const line of rawLines) {
      const productName = line.detailItem?.itemName || line.itemName || line.Item?.Name?.['#text'] || line.Item?.Name || line.Name || line.name || 'Bilinmeyen Ürün';
      
      const sellerCodeRaw = line.detailItem?.sellersItemIdentificationId || line.detailItem?.sellersItemIdentification || line.Item?.SellersItemIdentification?.ID?.['#text'] || line.Item?.SellersItemIdentification?.ID || line.sellersItemIdentification;
      const sellerCode = typeof sellerCodeRaw === 'string' ? sellerCodeRaw.trim() : (typeof sellerCodeRaw === 'number' ? String(sellerCodeRaw) : null);

      const buyerCodeRaw = line.detailItem?.buyersItemIdentificationId || line.detailItem?.buyersItemIdentification || line.Item?.BuyersItemIdentification?.ID?.['#text'] || line.Item?.BuyersItemIdentification?.ID || line.buyersItemIdentification;
      const buyerCode = typeof buyerCodeRaw === 'string' ? buyerCodeRaw.trim() : (typeof buyerCodeRaw === 'number' ? String(buyerCodeRaw) : null);

      const barcodeRaw = line.Item?.StandardItemIdentification?.ID?.['#text'] || line.Item?.StandardItemIdentification?.ID || line.Item?.ItemInstance?.ProductTraceID;
      const barcode = typeof barcodeRaw === 'string' ? barcodeRaw.trim() : (typeof barcodeRaw === 'number' ? String(barcodeRaw) : null);

      const qtyRaw = line.invoicedQuantity || line.Quantity || line.quantity || line.InvoicedQuantity?.['#text'] || line.InvoicedQuantity || 1;
      const qty = Number(String(qtyRaw).replace(',', '.')) || 1;
      
      const upRaw = line.unitPrice || line.Price?.PriceAmount?.['#text'] || line.Price?.PriceAmount || line.Price || line.unitPrice || line.unit_price || 0;
      const up = Number(String(upRaw).replace(',', '.')) || 0;
      
      const trRaw = line.taxTotal?.taxSubtotalList?.[0]?.percent || line.TaxTotal?.TaxSubtotal?.Percent?.['#text'] || line.TaxTotal?.TaxSubtotal?.Percent || line.TaxRate || line.taxRate || line.tax_rate || 20;
      const tr = Number(String(trRaw).replace(',', '.')) || 20;
      
      const lineTotal = qty * up;
      const taxAmount = (lineTotal * tr) / 100;

      // Match product with robust capacity-aware engine or auto-create invoice product
      let productId: number | null = null;
      let finalBarcode: string | null = barcode;
      let finalProductCode: string | null = sellerCode || buyerCode || null;

      if (!invoice.is_expense) {
        const resolved = await findOrCreateProductForInvoiceItem(pool, storeId, {
          supplierVkn: invoice.tax_number,
          productName,
          barcode,
          productCode: sellerCode || buyerCode,
          sellerCode,
          buyerCode,
          unitPrice: up,
          taxRate: tr,
          currency: invoice.currency || 'TRY'
        });
        productId = resolved.productId;
        finalBarcode = resolved.barcode;
        finalProductCode = resolved.productCode;

        if (invoice.tax_number && productName && productId && !resolved.autoCreated) {
          await saveSupplierMapping(pool, storeId, invoice.tax_number, productName, productId, finalProductCode);
        }
      }

      await pool.query(
        `INSERT INTO purchase_invoice_items 
         (purchase_invoice_id, product_id, product_name, barcode, product_code, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [invoice.id, productId, productName, finalBarcode, finalProductCode, qty, up, tr, taxAmount, lineTotal]
      );

      // Update product stock and add stock movement
      if (productId && !invoice.is_expense && qty > 0) {
        await pool.query(
          "UPDATE products SET stock_quantity = COALESCE(stock_quantity, 0) + $1::numeric, cost_price = CASE WHEN $2::numeric > 0 THEN $2::numeric ELSE cost_price END, cost_currency = COALESCE($3, cost_currency) WHERE id = $4 AND store_id = $5",
          [qty, up, invoice.currency || 'TRY', productId, storeId]
        );
        await addStockMovement(
          pool,
          storeId,
          productId,
          'in',
          qty,
          'purchase_invoice',
          `Alış Faturası: ${invoice.invoice_number}`,
          up,
          invoice.supplier_name,
          invoice.currency || 'TRY',
          null,
          invoice.id,
          'purchase',
          invoice.invoice_number,
          invoice.invoice_date || invoice.created_at || new Date()
        );
      }
      processedCount++;
    }

    res.json({
      success: true,
      message: `${processedCount} adet fatura kalemi başarıyla güncellendi ve ürünlerle doğru eşleştirildi.`,
      processedCount
    });
  } catch (err: any) {
    console.error("Error re-syncing invoice matching:", err);
    res.status(500).json({ error: err.message });
  }
});

// Operator Approval Endpoint (Gider Olarak Onayla OR Stoklu Alım Onayı with match/create/skip + Rezerve)
router.post("/purchase/:id/operator-approve", async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
  const { id } = req.params;
  const {
    mode = 'stock', // 'expense' | 'stock'
    expense_category,
    expense_center,
    remember_supplier_expense = false,
    target_warehouse_id = null,
    items: submittedItems = []
  } = req.body || {};

  const client = await pool.connect();
  const affectedProductIds: number[] = [];

  try {
    await client.query("BEGIN");

    // Resolve optional target warehouse for two-stage receiving (only if belongs to same family)
    let resolvedReceivingStoreId = Number(storeId);
    if (target_warehouse_id && Number(target_warehouse_id) !== Number(storeId)) {
      const rootCheck = await client.query("SELECT COALESCE(parent_id, id) AS root_id FROM stores WHERE id = $1", [storeId]);
      const rootId = Number(rootCheck.rows[0]?.root_id || storeId);
      const whCheck = await client.query(
        "SELECT id FROM stores WHERE id = $1 AND (id = $2 OR parent_id = $2)",
        [Number(target_warehouse_id), rootId]
      );
      if (whCheck.rows.length > 0) {
        resolvedReceivingStoreId = Number(whCheck.rows[0].id);
      }
    }

    const invRes = await client.query(
      "SELECT * FROM purchase_invoices WHERE id = $1 AND store_id = $2 FOR UPDATE",
      [id, storeId]
    );
    if (invRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Alış faturası bulunamadı." });
    }
    const inv = invRes.rows[0];
    const invNum = inv.document_number || inv.invoice_number || `#${inv.id}`;

    const dbItemsRes = await client.query(
      "SELECT * FROM purchase_invoice_items WHERE purchase_invoice_id = $1 ORDER BY id ASC",
      [inv.id]
    );
    const dbItems = dbItemsRes.rows;

    if (mode === 'expense') {
      const detected = detectExpenseCategory(inv.supplier_name, inv.tax_number, null);
      const finalCategory = expense_category || inv.expense_category || detected.expenseCategory || 'diger';
      const finalCenter = expense_center || inv.expense_center || detected.expenseCenter || 'office';

      for (const dItem of dbItems) {
        if (dItem.product_id) {
          affectedProductIds.push(Number(dItem.product_id));
        }
      }

      // Defensive rollback of any prior product stock linked to this invoice
      await revertInvoiceStockAndProducts(client, storeId, Number(inv.id));

      await client.query(
        `UPDATE purchase_invoice_items
         SET product_id = NULL, match_status = 'skipped', match_note = 'Gider olarak onaylandı', reserved_quantity = 0, reserved_for = NULL
         WHERE purchase_invoice_id = $1`,
        [inv.id]
      );

      await client.query(
        `UPDATE purchase_invoices
         SET is_expense = true,
             expense_category = $1,
             expense_center = $2,
             operator_status = 'completed',
             operator_processed_at = NOW(),
             status = CASE WHEN UPPER(COALESCE(e_document_type, '')) != 'TICARIFATURA' AND status = 'pending' THEN 'approved' ELSE status END
         WHERE id = $3`,
        [finalCategory, finalCenter, inv.id]
      );

      if (remember_supplier_expense === true) {
        if (inv.company_id) {
          await client.query(
            "UPDATE companies SET is_expense = true, expense_category = $1, expense_center = $2 WHERE id = $3 AND store_id = $4",
            [finalCategory, finalCenter, inv.company_id, storeId]
          );
        }
        if (inv.tax_number) {
          await client.query(
            "UPDATE companies SET is_expense = true, expense_category = $1, expense_center = $2 WHERE store_id = $3 AND tax_number = $4",
            [finalCategory, finalCenter, storeId, inv.tax_number]
          );
        }
      }
    } else {
      // mode === 'stock'
      const submittedByItemId = new Map<number, any>();
      if (Array.isArray(submittedItems)) {
        for (const si of submittedItems) {
          if (si?.itemId) submittedByItemId.set(Number(si.itemId), si);
        }
      }

      for (const dbItem of dbItems) {
        const decision = submittedByItemId.get(Number(dbItem.id)) || {
          action: dbItem.product_id ? 'match' : (dbItem.suggested_product_id ? 'match' : 'skip'),
          targetProductId: dbItem.product_id || dbItem.suggested_product_id || null,
          reserved_quantity: dbItem.reserved_quantity || 0,
          reserved_for: dbItem.reserved_for || null
        };

        const action: 'match' | 'create' | 'skip' = decision.action || 'skip';
        const qtyToStock = dbItem.system_quantity != null ? Number(dbItem.system_quantity) : Number(dbItem.quantity || 1);
        const rawUnitPrice = Number(dbItem.unit_price || 0);
        const taxRate = Number(dbItem.tax_rate || 20);
        const oldProdId = dbItem.product_id ? Number(dbItem.product_id) : null;

        if (action === 'skip') {
          if (oldProdId) {
            affectedProductIds.push(oldProdId);
            await transferAndCleanupInvoiceGeneratedProduct(client, storeId, {
              oldProductId: oldProdId,
              newProductId: null,
              invoiceId: Number(inv.id),
              invoiceItemId: Number(dbItem.id),
              invNum,
              itemQty: qtyToStock,
              unitPrice: rawUnitPrice,
              supplierVkn: inv.tax_number,
              itemProductName: dbItem.product_name
            });
          }
          await client.query(
            `UPDATE purchase_invoice_items
             SET product_id = NULL, match_status = 'skipped', match_note = 'Stok Dışı / Hizmet Olarak Atlandı', reserved_quantity = 0, reserved_for = NULL
             WHERE id = $1`,
            [dbItem.id]
          );
          continue;
        }

        let targetProdId: number | null = null;
        let targetBarcode: string | null = dbItem.barcode || null;
        let targetProdCode: string | null = dbItem.product_code || null;
        let matchStatusVal = 'matched';
        let matchNoteVal = 'Operatör Eşleştirdi';

        if (action === 'create') {
          const cData = decision.createProductData || {};
          const cleanName = String(cData.name || dbItem.product_name || 'Yeni Ürün').trim();
          const sanitized = sanitizeInvoiceItemCodes(
            cData.barcode !== undefined ? cData.barcode : dbItem.barcode,
            cData.product_code !== undefined ? cData.product_code : dbItem.product_code,
            null,
            cData.product_code !== undefined ? cData.product_code : dbItem.product_code
          );
          const finalBarcode = sanitized.barcode || generateTempBarcode();
          const finalProdCode = sanitized.productCode || dbItem.product_code || null;
          const costExcl = cData.cost_price !== undefined ? Number(cData.cost_price) : rawUnitPrice;
          const sellPrice = cData.price !== undefined && Number(cData.price) > 0
            ? Number(cData.price)
            : Number((costExcl * (1 + taxRate / 100) * 1.25).toFixed(2));
          const prodCategory = cData.category ? String(cData.category).trim() : null;

          const newProdRes = await client.query(
            `INSERT INTO products (
              store_id, name, barcode, product_code, sku, price, cost_price, cost_currency, currency,
              tax_rate, stock_quantity, status, category, labels, updated_at
            ) VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $7, $8, 0, 'active', $9, '["yeni_fatura_urunu"]'::jsonb, CURRENT_TIMESTAMP)
            RETURNING id, barcode, COALESCE(product_code, sku, '') as product_code`,
            [
              storeId,
              cleanName,
              finalBarcode,
              finalProdCode,
              sellPrice,
              costExcl,
              inv.currency || 'TRY',
              taxRate,
              prodCategory
            ]
          );
          targetProdId = newProdRes.rows[0].id;
          targetBarcode = newProdRes.rows[0].barcode;
          targetProdCode = newProdRes.rows[0].product_code || finalProdCode;
          matchStatusVal = 'created';
          matchNoteVal = 'Operatör Yeni Ürün Kartı Açtı';
        } else {
          // action === 'match'
          const reqTargetId = decision.targetProductId ? Number(decision.targetProductId) : null;
          if (!reqTargetId) {
            throw new Error(`"${dbItem.product_name}" kalemi için eşleştirilecek ürün seçilmedi.`);
          }
          const prodRes = await client.query(
            "SELECT id, name, barcode, COALESCE(product_code, sku, '') as product_code FROM products WHERE id = $1 AND store_id = $2",
            [reqTargetId, storeId]
          );
          if (prodRes.rows.length === 0) {
            throw new Error(`Seçilen envanter ürünü (#${reqTargetId}) bulunamadı.`);
          }
          targetProdId = prodRes.rows[0].id;
          targetBarcode = prodRes.rows[0].barcode || targetBarcode;
          targetProdCode = prodRes.rows[0].product_code || targetProdCode;

          if (oldProdId && oldProdId !== targetProdId) {
            affectedProductIds.push(oldProdId);
            await transferAndCleanupInvoiceGeneratedProduct(client, storeId, {
              oldProductId: oldProdId,
              newProductId: targetProdId,
              invoiceId: Number(inv.id),
              invoiceItemId: Number(dbItem.id),
              invNum,
              itemQty: qtyToStock,
              unitPrice: rawUnitPrice,
              supplierVkn: inv.tax_number,
              itemProductName: dbItem.product_name
            });
          }
        }

        const resQty = Math.max(0, Number(decision.reserved_quantity) || 0);
        const resFor = resQty > 0 && decision.reserved_for ? String(decision.reserved_for).trim() : null;

        await client.query(
          `UPDATE purchase_invoice_items
           SET product_id = $1,
               barcode = COALESCE($2, barcode),
               product_code = COALESCE(NULLIF($3, ''), product_code),
               match_status = $4,
               match_note = $5,
               reserved_quantity = $6,
               reserved_for = $7
           WHERE id = $8`,
          [targetProdId, targetBarcode, targetProdCode, matchStatusVal, matchNoteVal, resQty, resFor, dbItem.id]
        );

        if (targetProdId) {
          affectedProductIds.push(Number(targetProdId));

          if (inv.tax_number && dbItem.product_name) {
            await saveSupplierMapping(client, storeId, inv.tax_number, dbItem.product_name, targetProdId, targetProdCode);
          }

          if (qtyToStock > 0) {
            const movCheck = await client.query(
              `SELECT 1 FROM stock_movements
               WHERE store_id = $1 AND product_id = $2
                 AND (source = 'purchase_invoice' OR invoice_type = 'purchase')
                 AND invoice_id = $3
               LIMIT 1`,
              [storeId, targetProdId, inv.id]
            );
            if (movCheck.rows.length === 0) {
              // If routed to a dedicated warehouse branch, mirror/receive product into that warehouse's RECEIVING bin
              let stockDestStoreId = Number(storeId);
              let stockDestProdId = Number(targetProdId);

              if (resolvedReceivingStoreId !== Number(storeId)) {
                stockDestStoreId = resolvedReceivingStoreId;
                const whProdRes = await client.query(
                  "SELECT id FROM products WHERE store_id = $1 AND TRIM(barcode) = TRIM($2) LIMIT 1",
                  [stockDestStoreId, targetBarcode || '']
                );
                if (whProdRes.rows.length > 0) {
                  stockDestProdId = Number(whProdRes.rows[0].id);
                } else {
                  const srcProdRes = await client.query("SELECT * FROM products WHERE id = $1", [targetProdId]);
                  const sp = srcProdRes.rows[0];
                  if (sp) {
                    const newWhProd = await client.query(
                      `INSERT INTO products (store_id, barcode, name, product_code, sku, price, currency, cost_price, cost_currency, tax_rate, description, stock_quantity, unit, category, is_web_sale, product_type)
                       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0,$12,$13,$14,$15) RETURNING id`,
                      [stockDestStoreId, sp.barcode, sp.name, sp.product_code, sp.sku, sp.price, sp.currency, rawUnitPrice || sp.cost_price, inv.currency || sp.cost_currency, sp.tax_rate, sp.description, sp.unit, sp.category, sp.is_web_sale, sp.product_type]
                    );
                    stockDestProdId = Number(newWhProd.rows[0].id);
                  }
                }
              }

              await reconcileProductDefaultLocation(client, stockDestStoreId, stockDestProdId);
              await client.query(
                `UPDATE products
                 SET cost_price = CASE WHEN COALESCE($1::numeric, 0) > 0 THEN $1::numeric ELSE cost_price END,
                     cost_currency = COALESCE($2, cost_currency),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $3 AND store_id = $4`,
                [rawUnitPrice, inv.currency || 'TRY', stockDestProdId, stockDestStoreId]
              );
              await recordInboundToStore(client, {
                storeId: stockDestStoreId,
                productId: stockDestProdId,
                quantity: qtyToStock,
                movementType: "INBOUND",
                referenceType: "PURCHASE_INVOICE",
                referenceId: Number(inv.id),
                note: `Alış Faturası: ${invNum}`,
                performedBy: req.user?.id || null
              });
              await client.query(
                `INSERT INTO stock_movements
                  (store_id, product_id, type, quantity, source, description, unit_price, customer_info, currency, created_at, invoice_id, invoice_type, invoice_number)
                 VALUES ($1, $2, 'in', $3, 'purchase_invoice', $4, $5, $6, $7, $8, $9, 'purchase', $10)`,
                [
                  stockDestStoreId,
                  stockDestProdId,
                  qtyToStock,
                  `Alış Faturası: ${invNum}`,
                  rawUnitPrice,
                  inv.supplier_name || 'Tedarikçi',
                  inv.currency || 'TRY',
                  inv.invoice_date || inv.created_at || new Date(),
                  inv.id,
                  invNum
                ]
              );
            }
          }
        }
      }

      await client.query(
        `UPDATE purchase_invoices
         SET is_expense = false,
             expense_category = NULL,
             expense_center = NULL,
             operator_status = 'completed',
             operator_processed_at = NOW(),
             status = CASE WHEN UPPER(COALESCE(e_document_type, '')) != 'TICARIFATURA' AND status = 'pending' THEN 'approved' ELSE status END
         WHERE id = $1`,
        [inv.id]
      );

      if (remember_supplier_expense === false) {
        if (inv.company_id) {
          await client.query(
            "UPDATE companies SET is_expense = false, expense_category = NULL, expense_center = NULL WHERE id = $1 AND store_id = $2",
            [inv.company_id, storeId]
          );
        }
      }
    }

    const uniqueProdIds = Array.from(new Set(affectedProductIds));
    for (const pid of uniqueProdIds) {
      await recalculateProductReservedStock(client, pid, storeId);
    }

    await client.query("COMMIT");
    invalidateStoreProductsCache(storeId);

    if (uniqueProdIds.length > 0) {
      syncProductStockToMarketplaces(uniqueProdIds, storeId, { reason: `operator_approve_purchase_${id}` }).catch(err =>
        console.error("[Operator Approve Marketplace Sync Error]:", err?.message || err)
      );
    }

    let refreshed = await pool.query(
      `SELECT pi.*, COALESCE(pi.operator_status, 'completed') as operator_status, c.title as company_name, c.tax_number as company_tax_number
       FROM purchase_invoices pi
       LEFT JOIN companies c ON pi.company_id = c.id
       WHERE pi.id = $1`,
      [id]
    );

    let mpVaultLabel: string | null = null;
    if (refreshed.rows.length > 0) {
      const rInv = refreshed.rows[0];
      if (mode === 'expense') {
        const opInvNo = rInv.invoice_number || rInv.document_number || `PI-${rInv.id}`;
        const opTotal = Number(rInv.grand_total || rInv.total_amount || 0);
        const opTreasury = await syncPurchaseInvoiceTreasury(pool, {
          storeId: Number(storeId),
          invoiceId: Number(rInv.id),
          invoiceNumber: opInvNo,
          invoiceDate: rInv.invoice_date || rInv.created_at || new Date(),
          grandTotal: opTotal,
          currency: rInv.currency || 'TRY',
          exchangeRate: Number(rInv.exchange_rate || 1) || 1,
          paymentMethod: rInv.payment_method || 'term',
          paymentStatus: rInv.payment_status || 'unpaid',
          status: rInv.status || 'approved',
          isExpense: true,
          companyId: rInv.company_id ? Number(rInv.company_id) : null,
          supplierName: rInv.supplier_name || rInv.company_name || null,
          taxNumber: rInv.tax_number || rInv.company_tax_number || null,
          financialAccountId: rInv.financial_account_id ? Number(rInv.financial_account_id) : null,
          financialAccountName: rInv.financial_account_name || null,
        });
        if (opTreasury.marketplacePlatform && opTreasury.isPaid && opTreasury.financialAccountId) {
          mpVaultLabel = opTreasury.financialAccountName;
          await pool.query(
            `UPDATE purchase_invoices
             SET payment_method = 'marketplace_vault',
                 payment_status = 'paid',
                 financial_account_id = $1,
                 financial_account_name = $2
             WHERE id = $3 AND store_id = $4`,
            [opTreasury.financialAccountId, opTreasury.financialAccountName, Number(rInv.id), storeId]
          );
          if (rInv.company_id && !isCancelledOrDraftStatus(rInv.status)) {
            const exDebt = await pool.query(
              "SELECT id FROM current_account_transactions WHERE store_id = $1 AND purchase_invoice_id = $2 AND type = 'debt' LIMIT 1",
              [storeId, Number(rInv.id)]
            );
            if (exDebt.rows.length === 0) {
              await pool.query(
                `INSERT INTO current_account_transactions
                  (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date, financial_account_id, financial_account_name)
                 VALUES ($1, $2, $3, 'debt', $4, $5, $6, $7, 'marketplace_vault', $8, $9, $10)`,
                [
                  storeId, Number(rInv.company_id), Number(rInv.id), opTotal,
                  (rInv.currency || 'TRY').toUpperCase(), Number(rInv.exchange_rate || 1) || 1,
                  `Pazaryeri Hakediş Mahsubu: ${opInvNo}`, rInv.invoice_date || new Date(),
                  opTreasury.financialAccountId, opTreasury.financialAccountName
                ]
              );
            }
          }
          refreshed = await pool.query(
            `SELECT pi.*, COALESCE(pi.operator_status, 'completed') as operator_status, c.title as company_name
             FROM purchase_invoices pi
             LEFT JOIN companies c ON pi.company_id = c.id
             WHERE pi.id = $1`,
            [id]
          );
        }
      } else if (String(rInv.payment_method || '').toLowerCase() === 'marketplace_vault') {
        await pool.query(
          `UPDATE purchase_invoices
           SET payment_method = 'term', payment_status = 'unpaid',
               financial_account_id = NULL, financial_account_name = NULL
           WHERE id = $1 AND store_id = $2`,
          [Number(rInv.id), storeId]
        );
        await deletePortfolioTxForSource(pool, Number(storeId), 'purchase_invoice', Number(rInv.id));
        await pool.query(
          "DELETE FROM current_account_transactions WHERE store_id = $1 AND purchase_invoice_id = $2 AND type = 'debt' AND LOWER(COALESCE(payment_method, '')) = 'marketplace_vault'",
          [storeId, Number(rInv.id)]
        );
        refreshed = await pool.query(
          `SELECT pi.*, COALESCE(pi.operator_status, 'completed') as operator_status, c.title as company_name
           FROM purchase_invoices pi
           LEFT JOIN companies c ON pi.company_id = c.id
           WHERE pi.id = $1`,
          [id]
        );
      }
    }

    res.json({
      success: true,
      message: mode === 'expense'
        ? (mpVaultLabel ? `Fatura gider olarak onaylandı ve ${mpVaultLabel} bakiyesinden düşüldü.` : "Fatura gider faturası olarak onaylandı.")
        : "Fatura kalemleri onaylandı, stoklar ve rezerveler işlendi.",
      invoice: refreshed.rows[0]
    });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("[POST /purchase/:id/operator-approve] Error:", err);
    res.status(400).json({ error: err.message || "Operatör onayı tamamlanamadı." });
  } finally {
    client.release();
  }
});

// Update / Clear customer reservation on a purchase invoice item (can also be modified post-approval)
router.post("/purchase/:invoiceId/items/:itemId/reserve", async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
  const { invoiceId, itemId } = req.params;
  const { reserved_quantity = 0, reserved_for = "" } = req.body || {};

  try {
    const invRes = await pool.query(
      "SELECT id, invoice_number, is_expense FROM purchase_invoices WHERE id = $1 AND store_id = $2",
      [invoiceId, storeId]
    );
    if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı." });

    const itemRes = await pool.query(
      "SELECT * FROM purchase_invoice_items WHERE id = $1 AND purchase_invoice_id = $2",
      [itemId, invoiceId]
    );
    if (itemRes.rows.length === 0) return res.status(404).json({ error: "Fatura kalemi bulunamadı." });

    const item = itemRes.rows[0];
    const cleanQty = Math.max(0, Number(String(reserved_quantity).replace(',', '.')) || 0);
    const cleanFor = cleanQty > 0 && reserved_for ? String(reserved_for).trim() : null;

    await pool.query(
      "UPDATE purchase_invoice_items SET reserved_quantity = $1, reserved_for = $2 WHERE id = $3",
      [cleanQty, cleanFor, itemId]
    );

    let reserveSummary = null;
    if (item.product_id) {
      reserveSummary = await recalculateProductReservedStock(pool, Number(item.product_id), storeId);
      syncProductStockToMarketplaces([Number(item.product_id)], storeId, { reason: `purchase_item_reserve_${itemId}` }).catch(err =>
        console.error("[Reserve Update Marketplace Sync Error]:", err?.message || err)
      );
    }

    res.json({
      success: true,
      message: cleanQty > 0 ? "Rezerve bilgisi kaydedildi." : "Rezerve kaldırıldı.",
      reserved_quantity: cleanQty,
      reserved_for: cleanFor,
      product_reserve: reserveSummary
    });
  } catch (err: any) {
    console.error("[POST /purchase/:invoiceId/items/:itemId/reserve] Error:", err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
