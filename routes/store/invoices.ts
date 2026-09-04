import express from "express";
import { pool, addStockMovement } from "../../models/db";
import { getEInvoiceService } from "../einvoice";
import { getTurkishSearchSnippet, normalizeTurkishParam } from "./utils";
import { findMatchingProduct, saveSupplierMapping, sanitizeInvoiceItemCodes, isValidStandardBarcode } from "./invoiceMatching";
import { mergeProducts } from "./products";

const router = express.Router();

export async function initPurchaseInvoiceSchema() {
  try {
    await pool.query(`ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS variant_id VARCHAR(255);`);
    await pool.query(`ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE purchase_invoice_items ADD COLUMN IF NOT EXISTS product_code VARCHAR(255);`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR(255);`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(255);`);
    await pool.query(`ALTER TABLE supplier_product_mappings ADD COLUMN IF NOT EXISTS supplier_product_code VARCHAR(255);`);
    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);`);
    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS company_title VARCHAR(255);`);
    await pool.query(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS company_id INT;`);
  } catch (e) {
    console.error("Failed to alter purchase_invoice_items / sales_invoices table columns:", e);
  }

  try {
    // 1. Auto-repair sales_invoice_items missing product_id where barcode exists
    await pool.query(`
      UPDATE sales_invoice_items sii
      SET product_id = p.id
      FROM sales_invoices si, products p
      WHERE sii.sales_invoice_id = si.id
        AND p.store_id = si.store_id
        AND p.barcode = sii.barcode
        AND (sii.product_id IS NULL OR sii.product_id = 0)
        AND sii.barcode IS NOT NULL AND sii.barcode != ''
    `);

    // 2. Auto-repair purchase_invoice_items missing product_id where barcode exists
    await pool.query(`
      UPDATE purchase_invoice_items pii
      SET product_id = p.id
      FROM purchase_invoices pi, products p
      WHERE pii.purchase_invoice_id = pi.id
        AND p.store_id = pi.store_id
        AND p.barcode = pii.barcode
        AND (pii.product_id IS NULL OR pii.product_id = 0)
        AND pii.barcode IS NOT NULL AND pii.barcode != ''
        AND COALESCE(pi.is_expense, FALSE) = FALSE
    `);

    // 3. Auto-repair missing sales_invoice stock_movements
    await pool.query(`
      INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, customer_info, currency, created_at, invoice_id, invoice_type, invoice_number)
      SELECT 
        si.store_id,
        sii.product_id,
        'out',
        sii.quantity,
        'sales_invoice',
        'Satış Faturası: ' || COALESCE(NULLIF(si.document_number, ''), si.invoice_number),
        sii.unit_price,
        COALESCE(c.title, cust.full_name, 'Müşteri'),
        COALESCE(si.currency, 'TRY'),
        COALESCE(si.invoice_date::timestamp, si.created_at),
        si.id,
        'sales',
        COALESCE(NULLIF(si.document_number, ''), si.invoice_number)
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON sii.sales_invoice_id = si.id
      LEFT JOIN companies c ON si.company_id = c.id
      LEFT JOIN customers cust ON si.customer_id = cust.id
      WHERE sii.product_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM stock_movements sm
          WHERE sm.product_id = sii.product_id
            AND sm.source = 'sales_invoice'
            AND (
              sm.description LIKE '%' || si.invoice_number || '%'
              OR (si.document_number IS NOT NULL AND si.document_number != '' AND sm.description LIKE '%' || si.document_number || '%')
            )
        )
    `);

    // 4. Auto-repair missing purchase_invoice stock_movements (strictly non-expense invoices)
    await pool.query(`
      INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, customer_info, currency, created_at, invoice_id, invoice_type, invoice_number)
      SELECT 
        pi.store_id,
        pii.product_id,
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
      WHERE pii.product_id IS NOT NULL
        AND COALESCE(pi.is_expense, FALSE) = FALSE
        AND NOT EXISTS (
          SELECT 1 FROM stock_movements sm
          WHERE sm.product_id = pii.product_id
            AND sm.source = 'purchase_invoice'
            AND (
              sm.description LIKE '%' || pi.invoice_number || '%'
              OR (pi.document_number IS NOT NULL AND pi.document_number != '' AND sm.description LIKE '%' || pi.document_number || '%')
            )
        )
    `);

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

    // 6. Auto-repair missing transactions in current_account_transactions for purchase invoices
    // a) Ensure credit transaction exists for all linked purchase_invoices
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
        AND NOT EXISTS (
          SELECT 1 FROM current_account_transactions cat
          WHERE cat.purchase_invoice_id = pi.id AND cat.type = 'credit'
        )
    `);

    // b) Ensure debt (payment) transaction exists for all paid purchase invoices (or payment_method != 'term')
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
        COALESCE(pi.payment_method, 'nakit'),
        COALESCE(pi.invoice_date::timestamp, pi.created_at)
      FROM purchase_invoices pi
      WHERE pi.company_id IS NOT NULL 
        AND COALESCE(NULLIF(pi.grand_total, 0), pi.total_amount, 0) > 0
        AND (pi.payment_status = 'paid' OR (pi.payment_method IS NOT NULL AND pi.payment_method != 'term'))
        AND NOT EXISTS (
          SELECT 1 FROM current_account_transactions cat
          WHERE cat.purchase_invoice_id = pi.id AND cat.type = 'debt'
        )
    `);

    // c) Auto-repair sales invoices missing company_id, customer_name, company_title or tax_number
    try {
      // Find sales invoices with customer_id or sale_id but missing company_id
      const unlinkedSalesInvoices = await pool.query(`
        SELECT si.id, si.store_id, si.sale_id, si.customer_id, si.tax_number, si.address, si.customer_email,
               cust.full_name as cust_full_name, cust.name as cust_name, cust.surname as cust_surname, 
               cust.phone as cust_phone, cust.email as cust_email, cust.address as cust_address,
               cust.city as cust_city, cust.tc_id as cust_tc_id, cust.tax_number as cust_tax_number,
               s.customer_name as sale_cust_name, s.customer_phone as sale_cust_phone, s.customer_address as sale_cust_address
        FROM sales_invoices si
        LEFT JOIN customers cust ON si.customer_id = cust.id
        LEFT JOIN sales s ON si.sale_id = s.id
        WHERE si.company_id IS NULL OR si.customer_name IS NULL OR si.company_title IS NULL OR si.tax_number IS NULL OR si.tax_number = ''
      `);

      for (const row of unlinkedSalesInvoices.rows) {
        const rawName = (row.cust_full_name || row.sale_cust_name || (row.cust_name ? `${row.cust_name} ${row.cust_surname || ''}` : '') || 'Bireysel Web Müşterisi').trim();
        let rawTc = (row.cust_tc_id || row.cust_tax_number || row.tax_number || '').trim();
        if (!rawTc || (rawTc.length !== 10 && rawTc.length !== 11)) {
          rawTc = '11111111111';
        }
        const phone = row.cust_phone || row.sale_cust_phone || '';
        const email = row.cust_email || row.customer_email || '';
        const address = row.cust_address || row.sale_cust_address || row.address || '';
        const city = row.cust_city || '';

        // Check if company exists
        let companyId = null;
        const compFind = await pool.query(
          "SELECT id FROM companies WHERE store_id = $1 AND (tax_number = $2 OR (LOWER(TRIM(title)) = LOWER(TRIM($3)) AND $3 != 'Bireysel Web Müşterisi')) LIMIT 1",
          [row.store_id, rawTc, rawName]
        );
        if (compFind.rows.length > 0) {
          companyId = compFind.rows[0].id;
        } else {
          const newComp = await pool.query(
            `INSERT INTO companies (store_id, title, tax_number, tax_office, address, phone, email, contact_person)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [row.store_id, rawName, rawTc, city ? `${city} Vergi Dairesi` : 'Bireysel', address, phone, email, rawName]
          );
          companyId = newComp.rows[0].id;
        }

        // Update sales_invoice
        await pool.query(
          `UPDATE sales_invoices 
           SET company_id = COALESCE(company_id, $1),
               customer_name = COALESCE(customer_name, $2),
               company_title = COALESCE(company_title, $2),
               tax_number = COALESCE(NULLIF(tax_number, ''), $3),
               address = COALESCE(NULLIF(address, ''), $4),
               customer_email = COALESCE(NULLIF(customer_email, ''), $5)
           WHERE id = $6`,
          [companyId, rawName, rawTc, address, email, row.id]
        );

        // Update sales if linked
        if (row.sale_id) {
          await pool.query(
            "UPDATE sales SET company_id = COALESCE(company_id, $1), customer_name = COALESCE(customer_name, $2) WHERE id = $3",
            [companyId, rawName, row.sale_id]
          );
        }
      }

      // d) Ensure debt transaction exists for all linked sales_invoices
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
          AND NOT EXISTS (
            SELECT 1 FROM current_account_transactions cat
            WHERE cat.sales_invoice_id = si.id AND cat.type = 'debt'
          )
      `);

      // e) Ensure credit (collection) transaction exists for paid sales invoices (payment_method != 'term')
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
          COALESCE(si.payment_method, 'kredi_karti'),
          COALESCE(si.invoice_date::timestamp, si.created_at)
        FROM sales_invoices si
        WHERE si.company_id IS NOT NULL 
          AND COALESCE(NULLIF(si.grand_total, 0), si.total_amount, 0) > 0
          AND (si.status = 'paid' OR (si.payment_method IS NOT NULL AND si.payment_method != 'term'))
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
    } catch (err) {
      console.error("Failed to auto-repair sales invoices / current accounts:", err);
    }
  } catch (e) {
    console.error("Failed to alter purchase_invoice_items schema / stock sync:", e);
  }
}

async function resolveProductInfo(clientOrPool: any, storeId: number, productId: any, barcode: any, productCode?: any) {
  let resolvedId = productId ? Number(productId) : null;
  let rawBarcode = barcode ? String(barcode).trim() : '';
  let rawCode = productCode ? String(productCode).trim() : '';

  if ((!resolvedId || isNaN(resolvedId))) {
    // 1. Try matching barcode or product_code by barcode
    if (rawBarcode) {
      const pRes = await clientOrPool.query(
        "SELECT id, barcode, COALESCE(product_code, sku, '') as product_code FROM products WHERE store_id = $1 AND (barcode = $2 OR product_code = $2 OR sku = $2) LIMIT 1",
        [storeId, rawBarcode]
      );
      if (pRes.rows.length > 0) {
        resolvedId = pRes.rows[0].id;
        rawBarcode = pRes.rows[0].barcode || rawBarcode;
        rawCode = pRes.rows[0].product_code || rawCode;
      }
    }
    // 2. Try matching by productCode / SKU if still unresolved
    if ((!resolvedId || isNaN(resolvedId)) && rawCode) {
      const pRes = await clientOrPool.query(
        "SELECT id, barcode, COALESCE(product_code, sku, '') as product_code FROM products WHERE store_id = $1 AND (LOWER(product_code) = LOWER($2) OR LOWER(sku) = LOWER($2) OR barcode = $2) LIMIT 1",
        [storeId, rawCode]
      );
      if (pRes.rows.length > 0) {
        resolvedId = pRes.rows[0].id;
        rawBarcode = pRes.rows[0].barcode || rawBarcode;
        rawCode = pRes.rows[0].product_code || rawCode;
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
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { startDate, endDate, status, search } = req.query;

    let query = `
      SELECT si.*, 
             COALESCE(si.company_title, c.title, si.customer_name, cust.full_name, s.customer_name, 'Bireysel Web Müşterisi') as company_title,
             COALESCE(si.customer_name, si.company_title, cust.full_name, c.title, s.customer_name, 'Bireysel Web Müşterisi') as customer_name,
             s.customer_name as sale_customer_name,
             COALESCE(NULLIF(si.tax_number, ''), c.tax_number, cust.tc_id, cust.tax_number, '11111111111') as resolved_tax_number,
             (
               SELECT COALESCE(json_agg(json_build_object(
                 'id', sii.id,
                 'product_id', sii.product_id,
                 'product_name', sii.product_name,
                 'barcode', sii.barcode,
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
      WHERE si.store_id = $1
    `;
    const params: any[] = [storeId];

    if (startDate) {
      params.push(startDate);
      query += ` AND si.invoice_date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate + ' 23:59:59');
      query += ` AND si.invoice_date <= $${params.length}`;
    }
    if (status && status !== 'all') {
      params.push(status);
      query += ` AND si.status = $${params.length}`;
    }
    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
      searchTerms.forEach(term => {
        const pLen = params.length + 1;
        query += ` AND (
          ${getTurkishSearchSnippet('si.invoice_number', pLen)} OR 
          ${getTurkishSearchSnippet('si.document_number', pLen)} OR
          ${getTurkishSearchSnippet('si.ettn', pLen)} OR
          ${getTurkishSearchSnippet('si.notes', pLen)} OR
          ${getTurkishSearchSnippet('si.waybill_number', pLen)} OR
          ${getTurkishSearchSnippet('si.tax_number', pLen)} OR
          ${getTurkishSearchSnippet('c.title', pLen)} OR
          ${getTurkishSearchSnippet('cust.full_name', pLen)} OR
          ${getTurkishSearchSnippet('s.customer_name', pLen)} OR
          EXISTS (
            SELECT 1 FROM sales_invoice_items sub_sii 
            WHERE sub_sii.sales_invoice_id = si.id 
            AND (
              ${getTurkishSearchSnippet('sub_sii.product_name', pLen)} OR
              ${getTurkishSearchSnippet('sub_sii.barcode', pLen)}
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
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const invoiceResult = await pool.query(
      `SELECT si.*, 
              c.title as company_title,
              c.tax_number as company_tax_number,
              c.tax_office as company_tax_office,
              c.address as company_address,
              c.email as company_email,
              cust.full_name as customer_name,
              cust.tax_number as customer_tax_number,
              cust.tax_office as customer_tax_office,
              cust.address as customer_address,
              cust.email as customer_email_fallback,
              s.customer_name as sale_customer_name
       FROM sales_invoices si 
       LEFT JOIN companies c ON si.company_id = c.id 
       LEFT JOIN customers cust ON si.customer_id = cust.id
       LEFT JOIN sales s ON si.sale_id = s.id
       WHERE si.id = $1 AND si.store_id = $2`,
      [req.params.id, storeId]
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

    if (invoice.company_id) {
      invoice.tax_number = invoice.tax_number || invoice.company_tax_number;
      invoice.tax_office = invoice.tax_office || invoice.company_tax_office;
      invoice.address = invoice.address || invoice.company_address;
      invoice.customer_email = invoice.customer_email || invoice.company_email;
    } else if (invoice.customer_id) {
      invoice.tax_number = invoice.tax_number || invoice.customer_tax_number;
      invoice.tax_office = invoice.tax_office || invoice.customer_tax_office;
      invoice.address = invoice.address || invoice.customer_address;
      invoice.customer_email = invoice.customer_email || invoice.customer_email_fallback;
    }

    invoice.customer_name = invoice.customer_name || invoice.company_title || invoice.sale_customer_name || 'Bireysel Web Müşterisi';
    invoice.company_title = invoice.company_title || invoice.customer_name || 'Bireysel Web Müşterisi';
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
      gi_withholding_tax_code
    } = req.body;
    
    let storeId = req.user.store_id;
    if (req.user.role === "superadmin" && bodyStoreId) {
      storeId = bodyStoreId;
    }

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
        const itemTotalIncl = qty * price;
        const lineExtensionAmount = itemTotalIncl / (1 + (taxRate / 100));
        const lineTax = itemTotalIncl - lineExtensionAmount;
        
        total_amount += lineExtensionAmount;
        tax_amount += lineTax;
        grand_total += itemTotalIncl;
      } else {
        const lineExtensionAmount = qty * price;
        const lineTax = (lineExtensionAmount * taxRate) / 100;
        const itemTotalIncl = lineExtensionAmount + lineTax;
        
        total_amount += lineExtensionAmount;
        tax_amount += lineTax;
        grand_total += itemTotalIncl;
      }
    }
    
    const invoiceResult = await client.query(
      `INSERT INTO sales_invoices 
        (store_id, sale_id, company_id, customer_id, invoice_number, waybill_number, invoice_date, invoice_time, total_amount, tax_amount, grand_total, currency, exchange_rate, notes, invoice_type, status, payment_method, quotation_id, e_document_type, invoice_profile, is_tax_inclusive, customer_email, tax_number, tax_office, address, gi_invoice_type, gi_exemption_reason_code, gi_withholding_tax_code, return_invoice_number, return_invoice_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30) RETURNING id`,
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
        notes, 
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
        req.body.return_invoice_date || null
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

    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      
      let itemTax = 0;
      let itemTotal = 0; 

      if (finalIsTaxInclusive) {
        const itemTotalIncl = qty * price;
        itemTotal = itemTotalIncl / (1 + (taxRate / 100));
        itemTax = itemTotalIncl - itemTotal;
      } else {
        itemTotal = qty * price;
        itemTax = (itemTotal * taxRate) / 100;
      }

      const { productId: resolvedProductId, barcode: resolvedBarcode } = await resolveProductInfo(client, storeId, item.product_id, item.barcode);
      
      await client.query(
        `INSERT INTO sales_invoice_items 
          (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [invoiceId, resolvedProductId, item.product_name, resolvedBarcode, item.quantity, item.unit_price, item.tax_rate, itemTax, itemTotal]
      );
      
      if (resolvedProductId) {
        const productRes = await client.query("SELECT product_type FROM products WHERE id = $1", [resolvedProductId]);
        const productType = productRes.rows.length > 0 ? productRes.rows[0].product_type : 'product';

        if (productType !== 'service') {
          await client.query(
            "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
            [item.quantity, resolvedProductId, storeId]
          );
          
          await addStockMovement(client, storeId, resolvedProductId, 'out', item.quantity, 'sales_invoice', `Satış Faturası: ${invoice_number}`, item.unit_price, displayName, currency, null, invoiceId, 'sales', invoice_number);
        }
      }
    }
    
    if (company_id && status !== 'draft') {
      if (quotation_id || sale_id) {
        await client.query("DELETE FROM current_account_transactions WHERE (quotation_id = $1 OR sale_id = $2) AND sales_invoice_id IS NULL", [quotation_id || null, sale_id || null]);
      }

      const storeRes = await client.query("SELECT * FROM stores WHERE id = $1", [storeId]);
      const store = storeRes.rows[0];
      const branding = store?.branding || {};
      const defaultCurrency = store?.default_currency || branding?.default_currency || 'TRY';

      await client.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, transaction_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [storeId, company_id, invoiceId, 'debt', grand_total, currency || defaultCurrency, exchange_rate || 1, `Satış Faturası: ${invoice_number}`, invoice_date || new Date()]
      );

      if (payment_method && payment_method !== 'term') {
        await client.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [storeId, company_id, invoiceId, 'credit', grand_total, currency || defaultCurrency, exchange_rate || 1, `Satış Faturası Tahsilatı: ${invoice_number} (${payment_method})`, payment_method, invoice_date || new Date()]
        );
      }
    }
    
    await client.query("COMMIT");
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
    
    const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
    const { 
      company_id, customer_id, invoice_number, waybill_number, invoice_date, invoice_time,
      notes, items, payment_method, currency, exchange_rate, 
      invoice_type, invoice_profile, status, is_tax_inclusive,
      tax_number, tax_office, address,
      gi_invoice_type, gi_exemption_reason_code, gi_withholding_tax_code
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
    
    let displayName = 'Müşteri';
    if (company_id) {
      const companyRes = await client.query("SELECT title FROM companies WHERE id = $1", [company_id]);
      if (companyRes.rows.length > 0) displayName = companyRes.rows[0].title;
    } else if (customer_id) {
      const custRes = await client.query("SELECT full_name FROM customers WHERE id = $1", [customer_id]);
      if (custRes.rows.length > 0) displayName = custRes.rows[0].full_name;
    }

    for (const item of oldItemsResult.rows) {
      const { productId: oldResolvedId } = await resolveProductInfo(client, storeId, item.product_id, item.barcode);
      if (oldResolvedId) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, oldResolvedId, storeId]
        );
      }
    }
    
    await client.query("DELETE FROM stock_movements WHERE source = 'sales_invoice' AND (description LIKE $1 OR description LIKE $2 OR description LIKE $3)", [`%${oldInvoice.invoice_number}%`, `%${oldInvoice.document_number || oldInvoice.invoice_number}%`, `%${oldInvoice.invoice_number}%`]);

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
        const itemTotalIncl = qty * price;
        const lineExtensionAmount = itemTotalIncl / (1 + (taxRate / 100));
        const lineTax = itemTotalIncl - lineExtensionAmount;
        
        total_amount += lineExtensionAmount;
        tax_amount += lineTax;
        grand_total += itemTotalIncl;
      } else {
        const lineExtensionAmount = qty * price;
        const lineTax = (lineExtensionAmount * taxRate) / 100;
        const itemTotalIncl = lineExtensionAmount + lineTax;
        
        total_amount += lineExtensionAmount;
        tax_amount += lineTax;
        grand_total += itemTotalIncl;
      }
    }
    
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
        return_invoice_date = $27
    WHERE id = $28 AND store_id = $29`,
    [
      company_id || null, customer_id || null, invoice_number, waybill_number || null, invoice_date, 
      total_amount, tax_amount, grand_total, currency || 'TRY', exchange_rate || 1, 
      notes, payment_method, invoice_type, status, e_document_type, 
      invoice_profile || (e_document_type === 'E-FATURA' ? 'TICARIFATURA' : 'EARSIVFATURA'), 
      finalIsTaxInclusive,
      req.body.customer_email || null,
      req.body.tax_number || null, tax_office || null, address || null,
      gi_invoice_type || 'SATIS', gi_exemption_reason_code || null, gi_withholding_tax_code || null,
      invoice_time || null,
      req.body.return_invoice_number ? String(req.body.return_invoice_number).toUpperCase().replace(/[^A-Z0-9]/g, '').trim() : null,
      req.body.return_invoice_date || null,
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

    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      
      let itemTax = 0;
      let itemTotal = 0; 

      if (finalIsTaxInclusive) {
        const itemTotalIncl = qty * price;
        itemTotal = itemTotalIncl / (1 + (taxRate / 100));
        itemTax = itemTotalIncl - itemTotal;
      } else {
        itemTotal = qty * price;
        itemTax = (itemTotal * taxRate) / 100;
      }

      const { productId: resolvedProductId, barcode: resolvedBarcode } = await resolveProductInfo(client, storeId, item.product_id, item.barcode);
      
      await client.query(
        `INSERT INTO sales_invoice_items 
          (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [req.params.id, resolvedProductId, item.product_name, resolvedBarcode, item.quantity, item.unit_price, item.tax_rate, itemTax, itemTotal]
      );
      
      if (resolvedProductId) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, resolvedProductId, storeId]
        );
        await addStockMovement(client, storeId, resolvedProductId, 'out', item.quantity, 'sales_invoice', `Satış Faturası (Güncellendi): ${invoice_number}`, item.unit_price, displayName, currency, null, req.params.id, 'sales', invoice_number);
      }
    }

    if (company_id && status !== 'draft') {
      const storeRes = await client.query("SELECT * FROM stores WHERE id = $1", [storeId]);
      const store = storeRes.rows[0];
      const branding = store?.branding || {};
      const defaultCurrency = store?.default_currency || branding?.default_currency || 'TRY';

      await client.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, transaction_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [storeId, company_id, req.params.id, 'debt', grand_total, currency || defaultCurrency, exchange_rate || 1, `Satış Faturası: ${invoice_number}`, invoice_date || new Date()]
      );

      if (payment_method && payment_method !== 'term') {
        await client.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [storeId, company_id, req.params.id, 'credit', grand_total, currency || defaultCurrency, exchange_rate || 1, `Satış Faturası Tahsilatı: ${invoice_number} (${payment_method})`, payment_method, invoice_date || new Date()]
        );
      }
    }

    await client.query("COMMIT");
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
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
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

router.get("/purchase", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { search, startDate, endDate } = req.query;

    let query = `
      SELECT pi.*, c.title as company_name,
             (
               SELECT COALESCE(json_agg(json_build_object(
                 'id', pii.id,
                 'product_id', pii.product_id,
                 'product_name', pii.product_name,
                 'barcode', pii.barcode,
                 'quantity', pii.quantity,
                 'unit_price', pii.unit_price,
                 'tax_rate', pii.tax_rate,
                 'tax_amount', pii.tax_amount,
                 'total_price', pii.total_price,
                 'variant_id', pii.variant_id,
                 'variant_name', pii.variant_name
               ) ORDER BY pii.id), '[]'::json)
               FROM purchase_invoice_items pii 
               WHERE pii.purchase_invoice_id = pi.id
             ) as items
      FROM purchase_invoices pi 
      LEFT JOIN companies c ON pi.company_id = c.id 
      WHERE pi.store_id = $1
    `;
    const params: any[] = [storeId];

    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
      searchTerms.forEach(term => {
        const pLen = params.length + 1;
        query += ` AND (
          ${getTurkishSearchSnippet('pi.invoice_number', pLen)} OR 
          ${getTurkishSearchSnippet('pi.document_number', pLen)} OR
          ${getTurkishSearchSnippet('pi.supplier_name', pLen)} OR
          ${getTurkishSearchSnippet('pi.ettn', pLen)} OR
          ${getTurkishSearchSnippet('pi.notes', pLen)} OR
          ${getTurkishSearchSnippet('pi.waybill_number', pLen)} OR
          ${getTurkishSearchSnippet('pi.tax_number', pLen)} OR
          ${getTurkishSearchSnippet('c.title', pLen)} OR
          EXISTS (
            SELECT 1 FROM purchase_invoice_items sub_pii 
            WHERE sub_pii.purchase_invoice_id = pi.id 
            AND (
              ${getTurkishSearchSnippet('sub_pii.product_name', pLen)} OR
              ${getTurkishSearchSnippet('sub_pii.barcode', pLen)} OR
              ${getTurkishSearchSnippet('sub_pii.variant_name', pLen)}
            )
          )
        )`;
        params.push(normalizeTurkishParam(term));
      });
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND pi.invoice_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate + ' 23:59:59');
      query += ` AND pi.invoice_date <= $${params.length}`;
    }

    query += ` ORDER BY pi.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/purchase/:id", async (req: any, res) => {
  try {
    let query = `
      SELECT pi.*, c.title as company_name 
      FROM purchase_invoices pi 
      LEFT JOIN companies c ON pi.company_id = c.id 
      WHERE pi.id = $1
    `;
    let params = [req.params.id];
    if (req.user.role !== "superadmin") {
      query += " AND pi.store_id = $2";
      params.push(req.user.store_id);
    }
    
    const invoiceResult = await pool.query(query, params);
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    
    const invoice = invoiceResult.rows[0];
    
    let itemsResult = await pool.query(
      `SELECT pii.*, p.product_code as system_product_code, p.sku as system_sku
       FROM purchase_invoice_items pii
       LEFT JOIN products p ON pii.product_id = p.id
       WHERE pii.purchase_invoice_id = $1
       ORDER BY pii.id ASC`,
      [req.params.id]
    );
    
    let items = itemsResult.rows;

    // Only fetch from e-invoice service if there are NO items yet recorded for this invoice!
    if (invoice.ettn && (!items || items.length === 0)) {
       try {
         const service = await getEInvoiceService(invoice.store_id);
         if (service) {
           const details = await service.getInvoiceDetailsByUuid(invoice.ettn);
           if (details) {
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

                   // 5-Tier Intelligent matching:
                   const match = await findMatchingProduct(pool, invoice.store_id, {
                     supplierVkn: invoice.tax_number,
                     productName,
                     barcode,
                     productCode: sellerCode || buyerCode,
                     sellerCode,
                     buyerCode
                   });

                   let productId = match ? match.productId : null;
                   let finalBarcode: string;
                   let finalProductCode: string | null;

                   if (match) {
                     productId = match.productId;
                     finalProductCode = match.productCode || sellerCode || buyerCode || null;
                     if (isValidStandardBarcode(match.barcode)) {
                       finalBarcode = match.barcode;
                     } else {
                       const sanitized = sanitizeInvoiceItemCodes(match.barcode, sellerCode, buyerCode, finalProductCode);
                       finalBarcode = sanitized.barcode;
                       if (!finalProductCode) finalProductCode = sanitized.productCode;
                       await pool.query(
                         "UPDATE products SET barcode = $1, product_code = COALESCE(product_code, $2), sku = COALESCE(sku, $2) WHERE id = $3",
                         [finalBarcode, finalProductCode, productId]
                       );
                     }
                   } else {
                     const sanitized = sanitizeInvoiceItemCodes(barcode, sellerCode, buyerCode, null);
                     finalBarcode = sanitized.barcode;
                     finalProductCode = sanitized.productCode || sellerCode || buyerCode || null;

                     const existingProd = await pool.query(
                       "SELECT id, barcode, product_code FROM products WHERE store_id = $1 AND (barcode = $2 OR (product_code IS NOT NULL AND product_code = $3))",
                       [invoice.store_id, finalBarcode, finalProductCode || '__NONE__']
                     );
                     if (existingProd.rows.length > 0) {
                       productId = existingProd.rows[0].id;
                       finalBarcode = existingProd.rows[0].barcode;
                       finalProductCode = existingProd.rows[0].product_code || finalProductCode;
                     } else {
                       const newProdRes = await pool.query(
                         `INSERT INTO products 
                          (store_id, name, barcode, product_code, sku, price, cost_price, tax_rate, stock_quantity, currency, product_type, labels) 
                          VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
                         [invoice.store_id, productName, finalBarcode, finalProductCode, 0, up, tr, 0, invoice.currency || 'TRY', 'product', JSON.stringify(["yeni_fatura_urunu"])]
                       );
                       productId = newProdRes.rows[0].id;
                     }
                   }

                   // Auto save supplier mapping
                   if (invoice.tax_number && productName && productId) {
                     await saveSupplierMapping(pool, invoice.store_id, invoice.tax_number, productName, productId, finalProductCode);
                   }

                   await pool.query(
                     `INSERT INTO purchase_invoice_items 
                      (purchase_invoice_id, product_id, product_name, barcode, product_code, quantity, unit_price, tax_rate, tax_amount, total_price) 
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                     [invoice.id, productId, productName, finalBarcode, finalProductCode, qty, up, tr, taxAmount, lineTotal]
                   );

                   // Check if stock movement already recorded for this invoice to prevent double addition
                   const existingMov = await pool.query(
                     "SELECT 1 FROM stock_movements WHERE store_id = $1 AND related_id = $2 AND movement_type = 'purchase_invoice' LIMIT 1",
                     [invoice.store_id, invoice.id]
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
                       `E-Fatura İlk İçe Aktarma: ${invoice.invoice_number}`,
                       up,
                       invoice.supplier_name || invoice.company_name,
                       invoice.currency,
                       null,
                       invoice.id,
                       'purchase',
                       invoice.invoice_number
                     );
                   }
                 }

                 const refetched = await pool.query(
                   `SELECT pii.*, p.product_code as system_product_code, p.sku as system_sku
                    FROM purchase_invoice_items pii
                    LEFT JOIN products p ON pii.product_id = p.id
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
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const {
      invoice_number, invoice_date, company_id, waybill_number, tax_number, tax_office,
      address, total_amount, tax_amount, grand_total, currency, exchange_rate, notes,
      supplier_name, is_expense, expense_category, expense_center, items, status, is_tax_inclusive,
      payment_method, payment_status
    } = req.body;

    let finalIsExpense = is_expense === true || is_expense === 'true';
    let finalExpenseCategory = expense_category || null;
    let finalExpenseCenter = expense_center || null;

    const sTitle = (supplier_name || '').toLowerCase();
    if (!finalIsExpense) {
      if (sTitle.includes('ttnet') || sTitle.includes('tt net') || sTitle.includes('türk telekom') || sTitle.includes('turk telekom') || sTitle.includes('turkcell') || sTitle.includes('vodafone') || sTitle.includes('telekom') || sTitle.includes('turknet') || sTitle.includes('millenicom') || sTitle.includes('superonline')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'TELEKOM';
        finalExpenseCenter = finalExpenseCenter || 'office';
      } else if (sTitle.includes('enerjisa') || sTitle.includes('elektrik') || sTitle.includes('ayedaş') || sTitle.includes('ck boğaziçi') || sTitle.includes('gediz')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'ELEKTRIK';
        finalExpenseCenter = finalExpenseCenter || 'office';
      } else if (sTitle.includes('iski') || sTitle.includes('aski') || sTitle.includes('su ve kana') || sTitle.includes('izsu') || sTitle.includes('buski')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'SU';
        finalExpenseCenter = finalExpenseCenter || 'office';
      } else if (sTitle.includes('botaş') || sTitle.includes('gaz') || sTitle.includes('igdaş') || sTitle.includes('başkentgaz') || sTitle.includes('enerya')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'DOGALGAZ';
        finalExpenseCenter = finalExpenseCenter || 'office';
      } else if (sTitle.includes('shell') || sTitle.includes('opet') || sTitle.includes('petrol') || sTitle.includes('bp ') || sTitle.includes('total') || sTitle.includes('aytemiz')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'AKARYAKIT';
        finalExpenseCenter = finalExpenseCenter || 'logistics';
      } else if (sTitle.includes('aras') || sTitle.includes('yurtiçi') || sTitle.includes('mng') || sTitle.includes('kargo') || sTitle.includes('sürat') || sTitle.includes('ptt') || sTitle.includes('ups')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'KARGO';
        finalExpenseCenter = finalExpenseCenter || 'logistics';
      } else if (sTitle.includes('kira') || sTitle.includes('kiralama') || sTitle.includes('rent a car')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'KIRA';
        finalExpenseCenter = finalExpenseCenter || 'management';
      } else if (sTitle.includes('yemek') || sTitle.includes('ticket') || sTitle.includes('sodexo') || sTitle.includes('multinet') || sTitle.includes('metropol')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'PERSONEL_YEMEK';
        finalExpenseCenter = finalExpenseCenter || 'hr';
      } else if (sTitle.includes('sigorta') || sTitle.includes('aksigorta') || sTitle.includes('allianz') || sTitle.includes('anadolu sigorta')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'SIGORTA';
        finalExpenseCenter = finalExpenseCenter || 'office';
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

    const invoiceRes = await pool.query(
      `INSERT INTO purchase_invoices 
       (store_id, company_id, invoice_number, waybill_number, tax_number, tax_office, address, 
        invoice_date, total_amount, tax_amount, grand_total, currency, exchange_rate, notes, 
        supplier_name, is_expense, expense_category, expense_center, status, is_tax_inclusive, payment_method, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING *`,
      [
        storeId, company_id || null, invoice_number || `P-${Date.now()}`, waybill_number || null,
        tax_number || null, tax_office || null, address || null, invoice_date || new Date(),
        calculatedTotalAmount, calculatedTaxAmount, calculatedGrandTotal, currency || 'TRY', exchange_rate || 1,
        notes || null, supplier_name || null, finalIsExpense, finalExpenseCategory, finalExpenseCenter, status || 'pending',
        finalIsTaxInclusive, payment_method || null, payment_status || 'unpaid'
      ]
    );

    const invoice = invoiceRes.rows[0];

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
    }

    if (finalCompanyId) {
      console.log(`Adding current account transaction for company ${finalCompanyId}, invoice ${invoice.id}, amount ${calculatedGrandTotal}`);
      const storeRes = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
      const store = storeRes.rows[0];
      const branding = store?.branding || {};
      const defaultCurrency = store?.default_currency || branding?.default_currency || 'TRY';

      await pool.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, transaction_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [storeId, finalCompanyId, invoice.id, 'credit', calculatedGrandTotal, currency || defaultCurrency, exchange_rate || 1, `Alış Faturası: ${invoice_number}`, invoice_date || new Date()]
      );

      const isPaid = payment_status === 'paid' || (payment_method && payment_method !== 'term');
      if (isPaid) {
        await pool.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            storeId, finalCompanyId, invoice.id, 'debt', calculatedGrandTotal, currency || defaultCurrency, exchange_rate || 1,
            `Alış Faturası Ödemesi: ${invoice_number}${payment_method ? ` (${payment_method})` : ''}`, payment_method || 'nakit', invoice_date || new Date()
          ]
        );
      }
    }

    if (items && Array.isArray(items)) {
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

        // For expense invoices, do NOT link to products, do NOT track stock!
        let resolvedProductId = null;
        let resolvedBarcode = null;
        let resolvedProductCode = null;
        if (!finalIsExpense) {
          const resProd = await resolveProductInfo(pool, storeId, item.product_id, item.barcode, item.product_code);
          resolvedProductId = resProd.productId;
          resolvedBarcode = resProd.barcode;
          resolvedProductCode = resProd.productCode || item.product_code || null;
        }

        await pool.query(
          `INSERT INTO purchase_invoice_items 
           (purchase_invoice_id, product_id, product_name, barcode, product_code, quantity, unit_code, system_quantity, system_unit_code, unit_price, tax_rate, tax_amount, total_price, variant_id, variant_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
          [
            invoice.id, resolvedProductId, item.product_name || 'Bilinmeyen Ürün', resolvedBarcode || null, resolvedProductCode,
            qty, item.unit_code || 'Adet', item.system_quantity || null, item.system_unit_code || null, price, taxRate, itemTaxAmount, itemTotalPrice,
            item.variant_id || null, item.variant_name || null
          ]
        );

        if (resolvedProductId && !finalIsExpense) {
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
            `Fatura Girişi: ${invoice.invoice_number}${item.variant_name ? ` (${item.variant_name})` : ''}`, item.unit_price || 0, supplier_name || 'Tedarikçi', currency,
            null, invoice.id, 'purchase', invoice.invoice_number
          );
        }
      }
    }

    res.status(201).json(invoice);
  } catch (e: any) {
    console.error("Error in POST /purchase:", e);
    res.status(400).json({ error: e.message });
  }
});

router.put("/purchase/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;
    const {
      invoice_number, invoice_date, company_id, waybill_number, tax_number, tax_office,
      address, total_amount, tax_amount, grand_total, currency, exchange_rate, notes,
      supplier_name, is_expense, expense_category, expense_center, items, status, is_tax_inclusive,
      payment_method, payment_status
    } = req.body;

    const checkRes = await pool.query("SELECT id FROM purchase_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (checkRes.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });

    let finalIsExpense = is_expense === true || is_expense === 'true';
    let finalExpenseCategory = expense_category || null;
    let finalExpenseCenter = expense_center || null;

    const sTitle = (supplier_name || '').toLowerCase();
    if (!finalIsExpense) {
      if (sTitle.includes('ttnet') || sTitle.includes('tt net') || sTitle.includes('türk telekom') || sTitle.includes('turk telekom') || sTitle.includes('turkcell') || sTitle.includes('vodafone') || sTitle.includes('telekom') || sTitle.includes('turknet') || sTitle.includes('millenicom') || sTitle.includes('superonline')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'TELEKOM';
        finalExpenseCenter = finalExpenseCenter || 'office';
      } else if (sTitle.includes('enerjisa') || sTitle.includes('elektrik') || sTitle.includes('ayedaş') || sTitle.includes('ck boğaziçi') || sTitle.includes('gediz')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'ELEKTRIK';
        finalExpenseCenter = finalExpenseCenter || 'office';
      } else if (sTitle.includes('iski') || sTitle.includes('aski') || sTitle.includes('su ve kana') || sTitle.includes('izsu') || sTitle.includes('buski')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'SU';
        finalExpenseCenter = finalExpenseCenter || 'office';
      } else if (sTitle.includes('botaş') || sTitle.includes('gaz') || sTitle.includes('igdaş') || sTitle.includes('başkentgaz') || sTitle.includes('enerya')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'DOGALGAZ';
        finalExpenseCenter = finalExpenseCenter || 'office';
      } else if (sTitle.includes('shell') || sTitle.includes('opet') || sTitle.includes('petrol') || sTitle.includes('bp ') || sTitle.includes('total') || sTitle.includes('aytemiz')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'AKARYAKIT';
        finalExpenseCenter = finalExpenseCenter || 'logistics';
      } else if (sTitle.includes('aras') || sTitle.includes('yurtiçi') || sTitle.includes('mng') || sTitle.includes('kargo') || sTitle.includes('sürat') || sTitle.includes('ptt') || sTitle.includes('ups')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'KARGO';
        finalExpenseCenter = finalExpenseCenter || 'logistics';
      } else if (sTitle.includes('kira') || sTitle.includes('kiralama') || sTitle.includes('rent a car')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'KIRA';
        finalExpenseCenter = finalExpenseCenter || 'management';
      } else if (sTitle.includes('yemek') || sTitle.includes('ticket') || sTitle.includes('sodexo') || sTitle.includes('multinet') || sTitle.includes('metropol')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'PERSONEL_YEMEK';
        finalExpenseCenter = finalExpenseCenter || 'hr';
      } else if (sTitle.includes('sigorta') || sTitle.includes('aksigorta') || sTitle.includes('allianz') || sTitle.includes('anadolu sigorta')) {
        finalIsExpense = true;
        finalExpenseCategory = finalExpenseCategory || 'SIGORTA';
        finalExpenseCenter = finalExpenseCenter || 'office';
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

    // Deduct old items stock before replacing them
    const oldItems = await pool.query("SELECT product_id, barcode, product_code, quantity, system_quantity, variant_id, variant_name FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [id]);
    for (const oldItem of oldItems.rows) {
      let oldResolvedId = oldItem.product_id;
      if (!oldResolvedId) {
        const { productId } = await resolveProductInfo(pool, storeId, null, oldItem.barcode, oldItem.product_code);
        oldResolvedId = productId;
      }
      if (oldResolvedId) {
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
    await pool.query("DELETE FROM stock_movements WHERE (source = 'purchase_invoice' OR invoice_type = 'purchase') AND (invoice_id = $1 OR description LIKE $2 OR description LIKE $3)", [id, `%${invoice_number}%`, `%${id}%`]);

    const invoiceRes = await pool.query(
      `UPDATE purchase_invoices 
       SET company_id = $1, invoice_number = $2, waybill_number = $3, tax_number = $4, tax_office = $5, address = $6, 
           invoice_date = $7, total_amount = $8, tax_amount = $9, grand_total = $10, currency = $11, exchange_rate = $12, 
           notes = $13, supplier_name = $14, is_expense = $15, expense_category = $16, expense_center = $17, status = $18, is_tax_inclusive = $19,
           payment_method = $20, payment_status = $21
       WHERE id = $22 AND store_id = $23 RETURNING *`,
      [
        company_id || null, invoice_number, waybill_number || null, tax_number || null, tax_office || null, address || null,
        invoice_date, calculatedTotalAmount, calculatedTaxAmount, calculatedGrandTotal, currency || 'TRY', exchange_rate || 1,
        notes || null, supplier_name || null, finalIsExpense, finalExpenseCategory, finalExpenseCenter, status || 'pending',
        finalIsTaxInclusive, payment_method || null, payment_status || 'unpaid',
        id, storeId
      ]
    );

    const invoice = invoiceRes.rows[0];

    // Delete old transaction and add new one
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
      await pool.query("UPDATE purchase_invoices SET company_id = $1 WHERE id = $2", [finalCompanyId, id]);
    }

    await pool.query("DELETE FROM current_account_transactions WHERE purchase_invoice_id = $1", [id]);
    
    if (finalCompanyId) {
      const storeRes = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
      const store = storeRes.rows[0];
      const branding = store?.branding || {};
      const defaultCurrency = store?.default_currency || branding?.default_currency || 'TRY';

      await pool.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, transaction_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [storeId, finalCompanyId, invoice.id, 'credit', calculatedGrandTotal, currency || defaultCurrency, exchange_rate || 1, `Alış Faturası: ${invoice_number}`, invoice_date || new Date()]
      );

      const isPaid = payment_status === 'paid' || (payment_method && payment_method !== 'term');
      if (isPaid) {
        await pool.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            storeId, finalCompanyId, invoice.id, 'debt', calculatedGrandTotal, currency || defaultCurrency, exchange_rate || 1,
            `Alış Faturası Ödemesi: ${invoice_number}${payment_method ? ` (${payment_method})` : ''}`, payment_method || 'nakit', invoice_date || new Date()
          ]
        );
      }
    }

    if (items && Array.isArray(items)) {
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

        // For expense invoices, do NOT link to products, do NOT track stock!
        let resolvedProductId = null;
        let resolvedBarcode = null;
        let resolvedProductCode = null;
        if (!finalIsExpense) {
          const resProd = await resolveProductInfo(pool, storeId, item.product_id, item.barcode, item.product_code);
          resolvedProductId = resProd.productId;
          resolvedBarcode = resProd.barcode;
          resolvedProductCode = resProd.productCode || item.product_code || null;
        }

        await pool.query(
          `INSERT INTO purchase_invoice_items 
           (purchase_invoice_id, product_id, product_name, barcode, product_code, quantity, unit_code, system_quantity, system_unit_code, unit_price, tax_rate, tax_amount, total_price, variant_id, variant_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            id, resolvedProductId, item.product_name || 'Bilinmeyen Ürün', resolvedBarcode || null, resolvedProductCode,
            qty, item.unit_code || 'Adet', item.system_quantity || null, item.system_unit_code || null, price, taxRate, itemTaxAmount, itemTotalPrice,
            item.variant_id || null, item.variant_name || null
          ]
        );

        if (resolvedProductId && !finalIsExpense) {
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
            `Fatura Güncelleme: ${invoice.invoice_number}${item.variant_name ? ` (${item.variant_name})` : ''}`, item.unit_price || 0, supplier_name || 'Tedarikçi', currency,
            null, invoice.id, 'purchase', invoice.invoice_number
          );
        }
      }
    }

    res.json(invoice);
  } catch (e: any) {
    console.error("Error in PUT /purchase/:id:", e);
    res.status(400).json({ error: e.message });
  }
});

router.delete("/sales/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;

    const checkRes = await pool.query("SELECT id, invoice_number, quotation_id, sale_id FROM sales_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (checkRes.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
    const invoice = checkRes.rows[0];

    // Revert stock
    const oldItems = await pool.query("SELECT product_id, quantity FROM sales_invoice_items WHERE sales_invoice_id = $1", [id]);
    for (const item of oldItems.rows) {
      if (item.product_id) {
        await pool.query("UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3", [item.quantity, item.product_id, storeId]);
      }
    }

    if (invoice.invoice_number) {
      await pool.query("DELETE FROM stock_movements WHERE source = 'sales_invoice' AND description LIKE $1", [`%${invoice.invoice_number}%`]);
    }
    await pool.query("DELETE FROM sales_invoice_items WHERE sales_invoice_id = $1", [id]);
    await pool.query("DELETE FROM current_account_transactions WHERE sales_invoice_id = $1", [id]);
    if (invoice.quotation_id || invoice.sale_id) {
      await pool.query("DELETE FROM current_account_transactions WHERE (quotation_id = $1 OR sale_id = $2) AND sales_invoice_id IS NULL", [invoice.quotation_id || null, invoice.sale_id || null]);
    }
    await pool.query("DELETE FROM sales_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);

    res.json({ success: true, message: "Sales invoice deleted successfully" });
  } catch (e: any) {
    console.error("Error in DELETE /sales/:id:", e);
    res.status(400).json({ error: e.message });
  }
});

router.delete("/purchase/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;

    const checkRes = await pool.query("SELECT id, invoice_number FROM purchase_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (checkRes.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
    const invoice = checkRes.rows[0];

    // Adjust stocks back
    const oldItems = await pool.query("SELECT product_id, quantity, system_quantity, variant_id, variant_name FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [id]);
    for (const oldItem of oldItems.rows) {
      if (oldItem.product_id) {
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

    // Clean up related stock movements, current account transactions, and invoice items
    if (invoice.invoice_number) {
      await pool.query("DELETE FROM stock_movements WHERE source = 'purchase_invoice' AND description LIKE $1", [`%${invoice.invoice_number}%`]);
    }
    await pool.query("DELETE FROM current_account_transactions WHERE purchase_invoice_id = $1", [id]);
    await pool.query("DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [id]);
    await pool.query("DELETE FROM purchase_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);

    res.json({ success: true, message: "Purchase invoice deleted successfully" });
  } catch (e: any) {
    console.error("Error in DELETE /purchase/:id:", e);
    res.status(400).json({ error: e.message });
  }
});

router.post("/purchase/:id/status", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
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
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
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
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE purchase_invoices SET payment_status = $1 WHERE id = $2 AND store_id = $3 RETURNING *",
      [status, id, storeId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });

    const invoice = result.rows[0];

    // Resolve company_id if missing
    let compId = invoice.company_id;
    if (!compId && invoice.tax_number) {
      const compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND tax_number = $2 LIMIT 1", [storeId, String(invoice.tax_number).trim()]);
      if (compRes.rows.length > 0) {
        compId = compRes.rows[0].id;
        await pool.query("UPDATE purchase_invoices SET company_id = $1 WHERE id = $2", [compId, id]);
      }
    }
    if (!compId && invoice.supplier_name) {
      const compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2)) LIMIT 1", [storeId, String(invoice.supplier_name).trim()]);
      if (compRes.rows.length > 0) {
        compId = compRes.rows[0].id;
        await pool.query("UPDATE purchase_invoices SET company_id = $1 WHERE id = $2", [compId, id]);
      }
    }

    if (compId) {
      // Remove any existing debt (payment) transaction for this invoice first
      await pool.query(
        "DELETE FROM current_account_transactions WHERE purchase_invoice_id = $1 AND type = 'debt'",
        [id]
      );

      // Ensure credit transaction exists
      const creditRes = await pool.query("SELECT 1 FROM current_account_transactions WHERE purchase_invoice_id = $1 AND type = 'credit'", [id]);
      if (creditRes.rows.length === 0) {
        const storeRes = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
        const store = storeRes.rows[0];
        const branding = store?.branding || {};
        const defaultCurrency = store?.default_currency || branding?.default_currency || 'TRY';

        await pool.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, transaction_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            storeId, compId, id, 'credit', Number(invoice.grand_total || invoice.total_amount || 0),
            invoice.currency || defaultCurrency, invoice.exchange_rate || 1,
            `Alış Faturası: ${invoice.invoice_number}`, invoice.invoice_date || invoice.created_at || new Date()
          ]
        );
      }

      if (status === 'paid') {
        const storeRes = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
        const store = storeRes.rows[0];
        const branding = store?.branding || {};
        const defaultCurrency = store?.default_currency || branding?.default_currency || 'TRY';

        await pool.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            storeId, compId, id, 'debt', Number(invoice.grand_total || invoice.total_amount || 0),
            invoice.currency || defaultCurrency, invoice.exchange_rate || 1,
            `Alış Faturası Ödemesi: ${invoice.invoice_number}${invoice.payment_method ? ` (${invoice.payment_method})` : ''}`,
            invoice.payment_method || 'nakit', new Date()
          ]
        );
      }
    }

    res.json(invoice);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
