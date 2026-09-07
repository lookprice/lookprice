import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

// GET /api/store/transactions/:id - Fetch single transaction
router.get("/:id", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
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

// PUT /api/store/transactions/:id - Update transaction
router.put("/:id", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  const { id } = req.params;
  const { type, amount, description, transaction_date, payment_method, currency, exchange_rate } = req.body;

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
       WHERE id = $8
       RETURNING *`,
      [newType, newAmount, newDescription, newDate, newPaymentMethod, newCurrency, newExchangeRate, id]
    );

    res.json({ success: true, transaction: updateRes.rows[0], message: "İşlem başarıyla güncellendi" });
  } catch (err: any) {
    console.error("Error updating transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/store/transactions/:id - Alias to PUT
router.patch("/:id", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  const { id } = req.params;
  const { type, amount, description, transaction_date, payment_method, currency, exchange_rate } = req.body;

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
       WHERE id = $8
       RETURNING *`,
      [newType, newAmount, newDescription, newDate, newPaymentMethod, newCurrency, newExchangeRate, id]
    );

    res.json({ success: true, transaction: updateRes.rows[0], message: "İşlem başarıyla güncellendi" });
  } catch (err: any) {
    console.error("Error updating transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/store/transactions/:id - Delete transaction
router.delete("/:id", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
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
