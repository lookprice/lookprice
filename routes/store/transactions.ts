import express from "express";
import { pool } from "../../models/db";
import { getAuthorizedStoreId } from "../../middleware/auth";

const router = express.Router();

// GET /api/store/transactions/:id - Fetch single transaction
router.get("/:id", async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId);
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM current_account_transactions WHERE id = $1 AND (store_id = $2 OR store_id IS NULL)",
      [id, storeId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "İşlem bulunamadı" });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error("Error fetching transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// Helper to parse localized/formatted numbers safely
function cleanNumber(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const s = String(val).trim().replace(/\s/g, '');
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      return parseFloat(s.replace(/\./g, '').replace(',', '.')) || null;
    } else {
      return parseFloat(s.replace(/,/g, '')) || null;
    }
  }
  if (s.includes(',')) {
    return parseFloat(s.replace(',', '.')) || null;
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// PUT /api/store/transactions/:id - Update transaction
router.put("/:id", async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
  const { id } = req.params;
  const { type, amount, description, transaction_date, payment_method, currency, exchange_rate, company_id } = req.body;

  try {
    let checkQuery = "SELECT * FROM current_account_transactions WHERE id = $1";
    let checkParams: any[] = [id];
    if (req.user.role !== "superadmin") {
      checkQuery += " AND (store_id = $2 OR store_id IS NULL)";
      checkParams.push(storeId);
    }
    const checkRes = await pool.query(checkQuery, checkParams);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "İşlem bulunamadı" });
    }

    const currentTx = checkRes.rows[0];
    const newType = type || currentTx.type;
    const parsedAmount = cleanNumber(amount);
    const newAmount = parsedAmount !== null ? parsedAmount : currentTx.amount;
    const newDescription = description !== undefined ? description : currentTx.description;
    const newPaymentMethod = payment_method !== undefined ? payment_method : currentTx.payment_method;
    const newCurrency = currency !== undefined ? currency : currentTx.currency;
    const parsedExchangeRate = cleanNumber(exchange_rate);
    const newExchangeRate = parsedExchangeRate !== null ? parsedExchangeRate : currentTx.exchange_rate;
    const newCompanyId = (company_id !== undefined && company_id !== null && company_id !== '') ? Number(company_id) : currentTx.company_id;
    
    let newDate = currentTx.transaction_date;
    if (transaction_date) {
      const d = new Date(transaction_date);
      if (!isNaN(d.getTime())) {
        newDate = d;
      }
    }

    const updateRes = await pool.query(
      `UPDATE current_account_transactions 
       SET type = $1, amount = $2, description = $3, transaction_date = $4, payment_method = $5, currency = $6, exchange_rate = $7, company_id = $8
       WHERE id = $9
       RETURNING *`,
      [newType, newAmount, newDescription, newDate, newPaymentMethod, newCurrency, newExchangeRate, newCompanyId, id]
    );

    res.json({ success: true, transaction: updateRes.rows[0], message: "İşlem başarıyla güncellendi" });
  } catch (err: any) {
    console.error("Error updating transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/store/transactions/:id - Alias to PUT
router.patch("/:id", async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
  const { id } = req.params;
  const { type, amount, description, transaction_date, payment_method, currency, exchange_rate, company_id } = req.body;

  try {
    let checkQuery = "SELECT * FROM current_account_transactions WHERE id = $1";
    let checkParams: any[] = [id];
    if (req.user.role !== "superadmin") {
      checkQuery += " AND (store_id = $2 OR store_id IS NULL)";
      checkParams.push(storeId);
    }
    const checkRes = await pool.query(checkQuery, checkParams);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "İşlem bulunamadı" });
    }

    const currentTx = checkRes.rows[0];
    const newType = type || currentTx.type;
    const parsedAmount = cleanNumber(amount);
    const newAmount = parsedAmount !== null ? parsedAmount : currentTx.amount;
    const newDescription = description !== undefined ? description : currentTx.description;
    const newPaymentMethod = payment_method !== undefined ? payment_method : currentTx.payment_method;
    const newCurrency = currency !== undefined ? currency : currentTx.currency;
    const parsedExchangeRate = cleanNumber(exchange_rate);
    const newExchangeRate = parsedExchangeRate !== null ? parsedExchangeRate : currentTx.exchange_rate;
    const newCompanyId = (company_id !== undefined && company_id !== null && company_id !== '') ? Number(company_id) : currentTx.company_id;

    let newDate = currentTx.transaction_date;
    if (transaction_date) {
      const d = new Date(transaction_date);
      if (!isNaN(d.getTime())) {
        newDate = d;
      }
    }

    const updateRes = await pool.query(
      `UPDATE current_account_transactions 
       SET type = $1, amount = $2, description = $3, transaction_date = $4, payment_method = $5, currency = $6, exchange_rate = $7, company_id = $8
       WHERE id = $9
       RETURNING *`,
      [newType, newAmount, newDescription, newDate, newPaymentMethod, newCurrency, newExchangeRate, newCompanyId, id]
    );

    res.json({ success: true, transaction: updateRes.rows[0], message: "İşlem başarıyla güncellendi" });
  } catch (err: any) {
    console.error("Error updating transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/store/transactions/:id - Delete transaction
router.delete("/:id", async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId);
  const { id } = req.params;

  try {
    let deleteQuery = "DELETE FROM current_account_transactions WHERE id = $1";
    let deleteParams: any[] = [id];
    if (req.user.role !== "superadmin") {
      deleteQuery += " AND (store_id = $2 OR store_id IS NULL)";
      deleteParams.push(storeId);
    }
    deleteQuery += " RETURNING *";

    const result = await pool.query(deleteQuery, deleteParams);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "İşlem bulunamadı veya silinemedi" });
    }

    res.json({ success: true, message: "İşlem başarıyla silindi", deleted: result.rows[0] });
  } catch (err: any) {
    console.error("Error deleting transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
