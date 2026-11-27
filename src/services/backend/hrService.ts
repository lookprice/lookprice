import crypto from "crypto";
import { Pool, PoolClient } from "pg";
import { resolveFinancialAccountInfo, mapTreasuryMethod } from "../../../routes/store/treasurySync";

let hrSchemaReady = false;

export const HR_PAYROLL_ITEM_LABELS: Record<string, string> = {
  salary: "Maaş",
  advance: "Avans",
  bonus: "Prim / İkramiye",
  sgk: "SGK & Vergi",
  meal_transport: "Yol & Yemek",
  overtime: "Fazla Mesai",
  deduction: "Kesinti",
};

export const HR_LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Yıllık İzin",
  sick: "Hastalık / Raporlu",
  excuse: "Mazeret İzni",
  unpaid: "Ücretsiz İzin",
  parental: "Doğum / Babalık İzni",
};

export function normalizePhone(raw?: string | null): string {
  if (!raw) return "";
  let digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  return digits;
}

export function generateQrToken(): string {
  return `LPQR-${crypto.randomBytes(9).toString("hex").toUpperCase()}`;
}

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function parseShiftTimeToMinutes(hhmm?: string | null, fallback = 540): number {
  if (!hhmm || typeof hhmm !== "string") return fallback;
  const parts = hhmm.trim().split(":");
  if (parts.length < 2) return fallback;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return fallback;
  return h * 60 + m;
}

export function computeAttendanceMetrics(params: {
  checkInAt?: Date | string | null;
  checkOutAt?: Date | string | null;
  shiftStart?: string | null;
  shiftEnd?: string | null;
  lateToleranceMin?: number | null;
  breakMinutes?: number | null;
}) {
  const shiftStartMin = parseShiftTimeToMinutes(params.shiftStart, 9 * 60);
  const shiftEndMin = parseShiftTimeToMinutes(params.shiftEnd, 18 * 60);
  const tolerance = Math.max(0, Number(params.lateToleranceMin ?? 15) || 0);
  const breakMins = Math.max(0, Number(params.breakMinutes ?? 0) || 0);

  let lateMinutes = 0;
  let earlyLeaveMinutes = 0;
  let overtimeMinutes = 0;
  let workedMinutes = 0;

  const checkIn = params.checkInAt ? new Date(params.checkInAt) : null;
  const checkOut = params.checkOutAt ? new Date(params.checkOutAt) : null;

  if (checkIn && !isNaN(checkIn.getTime())) {
    const inMinOfDay = checkIn.getHours() * 60 + checkIn.getMinutes();
    const diffLate = inMinOfDay - shiftStartMin;
    if (diffLate > tolerance) {
      lateMinutes = diffLate;
    }
  }

  if (checkIn && checkOut && !isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime())) {
    const rawDiff = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / 60000));
    workedMinutes = Math.max(0, rawDiff - breakMins);

    const expectedDuration =
      shiftEndMin > shiftStartMin
        ? Math.max(60, shiftEndMin - shiftStartMin - 60) // assumes ~60m standard break if unlogged, or shift span
        : 480;

    const outMinOfDay = checkOut.getHours() * 60 + checkOut.getMinutes();
    if (shiftEndMin > shiftStartMin) {
      if (outMinOfDay < shiftEndMin - 5 && rawDiff < shiftEndMin - shiftStartMin) {
        earlyLeaveMinutes = Math.max(0, shiftEndMin - outMinOfDay);
      }
      if (outMinOfDay > shiftEndMin + 15) {
        overtimeMinutes = outMinOfDay - shiftEndMin;
      }
    } else if (workedMinutes > expectedDuration + 15) {
      overtimeMinutes = workedMinutes - expectedDuration;
    }
  }

  return {
    lateMinutes,
    earlyLeaveMinutes,
    overtimeMinutes,
    workedMinutes,
  };
}

export function computeAnnualLeaveEntitlement(
  startDate?: string | Date | null,
  overrideDays?: number | null
): { entitledDays: number; tenureYears: number } {
  if (overrideDays !== undefined && overrideDays !== null && !isNaN(Number(overrideDays)) && Number(overrideDays) >= 0) {
    const tenureYears = startDate
      ? Math.max(0, (Date.now() - new Date(startDate).getTime()) / (365.25 * 86400000))
      : 0;
    return { entitledDays: Number(overrideDays), tenureYears: Number(tenureYears.toFixed(1)) };
  }
  if (!startDate) return { entitledDays: 14, tenureYears: 0 };
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return { entitledDays: 14, tenureYears: 0 };

  const diffYears = Math.max(0, (Date.now() - start.getTime()) / (365.25 * 86400000));
  let entitled = 14;
  if (diffYears >= 15) entitled = 26;
  else if (diffYears >= 5) entitled = 20;
  else entitled = 14;

  return { entitledDays: entitled, tenureYears: Number(diffYears.toFixed(1)) };
}

export async function ensureHrSchema(db: Pool | PoolClient) {
  if (hrSchemaReady) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS hr_location_checkpoints (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        branch_id INTEGER NOT NULL,
        label TEXT NOT NULL,
        branch_type TEXT DEFAULT 'STORE',
        qr_token TEXT NOT NULL UNIQUE,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        radius_meters INTEGER NOT NULL DEFAULT 150,
        strict_gps BOOLEAN NOT NULL DEFAULT TRUE,
        work_start TEXT DEFAULT '09:00',
        work_end TEXT DEFAULT '18:00',
        late_tolerance_min INTEGER DEFAULT 15,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, branch_id)
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS hr_employees (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        branch_id INTEGER,
        user_id INTEGER,
        employee_code TEXT,
        full_name TEXT NOT NULL,
        tc_no TEXT,
        phone TEXT NOT NULL,
        phone_normalized TEXT NOT NULL,
        email TEXT,
        pin_hash TEXT,
        pin_failed_attempts INTEGER DEFAULT 0,
        pin_locked_until TIMESTAMP,
        role_title TEXT DEFAULT 'Personel',
        department TEXT DEFAULT 'Genel',
        employment_type TEXT DEFAULT 'full_time',
        start_date DATE DEFAULT CURRENT_DATE,
        end_date DATE,
        status TEXT DEFAULT 'active',
        shift_start TEXT DEFAULT '09:00',
        shift_end TEXT DEFAULT '18:00',
        late_tolerance_min INTEGER DEFAULT 15,
        base_salary NUMERIC DEFAULT 0,
        salary_currency TEXT DEFAULT 'TRY',
        meal_allowance NUMERIC DEFAULT 0,
        transport_allowance NUMERIC DEFAULT 0,
        annual_leave_override INTEGER,
        iban TEXT,
        blood_type TEXT,
        emergency_contact_name TEXT,
        emergency_contact_phone TEXT,
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS hr_attendance_logs (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
        branch_id INTEGER,
        checkpoint_id INTEGER,
        work_date DATE NOT NULL DEFAULT CURRENT_DATE,
        check_in_at TIMESTAMP,
        check_out_at TIMESTAMP,
        break_started_at TIMESTAMP,
        break_minutes INTEGER DEFAULT 0,
        check_in_lat DOUBLE PRECISION,
        check_in_lng DOUBLE PRECISION,
        check_in_distance_m INTEGER,
        check_out_lat DOUBLE PRECISION,
        check_out_lng DOUBLE PRECISION,
        check_out_distance_m INTEGER,
        verification_status TEXT DEFAULT 'qr_gps_verified',
        late_minutes INTEGER DEFAULT 0,
        early_leave_minutes INTEGER DEFAULT 0,
        overtime_minutes INTEGER DEFAULT 0,
        worked_minutes INTEGER DEFAULT 0,
        notes TEXT,
        is_manual BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS hr_payroll_ledger (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
        period_month TEXT NOT NULL,
        item_type TEXT NOT NULL DEFAULT 'salary',
        title TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        currency TEXT NOT NULL DEFAULT 'TRY',
        status TEXT NOT NULL DEFAULT 'paid',
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method TEXT DEFAULT 'bank_transfer',
        account_id INTEGER,
        account_name TEXT,
        reference_no TEXT,
        description TEXT,
        portfolio_transaction_id INTEGER,
        requested_by_employee BOOLEAN DEFAULT FALSE,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS hr_leave_requests (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
        leave_type TEXT NOT NULL DEFAULT 'annual',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        days_count NUMERIC NOT NULL DEFAULT 1,
        reason TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewed_by INTEGER,
        reviewed_at TIMESTAMP,
        review_note TEXT,
        requested_by_employee BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS hr_documents (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
        doc_type TEXT NOT NULL DEFAULT 'other',
        title TEXT NOT NULL,
        file_name TEXT,
        stored_path TEXT,
        mime_type TEXT,
        file_size INTEGER DEFAULT 0,
        issue_date DATE,
        expiry_date DATE,
        notes TEXT,
        uploaded_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS hr_assets (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
        asset_name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        serial_no TEXT,
        assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
        return_date DATE,
        status TEXT NOT NULL DEFAULT 'assigned',
        condition_note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Extend portfolio_transactions for bidirectional HR <-> Finance linkage
    await db.query(`
      ALTER TABLE portfolio_transactions
      ADD COLUMN IF NOT EXISTS employee_id INTEGER;
    `).catch(() => {});
    await db.query(`
      ALTER TABLE portfolio_transactions
      ADD COLUMN IF NOT EXISTS payroll_item_type TEXT;
    `).catch(() => {});

    // Helpful indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hr_employees_store ON hr_employees(store_id, status);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hr_employees_phone ON hr_employees(store_id, phone_normalized);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hr_attendance_store_date ON hr_attendance_logs(store_id, work_date DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hr_attendance_emp_date ON hr_attendance_logs(employee_id, work_date DESC);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hr_payroll_store_period ON hr_payroll_ledger(store_id, period_month);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hr_payroll_tx ON hr_payroll_ledger(portfolio_transaction_id);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hr_leaves_store_status ON hr_leave_requests(store_id, status);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hr_docs_store_expiry ON hr_documents(store_id, expiry_date);`).catch(() => {});
    await db.query(`CREATE INDEX IF NOT EXISTS idx_hr_assets_store ON hr_assets(store_id, status);`).catch(() => {});

    hrSchemaReady = true;
  } catch (err) {
    console.error("[HR] ensureHrSchema error:", err);
    throw err;
  }
}

/**
 * Ensures the main store and every child branch/warehouse has a QR checkpoint row.
 */
export async function ensureCheckpointsForStore(db: Pool | PoolClient, storeId: number) {
  await ensureHrSchema(db);
  const storeRes = await db.query(
    `SELECT id, name, branch_type, parent_id
     FROM stores
     WHERE id = $1 OR parent_id = $1
     ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END, id ASC`,
    [storeId]
  );

  for (const s of storeRes.rows) {
    const bType = s.branch_type || "STORE";
    const label = s.name || (bType === "WAREHOUSE" ? `Depo #${s.id}` : `Mağaza #${s.id}`);
    await db.query(
      `INSERT INTO hr_location_checkpoints (store_id, branch_id, label, branch_type, qr_token)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (store_id, branch_id)
       DO UPDATE SET label = COALESCE(NULLIF(hr_location_checkpoints.label, ''), EXCLUDED.label),
                     branch_type = EXCLUDED.branch_type`,
      [storeId, s.id, label, bType, generateQrToken()]
    );
  }

  const cpRes = await db.query(
    `SELECT cp.*, s.address AS store_address, s.phone AS store_phone
     FROM hr_location_checkpoints cp
     LEFT JOIN stores s ON s.id = cp.branch_id
     WHERE cp.store_id = $1
     ORDER BY CASE WHEN cp.branch_id = $1 THEN 0 ELSE 1 END, cp.id ASC`,
    [storeId]
  );
  return cpRes.rows;
}

/**
 * HR -> Finance bidirectional sync:
 * Creates or updates a linked `portfolio_transactions` row for a PAID hr_payroll_ledger item.
 */
export async function syncPayrollToPortfolioTransaction(
  db: Pool | PoolClient,
  ledgerRow: any,
  employeeName: string
): Promise<number | null> {
  if (!ledgerRow || !ledgerRow.id) return null;
  const storeId = Number(ledgerRow.store_id);
  const ledgerId = Number(ledgerRow.id);

  // Only paid non-deduction items create an expense cash outflow in Finance
  if (ledgerRow.status !== "paid" || ledgerRow.item_type === "deduction") {
    if (ledgerRow.portfolio_transaction_id) {
      await db.query(
        `DELETE FROM portfolio_transactions WHERE id = $1 AND store_id = $2`,
        [Number(ledgerRow.portfolio_transaction_id), storeId]
      );
      await db.query(
        `UPDATE hr_payroll_ledger SET portfolio_transaction_id = NULL WHERE id = $1`,
        [ledgerId]
      );
    }
    return null;
  }

  const itemLabel = HR_PAYROLL_ITEM_LABELS[ledgerRow.item_type] || "Personel Ödemesi";
  const txTitle = (ledgerRow.title && String(ledgerRow.title).trim())
    ? String(ledgerRow.title).trim()
    : `${employeeName} — ${itemLabel} (${ledgerRow.period_month})`;
  const txCurr = String(ledgerRow.currency || "TRY").toUpperCase();
  const normalizedMethod = mapTreasuryMethod(ledgerRow.payment_method || "bank_transfer");
  const accInfo = await resolveFinancialAccountInfo(
    db,
    storeId,
    ledgerRow.account_id ? Number(ledgerRow.account_id) : null,
    ledgerRow.account_name || null,
    normalizedMethod,
    txCurr
  );
  const txDate = ledgerRow.payment_date
    ? new Date(ledgerRow.payment_date).toISOString()
    : new Date().toISOString();

  // Check if a portfolio_transaction already exists for this ledger row
  let existingTxId: number | null = ledgerRow.portfolio_transaction_id
    ? Number(ledgerRow.portfolio_transaction_id)
    : null;

  if (!existingTxId) {
    const findRes = await db.query(
      `SELECT id FROM portfolio_transactions
       WHERE store_id = $1 AND source_type = 'hr_payroll_payment' AND source_id = $2
       LIMIT 1`,
      [storeId, ledgerId]
    );
    if (findRes.rows.length > 0) {
      existingTxId = Number(findRes.rows[0].id);
    }
  }

  if (existingTxId) {
    await db.query(
      `UPDATE portfolio_transactions
       SET type = 'expense',
           category = 'staff_payroll',
           title = $1,
           amount = $2,
           currency = $3,
           date = $4,
           description = $5,
           payment_method = $6,
           reference_no = $7,
           contact_name = $8,
           account_id = $9,
           account_name = $10,
           employee_id = $11,
           payroll_item_type = $12,
           source_type = 'hr_payroll_payment',
           source_id = $13,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 AND store_id = $15`,
      [
        txTitle,
        Number(ledgerRow.amount),
        txCurr,
        txDate,
        ledgerRow.description || "",
        normalizedMethod,
        ledgerRow.reference_no || "",
        employeeName,
        accInfo.accountId,
        accInfo.accountName,
        Number(ledgerRow.employee_id),
        ledgerRow.item_type,
        ledgerId,
        existingTxId,
        storeId,
      ]
    );
    await db.query(
      `UPDATE hr_payroll_ledger SET portfolio_transaction_id = $1, account_id = $2, account_name = $3 WHERE id = $4`,
      [existingTxId, accInfo.accountId, accInfo.accountName, ledgerId]
    );
    return existingTxId;
  }

  const insRes = await db.query(
    `INSERT INTO portfolio_transactions (
       store_id, type, category, title, amount, currency, exchange_rate, date,
       description, payment_method, reference_no, contact_name,
       account_id, account_name, source_type, source_id, employee_id, payroll_item_type
     )
     VALUES ($1, 'expense', 'staff_payroll', $2, $3, $4, 1, $5, $6, $7, $8, $9, $10, $11, 'hr_payroll_payment', $12, $13, $14)
     RETURNING id`,
    [
      storeId,
      txTitle,
      Number(ledgerRow.amount),
      txCurr,
      txDate,
      ledgerRow.description || "",
      normalizedMethod,
      ledgerRow.reference_no || "",
      employeeName,
      accInfo.accountId,
      accInfo.accountName,
      ledgerId,
      Number(ledgerRow.employee_id),
      ledgerRow.item_type,
    ]
  );

  const newTxId = Number(insRes.rows[0].id);
  await db.query(
    `UPDATE hr_payroll_ledger SET portfolio_transaction_id = $1, account_id = $2, account_name = $3 WHERE id = $4`,
    [newTxId, accInfo.accountId, accInfo.accountName, ledgerId]
  );
  return newTxId;
}

/**
 * Finance -> HR bidirectional sync:
 * When a user creates or updates a `portfolio_transactions` row with `category === 'staff_payroll'`
 * and an `employee_id`, keep `hr_payroll_ledger` synchronized atomically.
 */
export async function syncPortfolioTransactionToPayroll(
  db: Pool | PoolClient,
  txRow: any
): Promise<void> {
  if (!txRow || !txRow.id || !txRow.store_id) return;
  await ensureHrSchema(db);

  const storeId = Number(txRow.store_id);
  const txId = Number(txRow.id);
  const employeeId = txRow.employee_id ? Number(txRow.employee_id) : null;
  const isStaffExpense = txRow.type === "expense" && txRow.category === "staff_payroll" && employeeId && employeeId > 0;

  if (!isStaffExpense) {
    // If previously linked to HR ledger from finance, remove the linked HR ledger entry
    await db.query(
      `DELETE FROM hr_payroll_ledger WHERE store_id = $1 AND portfolio_transaction_id = $2`,
      [storeId, txId]
    );
    return;
  }

  // Verify employee belongs to store
  const empRes = await db.query(
    `SELECT id, full_name FROM hr_employees WHERE id = $1 AND store_id = $2 LIMIT 1`,
    [employeeId, storeId]
  );
  if (empRes.rows.length === 0) return;

  const txDate = txRow.date ? new Date(txRow.date) : new Date();
  const periodMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
  const itemType = txRow.payroll_item_type && HR_PAYROLL_ITEM_LABELS[txRow.payroll_item_type]
    ? txRow.payroll_item_type
    : "salary";

  const existingLedger = await db.query(
    `SELECT id FROM hr_payroll_ledger WHERE store_id = $1 AND portfolio_transaction_id = $2 LIMIT 1`,
    [storeId, txId]
  );

  if (existingLedger.rows.length > 0) {
    await db.query(
      `UPDATE hr_payroll_ledger
       SET employee_id = $1,
           period_month = $2,
           item_type = $3,
           title = $4,
           amount = $5,
           currency = $6,
           status = 'paid',
           payment_date = $7,
           payment_method = $8,
           account_id = $9,
           account_name = $10,
           reference_no = $11,
           description = $12,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 AND store_id = $14`,
      [
        employeeId,
        periodMonth,
        itemType,
        txRow.title || `${empRes.rows[0].full_name} — ${HR_PAYROLL_ITEM_LABELS[itemType]}`,
        Number(txRow.amount),
        String(txRow.currency || "TRY").toUpperCase(),
        txDate.toISOString(),
        txRow.payment_method || "cash",
        txRow.account_id ? Number(txRow.account_id) : null,
        txRow.account_name || "",
        txRow.reference_no || "",
        txRow.description || "",
        Number(existingLedger.rows[0].id),
        storeId,
      ]
    );
  } else {
    const ins = await db.query(
      `INSERT INTO hr_payroll_ledger (
         store_id, employee_id, period_month, item_type, title, amount, currency,
         status, payment_date, payment_method, account_id, account_name,
         reference_no, description, portfolio_transaction_id, requested_by_employee
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'paid', $8, $9, $10, $11, $12, $13, $14, FALSE)
       RETURNING id`,
      [
        storeId,
        employeeId,
        periodMonth,
        itemType,
        txRow.title || `${empRes.rows[0].full_name} — ${HR_PAYROLL_ITEM_LABELS[itemType]}`,
        Number(txRow.amount),
        String(txRow.currency || "TRY").toUpperCase(),
        txDate.toISOString(),
        txRow.payment_method || "cash",
        txRow.account_id ? Number(txRow.account_id) : null,
        txRow.account_name || "",
        txRow.reference_no || "",
        txRow.description || "",
        txId,
      ]
    );
    // Stamp back-reference on portfolio_transactions
    await db.query(
      `UPDATE portfolio_transactions
       SET source_type = COALESCE(source_type, 'hr_payroll_payment'),
           source_id = COALESCE(source_id, $1)
       WHERE id = $2 AND store_id = $3`,
      [Number(ins.rows[0].id), txId, storeId]
    );
  }
}

export async function deleteHrLedgerForPortfolioTransaction(
  db: Pool | PoolClient,
  storeId: number,
  txId: number
): Promise<void> {
  try {
    await ensureHrSchema(db);
    await db.query(
      `DELETE FROM hr_payroll_ledger WHERE store_id = $1 AND portfolio_transaction_id = $2`,
      [storeId, txId]
    );
  } catch (e) {
    // Non-fatal if HR table hasn't been touched
  }
}
