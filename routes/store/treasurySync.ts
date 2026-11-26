import { Pool, PoolClient } from "pg";
import { pool } from "../../models/db";
import { isShopLPStore } from "./invoiceMatching";

type DbConn = Pool | PoolClient;

let treasurySchemaReady = false;

export type MarketplacePlatform =
  | "hepsiburada"
  | "trendyol"
  | "n11"
  | "amazon"
  | "pazarama";

export interface MarketplaceVaultDef {
  key: MarketplacePlatform;
  code: string;
  brandLabel: string;
  accountName: string;
  bankName: string;
}

export const MARKETPLACE_VAULT_DEFS: Record<MarketplacePlatform, MarketplaceVaultDef> = {
  hepsiburada: {
    key: "hepsiburada",
    code: "HB",
    brandLabel: "Hepsiburada",
    accountName: "Hepsiburada Kasası",
    bankName: "Hepsiburada (D-Market)",
  },
  trendyol: {
    key: "trendyol",
    code: "TY",
    brandLabel: "Trendyol",
    accountName: "Trendyol Kasası",
    bankName: "Trendyol (DSM Grup)",
  },
  n11: {
    key: "n11",
    code: "N11",
    brandLabel: "N11",
    accountName: "N11 Kasası",
    bankName: "N11 (Doğuş Planet)",
  },
  amazon: {
    key: "amazon",
    code: "AMZ",
    brandLabel: "Amazon",
    accountName: "Amazon Kasası",
    bankName: "Amazon Türkiye",
  },
  pazarama: {
    key: "pazarama",
    code: "PZR",
    brandLabel: "Pazarama",
    accountName: "Pazarama Kasası",
    bankName: "Pazarama (Topkapı Danışmanlık)",
  },
};

export const MARKETPLACE_PLATFORMS: MarketplacePlatform[] = [
  "hepsiburada",
  "trendyol",
  "n11",
  "amazon",
  "pazarama",
];

function foldTurkish(val?: any): string {
  return String(val ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export function detectMarketplacePlatform(input: {
  source?: any;
  paymentMethod?: any;
  invoiceNumber?: any;
  supplierName?: any;
  taxNumber?: any;
  accountName?: any;
}): MarketplacePlatform | null {
  const taxDigits = String(input.taxNumber ?? "").replace(/\D/g, "");
  if (taxDigits === "2650275912") return "hepsiburada"; // D-Market Elektronik Hizmetler A.Ş.
  if (taxDigits === "3130557669") return "trendyol"; // DSM Grup Danışmanlık A.Ş.
  if (taxDigits === "3090386496") return "n11"; // Doğuş Planet Elektronik Ticaret A.Ş.
  if (taxDigits === "0680899838") return "amazon"; // Amazon Turkey Perakende Hizmetleri Ltd. Şti.
  if (taxDigits === "8570428629") return "pazarama"; // Topkapı Danışmanlık Elektronik Hizmetler A.Ş.

  const src = foldTurkish(input.source);
  if (src === "hepsiburada" || src === "hb") return "hepsiburada";
  if (src === "trendyol" || src === "ty") return "trendyol";
  if (src === "n11") return "n11";
  if (src === "amazon" || src === "amz") return "amazon";
  if (src === "pazarama" || src === "pzr") return "pazarama";

  const inv = foldTurkish(input.invoiceNumber);
  if (inv.startsWith("hb-") || inv.startsWith("hb_")) return "hepsiburada";
  if (inv.startsWith("ty-") || inv.startsWith("ty_")) return "trendyol";
  if (inv.startsWith("n11-") || inv.startsWith("n11_")) return "n11";
  if (inv.startsWith("amz-") || inv.startsWith("amz_")) return "amazon";
  if (inv.startsWith("pzr-") || inv.startsWith("pzr_") || inv.startsWith("pz-") || inv.startsWith("pz_")) return "pazarama";

  const combined = [
    foldTurkish(input.paymentMethod),
    foldTurkish(input.supplierName),
    foldTurkish(input.accountName),
  ]
    .filter(Boolean)
    .join(" | ");

  if (!combined) return null;

  if (
    combined.includes("hepsiburada") ||
    combined.includes("d-market") ||
    combined.includes("d market elektronik")
  ) {
    return "hepsiburada";
  }
  if (
    combined.includes("trendyol") ||
    combined.includes("dsm grup")
  ) {
    return "trendyol";
  }
  if (
    /\bn11\b/.test(combined) ||
    combined.includes("n11.com") ||
    combined.includes("dogus planet")
  ) {
    return "n11";
  }
  if (
    combined.includes("amazon")
  ) {
    return "amazon";
  }
  if (
    combined.includes("pazarama") ||
    combined.includes("topkapi danismanlik")
  ) {
    return "pazarama";
  }

  return null;
}

export function isMarketplacePaymentMethod(method?: any): boolean {
  const token = foldTurkish(method);
  if (!token) return false;
  if (
    token === "marketplace_vault" ||
    token === "marketplace" ||
    token === "pazaryeri" ||
    token === "pazaryeri_kasa" ||
    token === "pazaryeri kasasi"
  ) {
    return true;
  }
  return Boolean(detectMarketplacePlatform({ paymentMethod: token }));
}

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
    token === "iptal edildi" ||
    token === "returned" ||
    token === "iade" ||
    token === "rejected" ||
    token === "unsupplied"
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
      isCheckPromissoryMethod(methodToken) ||
      isMarketplacePaymentMethod(methodToken))
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
): "cash" | "bank_transfer" | "credit_card" | "check_promissory" | "marketplace_vault" {
  const token = normalizePaymentToken(paymentMethod);
  if (isMarketplacePaymentMethod(token)) return "marketplace_vault";
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
    await db.query(`ALTER TABLE current_account_transactions ADD COLUMN IF NOT EXISTS cross_currency TEXT;`);
    await db.query(`ALTER TABLE current_account_transactions ADD COLUMN IF NOT EXISTS cross_rate DECIMAL(12,4);`);
    await db.query(`ALTER TABLE current_account_transactions ADD COLUMN IF NOT EXISTS cross_amount DECIMAL(12,2);`);
    await db.query(`ALTER TABLE current_account_transactions ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;`);

    if (db === pool) treasurySchemaReady = true;
  } catch (err) {
    console.warn("ensureTreasurySchema warning:", err);
  }
}

export async function ensureMarketplaceVaultAccount(
  db: DbConn,
  storeId: number,
  platform: MarketplacePlatform
): Promise<{
  id: number;
  account_name: string;
  currency: string;
  platform: MarketplacePlatform;
} | null> {
  if (!storeId) return null;
  const shopLp = await isShopLPStore(db, storeId);
  if (!shopLp) return null;

  await ensureTreasurySchema(db);
  const def = MARKETPLACE_VAULT_DEFS[platform];
  if (!def) return null;

  const existing = await db.query(
    `SELECT id, account_name, currency
     FROM store_financial_accounts
     WHERE store_id = $1
       AND LOWER(account_type) = 'marketplace'
       AND (
         LOWER(COALESCE(account_number, '')) IN ($2, $3)
         OR LOWER(account_name) = LOWER($4)
       )
     ORDER BY id ASC
     LIMIT 1`,
    [storeId, def.key, def.code.toLowerCase(), def.accountName]
  );

  if (existing.rows.length > 0) {
    return {
      id: Number(existing.rows[0].id),
      account_name: existing.rows[0].account_name,
      currency: (existing.rows[0].currency || "TRY").toUpperCase(),
      platform,
    };
  }

  const ins = await db.query(
    `INSERT INTO store_financial_accounts
      (store_id, account_type, account_name, bank_name, account_number, currency, initial_balance)
     VALUES ($1, 'marketplace', $2, $3, $4, 'TRY', 0)
     RETURNING id, account_name, currency`,
    [storeId, def.accountName, def.bankName, def.key]
  );

  return {
    id: Number(ins.rows[0].id),
    account_name: ins.rows[0].account_name,
    currency: (ins.rows[0].currency || "TRY").toUpperCase(),
    platform,
  };
}

export async function resolveFinancialAccountInfo(
  db: DbConn,
  storeId: number,
  accountId: any,
  accountName: any,
  paymentMethod: any,
  currency: string
): Promise<{ accountId: number | null; accountName: string | null }> {
  const mappedMethod = mapTreasuryMethod(paymentMethod);
  const curr = (currency || "TRY").toUpperCase();

  if (mappedMethod === "check_promissory") {
    return { accountId: null, accountName: "Çek / Senet Portföyü" };
  }

  const parsedId = accountId ? Number(accountId) : null;
  if (parsedId && !isNaN(parsedId)) {
    try {
      const res = await db.query(
        "SELECT id, account_name, account_type FROM store_financial_accounts WHERE id = $1 AND store_id = $2 LIMIT 1",
        [parsedId, storeId]
      );
      if (res.rows.length > 0) {
        const acc = res.rows[0];
        const accType = String(acc.account_type || "").toLowerCase();
        const isCompatible =
          (mappedMethod === "cash" && accType === "cash") ||
          (mappedMethod === "bank_transfer" && accType === "bank") ||
          (mappedMethod === "credit_card" && accType === "credit_card") ||
          (mappedMethod === "marketplace_vault" && accType === "marketplace");
        if (isCompatible) {
          return {
            accountId: Number(acc.id),
            accountName: acc.account_name,
          };
        }
      }
    } catch {
      // fall through
    }
  }

  if (mappedMethod === "marketplace_vault") {
    const detected = detectMarketplacePlatform({
      paymentMethod,
      accountName,
    });
    if (detected) {
      const vault = await ensureMarketplaceVaultAccount(db, storeId, detected);
      if (vault) {
        return { accountId: vault.id, accountName: vault.account_name };
      }
    }
    const trimmedMp = accountName ? String(accountName).trim() : "";
    return {
      accountId: null,
      accountName: trimmedMp || "Pazaryeri Kasası",
    };
  }

  if (mappedMethod === "cash") {
    return {
      accountId: null,
      accountName: `${curr} Nakit Kasa`,
    };
  }

  const trimmedName = accountName ? String(accountName).trim() : "";
  if (trimmedName && !/^(GBP|EUR|USD|TRY)?\s*(Nakit\s+Kasa|Cash\s*Vault|Cash)$/i.test(trimmedName)) {
    return { accountId: null, accountName: trimmedName };
  }

  return {
    accountId: null,
    accountName: mappedMethod === "credit_card" ? "Kredi Kartı" : mappedMethod === "bank_transfer" ? "Banka Hesabı" : null,
  };
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
    let accId = checkRow.collection_account_id
      ? Number(checkRow.collection_account_id)
      : null;
    let accName = checkRow.collection_account_name || null;
    let payMethod: "cash" | "bank_transfer" | "credit_card" | "check_promissory" = "cash";

    if (accId) {
      try {
        const accRes = await db.query(
          "SELECT id, account_name, account_type FROM store_financial_accounts WHERE id = $1 AND store_id = $2 LIMIT 1",
          [accId, storeId]
        );
        if (accRes.rows.length > 0) {
          const accRow = accRes.rows[0];
          const accType = String(accRow.account_type || "").toLowerCase();
          if (!accName) accName = accRow.account_name;
          if (accType === "cash") payMethod = "cash";
          else if (accType === "credit_card") payMethod = "credit_card";
          else if (accType === "check") payMethod = "check_promissory";
          else payMethod = "bank_transfer";
        } else {
          payMethod = "bank_transfer";
        }
      } catch {
        payMethod = "bank_transfer";
      }
    } else if (!accName) {
      accName = `${curr} Nakit Kasa`;
      payMethod = "cash";
    }

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

export async function syncMarketplaceOrderTreasury(
  db: DbConn,
  params: {
    storeId: number;
    platform: MarketplacePlatform;
    orderNumber: string;
    salesInvoiceId?: number | null;
    saleId?: number | null;
    amount: number;
    currency?: string | null;
    date?: any;
    customerName?: string | null;
    status?: string | null;
  }
): Promise<{
  synced: boolean;
  deleted?: boolean;
  accountId: number | null;
  accountName: string | null;
}> {
  if (!params.storeId) {
    return { synced: false, accountId: null, accountName: null };
  }
  const shopLp = await isShopLPStore(db, params.storeId);
  if (!shopLp) {
    return { synced: false, accountId: null, accountName: null };
  }

  await ensureTreasurySchema(db);
  const grandTotal = Number(params.amount || 0);
  const cancelled = isCancelledOrDraftStatus(params.status);

  if (cancelled || grandTotal <= 0) {
    if (params.salesInvoiceId) {
      await deletePortfolioTxForSource(db, params.storeId, "sales_invoice", Number(params.salesInvoiceId));
      await deleteCheckNoteForSource(db, params.storeId, "sales_invoice", Number(params.salesInvoiceId));
    }
    if (params.saleId) {
      await deletePortfolioTxForSource(db, params.storeId, "sale", Number(params.saleId));
    }
    return { synced: false, deleted: true, accountId: null, accountName: null };
  }

  const vault = await ensureMarketplaceVaultAccount(db, params.storeId, params.platform);
  if (!vault) {
    return { synced: false, accountId: null, accountName: null };
  }

  const def = MARKETPLACE_VAULT_DEFS[params.platform];
  const curr = (params.currency || vault.currency || "TRY").toUpperCase();
  const orderRef = String(params.orderNumber || "").trim() || `${def.code}-${params.salesInvoiceId || params.saleId || ""}`;

  // Canonical source: prefer sales_invoice when linked to prevent duplicate posting
  const sourceType = params.salesInvoiceId ? "sales_invoice" : "sale";
  const sourceId = Number(params.salesInvoiceId || params.saleId);

  if (!sourceId || isNaN(sourceId)) {
    return { synced: false, accountId: vault.id, accountName: vault.account_name };
  }

  if (params.salesInvoiceId && params.saleId) {
    await deletePortfolioTxForSource(db, params.storeId, "sale", Number(params.saleId));
  }

  await upsertPortfolioTxForSource(db, {
    storeId: params.storeId,
    sourceType,
    sourceId,
    type: "income",
    category: "online_marketplace",
    title: `${def.brandLabel} Siparişi: #${orderRef}`,
    amount: grandTotal,
    currency: curr,
    exchangeRate: 1,
    date: params.date || new Date(),
    paymentMethod: "marketplace_vault",
    accountId: vault.id,
    accountName: vault.account_name,
    referenceNo: orderRef,
    contactName: (params.customerName || def.brandLabel).trim(),
    description: `${def.brandLabel} Pazaryeri Sipariş Alacağı (#${orderRef})`,
    companyId: null,
  });

  if (params.salesInvoiceId) {
    try {
      await db.query(
        `UPDATE sales_invoices
         SET financial_account_id = $1, financial_account_name = $2
         WHERE id = $3 AND store_id = $4`,
        [vault.id, vault.account_name, Number(params.salesInvoiceId), params.storeId]
      );
    } catch {
      // non-fatal
    }
  }

  return { synced: true, accountId: vault.id, accountName: vault.account_name };
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
    taxNumber?: string | null;
    financialAccountId?: number | null;
    financialAccountName?: string | null;
    checkNoteNo?: string | null;
    checkDueDate?: string | null;
    checkInstrumentType?: string | null;
    checkBankName?: string | null;
  }
) {
  await ensureTreasurySchema(db);
  const grandTotal = Number(params.grandTotal || 0);
  const curr = (params.currency || "TRY").toUpperCase();
  const isDocCancelledOrDraft = isCancelledOrDraftStatus(params.status);

  // Resolve supplier name & VKN if companyId is given so marketplace detection is exact
  let resolvedSupplierName = (params.supplierName || "").trim();
  let resolvedTaxNumber = (params.taxNumber || "").trim();
  if (params.companyId && (!resolvedSupplierName || !resolvedTaxNumber)) {
    try {
      const compRes = await db.query(
        "SELECT title, tax_number FROM companies WHERE id = $1 LIMIT 1",
        [params.companyId]
      );
      if (compRes.rows.length > 0) {
        if (!resolvedSupplierName) resolvedSupplierName = String(compRes.rows[0].title || "").trim();
        if (!resolvedTaxNumber) resolvedTaxNumber = String(compRes.rows[0].tax_number || "").trim();
      }
    } catch {
      // non-fatal
    }
  }

  const rawMappedMethod = mapTreasuryMethod(params.paymentMethod);
  const isExplicitNonMpPaid =
    !isTermOrUnpaidMethod(params.paymentMethod) &&
    rawMappedMethod !== "marketplace_vault";

  // STRICT RULE: Marketplace expense invoices (commission, cargo, ads, service) on shopLP
  // automatically deduct (-) from that marketplace's vault.
  // Stock / product purchase invoices (isExpense === false) from HB/Amazon are EXPLICITLY EXCLUDED!
  if (!isDocCancelledOrDraft && params.isExpense === true && grandTotal > 0 && !isExplicitNonMpPaid) {
    const detectedMp = detectMarketplacePlatform({
      supplierName: resolvedSupplierName,
      taxNumber: resolvedTaxNumber,
      invoiceNumber: params.invoiceNumber,
      accountName: params.financialAccountName,
      paymentMethod: params.paymentMethod,
    });
    if (detectedMp && (await isShopLPStore(db, params.storeId))) {
      await deleteCheckNoteForSource(db, params.storeId, "purchase_invoice", params.invoiceId);
      const vault = await ensureMarketplaceVaultAccount(db, params.storeId, detectedMp);
      if (vault) {
        const def = MARKETPLACE_VAULT_DEFS[detectedMp];
        await upsertPortfolioTxForSource(db, {
          storeId: params.storeId,
          sourceType: "purchase_invoice",
          sourceId: params.invoiceId,
          type: "expense",
          category: "marketplace_commission",
          title: `${def.brandLabel} Masraf / Gider Faturası: ${params.invoiceNumber}`,
          amount: grandTotal,
          currency: curr,
          exchangeRate: params.exchangeRate || 1,
          date: params.invoiceDate || new Date(),
          paymentMethod: "marketplace_vault",
          accountId: vault.id,
          accountName: vault.account_name,
          referenceNo: params.invoiceNumber,
          contactName: resolvedSupplierName || def.brandLabel,
          description: `${def.brandLabel} Hakediş Mahsubu / Gider Faturası (#${params.invoiceNumber})`,
          companyId: params.companyId || null,
        });

        return {
          isPaid: true,
          financialAccountId: vault.id,
          financialAccountName: vault.account_name,
          checkNoteId: null,
          resolvedPaymentMethod: "marketplace_vault",
          resolvedPaymentStatus: "paid",
          marketplacePlatform: detectedMp,
        };
      }
    }
  }

  const isPaid = isSettlementPaid(
    params.paymentMethod,
    params.paymentStatus,
    params.status
  );

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
      resolvedPaymentMethod: params.paymentMethod || "term",
      resolvedPaymentStatus: "unpaid",
      marketplacePlatform: null as MarketplacePlatform | null,
    };
  }

  const mappedMethod = rawMappedMethod;

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
      contactName: resolvedSupplierName || "",
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
      resolvedPaymentMethod: "check_promissory",
      resolvedPaymentStatus: "paid",
      marketplacePlatform: null as MarketplacePlatform | null,
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
    category:
      mappedMethod === "marketplace_vault"
        ? "marketplace_commission"
        : params.isExpense
        ? "rent_utilities"
        : "supplier_payment",
    title:
      mappedMethod === "marketplace_vault"
        ? `Pazaryeri Gider Mahsubu: ${params.invoiceNumber}`
        : `Alış Faturası Ödemesi: ${params.invoiceNumber}`,
    amount: grandTotal,
    currency: curr,
    exchangeRate: params.exchangeRate || 1,
    date: params.invoiceDate || new Date(),
    paymentMethod: mappedMethod,
    accountId: acctInfo.accountId,
    accountName: acctInfo.accountName,
    referenceNo: params.invoiceNumber,
    contactName: resolvedSupplierName || "",
    description:
      mappedMethod === "marketplace_vault"
        ? `Pazaryeri Kasa Mahsubu (#${params.invoiceNumber})`
        : params.isExpense
        ? `Gider Faturası (#${params.invoiceNumber})`
        : `Alış Faturası Ödemesi (#${params.invoiceNumber})`,
    companyId: params.companyId || null,
  });

  return {
    isPaid: true,
    financialAccountId: acctInfo.accountId,
    financialAccountName: acctInfo.accountName,
    checkNoteId: null,
    resolvedPaymentMethod: mappedMethod,
    resolvedPaymentStatus: "paid",
    marketplacePlatform: null as MarketplacePlatform | null,
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

  // If this sales invoice belongs to a marketplace on a shopLP store, route to its dedicated Marketplace Vault
  const detectedMp =
    mappedMethod === "marketplace_vault"
      ? detectMarketplacePlatform({
          paymentMethod: params.paymentMethod,
          invoiceNumber: params.invoiceNumber,
          accountName: params.financialAccountName,
        })
      : null;

  if (mappedMethod === "marketplace_vault" && (await isShopLPStore(db, params.storeId))) {
    await deleteCheckNoteForSource(db, params.storeId, "sales_invoice", params.invoiceId);
    let resolvedAccountId: number | null = null;
    let resolvedAccountName: string | null = null;

    if (params.financialAccountId) {
      const explicitAcct = await resolveFinancialAccountInfo(
        db,
        params.storeId,
        params.financialAccountId,
        params.financialAccountName,
        "marketplace_vault",
        curr
      );
      resolvedAccountId = explicitAcct.accountId;
      resolvedAccountName = explicitAcct.accountName;
    }

    if (!resolvedAccountId && detectedMp) {
      const vault = await ensureMarketplaceVaultAccount(db, params.storeId, detectedMp);
      if (vault) {
        resolvedAccountId = vault.id;
        resolvedAccountName = vault.account_name;
      }
    }

    const brandLabel = detectedMp ? MARKETPLACE_VAULT_DEFS[detectedMp].brandLabel : "Pazaryeri";
    await upsertPortfolioTxForSource(db, {
      storeId: params.storeId,
      sourceType: "sales_invoice",
      sourceId: params.invoiceId,
      type: "income",
      category: "online_marketplace",
      title: `${brandLabel} Siparişi: #${params.invoiceNumber}`,
      amount: grandTotal,
      currency: curr,
      exchangeRate: params.exchangeRate || 1,
      date: params.invoiceDate || new Date(),
      paymentMethod: "marketplace_vault",
      accountId: resolvedAccountId,
      accountName: resolvedAccountName || `${brandLabel} Kasası`,
      referenceNo: params.invoiceNumber,
      contactName: params.customerName || brandLabel,
      description: `${brandLabel} Pazaryeri Sipariş Alacağı (#${params.invoiceNumber})`,
      companyId: params.companyId || null,
    });

    return {
      isPaid: true,
      financialAccountId: resolvedAccountId,
      financialAccountName: resolvedAccountName || `${brandLabel} Kasası`,
      checkNoteId: null,
    };
  }

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

/**
 * Idempotently ensures marketplace vaults for configured/transacted e-markets
 * on shopLP stores and reconciles historical marketplace orders (+) and
 * marketplace expense purchase invoices (-).
 */
export async function backfillMarketplaceVaults(
  db: DbConn,
  storeId: number
): Promise<{
  skipped?: boolean;
  ensuredVaults: string[];
  syncedOrders: number;
  removedCancelledOrders: number;
  syncedExpenseInvoices: number;
}> {
  if (!storeId) {
    return { skipped: true, ensuredVaults: [], syncedOrders: 0, removedCancelledOrders: 0, syncedExpenseInvoices: 0 };
  }
  const shopLp = await isShopLPStore(db, storeId);
  if (!shopLp) {
    return { skipped: true, ensuredVaults: [], syncedOrders: 0, removedCancelledOrders: 0, syncedExpenseInvoices: 0 };
  }

  await ensureTreasurySchema(db);
  const ensuredVaults = new Set<string>();
  let syncedOrders = 0;
  let removedCancelledOrders = 0;
  let syncedExpenseInvoices = 0;

  // 1. Auto-create vaults for any marketplace configured in store settings columns or branding JSON
  try {
    const storeRes = await db.query(
      `SELECT branding, hepsiburada_settings, trendyol_settings, n11_settings, amazon_settings, pazarama_settings
       FROM stores WHERE id = $1 LIMIT 1`,
      [storeId]
    );
    const stRow = storeRes.rows[0] || {};
    const branding = stRow.branding || {};
    const mergeCfg = (a: any, b: any) => ({
      ...(a && typeof a === "object" ? a : {}),
      ...(b && typeof b === "object" ? b : {}),
    });
    const configCheck: Array<[MarketplacePlatform, any]> = [
      ["hepsiburada", mergeCfg(branding.hepsiburada_settings, stRow.hepsiburada_settings)],
      ["trendyol", mergeCfg(branding.trendyol_settings, stRow.trendyol_settings)],
      ["n11", mergeCfg(branding.n11_settings, stRow.n11_settings)],
      ["amazon", mergeCfg(branding.amazon_settings, stRow.amazon_settings)],
      ["pazarama", mergeCfg(branding.pazarama_settings, stRow.pazarama_settings)],
    ];
    for (const [platform, cfg] of configCheck) {
      if (
        cfg &&
        typeof cfg === "object" &&
        (cfg.is_active ||
          cfg.enabled ||
          cfg.merchantId ||
          cfg.merchant_id ||
          cfg.supplierId ||
          cfg.supplier_id ||
          cfg.apiKey ||
          cfg.api_key ||
          cfg.sellerId ||
          cfg.seller_id ||
          cfg.clientId ||
          cfg.client_id)
      ) {
        const v = await ensureMarketplaceVaultAccount(db, storeId, platform);
        if (v) ensuredVaults.add(v.account_name);
      }
    }
  } catch (err) {
    console.warn("[backfillMarketplaceVaults] branding scan warning:", err);
  }

  // 2. Reconcile marketplace sales_invoices (+ orders & cancel cleanup)
  try {
    const siRes = await db.query(
      `SELECT si.id, si.sale_id, si.invoice_number, si.invoice_date, si.grand_total, si.total_amount,
              si.currency, si.status, si.payment_method, si.customer_name,
              s.source AS sale_source, s.status AS sale_status
       FROM sales_invoices si
       LEFT JOIN sales s ON s.id = si.sale_id AND s.store_id = si.store_id
       WHERE si.store_id = $1`,
      [storeId]
    );

    for (const row of siRes.rows) {
      const mp = detectMarketplacePlatform({
        source: row.sale_source,
        paymentMethod: row.payment_method,
        invoiceNumber: row.invoice_number,
      });
      if (!mp) continue;

      const isCancelled = isCancelledOrDraftStatus(row.status) || isCancelledOrDraftStatus(row.sale_status);
      const amt = Number(row.grand_total || row.total_amount || 0);
      const res = await syncMarketplaceOrderTreasury(db, {
        storeId,
        platform: mp,
        orderNumber: String(row.invoice_number || `INV-${row.id}`),
        salesInvoiceId: Number(row.id),
        saleId: row.sale_id ? Number(row.sale_id) : null,
        amount: amt,
        currency: row.currency || "TRY",
        date: row.invoice_date || new Date(),
        customerName: row.customer_name || MARKETPLACE_VAULT_DEFS[mp].brandLabel,
        status: isCancelled ? "cancelled" : "approved",
      });
      if (res.deleted) removedCancelledOrders++;
      else if (res.synced) {
        syncedOrders++;
        if (res.accountName) ensuredVaults.add(res.accountName);
      }
    }
  } catch (err) {
    console.warn("[backfillMarketplaceVaults] sales_invoices scan warning:", err);
  }

  // 3. Reconcile standalone marketplace sales (that have no sales_invoice row)
  try {
    const saleRes = await db.query(
      `SELECT s.id, s.total_amount, s.currency, s.status, s.customer_name, s.payment_method, s.source, s.created_at
       FROM sales s
       WHERE s.store_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM sales_invoices si WHERE si.sale_id = s.id AND si.store_id = s.store_id
         )`,
      [storeId]
    );

    for (const s of saleRes.rows) {
      const mp = detectMarketplacePlatform({
        source: s.source,
        paymentMethod: s.payment_method,
      });
      if (!mp) continue;

      const res = await syncMarketplaceOrderTreasury(db, {
        storeId,
        platform: mp,
        orderNumber: `${MARKETPLACE_VAULT_DEFS[mp].code}-${s.id}`,
        saleId: Number(s.id),
        amount: Number(s.total_amount || 0),
        currency: s.currency || "TRY",
        date: s.created_at || new Date(),
        customerName: s.customer_name || MARKETPLACE_VAULT_DEFS[mp].brandLabel,
        status: s.status || "completed",
      });
      if (res.deleted) removedCancelledOrders++;
      else if (res.synced) {
        syncedOrders++;
        if (res.accountName) ensuredVaults.add(res.accountName);
      }
    }
  } catch (err) {
    console.warn("[backfillMarketplaceVaults] standalone sales scan warning:", err);
  }

  // 4. Reconcile marketplace EXPENSE purchase invoices (is_expense = TRUE ONLY; inventory stock purchases excluded!)
  try {
    const piRes = await db.query(
      `SELECT pi.id, pi.invoice_number, pi.document_number, pi.invoice_date, pi.grand_total, pi.total_amount,
              pi.currency, pi.exchange_rate, pi.payment_method, pi.payment_status, pi.status,
              pi.is_expense, pi.company_id, pi.supplier_name, pi.financial_account_id, pi.financial_account_name,
              c.title AS company_title, c.tax_number AS company_tax_number
       FROM purchase_invoices pi
       LEFT JOIN companies c ON c.id = pi.company_id
       WHERE pi.store_id = $1
         AND COALESCE(pi.is_expense, FALSE) = TRUE`,
      [storeId]
    );

    for (const pi of piRes.rows) {
      const supplierLabel = pi.supplier_name || pi.company_title || "";
      const detectedMp = detectMarketplacePlatform({
        supplierName: supplierLabel,
        taxNumber: pi.company_tax_number,
        invoiceNumber: pi.invoice_number || pi.document_number,
        accountName: pi.financial_account_name,
      });
      if (!detectedMp) continue;

      const isExplicitNonMpPaid =
        !isTermOrUnpaidMethod(pi.payment_method) &&
        mapTreasuryMethod(pi.payment_method) !== "marketplace_vault";
      if (isExplicitNonMpPaid) continue;

      const invNo = pi.invoice_number || pi.document_number || `PI-${pi.id}`;
      const amt = Number(pi.grand_total || pi.total_amount || 0);
      const syncRes = await syncPurchaseInvoiceTreasury(db, {
        storeId,
        invoiceId: Number(pi.id),
        invoiceNumber: invNo,
        invoiceDate: pi.invoice_date || new Date(),
        grandTotal: amt,
        currency: pi.currency || "TRY",
        exchangeRate: Number(pi.exchange_rate || 1) || 1,
        paymentMethod: pi.payment_method || "term",
        paymentStatus: pi.payment_status || "unpaid",
        status: pi.status || "approved",
        isExpense: true,
        companyId: pi.company_id ? Number(pi.company_id) : null,
        supplierName: supplierLabel,
        taxNumber: pi.company_tax_number || null,
        financialAccountId: pi.financial_account_id ? Number(pi.financial_account_id) : null,
        financialAccountName: pi.financial_account_name || null,
      });

      if (syncRes.isPaid && syncRes.financialAccountId) {
        syncedExpenseInvoices++;
        if (syncRes.financialAccountName) ensuredVaults.add(syncRes.financialAccountName);

        if (
          pi.payment_method !== "marketplace_vault" ||
          pi.payment_status !== "paid" ||
          Number(pi.financial_account_id || 0) !== Number(syncRes.financialAccountId)
        ) {
          await db.query(
            `UPDATE purchase_invoices
             SET payment_method = 'marketplace_vault',
                 payment_status = 'paid',
                 financial_account_id = $1,
                 financial_account_name = $2
             WHERE id = $3 AND store_id = $4`,
            [syncRes.financialAccountId, syncRes.financialAccountName, Number(pi.id), storeId]
          );
        }

        // Ensure supplier cari mahsup (debt) row exists so open balance nets to 0
        if (pi.company_id && !isCancelledOrDraftStatus(pi.status)) {
          const existingDebt = await db.query(
            `SELECT id FROM current_account_transactions
             WHERE store_id = $1 AND purchase_invoice_id = $2 AND type = 'debt'
             LIMIT 1`,
            [storeId, Number(pi.id)]
          );
          if (existingDebt.rows.length === 0) {
            await db.query(
              `INSERT INTO current_account_transactions
                (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date, financial_account_id, financial_account_name)
               VALUES ($1, $2, $3, 'debt', $4, $5, $6, $7, 'marketplace_vault', $8, $9, $10)`,
              [
                storeId,
                Number(pi.company_id),
                Number(pi.id),
                amt,
                (pi.currency || "TRY").toUpperCase(),
                Number(pi.exchange_rate || 1) || 1,
                `Pazaryeri Hakediş Mahsubu: ${invNo}`,
                pi.invoice_date || new Date(),
                syncRes.financialAccountId,
                syncRes.financialAccountName,
              ]
            );
          }
        }
      }
    }
  } catch (err) {
    console.warn("[backfillMarketplaceVaults] purchase_invoices scan warning:", err);
  }

  return {
    ensuredVaults: Array.from(ensuredVaults),
    syncedOrders,
    removedCancelledOrders,
    syncedExpenseInvoices,
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
    // Never delete explicitly manual entries or entries linked to a financial account / check-note
    await db.query(`
      DELETE FROM current_account_transactions cat
      USING purchase_invoices pi
      WHERE cat.purchase_invoice_id IS NULL
        AND COALESCE(cat.is_manual, FALSE) = FALSE
        AND cat.financial_account_id IS NULL
        AND cat.check_note_id IS NULL
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
