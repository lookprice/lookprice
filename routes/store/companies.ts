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
  const { tax_office, tax_number, address, delivery_address, phone, email, contact_person, representative } = req.body;
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

    const result = await pool.query(
      "INSERT INTO companies (store_id, title, tax_office, tax_number, address, delivery_address, phone, email, contact_person, representative) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [storeId, title, tax_office, tax_number, address, delivery_address || null, phone, email, contact_person, representative]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Company
router.put("/:id", async (req: any, res) => {
  const { title, tax_office, tax_number, address, delivery_address, phone, email, contact_person, representative } = req.body;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const existing = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND LOWER(title) = LOWER($2) AND id != $3", [storeId, title, req.params.id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Bu isimde bir cari hesap zaten mevcut." });
    }

    const result = await pool.query(
      "UPDATE companies SET title = $1, tax_office = $2, tax_number = $3, address = $4, delivery_address = $5, phone = $6, email = $7, contact_person = $8, representative = $9 WHERE id = $10 AND store_id = $11 RETURNING *",
      [title, tax_office, tax_number, address, delivery_address || null, phone, email, contact_person, representative, req.params.id, storeId]
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

    let query = `
      SELECT 
        c.*, 
        c.transaction_date,
        s.due_date,
        s.id as sale_id,
        pi.id as purchase_invoice_id,
        pi.invoice_number as purchase_invoice_number,
        si.id as sales_invoice_id,
        si.invoice_number as sales_invoice_number
      FROM current_account_transactions c
      LEFT JOIN sales s ON c.sale_id = s.id
      LEFT JOIN purchase_invoices pi ON c.purchase_invoice_id = pi.id
      LEFT JOIN sales_invoices si ON c.sales_invoice_id = si.id
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
    res.json({
      transactions: result.rows,
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
    let finalDate = new Date();
    if (transaction_date) {
      const providedDate = new Date(transaction_date);
      const now = new Date();
      if (providedDate.toDateString() === now.toDateString()) {
        finalDate = now;
      } else {
        providedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        finalDate = providedDate;
      }
    }

    const result = await pool.query(
      "INSERT INTO current_account_transactions (store_id, company_id, type, amount, description, transaction_date, payment_method, currency, exchange_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [storeId, req.params.id, type, amount, description, finalDate, payment_method, currency || branding?.default_currency || 'TRY', exchange_rate || 1]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Company Transaction
router.put("/:companyId/transactions/:id", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  const { companyId, id } = req.params;
  const { type, amount, description, transaction_date, payment_method, currency, exchange_rate } = req.body;

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
    const newAmount = amount !== undefined && amount !== null && amount !== "" ? Number(String(amount).replace(',', '.')) : currentTx.amount;
    const newDescription = description !== undefined ? description : currentTx.description;
    const newPaymentMethod = payment_method !== undefined ? payment_method : currentTx.payment_method;
    const newCurrency = currency !== undefined ? currency : currentTx.currency;
    const newExchangeRate = exchange_rate !== undefined && exchange_rate !== null && exchange_rate !== "" ? Number(String(exchange_rate).replace(',', '.')) : currentTx.exchange_rate;
    let newDate = currentTx.transaction_date;
    if (transaction_date) {
      newDate = new Date(transaction_date);
    }

    const updateRes = await pool.query(
      `UPDATE current_account_transactions 
       SET type = $1, amount = $2, description = $3, transaction_date = $4, payment_method = $5, currency = $6, exchange_rate = $7
       WHERE id = $8 AND company_id = $9
       RETURNING *`,
      [newType, newAmount, newDescription, newDate, newPaymentMethod, newCurrency, newExchangeRate, id, companyId]
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
