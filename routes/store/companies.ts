import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

// Get All Companies
router.get("/", async (req: any, res) => {
  try {
    let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
    
    const result = await pool.query(
      `SELECT 
        c.*,
        COALESCE(
          (
            SELECT json_object_agg(currency, bal)
            FROM (
              SELECT COALESCE(currency, 'TRY') as currency, SUM(CASE WHEN type = 'debt' THEN amount ELSE -amount END) as bal
              FROM current_account_transactions
              WHERE company_id = c.id
              GROUP BY COALESCE(currency, 'TRY')
            ) sub
          ), 
          '{}'::json
        ) as balances
      FROM companies c
      WHERE c.store_id = $1
      ORDER BY c.title ASC`,
      [storeId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Company
router.post("/", async (req: any, res) => {
  const { tax_office, tax_number, address, delivery_address, phone, email, contact_person, representative, is_expense, expense_category, expense_center } = req.body;
  const title = String(req.body.title || "").trim();
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    // Check limit
    const limitRes = await pool.query("SELECT max_customers FROM stores WHERE id = $1", [storeId]);
    const maxCustomers = Math.max(limitRes.rows[0]?.max_customers ?? 50, 5000);
    const currentCountRes = await pool.query("SELECT COUNT(*)::INT as count FROM companies WHERE store_id = $1", [storeId]);
    const currentCount = currentCountRes.rows[0].count;
    if (currentCount >= maxCustomers) {
      return res.status(400).json({ error: `Cari hesap limitine (${maxCustomers}) ulaşıldı. Lütfen limitlerinizi yükseltin.` });
    }

    const existing = await pool.query("SELECT * FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER($2)", [storeId, title]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Bu isimde bir cari hesap zaten mevcut." });
    }

    const finalIsExpense = is_expense === true || is_expense === 'true';
    const result = await pool.query(
      "INSERT INTO companies (store_id, title, tax_office, tax_number, address, delivery_address, phone, email, contact_person, representative, is_expense, expense_category, expense_center) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *",
      [storeId, title, tax_office, tax_number, address, delivery_address || null, phone, email, contact_person, representative, finalIsExpense, expense_category || null, expense_center || null]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Company
router.put("/:id", async (req: any, res) => {
  const { title, tax_office, tax_number, address, delivery_address, phone, email, contact_person, representative, is_expense, expense_category, expense_center } = req.body;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const existing = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND LOWER(title) = LOWER($2) AND id != $3", [storeId, title, req.params.id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Bu isimde bir cari hesap zaten mevcut." });
    }

    const finalIsExpense = is_expense === true || is_expense === 'true';
    const result = await pool.query(
      "UPDATE companies SET title = $1, tax_office = $2, tax_number = $3, address = $4, delivery_address = $5, phone = $6, email = $7, contact_person = $8, representative = $9, is_expense = $10, expense_category = $11, expense_center = $12 WHERE id = $13 AND store_id = $14 RETURNING *",
      [title, tax_office, tax_number, address, delivery_address || null, phone, email, contact_person, representative, finalIsExpense, expense_category || null, expense_center || null, req.params.id, storeId]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Company
router.delete("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    await pool.query("DELETE FROM companies WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Company Transactions
router.get("/:id/transactions", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  
  const { startDate, endDate } = req.query;
  
  try {
    let openingBalances: Record<string, number> = {};
    if (startDate && startDate !== "") {
      const obQuery = `
        SELECT currency, COALESCE(SUM(CASE WHEN type = 'debt' THEN amount ELSE -amount END), 0)::FLOAT as balance
        FROM current_account_transactions
        WHERE company_id = $1 AND (store_id = $2 OR store_id IS NULL) AND transaction_date < $3
        GROUP BY currency
      `;
      const obResult = await pool.query(obQuery, [req.params.id, storeId, startDate]);
      obResult.rows.forEach(row => {
        openingBalances[row.currency || 'TRY'] = row.balance;
      });
    }

    // Fetch store currency rates for fallback when currency is non-TRY
    let storeRates: Record<string, number> = { USD: 34.50, EUR: 37.80, GBP: 45.20 };
    if (storeId) {
      try {
        const storeRes = await pool.query("SELECT currency_rates, branding FROM stores WHERE id = $1", [storeId]);
        if (storeRes.rows.length > 0) {
          const row = storeRes.rows[0];
          const rates = row.currency_rates || row.branding?.currency_rates || {};
          if (typeof rates === 'object' && rates !== null) {
            Object.keys(rates).forEach(k => {
              const val = parseFloat(rates[k]);
              if (!isNaN(val) && val > 0) storeRates[k.toUpperCase()] = val;
            });
          }
        }
      } catch (e) {
        console.error("Error fetching store rates in transactions:", e);
      }
    }

    let query = `
      SELECT 
        c.*, 
        c.transaction_date,
        s.due_date,
        s.id as sale_id,
        COALESCE(pi.id, pi_fallback.id) as purchase_invoice_id,
        COALESCE(
          NULLIF(pi.invoice_number, ''), 
          NULLIF(pi.document_number, ''),
          NULLIF(pi_fallback.invoice_number, ''),
          NULLIF(pi_fallback.document_number, '')
        ) as purchase_invoice_number,
        COALESCE(NULLIF(pi.exchange_rate, 1), NULLIF(pi_fallback.exchange_rate, 1)) as pi_exchange_rate,
        COALESCE(pi.currency, pi_fallback.currency) as pi_currency,
        COALESCE(si.id, si_fallback.id) as sales_invoice_id,
        COALESCE(
          NULLIF(si.invoice_number, ''), 
          NULLIF(si.document_number, ''),
          NULLIF(si_fallback.invoice_number, ''),
          NULLIF(si_fallback.document_number, '')
        ) as sales_invoice_number,
        COALESCE(NULLIF(si.exchange_rate, 1), NULLIF(si_fallback.exchange_rate, 1)) as si_exchange_rate,
        COALESCE(si.currency, si_fallback.currency) as si_currency
      FROM current_account_transactions c
      LEFT JOIN sales s ON c.sale_id = s.id
      LEFT JOIN purchase_invoices pi ON c.purchase_invoice_id = pi.id
      LEFT JOIN sales_invoices si ON c.sales_invoice_id = si.id
      LEFT JOIN LATERAL (
        SELECT id, invoice_number, document_number, exchange_rate, currency
        FROM sales_invoices si_m
        WHERE si_m.company_id = c.company_id
          AND (
            (c.sale_id IS NOT NULL AND si_m.sale_id = c.sale_id)
            OR (
              c.sales_invoice_id IS NULL 
              AND c.purchase_invoice_id IS NULL
              AND ABS(COALESCE(NULLIF(si_m.grand_total, 0), si_m.total_amount, 0) - c.amount) < 0.5
            )
          )
        ORDER BY ABS(EXTRACT(EPOCH FROM (COALESCE(si_m.invoice_date::timestamp, si_m.created_at) - c.transaction_date))) ASC, id DESC
        LIMIT 1
      ) si_fallback ON c.sales_invoice_id IS NULL
      LEFT JOIN LATERAL (
        SELECT id, invoice_number, document_number, exchange_rate, currency
        FROM purchase_invoices pi_m
        WHERE pi_m.company_id = c.company_id
          AND c.purchase_invoice_id IS NULL
          AND c.sales_invoice_id IS NULL
          AND ABS(COALESCE(NULLIF(pi_m.grand_total, 0), pi_m.total_amount, 0) - c.amount) < 0.5
        ORDER BY ABS(EXTRACT(EPOCH FROM (COALESCE(pi_m.invoice_date::timestamp, pi_m.created_at) - c.transaction_date))) ASC, id DESC
        LIMIT 1
      ) pi_fallback ON c.purchase_invoice_id IS NULL
      WHERE c.company_id = $1 AND (c.store_id = $2 OR c.store_id IS NULL)
    `;
    
    const params: any[] = [req.params.id, storeId];
    
    if (startDate && startDate !== "") {
      params.push(startDate);
      query += ` AND c.transaction_date >= $${params.length}`;
    }
    
    if (endDate && endDate !== "") {
      params.push(`${endDate} 23:59:59`);
      query += ` AND c.transaction_date <= $${params.length}`;
    }
    
    query += " ORDER BY c.transaction_date ASC, c.id ASC";
    
    const result = await pool.query(query, params);
    const enrichedTransactions = result.rows.map(row => {
      let invNo = row.sales_invoice_number || row.purchase_invoice_number || '';
      let desc = (row.description || '').trim();

      // If invNo is still empty, extract invoice/document number from description
      if (!invNo) {
        const matchBracket = desc.match(/\[(?:Belge|Evrak|Ref|Dekont|Fatura):\s*([^\]]+)\]/i);
        if (matchBracket) {
          invNo = matchBracket[1].trim();
        } else {
          const matchPrefix = desc.match(/(?:Satış Faturası|Alış Faturası|Fatura|Belge|Evrak|E-Fatura|E-Arşiv)(?:\s+(?:Tahsilatı|Ödemesi))?[\s:]+([A-Z0-9\-_/]{3,})/i);
          if (matchPrefix) {
            invNo = matchPrefix[1].trim();
          } else {
            const matchCode = desc.match(/\b(GIB\d{10,16}|EAR\d{10,16}|SAT-\d+|ALI-\d+|FT-\d+|INV-\d+|\d{4}-\d{3,8})\b/i);
            if (matchCode) {
              invNo = matchCode[1].trim();
            }
          }
        }
      }

      if (!invNo && row.sale_id) {
        invNo = `POS #${row.sale_id}`;
      }

      // Clean duplicate invoice numbers from description string to prevent repeating same info
      if (invNo && invNo !== '-') {
        const safeInvNo = invNo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        desc = desc.replace(new RegExp(`^Satış Faturası:\\s*${safeInvNo}\\s*[-:]?\\s*`, 'i'), 'Satış Faturası');
        desc = desc.replace(new RegExp(`^Alış Faturası:\\s*${safeInvNo}\\s*[-:]?\\s*`, 'i'), 'Alış Faturası');
        desc = desc.replace(new RegExp(`^Satış Faturası Tahsilatı:\\s*${safeInvNo}\\s*`, 'i'), 'Satış Faturası Tahsilatı ');
        desc = desc.replace(new RegExp(`^Alış Faturası Ödemesi:\\s*${safeInvNo}\\s*`, 'i'), 'Alış Faturası Ödemesi ');
        desc = desc.replace(new RegExp(`[:\\s-]*${safeInvNo}`, 'gi'), '');
        desc = desc.replace(/\[(?:Belge|Evrak|Ref|Dekont|Fatura):\s*[^\]]+\]/gi, '');
        desc = desc.replace(/[:\-]+$/, '').trim();
      }

      if (!desc) {
        if (row.sales_invoice_id || row.sales_invoice_number) desc = 'Satış Faturası';
        else if (row.purchase_invoice_id || row.purchase_invoice_number) desc = 'Alış Faturası';
        else if (row.sale_id) desc = 'POS Satışı';
        else desc = row.type === 'debt' ? 'Borç Hareketi' : 'Alacak Hareketi';
      }

      // Currency and Exchange Rate Consolidation
      const curr = (row.currency || row.si_currency || row.pi_currency || 'TRY').toUpperCase();
      let rate = Number(row.exchange_rate || row.si_exchange_rate || row.pi_exchange_rate || 0);
      if (isNaN(rate) || rate <= 0 || (curr !== 'TRY' && rate === 1)) {
        if (curr !== 'TRY' && storeRates[curr]) {
          rate = storeRates[curr];
        } else {
          rate = 1;
        }
      }

      return {
        ...row,
        invoice_number: invNo || '-',
        description: desc,
        currency: curr,
        exchange_rate: rate
      };
    });

    res.json({
      transactions: enrichedTransactions,
      opening_balances: openingBalances
    });
  } catch (err: any) {
    console.error("Error fetching company transactions:", err);
    res.status(500).json({ error: err.message, transactions: [], opening_balances: {} });
  }
});

// Create Company Transaction
router.post("/:id/transactions", async (req: any, res) => {
  const { type, amount, description, transaction_date, payment_method, currency, exchange_rate } = req.body;
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  
  try {
    const storeRes = await pool.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
    const branding = storeRes.rows[0]?.branding || {};
    
    // Clean parse amount
    let cleanAmount = 0;
    if (amount !== undefined && amount !== null && amount !== '') {
      if (typeof amount === 'number') {
        cleanAmount = isNaN(amount) ? 0 : amount;
      } else {
        const s = String(amount).trim().replace(/\s/g, '');
        if (s.includes(',') && s.includes('.')) {
          cleanAmount = s.lastIndexOf(',') > s.lastIndexOf('.') ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s.replace(/,/g, ''));
        } else if (s.includes(',')) {
          cleanAmount = parseFloat(s.replace(',', '.'));
        } else {
          cleanAmount = parseFloat(s);
        }
      }
    }
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      return res.status(400).json({ error: "Geçerli bir işlem tutarı girilmelidir." });
    }

    let cleanExchangeRate = 1;
    if (exchange_rate !== undefined && exchange_rate !== null && exchange_rate !== '') {
      const s = String(exchange_rate).trim().replace(/\s/g, '').replace(',', '.');
      const pr = parseFloat(s);
      if (!isNaN(pr) && pr > 0) cleanExchangeRate = pr;
    }

    let finalDate = new Date();
    if (transaction_date) {
      const providedDate = new Date(transaction_date);
      if (!isNaN(providedDate.getTime())) {
        const now = new Date();
        if (providedDate.toDateString() === now.toDateString()) {
          finalDate = now;
        } else {
          providedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
          finalDate = providedDate;
        }
      }
    }

    const finalCurrency = (currency || branding?.default_currency || 'TRY').toUpperCase();
    const finalType = type === 'debt' ? 'debt' : 'credit';
    const finalPaymentMethod = payment_method || 'cash';

    const result = await pool.query(
      "INSERT INTO current_account_transactions (store_id, company_id, type, amount, description, transaction_date, payment_method, currency, exchange_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [storeId, req.params.id, finalType, cleanAmount, description || '', finalDate, finalPaymentMethod, finalCurrency, cleanExchangeRate]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Error creating company transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update Company Transaction
router.put("/:companyId/transactions/:id", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  const { companyId, id } = req.params;
  const { type, amount, description, transaction_date, payment_method, currency, exchange_rate, new_company_id } = req.body;

  try {
    let checkQuery = "SELECT * FROM current_account_transactions WHERE id = $1 AND company_id = $2";
    let checkParams: any[] = [id, companyId];
    if (req.user.role !== "superadmin") {
      checkQuery += " AND (store_id = $3 OR store_id IS NULL)";
      checkParams.push(storeId);
    }
    const checkRes = await pool.query(checkQuery, checkParams);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "İşlem bulunamadı" });
    }

    const currentTx = checkRes.rows[0];
    const newType = type || currentTx.type;
    
    // Clean parse amount
    let newAmount = currentTx.amount;
    if (amount !== undefined && amount !== null && amount !== "") {
      const s = String(amount).trim().replace(/\s/g, '');
      if (s.includes(',') && s.includes('.')) {
        newAmount = s.lastIndexOf(',') > s.lastIndexOf('.') ? parseFloat(s.replace(/\./g, '').replace(',', '.')) : parseFloat(s.replace(/,/g, ''));
      } else if (s.includes(',')) {
        newAmount = parseFloat(s.replace(',', '.'));
      } else {
        newAmount = parseFloat(s);
      }
      if (isNaN(newAmount)) newAmount = currentTx.amount;
    }

    const newDescription = description !== undefined ? description : currentTx.description;
    const newPaymentMethod = payment_method !== undefined ? payment_method : currentTx.payment_method;
    const newCurrency = currency !== undefined ? currency : currentTx.currency;
    
    let newExchangeRate = currentTx.exchange_rate;
    if (exchange_rate !== undefined && exchange_rate !== null && exchange_rate !== "") {
      const s = String(exchange_rate).trim().replace(/\s/g, '').replace(',', '.');
      const parsedRate = parseFloat(s);
      if (!isNaN(parsedRate)) newExchangeRate = parsedRate;
    }

    const targetCompanyId = (new_company_id !== undefined && new_company_id !== null && new_company_id !== '') ? Number(new_company_id) : companyId;

    let newDate = currentTx.transaction_date;
    if (transaction_date) {
      const d = new Date(transaction_date);
      if (!isNaN(d.getTime())) newDate = d;
    }

    const updateRes = await pool.query(
      `UPDATE current_account_transactions 
       SET type = $1, amount = $2, description = $3, transaction_date = $4, payment_method = $5, currency = $6, exchange_rate = $7, company_id = $8
       WHERE id = $9
       RETURNING *`,
      [newType, newAmount, newDescription, newDate, newPaymentMethod, newCurrency, newExchangeRate, targetCompanyId, id]
    );

    res.json({ success: true, transaction: updateRes.rows[0] });
  } catch (err: any) {
    console.error("Error updating company transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Company Transaction
router.delete("/:companyId/transactions/:id", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  try {
    let deleteQuery = "DELETE FROM current_account_transactions WHERE id = $1 AND company_id = $2";
    let deleteParams: any[] = [req.params.id, req.params.companyId];
    if (req.user.role !== "superadmin") {
      deleteQuery += " AND (store_id = $3 OR store_id IS NULL)";
      deleteParams.push(storeId);
    }
    deleteQuery += " RETURNING *";

    const result = await pool.query(deleteQuery, deleteParams);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "İşlem bulunamadı veya silinemedi" });
    }
    res.json({ success: true, message: "İşlem başarıyla silindi", deleted: result.rows[0] });
  } catch (err: any) {
    console.error("Error deleting company transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
