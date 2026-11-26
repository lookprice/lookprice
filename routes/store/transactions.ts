import express from "express";
import { pool } from "../../models/db";
import { getAuthorizedStoreId } from "../../middleware/auth";
import {
  ensureTreasurySchema,
  syncCompanyTransactionTreasury,
  deletePortfolioTxForSource,
  deleteCheckNoteForSource
} from "./treasurySync";

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
  await ensureTreasurySchema(pool);
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
  const { id } = req.params;
  const { 
    type, amount, description, transaction_date, payment_method, currency, exchange_rate, company_id,
    cross_currency, cross_rate, cross_amount,
    financial_account_id, financial_account_name,
    check_note_no, check_due_date, check_instrument_type, check_bank_name
  } = req.body;

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
    if (Number(newCompanyId) !== Number(currentTx.company_id)) {
      const targetComp = await pool.query("SELECT id, store_id FROM companies WHERE id = $1 LIMIT 1", [newCompanyId]);
      if (targetComp.rows.length === 0) {
        return res.status(404).json({ error: "Hedef cari hesap bulunamadı" });
      }
      if (req.user.role !== "superadmin" && Number(targetComp.rows[0].store_id) !== Number(storeId)) {
        return res.status(403).json({ error: "Hedef cari hesaba erişim yetkiniz yok" });
      }
    }
    
    const parsedCrossRate = cleanNumber(cross_rate);
    const newCrossRate = parsedCrossRate !== null ? parsedCrossRate : (cross_rate === null || cross_rate === '' ? null : currentTx.cross_rate);
    const parsedCrossAmount = cleanNumber(cross_amount);
    const newCrossAmount = parsedCrossAmount !== null ? parsedCrossAmount : (cross_amount === null || cross_amount === '' ? null : currentTx.cross_amount);
    const newCrossCurrency = cross_currency !== undefined ? (cross_currency ? String(cross_currency).toUpperCase() : null) : currentTx.cross_currency;

    let newDate = currentTx.transaction_date;
    if (transaction_date) {
      const d = new Date(transaction_date);
      if (!isNaN(d.getTime())) {
        newDate = d;
      }
    }

    const updateRes = await pool.query(
      `UPDATE current_account_transactions 
       SET type = $1, amount = $2, description = $3, transaction_date = $4, payment_method = $5, currency = $6, exchange_rate = $7, company_id = $8,
           cross_currency = $9, cross_rate = $10, cross_amount = $11
       WHERE id = $12
       RETURNING *`,
      [newType, newAmount, newDescription, newDate, newPaymentMethod, newCurrency, newExchangeRate, newCompanyId, newCrossCurrency, newCrossRate, newCrossAmount, id]
    );

    let updatedTx = updateRes.rows[0];
    const effectiveStoreId = Number(updatedTx.store_id || storeId);
    const treasuryRes = await syncCompanyTransactionTreasury(pool, {
      storeId: effectiveStoreId,
      transactionId: Number(updatedTx.id),
      companyId: Number(newCompanyId),
      type: newType === 'debt' ? 'debt' : 'credit',
      amount: Number(newAmount),
      currency: newCurrency || 'TRY',
      exchangeRate: Number(newExchangeRate || 1),
      crossCurrency: newCrossCurrency,
      crossRate: newCrossRate,
      crossAmount: newCrossAmount,
      paymentMethod: newPaymentMethod,
      description: newDescription,
      transactionDate: newDate,
      purchaseInvoiceId: updatedTx.purchase_invoice_id || null,
      salesInvoiceId: updatedTx.sales_invoice_id || null,
      financialAccountId: financial_account_id !== undefined ? (financial_account_id ? Number(financial_account_id) : null) : currentTx.financial_account_id,
      financialAccountName: financial_account_name !== undefined ? financial_account_name : currentTx.financial_account_name,
      checkNoteNo: check_note_no || null,
      checkDueDate: check_due_date || null,
      checkInstrumentType: check_instrument_type || null,
      checkBankName: check_bank_name || null
    });

    if (!updatedTx.purchase_invoice_id && !updatedTx.sales_invoice_id) {
      const finalUpd = await pool.query(
        `UPDATE current_account_transactions
         SET financial_account_id = $1, financial_account_name = $2, check_note_id = $3
         WHERE id = $4 RETURNING *`,
        [treasuryRes.financialAccountId, treasuryRes.financialAccountName, treasuryRes.checkNoteId, updatedTx.id]
      );
      if (finalUpd.rows.length > 0) updatedTx = finalUpd.rows[0];
    }

    res.json({ success: true, transaction: updatedTx, message: "İşlem başarıyla güncellendi" });
  } catch (err: any) {
    console.error("Error updating transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/store/transactions/:id - Alias to PUT
router.patch("/:id", async (req: any, res) => {
  await ensureTreasurySchema(pool);
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
  const { id } = req.params;
  const { 
    type, amount, description, transaction_date, payment_method, currency, exchange_rate, company_id,
    cross_currency, cross_rate, cross_amount,
    financial_account_id, financial_account_name,
    check_note_no, check_due_date, check_instrument_type, check_bank_name
  } = req.body;

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
    if (Number(newCompanyId) !== Number(currentTx.company_id)) {
      const targetComp = await pool.query("SELECT id, store_id FROM companies WHERE id = $1 LIMIT 1", [newCompanyId]);
      if (targetComp.rows.length === 0) {
        return res.status(404).json({ error: "Hedef cari hesap bulunamadı" });
      }
      if (req.user.role !== "superadmin" && Number(targetComp.rows[0].store_id) !== Number(storeId)) {
        return res.status(403).json({ error: "Hedef cari hesaba erişim yetkiniz yok" });
      }
    }

    const parsedCrossRate = cleanNumber(cross_rate);
    const newCrossRate = parsedCrossRate !== null ? parsedCrossRate : (cross_rate === null || cross_rate === '' ? null : currentTx.cross_rate);
    const parsedCrossAmount = cleanNumber(cross_amount);
    const newCrossAmount = parsedCrossAmount !== null ? parsedCrossAmount : (cross_amount === null || cross_amount === '' ? null : currentTx.cross_amount);
    const newCrossCurrency = cross_currency !== undefined ? (cross_currency ? String(cross_currency).toUpperCase() : null) : currentTx.cross_currency;

    let newDate = currentTx.transaction_date;
    if (transaction_date) {
      const d = new Date(transaction_date);
      if (!isNaN(d.getTime())) {
        newDate = d;
      }
    }

    const updateRes = await pool.query(
      `UPDATE current_account_transactions 
       SET type = $1, amount = $2, description = $3, transaction_date = $4, payment_method = $5, currency = $6, exchange_rate = $7, company_id = $8,
           cross_currency = $9, cross_rate = $10, cross_amount = $11
       WHERE id = $12
       RETURNING *`,
      [newType, newAmount, newDescription, newDate, newPaymentMethod, newCurrency, newExchangeRate, newCompanyId, newCrossCurrency, newCrossRate, newCrossAmount, id]
    );

    let updatedTx = updateRes.rows[0];
    const effectiveStoreId = Number(updatedTx.store_id || storeId);
    const treasuryRes = await syncCompanyTransactionTreasury(pool, {
      storeId: effectiveStoreId,
      transactionId: Number(updatedTx.id),
      companyId: Number(newCompanyId),
      type: newType === 'debt' ? 'debt' : 'credit',
      amount: Number(newAmount),
      currency: newCurrency || 'TRY',
      exchangeRate: Number(newExchangeRate || 1),
      crossCurrency: newCrossCurrency,
      crossRate: newCrossRate,
      crossAmount: newCrossAmount,
      paymentMethod: newPaymentMethod,
      description: newDescription,
      transactionDate: newDate,
      purchaseInvoiceId: updatedTx.purchase_invoice_id || null,
      salesInvoiceId: updatedTx.sales_invoice_id || null,
      financialAccountId: financial_account_id !== undefined ? (financial_account_id ? Number(financial_account_id) : null) : currentTx.financial_account_id,
      financialAccountName: financial_account_name !== undefined ? financial_account_name : currentTx.financial_account_name,
      checkNoteNo: check_note_no || null,
      checkDueDate: check_due_date || null,
      checkInstrumentType: check_instrument_type || null,
      checkBankName: check_bank_name || null
    });

    if (!updatedTx.purchase_invoice_id && !updatedTx.sales_invoice_id) {
      const finalUpd = await pool.query(
        `UPDATE current_account_transactions
         SET financial_account_id = $1, financial_account_name = $2, check_note_id = $3
         WHERE id = $4 RETURNING *`,
        [treasuryRes.financialAccountId, treasuryRes.financialAccountName, treasuryRes.checkNoteId, updatedTx.id]
      );
      if (finalUpd.rows.length > 0) updatedTx = finalUpd.rows[0];
    }

    res.json({ success: true, transaction: updatedTx, message: "İşlem başarıyla güncellendi" });
  } catch (err: any) {
    console.error("Error updating transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/store/transactions/:id - Delete transaction
router.delete("/:id", async (req: any, res) => {
  await ensureTreasurySchema(pool);
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

    const deletedRow = result.rows[0];
    const effectiveStoreId = Number(deletedRow.store_id || storeId);
    if (effectiveStoreId) {
      await deletePortfolioTxForSource(pool, effectiveStoreId, 'company_transaction', Number(deletedRow.id));
      await deleteCheckNoteForSource(pool, effectiveStoreId, 'company_transaction', Number(deletedRow.id));
    }

    res.json({ success: true, message: "İşlem başarıyla silindi", deleted: deletedRow });
  } catch (err: any) {
    console.error("Error deleting transaction:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
