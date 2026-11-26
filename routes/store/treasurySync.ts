import { Pool, PoolClient } from "pg";
import { pool } from "../../models/db";

type DbConn = Pool | PoolClient;

let treasurySchemaReady = false;

export const NON_PAID_METHODS = new Set([
  "",
  "term",
  "open_account",
  "open",
  "unpaid",
  "vadeli",
  "acik_hesap",
  "acik hesap",
  "açık hesap",
  "açık hesap-cari",
  "cari",
]);

export function normalizePaymentToken(val?: any): string {
  if (val === undefined || val === null) return "";
  return String(val).trim().toLocaleLowerCase("tr-TR");
}

export function isTermOrUnpaidMethod(method?: any): boolean {
  const token = normalizePaymentToken(method);
  return NON_PAID_METHODS.has(token);
}

export function isCheckPromissoryMethod(method?: any): boolean {
  const token = normalizePaymentToken(method);
  return (
    token === "check_promissory" ||
    token === "check" ||
    token === "promissory_note" ||
    token === "cek" ||
    token === "çek" ||
    token === "senet" ||
    token === "çek/senet" ||
    token === "cek_senet"
  );
}

export function isCancelledOrDraftStatus(status?: any): boolean {
  const token = normalizePaymentToken(status);
  return (
    token === "draft" ||
    token === "taslak" ||
    token === "cancelled" ||
    token === "canceled" ||
    token === "iptal" ||
    token === "iptal edildi"
  );
}

export function isSettlementPaid(
  paymentMethod?: any,
  paymentStatus?: any,
  docStatus?: any
): boolean {
  if (isCancelledOrDraftStatus(docStatus)) return false;

  const methodToken = normalizePaymentToken(paymentMethod);
  const statusToken = normalizePaymentToken(paymentStatus);

  // Explicit term / open-account method ALWAYS overrides any stale payment_status='paid'
  if (methodToken && NON_PAID_METHODS.has(methodToken)) {
    return false;
  }

  // Concrete payment methods imply paid settlement
  if (
    methodToken &&
    (methodToken === "cash" ||
      methodToken === "nakit" ||
      methodToken === "bank" ||
      methodToken === "bank_transfer" ||
      methodToken === "havale" ||
      methodToken === "eft" ||
      methodToken === "fast" ||
      methodToken === "credit_card" ||
      methodToken === "kredi_karti" ||
      methodToken === "kredi kartı" ||
      methodToken === "pos" ||
      isCheckPromissoryMethod(methodToken))
  ) {
    return true;
  }

  if (statusToken === "paid" || statusToken === "odendi" || statusToken === "ödendi") {
    return true;
  }

  return false;
}

export function mapTreasuryMethod(
  paymentMethod?: any
): "cash" | "bank_transfer" | "credit_card" | "check_promissory" {
  const token = normalizePaymentToken(paymentMethod);
  if (isCheckPromissoryMethod(token)) return "check_promissory";
  if (
    token === "credit_card" ||
    token === "kredi_karti" ||
    token === "kredi kartı" ||
    token === "pos"
  ) {
    return "credit_card";
  }
  if (
    token === "bank" ||
    token === "bank_transfer" ||
    token === "havale" ||
    token === "eft" ||
    token === "fast"
  ) {
    return "bank_transfer";
  }
  return "cash";
}

export async function ensureTreasurySchema(db: DbConn = pool) {
  if (treasurySchemaReady && db === pool) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS portfolio_transactions (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        currency TEXT NOT NULL DEFAULT 'TRY',
        date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        property_id INTEGER,
        description TEXT,
        payment_method TEXT DEFAULT 'cash',
        reference_no TEXT,
        contact_name TEXT,
        account_id INTEGER,
        account_name TEXT,
        source_type TEXT,
        source_id INTEGER,
        check_id INTEGER,
        exchange_rate NUMERIC DEFAULT 1,
        company_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS store_financial_accounts (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        account_type TEXT NOT NULL DEFAULT 'bank',
        account_name TEXT NOT NULL,
        bank_name TEXT,
        account_number TEXT,
        currency TEXT NOT NULL DEFAULT 'TRY',
        initial_balance NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`ALTER TABLE portfolio_transactions ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';`);
    await db.query(`ALTER TABLE portfolio_transactions ADD COLUMN IF NOT EXISTS reference_no TEXT;`);
    await db.query(`ALTER TABLE portfolio_transactions ADD COLUMN IF NOT EXISTS contact_name TEXT;`);
    await db.query(`ALTER TABLE portfolio_transactions ADD COLUMN IF NOT EXISTS account_id INTEGER;`);
    await db.query(`ALTER TABLE portfolio_transactions ADD COLUMN IF NOT EXISTS account_name TEXT;`);
    await db.query(`ALTER TABLE portfolio_transactions ADD COLUMN IF NOT EXISTS source_type TEXT;`);
    await db.query(`ALTER TABLE portfolio_transactions ADD COLUMN IF NOT EXISTS source_id INTEGER;`);
    await db.query(`ALTER TABLE portfolio_transactions ADD COLUMN IF NOT EXISTS check_id INTEGER;`);
    await db.query(`ALTER TABLE portfolio_transactions ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1;`);
    await db.query(`ALTER TABLE portfolio_transactions ADD COLUMN IF NOT EXISTS company_id INTEGER;`);
    await db.query(`ALTER TABLE portfolio_transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_portfolio_tx_source
      ON portfolio_transactions (store_id, source_type, source_id);
    `);

    // Store Checks & Promissory Notes
    await db.query(`
      CREATE TABLE IF NOT EXISTS store_checks_notes (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        direction TEXT NOT NULL DEFAULT 'received',
        instrument_type TEXT NOT NULL DEFAULT 'check',
        document_no TEXT NOT NULL,
        company_id INTEGER,
        contact_name TEXT,
        bank_name TEXT,
        branch_name TEXT,
        drawer_name TEXT,
        issue_date DATE,
        due_date DATE NOT NULL,
        amount NUMERIC NOT NULL,
        currency TEXT NOT NULL DEFAULT 'TRY',
        exchange_rate NUMERIC DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'portfolio',
        collection_account_id INTEGER,
        collection_account_name TEXT,
        collected_at TIMESTAMP,
        source_type TEXT DEFAULT 'manual',
        source_id INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_checks_notes_store_due ON store_checks_notes (store_id, due_date);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_checks_notes_source ON store_checks_notes (store_id, source_type, source_id);`);

    // Add treasury link columns on invoices & current_account_transactions
    await db.query(`ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS financial_account_id INTEGER;`);
    await db.query(`ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS financial_account_name TEXT;`);
    await db.query(`ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS check_note_id INTEGER;`);
    await db.query(`ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS check_note_no TEXT;`);
    await db.query(`ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS check_due_date DATE;`);
    await db.query(`ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS check_instrument_type TEXT;`);
    await db.query(`ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS check_bank_name TEXT;`);

    await db.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS financial_account_id INTEGER;`);
    await db.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS financial_account_name TEXT;`);
    await db.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS check_note_id INTEGER;`);
    await db.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS check_note_no TEXT;`);
    await db.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS check_due_date DATE;`);
    await db.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS check_instrument_type TEXT;`);
    await db.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS check_bank_name TEXT;`);

    await db.query(`ALTER TABLE current_account_transactions ADD COLUMN IF NOT EXISTS financial_account_id INTEGER;`);
    await db.query(`ALTER TABLE current_account_transactions ADD COLUMN IF NOT EXISTS financial_account_name TEXT;`);
    await db.query(`ALTER TABLE current_account_transactions ADD COLUMN IF NOT EXISTS check_note_id INTEGER;`);

    if (db === pool) treasurySchemaReady = true;
  } catch (err) {
    console.warn("ensureTreasurySchema warning:", err);
  }
}

export async function resolveFinancialAccountInfo(
  db: DbConn,
  storeId: number,
  accountId: any,
  accountName: any,
  paymentMethod: any,
  currency: string
): Promise<{ accountId: number | null; accountName: string | null }> {
  const parsedId = accountId ? Number(accountId) : null;
  if (parsedId && !isNaN(parsedId)) {
    try {
      const res = await db.query(
        "SELECT id, account_name FROM store_financial_accounts WHERE id = $1 AND store_id = $2 LIMIT 1",
        [parsedId, storeId]
      );
      if (res.rows.length > 0) {
        return {
          accountId: Number(res.rows[0].id),
          accountName: res.rows[0].account_name,
        };
      }
    } catch {
      // fall through
    }
  }

  const trimmedName = accountName ? String(accountName).trim() : "";
  if (trimmedName) {
    return { accountId: null, accountName: trimmedName };
  }

  const mappedMethod = mapTreasuryMethod(paymentMethod);
  if (mappedMethod === "cash") {
    return {
      accountId: null,
      accountName: `${(currency || "TRY").toUpperCase()} Nakit Kasa`,
    };
  }
  return { accountId: null, accountName: null };
}

export async function deletePortfolioTxForSource(
  db: DbConn,
  storeId: number,
  sourceType: string,
  sourceId: number
) {
  await db.query(
    "DELETE FROM portfolio_transactions WHERE store_id = $1 AND source_type = $2 AND source_id = $3",
    [storeId, sourceType, sourceId]
  );
}

export async function upsertPortfolioTxForSource(
  db: DbConn,
  params: {
    storeId: number;
    sourceType: string;
    sourceId: number;
    type: "income" | "expense";
    category: string;
    title: string;
    amount: number;
    currency: string;
    exchangeRate?: number;
    date: any;
    paymentMethod: string;
    accountId: number | null;
    accountName: string | null;
    referenceNo?: string | null;
    contactName?: string | null;
    description?: string | null;
    companyId?: number | null;
    checkId?: number | null;
  }
) {
  const existing = await db.query(
    "SELECT id FROM portfolio_transactions WHERE store_id = $1 AND source_type = $2 AND source_id = $3 ORDER BY id ASC LIMIT 1",
    [params.storeId, params.sourceType, params.sourceId]
  );

  let txDateIso: string;
  try {
    const d = params.date ? new Date(params.date) : new Date();
    txDateIso = !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
  } catch {
    txDateIso = new Date().toISOString();
  }

  const curr = (params.currency || "TRY").toUpperCase();
  const rate = Number(params.exchangeRate || 1) || 1;
  const amt = Number(params.amount || 0);

  if (existing.rows.length > 0) {
    const existingId = existing.rows[0].id;
    // Remove any accidental duplicates
    await db.query(
      "DELETE FROM portfolio_transactions WHERE store_id = $1 AND source_type = $2 AND source_id = $3 AND id <> $4",
      [params.storeId, params.sourceType, params.sourceId, existingId]
    );
    const upd = await db.query(
      `UPDATE portfolio_transactions
       SET type = $1,
           category = $2,
           title = $3,
           amount = $4,
           currency = $5,
           date = $6,
           description = $7,
           payment_method = $8,
           reference_no = $9,
           contact_name = $10,
           account_id = $11,
           account_name = $12,
           exchange_rate = $13,
           company_id = $14,
           check_id = $15,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $16 AND store_id = $17
       RETURNING *`,
      [
        params.type,
        params.category,
        params.title,
        amt,
        curr,
        txDateIso,
        params.description || "",
        params.paymentMethod,
        params.referenceNo || "",
        params.contactName || "",
        params.accountId,
        params.accountName,
        rate,
        params.companyId || null,
        params.checkId || null,
        existingId,
        params.storeId,
      ]
    );
    return upd.rows[0];
  }

  const ins = await db.query(
    `INSERT INTO portfolio_transactions
      (store_id, type, category, title, amount, currency, date, description, payment_method, reference_no, contact_name, account_id, account_name, source_type, source_id, check_id, exchange_rate, company_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     RETURNING *`,
    [
      params.storeId,
      params.type,
      params.category,
      params.title,
      amt,
      curr,
      txDateIso,
      params.description || "",
      params.paymentMethod,
      params.referenceNo || "",
      params.contactName || "",
      params.accountId,
      params.accountName,
      params.sourceType,
      params.sourceId,
      params.checkId || null,
      rate,
      params.companyId || null,
    ]
  );
  return ins.rows[0];
}

export async function syncCheckNoteToPortfolio(db: DbConn, checkRow: any) {
  if (!checkRow) return;
  const storeId = Number(checkRow.store_id);
  const checkId = Number(checkRow.id);
  const status = normalizePaymentToken(checkRow.status);

  if (status === "collected" || status === "paid") {
    const isReceived = checkRow.direction !== "issued";
    const type: "income" | "expense" = isReceived ? "income" : "expense";
    const category = isReceived ? "check_collection" : "check_payment";
    const label =
      checkRow.instrument_type === "promissory_note" ? "Senet" : "Çek";
    const title = `${label} ${isReceived ? "Tahsilatı" : "Ödemesi"}: ${checkRow.document_no}`;
    const curr = (checkRow.currency || "TRY").toUpperCase();
    const accId = checkRow.collection_account_id
      ? Number(checkRow.collection_account_id)
      : null;
    let accName = checkRow.collection_account_name || null;
    if (!accName) {
      accName = accId ? null : `${curr} Nakit Kasa`;
    }
    const payMethod = accId ? "bank_transfer" : "cash";

    await upsertPortfolioTxForSource(db, {
      storeId,
      sourceType: "check_note",
      sourceId: checkId,
      type,
      category,
      title,
      amount: Number(checkRow.amount || 0),
      currency: curr,
      exchangeRate: Number(checkRow.exchange_rate || 1) || 1,
      date: checkRow.collected_at || new Date(),
      paymentMethod: payMethod,
      accountId: accId,
      accountName: accName,
      referenceNo: checkRow.document_no,
      contactName: checkRow.contact_name || "",
      description:
        checkRow.notes ||
        `Vade: ${checkRow.due_date ? String(checkRow.due_date).slice(0, 10) : "-"} | ${checkRow.bank_name || ""}`,
      companyId: checkRow.company_id || null,
      checkId,
    });
  } else {
    await deletePortfolioTxForSource(db, storeId, "check_note", checkId);
  }
}

export async function deleteCheckNoteForSource(
  db: DbConn,
  storeId: number,
  sourceType: string,
  sourceId: number
) {
  const existing = await db.query(
    "SELECT id FROM store_checks_notes WHERE store_id = $1 AND source_type = $2 AND source_id = $3",
    [storeId, sourceType, sourceId]
  );
  for (const row of existing.rows) {
    await deletePortfolioTxForSource(db, storeId, "check_note", Number(row.id));
  }
  await db.query(
    "DELETE FROM store_checks_notes WHERE store_id = $1 AND source_type = $2 AND source_id = $3",
    [storeId, sourceType, sourceId]
  );
}

export async function syncCheckNoteForSource(
  db: DbConn,
  params: {
    storeId: number;
    sourceType: "purchase_invoice" | "sales_invoice" | "company_transaction";
    sourceId: number;
    direction: "received" | "issued";
    instrumentType?: string | null;
    documentNo?: string | null;
    companyId?: number | null;
    contactName?: string | null;
    bankName?: string | null;
    branchName?: string | null;
    drawerName?: string | null;
    issueDate?: any;
    dueDate?: any;
    amount: number;
    currency: string;
    exchangeRate?: number;
    notes?: string | null;
  }
): Promise<any> {
  const docNo =
    (params.documentNo && String(params.documentNo).trim()) ||
    `CEK-${params.sourceType.slice(0, 3).toUpperCase()}-${params.sourceId}`;
  const instType =
    params.instrumentType === "promissory_note" ? "promissory_note" : "check";
  let issueDateStr: string | null = null;
  try {
    if (params.issueDate) {
      const d = new Date(params.issueDate);
      if (!isNaN(d.getTime())) issueDateStr = d.toISOString().split("T")[0];
    }
  } catch {
    issueDateStr = null;
  }
  let dueDateStr = new Date().toISOString().split("T")[0];
  try {
    if (params.dueDate) {
      const d = new Date(params.dueDate);
      if (!isNaN(d.getTime())) dueDateStr = d.toISOString().split("T")[0];
    } else if (issueDateStr) {
      dueDateStr = issueDateStr;
    }
  } catch {
    dueDateStr = new Date().toISOString().split("T")[0];
  }

  const curr = (params.currency || "TRY").toUpperCase();
  const rate = Number(params.exchangeRate || 1) || 1;
  const amt = Number(params.amount || 0);

  const existingRes = await db.query(
    "SELECT * FROM store_checks_notes WHERE store_id = $1 AND source_type = $2 AND source_id = $3 ORDER BY id ASC LIMIT 1",
    [params.storeId, params.sourceType, params.sourceId]
  );

  let savedRow: any;
  if (existingRes.rows.length > 0) {
    const existingId = existingRes.rows[0].id;
    await db.query(
      "DELETE FROM store_checks_notes WHERE store_id = $1 AND source_type = $2 AND source_id = $3 AND id <> $4",
      [params.storeId, params.sourceType, params.sourceId, existingId]
    );
    const upd = await db.query(
      `UPDATE store_checks_notes
       SET direction = $1,
           instrument_type = $2,
           document_no = $3,
           company_id = $4,
           contact_name = $5,
           bank_name = $6,
           branch_name = $7,
           drawer_name = $8,
           issue_date = COALESCE($9::date, issue_date),
           due_date = $10::date,
           amount = $11,
           currency = $12,
           exchange_rate = $13,
           notes = COALESCE($14, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $15 AND store_id = $16
       RETURNING *`,
      [
        params.direction,
        instType,
        docNo,
        params.companyId || null,
        params.contactName || "",
        params.bankName || null,
        params.branchName || null,
        params.drawerName || params.contactName || null,
        issueDateStr,
        dueDateStr,
        amt,
        curr,
        rate,
        params.notes || null,
        existingId,
        params.storeId,
      ]
    );
    savedRow = upd.rows[0];
  } else {
    const ins = await db.query(
      `INSERT INTO store_checks_notes
        (store_id, direction, instrument_type, document_no, company_id, contact_name, bank_name, branch_name, drawer_name, issue_date, due_date, amount, currency, exchange_rate, status, source_type, source_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::date, $11::date, $12, $13, $14, 'portfolio', $15, $16, $17)
       RETURNING *`,
      [
        params.storeId,
        params.direction,
        instType,
        docNo,
        params.companyId || null,
        params.contactName || "",
        params.bankName || null,
        params.branchName || null,
        params.drawerName || params.contactName || null,
        issueDateStr || dueDateStr,
        dueDateStr,
        amt,
        curr,
        rate,
        params.sourceType,
        params.sourceId,
        params.notes || null,
      ]
    );
    savedRow = ins.rows[0];
  }

  // If check was already settled (collected/paid), re-sync its portfolio transaction too
  await syncCheckNoteToPortfolio(db, savedRow);
  return savedRow;
}

export async function syncPurchaseInvoiceTreasury(
  db: DbConn,
  params: {
    storeId: number;
    invoiceId: number;
    invoiceNumber: string;
    invoiceDate: any;
    grandTotal: number;
    currency: string;
    exchangeRate: number;
    paymentMethod: string | null;
    paymentStatus: string | null;
    status?: string | null;
    isExpense?: boolean;
    companyId?: number | null;
    supplierName?: string | null;
    financialAccountId?: number | null;
    financialAccountName?: string | null;
    checkNoteNo?: string | null;
    checkDueDate?: string | null;
    checkInstrumentType?: string | null;
    checkBankName?: string | null;
  }
) {
  await ensureTreasurySchema(db);
  const isPaid = isSettlementPaid(
    params.paymentMethod,
    params.paymentStatus,
    params.status
  );
  const grandTotal = Number(params.grandTotal || 0);
  const curr = (params.currency || "TRY").toUpperCase();

  if (!isPaid || grandTotal <= 0) {
    await deletePortfolioTxForSource(
      db,
      params.storeId,
      "purchase_invoice",
      params.invoiceId
    );
    await deleteCheckNoteForSource(
      db,
      params.storeId,
      "purchase_invoice",
      params.invoiceId
    );
    return {
      isPaid: false,
      financialAccountId: null,
      financialAccountName: null,
      checkNoteId: null,
    };
  }

  const mappedMethod = mapTreasuryMethod(params.paymentMethod);

  if (mappedMethod === "check_promissory") {
    await deletePortfolioTxForSource(
      db,
      params.storeId,
      "purchase_invoice",
      params.invoiceId
    );
    const checkRow = await syncCheckNoteForSource(db, {
      storeId: params.storeId,
      sourceType: "purchase_invoice",
      sourceId: params.invoiceId,
      direction: "issued",
      instrumentType: params.checkInstrumentType || "check",
      documentNo: params.checkNoteNo || params.invoiceNumber,
      companyId: params.companyId || null,
      contactName: params.supplierName || "",
      bankName: params.checkBankName || null,
      issueDate: params.invoiceDate,
      dueDate: params.checkDueDate || params.invoiceDate,
      amount: grandTotal,
      currency: curr,
      exchangeRate: params.exchangeRate || 1,
      notes: `Alış Faturası: ${params.invoiceNumber}`,
    });
    return {
      isPaid: true,
      financialAccountId: null,
      financialAccountName: null,
      checkNoteId: checkRow?.id ? Number(checkRow.id) : null,
    };
  }

  await deleteCheckNoteForSource(
    db,
    params.storeId,
    "purchase_invoice",
    params.invoiceId
  );

  const acctInfo = await resolveFinancialAccountInfo(
    db,
    params.storeId,
    params.financialAccountId,
    params.financialAccountName,
    params.paymentMethod,
    curr
  );

  await upsertPortfolioTxForSource(db, {
    storeId: params.storeId,
    sourceType: "purchase_invoice",
    sourceId: params.invoiceId,
    type: "expense",
    category: params.isExpense ? "rent_utilities" : "supplier_payment",
    title: `Alış Faturası Ödemesi: ${params.invoiceNumber}`,
    amount: grandTotal,
    currency: curr,
    exchangeRate: params.exchangeRate || 1,
    date: params.invoiceDate || new Date(),
    paymentMethod: mappedMethod,
    accountId: acctInfo.accountId,
    accountName: acctInfo.accountName,
    referenceNo: params.invoiceNumber,
    contactName: params.supplierName || "",
    description: params.isExpense
      ? `Gider Faturası (#${params.invoiceNumber})`
      : `Alış Faturası Ödemesi (#${params.invoiceNumber})`,
    companyId: params.companyId || null,
  });

  return {
    isPaid: true,
    financialAccountId: acctInfo.accountId,
    financialAccountName: acctInfo.accountName,
    checkNoteId: null,
  };
}

export async function syncSalesInvoiceTreasury(
  db: DbConn,
  params: {
    storeId: number;
    invoiceId: number;
    invoiceNumber: string;
    invoiceDate: any;
    grandTotal: number;
    currency: string;
    exchangeRate: number;
    paymentMethod: string | null;
    status?: string | null;
    companyId?: number | null;
    customerName?: string | null;
    financialAccountId?: number | null;
    financialAccountName?: string | null;
    checkNoteNo?: string | null;
    checkDueDate?: string | null;
    checkInstrumentType?: string | null;
    checkBankName?: string | null;
  }
) {
  await ensureTreasurySchema(db);
  const isPaid = isSettlementPaid(params.paymentMethod, null, params.status);
  const grandTotal = Number(params.grandTotal || 0);
  const curr = (params.currency || "TRY").toUpperCase();

  if (!isPaid || grandTotal <= 0) {
    await deletePortfolioTxForSource(
      db,
      params.storeId,
      "sales_invoice",
      params.invoiceId
    );
    await deleteCheckNoteForSource(
      db,
      params.storeId,
      "sales_invoice",
      params.invoiceId
    );
    return {
      isPaid: false,
      financialAccountId: null,
      financialAccountName: null,
      checkNoteId: null,
    };
  }

  const mappedMethod = mapTreasuryMethod(params.paymentMethod);

  if (mappedMethod === "check_promissory") {
    await deletePortfolioTxForSource(
      db,
      params.storeId,
      "sales_invoice",
      params.invoiceId
    );
    const checkRow = await syncCheckNoteForSource(db, {
      storeId: params.storeId,
      sourceType: "sales_invoice",
      sourceId: params.invoiceId,
      direction: "received",
      instrumentType: params.checkInstrumentType || "check",
      documentNo: params.checkNoteNo || params.invoiceNumber,
      companyId: params.companyId || null,
      contactName: params.customerName || "",
      bankName: params.checkBankName || null,
      issueDate: params.invoiceDate,
      dueDate: params.checkDueDate || params.invoiceDate,
      amount: grandTotal,
      currency: curr,
      exchangeRate: params.exchangeRate || 1,
      notes: `Satış Faturası: ${params.invoiceNumber}`,
    });
    return {
      isPaid: true,
      financialAccountId: null,
      financialAccountName: null,
      checkNoteId: checkRow?.id ? Number(checkRow.id) : null,
    };
  }

  await deleteCheckNoteForSource(
    db,
    params.storeId,
    "sales_invoice",
    params.invoiceId
  );

  const acctInfo = await resolveFinancialAccountInfo(
    db,
    params.storeId,
    params.financialAccountId,
    params.financialAccountName,
    params.paymentMethod,
    curr
  );

  await upsertPortfolioTxForSource(db, {
    storeId: params.storeId,
    sourceType: "sales_invoice",
    sourceId: params.invoiceId,
    type: "income",
    category: "invoice_collection",
    title: `Satış Faturası Tahsilatı: ${params.invoiceNumber}`,
    amount: grandTotal,
    currency: curr,
    exchangeRate: params.exchangeRate || 1,
    date: params.invoiceDate || new Date(),
    paymentMethod: mappedMethod,
    accountId: acctInfo.accountId,
    accountName: acctInfo.accountName,
    referenceNo: params.invoiceNumber,
    contactName: params.customerName || "",
    description: `Satış Faturası Tahsilatı (#${params.invoiceNumber})`,
    companyId: params.companyId || null,
  });

  return {
    isPaid: true,
    financialAccountId: acctInfo.accountId,
    financialAccountName: acctInfo.accountName,
    checkNoteId: null,
  };
}

export async function syncCompanyTransactionTreasury(
  db: DbConn,
  params: {
    storeId: number;
    transactionId: number;
    companyId: number;
    type: "credit" | "debt";
    amount: number;
    currency: string;
    exchangeRate: number;
    crossCurrency?: string | null;
    crossRate?: number | null;
    crossAmount?: number | null;
    paymentMethod: string | null;
    description?: string | null;
    transactionDate?: any;
    purchaseInvoiceId?: number | null;
    salesInvoiceId?: number | null;
    financialAccountId?: number | null;
    financialAccountName?: string | null;
    checkNoteNo?: string | null;
    checkDueDate?: string | null;
    checkInstrumentType?: string | null;
    checkBankName?: string | null;
  }
) {
  await ensureTreasurySchema(db);

  // Invoice-originated ledger entries are synced via invoice sync hooks, never double-posted
  if (params.purchaseInvoiceId || params.salesInvoiceId) {
    return {
      financialAccountId: null,
      financialAccountName: null,
      checkNoteId: null,
    };
  }

  const isPaid = isSettlementPaid(params.paymentMethod, null, null);
  const rawAmt = Number(params.amount || 0);

  if (!isPaid || rawAmt <= 0) {
    await deletePortfolioTxForSource(
      db,
      params.storeId,
      "company_transaction",
      params.transactionId
    );
    await deleteCheckNoteForSource(
      db,
      params.storeId,
      "company_transaction",
      params.transactionId
    );
    return {
      financialAccountId: null,
      financialAccountName: null,
      checkNoteId: null,
    };
  }

  // Lookup company title
  let companyTitle = "";
  try {
    const cRes = await db.query("SELECT title FROM companies WHERE id = $1 LIMIT 1", [
      params.companyId,
    ]);
    companyTitle = cRes.rows[0]?.title || "";
  } catch {
    companyTitle = "";
  }

  // If cross-currency TRY settlement was used (e.g. paid TRY into USD debt),
  // treasury vault receives/pays the actual TRY cash/bank amount!
  const isCrossTry =
    String(params.crossCurrency || "").toUpperCase() === "TRY" &&
    Number(params.crossAmount || 0) > 0;
  const effectiveCurrency = isCrossTry
    ? "TRY"
    : (params.currency || "TRY").toUpperCase();
  const effectiveAmount = isCrossTry ? Number(params.crossAmount) : rawAmt;
  const effectiveRate = isCrossTry ? 1 : Number(params.exchangeRate || 1) || 1;

  const isCollection = params.type === "credit"; // Company credit = Tahsilat from customer -> money IN
  const mappedMethod = mapTreasuryMethod(params.paymentMethod);

  if (mappedMethod === "check_promissory") {
    await deletePortfolioTxForSource(
      db,
      params.storeId,
      "company_transaction",
      params.transactionId
    );
    const checkRow = await syncCheckNoteForSource(db, {
      storeId: params.storeId,
      sourceType: "company_transaction",
      sourceId: params.transactionId,
      direction: isCollection ? "received" : "issued",
      instrumentType: params.checkInstrumentType || "check",
      documentNo:
        params.checkNoteNo || `CARI-${params.transactionId}`,
      companyId: params.companyId,
      contactName: companyTitle,
      bankName: params.checkBankName || null,
      issueDate: params.transactionDate,
      dueDate: params.checkDueDate || params.transactionDate,
      amount: effectiveAmount,
      currency: effectiveCurrency,
      exchangeRate: effectiveRate,
      notes: params.description || "",
    });
    return {
      financialAccountId: null,
      financialAccountName: null,
      checkNoteId: checkRow?.id ? Number(checkRow.id) : null,
    };
  }

  await deleteCheckNoteForSource(
    db,
    params.storeId,
    "company_transaction",
    params.transactionId
  );

  const acctInfo = await resolveFinancialAccountInfo(
    db,
    params.storeId,
    params.financialAccountId,
    params.financialAccountName,
    params.paymentMethod,
    effectiveCurrency
  );

  // Extract optional [Belge: ...] doc no
  let refNo = "";
  const docMatch = String(params.description || "").match(
    /^\[(?:Belge|Evrak|Ref|Dekont):\s*([^\]]+)\]/i
  );
  if (docMatch) refNo = docMatch[1].trim();

  await upsertPortfolioTxForSource(db, {
    storeId: params.storeId,
    sourceType: "company_transaction",
    sourceId: params.transactionId,
    type: isCollection ? "income" : "expense",
    category: isCollection ? "invoice_collection" : "supplier_payment",
    title: isCollection
      ? `Cari Tahsilat: ${companyTitle || "#" + params.companyId}`
      : `Cari Ödeme: ${companyTitle || "#" + params.companyId}`,
    amount: effectiveAmount,
    currency: effectiveCurrency,
    exchangeRate: effectiveRate,
    date: params.transactionDate || new Date(),
    paymentMethod: mappedMethod,
    accountId: acctInfo.accountId,
    accountName: acctInfo.accountName,
    referenceNo: refNo,
    contactName: companyTitle,
    description: params.description || "",
    companyId: params.companyId,
  });

  return {
    financialAccountId: acctInfo.accountId,
    financialAccountName: acctInfo.accountName,
    checkNoteId: null,
  };
}

export async function healInvoicePaymentTransactions(db: DbConn = pool) {
  await ensureTreasurySchema(db);
  try {
    // 1. Normalize stale purchase_invoices.payment_status where payment_method is clearly term/open-account
    await db.query(`
      UPDATE purchase_invoices
      SET payment_status = 'unpaid'
      WHERE LOWER(TRIM(COALESCE(payment_method, ''))) IN ('term', 'open_account', 'open', 'unpaid', 'vadeli', 'acik_hesap', 'acik hesap', 'açık hesap', 'açık hesap-cari', 'cari')
        AND LOWER(TRIM(COALESCE(payment_status, ''))) = 'paid';
    `);

    // 2. Delete erroneous 'debt' (Ödeme) rows in current_account_transactions directly linked to open-account / cancelled purchase invoices
    await db.query(`
      DELETE FROM current_account_transactions cat
      USING purchase_invoices pi
      WHERE cat.purchase_invoice_id = pi.id
        AND cat.type = 'debt'
        AND (
          LOWER(TRIM(COALESCE(pi.status, ''))) IN ('draft', 'taslak', 'cancelled', 'canceled', 'iptal', 'iptal edildi')
          OR LOWER(TRIM(COALESCE(pi.payment_method, ''))) IN ('term', 'open_account', 'open', 'unpaid', 'vadeli', 'acik_hesap', 'acik hesap', 'açık hesap', 'açık hesap-cari', 'cari')
          OR (COALESCE(TRIM(pi.payment_method), '') = '' AND LOWER(TRIM(COALESCE(pi.payment_status, 'unpaid'))) <> 'paid')
        );
    `);

    // 3. Delete orphan duplicate 'debt' (Ödeme) rows (where purchase_invoice_id IS NULL, e.g. legacy sync bug like ARC2026000206845)
    // matching an open-account purchase invoice of the same store, company, amount, and invoice/document number
    await db.query(`
      DELETE FROM current_account_transactions cat
      USING purchase_invoices pi
      WHERE cat.purchase_invoice_id IS NULL
        AND cat.type = 'debt'
        AND cat.company_id = pi.company_id
        AND cat.store_id = pi.store_id
        AND ABS(COALESCE(cat.amount, 0) - COALESCE(NULLIF(pi.grand_total, 0), pi.total_amount, 0)) < 0.02
        AND (
          LOWER(TRIM(COALESCE(pi.payment_method, ''))) IN ('term', 'open_account', 'open', 'unpaid', 'vadeli', 'acik_hesap', 'acik hesap', 'açık hesap', 'açık hesap-cari', 'cari')
          OR (COALESCE(TRIM(pi.payment_method), '') = '' AND LOWER(TRIM(COALESCE(pi.payment_status, 'unpaid'))) <> 'paid')
        )
        AND (
          (COALESCE(TRIM(pi.invoice_number), '') <> '' AND (
            TRIM(cat.description) = TRIM(pi.invoice_number)
            OR cat.description LIKE 'Alış Faturası Ödemesi: ' || TRIM(pi.invoice_number) || '%'
          ))
          OR (COALESCE(TRIM(pi.document_number), '') <> '' AND (
            TRIM(cat.description) = TRIM(pi.document_number)
            OR cat.description LIKE 'Alış Faturası Ödemesi: ' || TRIM(pi.document_number) || '%'
          ))
        );
    `);

    // 4. Delete erroneous 'credit' (Tahsilat) rows linked to draft/cancelled/term sales invoices
    await db.query(`
      DELETE FROM current_account_transactions cat
      USING sales_invoices si
      WHERE cat.sales_invoice_id = si.id
        AND cat.type = 'credit'
        AND (
          LOWER(TRIM(COALESCE(si.status, ''))) IN ('draft', 'taslak', 'cancelled', 'canceled', 'iptal', 'iptal edildi')
          OR LOWER(TRIM(COALESCE(si.payment_method, ''))) IN ('term', 'open_account', 'open', 'unpaid', 'vadeli', 'acik_hesap', 'acik hesap', 'açık hesap', 'açık hesap-cari', 'cari')
        );
    `);

    // 5. Delete portfolio_transactions linked to open-account / cancelled invoices
    await db.query(`
      DELETE FROM portfolio_transactions pt
      USING purchase_invoices pi
      WHERE pt.source_type = 'purchase_invoice'
        AND pt.source_id = pi.id
        AND pt.store_id = pi.store_id
        AND (
          LOWER(TRIM(COALESCE(pi.status, ''))) IN ('draft', 'taslak', 'cancelled', 'canceled', 'iptal', 'iptal edildi')
          OR LOWER(TRIM(COALESCE(pi.payment_method, ''))) IN ('term', 'open_account', 'open', 'unpaid', 'vadeli', 'acik_hesap', 'acik hesap', 'açık hesap', 'açık hesap-cari', 'cari')
          OR (COALESCE(TRIM(pi.payment_method), '') = '' AND LOWER(TRIM(COALESCE(pi.payment_status, 'unpaid'))) <> 'paid')
        );
    `);

    await db.query(`
      DELETE FROM portfolio_transactions pt
      USING sales_invoices si
      WHERE pt.source_type = 'sales_invoice'
        AND pt.source_id = si.id
        AND pt.store_id = si.store_id
        AND (
          LOWER(TRIM(COALESCE(si.status, ''))) IN ('draft', 'taslak', 'cancelled', 'canceled', 'iptal', 'iptal edildi')
          OR LOWER(TRIM(COALESCE(si.payment_method, ''))) IN ('term', 'open_account', 'open', 'unpaid', 'vadeli', 'acik_hesap', 'acik hesap', 'açık hesap', 'açık hesap-cari', 'cari')
        );
    `);
  } catch (err) {
    console.error("healInvoicePaymentTransactions error:", err);
  }
}
