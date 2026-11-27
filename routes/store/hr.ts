import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";
import { pool } from "../../models/db";
import { getAuthorizedStoreId } from "../../middleware/auth";
import {
  ensureHrSchema,
  ensureCheckpointsForStore,
  normalizePhone,
  generateQrToken,
  computeAttendanceMetrics,
  computeAnnualLeaveEntitlement,
  syncPayrollToPortfolioTransaction,
  HR_PAYROLL_ITEM_LABELS,
  HR_LEAVE_TYPE_LABELS,
} from "../../src/services/backend/hrService";

const router = express.Router();

// Store HR documents outside public/ with strict confinement
const HR_DOCS_BASE_DIR = path.resolve(process.cwd(), "uploads", "hr_docs");
if (!fs.existsSync(HR_DOCS_BASE_DIR)) {
  fs.mkdirSync(HR_DOCS_BASE_DIR, { recursive: true });
}

const ALLOWED_DOC_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_DOC_EXTS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp"]);

const hrDocUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, HR_DOCS_BASE_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safeExt = ALLOWED_DOC_EXTS.has(ext) ? ext : ".bin";
      cb(null, `hrdoc_${Date.now()}_${crypto.randomBytes(8).toString("hex")}${safeExt}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_DOC_MIMES.has(file.mimetype) || !ALLOWED_DOC_EXTS.has(ext)) {
      return cb(new Error("Yalnızca PDF, JPG, PNG veya WEBP belgeleri yüklenebilir (maks. 10 MB)."));
    }
    cb(null, true);
  },
});

function resolveStoreId(req: any): number {
  const requested = req.query?.storeId ?? req.query?.store_id ?? req.body?.storeId ?? req.body?.store_id;
  const authId = getAuthorizedStoreId(req, requested);
  return authId > 0 ? authId : Number(req.user?.store_id || 0);
}

function generatePin4(): string {
  return String(crypto.randomInt(1000, 10000));
}

// ============================================================================
// 1. OVERVIEW & LIVE BOARD
// ============================================================================
router.get("/overview", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const storeRes = await pool.query(`SELECT id, name, slug, branding FROM stores WHERE id = $1 LIMIT 1`, [storeId]);
    const storeRow = storeRes.rows[0] || {};
    const checkpoints = await ensureCheckpointsForStore(pool, storeId);

    const todayStr = new Date().toISOString().slice(0, 10);
    const currentMonth = todayStr.slice(0, 7);

    const [empRes, todayAttRes, pendingLeavesRes, pendingAdvRes, expiringDocsRes, assetsCountRes] = await Promise.all([
      pool.query(
        `SELECT e.*, s.name AS branch_name, s.branch_type
         FROM hr_employees e
         LEFT JOIN stores s ON s.id = e.branch_id
         WHERE e.store_id = $1
         ORDER BY CASE WHEN e.status = 'active' THEN 0 ELSE 1 END, e.full_name ASC`,
        [storeId]
      ),
      pool.query(
        `SELECT a.*, e.full_name, e.role_title, e.department, e.shift_start, e.shift_end, cp.label AS checkpoint_label
         FROM hr_attendance_logs a
         JOIN hr_employees e ON e.id = a.employee_id
         LEFT JOIN hr_location_checkpoints cp ON cp.id = a.checkpoint_id
         WHERE a.store_id = $1 AND a.work_date = $2
         ORDER BY a.check_in_at DESC`,
        [storeId, todayStr]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS cnt FROM hr_leave_requests WHERE store_id = $1 AND status = 'pending'`,
        [storeId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS cnt FROM hr_payroll_ledger WHERE store_id = $1 AND status = 'pending_request'`,
        [storeId]
      ),
      pool.query(
        `SELECT d.*, e.full_name
         FROM hr_documents d
         JOIN hr_employees e ON e.id = d.employee_id
         WHERE d.store_id = $1 AND d.expiry_date IS NOT NULL AND d.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
         ORDER BY d.expiry_date ASC`,
        [storeId]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS cnt FROM hr_assets WHERE store_id = $1 AND status = 'assigned'`,
        [storeId]
      ),
    ]);

    const activeEmployees = empRes.rows.filter((e: any) => e.status === "active");
    const checkedInIds = new Set(todayAttRes.rows.map((a: any) => Number(a.employee_id)));
    const onSiteNow = todayAttRes.rows.filter((a: any) => a.check_in_at && !a.check_out_at);
    const lateToday = todayAttRes.rows.filter((a: any) => Number(a.late_minutes || 0) > 0);
    const notCheckedIn = activeEmployees.filter((e: any) => !checkedInIds.has(Number(e.id)));

    res.json({
      store_slug: storeRow.slug || "",
      store_name: storeRow.name || "",
      today: todayStr,
      current_month: currentMonth,
      kpis: {
        active_employees: activeEmployees.length,
        total_employees: empRes.rows.length,
        on_site_now: onSiteNow.length,
        checked_in_today: checkedInIds.size,
        late_today: lateToday.length,
        not_checked_in: notCheckedIn.length,
        pending_leaves: Number(pendingLeavesRes.rows[0]?.cnt || 0),
        pending_advances: Number(pendingAdvRes.rows[0]?.cnt || 0),
        expiring_documents: expiringDocsRes.rows.length,
        assigned_assets: Number(assetsCountRes.rows[0]?.cnt || 0),
      },
      on_site_list: onSiteNow,
      today_attendance: todayAttRes.rows,
      not_checked_in_list: notCheckedIn.map((e: any) => ({
        id: e.id,
        full_name: e.full_name,
        role_title: e.role_title,
        branch_name: e.branch_name || storeRow.name || "Merkez",
        shift_start: e.shift_start,
      })),
      expiring_documents_list: expiringDocsRes.rows,
      checkpoints,
    });
  } catch (err: any) {
    console.error("[HR] GET /overview error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 2. EMPLOYEES CRUD & PIN MANAGEMENT
// ============================================================================
router.get("/employees", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const statusFilter = typeof req.query.status === "string" ? req.query.status : "all";
    const branchFilter = req.query.branch_id ? Number(req.query.branch_id) : null;

    const params: any[] = [storeId];
    let where = "WHERE e.store_id = $1";
    if (statusFilter !== "all") {
      params.push(statusFilter);
      where += ` AND e.status = $${params.length}`;
    }
    if (branchFilter && !isNaN(branchFilter)) {
      params.push(branchFilter);
      where += ` AND e.branch_id = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT e.id, e.store_id, e.branch_id, e.user_id, e.employee_code, e.full_name,
              e.tc_no, e.phone, e.email, (e.pin_hash IS NOT NULL) AS has_pin,
              e.role_title, e.department, e.employment_type, e.start_date, e.end_date,
              e.status, e.shift_start, e.shift_end, e.late_tolerance_min,
              e.base_salary, e.salary_currency, e.meal_allowance, e.transport_allowance,
              e.annual_leave_override, e.iban, e.blood_type,
              e.emergency_contact_name, e.emergency_contact_phone, e.address, e.notes,
              s.name AS branch_name, s.branch_type,
              u.email AS linked_user_email, u.role AS linked_user_role
       FROM hr_employees e
       LEFT JOIN stores s ON s.id = e.branch_id
       LEFT JOIN users u ON u.id = e.user_id
       ${where}
       ORDER BY CASE WHEN e.status = 'active' THEN 0 ELSE 1 END, e.full_name ASC`,
      params
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error("[HR] GET /employees error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/employees", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const body = req.body || {};
    const fullName = String(body.full_name || "").trim();
    const rawPhone = String(body.phone || "").trim();
    const cleanPhone = normalizePhone(rawPhone);

    if (!fullName || !cleanPhone) {
      return res.status(400).json({ error: "Ad Soyad ve geçerli telefon numarası zorunludur." });
    }

    // Check duplicate active phone within same store
    const dupRes = await pool.query(
      `SELECT id, full_name FROM hr_employees WHERE store_id = $1 AND phone_normalized = $2 AND status = 'active' LIMIT 1`,
      [storeId, cleanPhone]
    );
    if (dupRes.rows.length > 0) {
      return res.status(409).json({
        error: `Bu telefon numarası zaten aktif personel (${dupRes.rows[0].full_name}) kaydında kullanılıyor.`,
      });
    }

    const plainPin = /^\d{4,6}$/.test(String(body.pin || "").trim())
      ? String(body.pin).trim()
      : generatePin4();
    const pinHash = await bcrypt.hash(plainPin, 10);

    let branchId = storeId;
    if (body.branch_id) {
      const requestedBranchId = Number(body.branch_id);
      const branchCheck = await pool.query(
        `SELECT id FROM stores WHERE id = $1 AND (id = $2 OR parent_id = $2) LIMIT 1`,
        [requestedBranchId, storeId]
      );
      if (branchCheck.rows.length === 0) {
        return res.status(403).json({ error: "Seçilen şube/depo bu işletmeye ait değil." });
      }
      branchId = requestedBranchId;
    }
    const userId = body.user_id ? Number(body.user_id) : null;

    const ins = await pool.query(
      `INSERT INTO hr_employees (
         store_id, branch_id, user_id, employee_code, full_name, tc_no, phone, phone_normalized,
         email, pin_hash, role_title, department, employment_type, start_date, end_date, status,
         shift_start, shift_end, late_tolerance_min, base_salary, salary_currency,
         meal_allowance, transport_allowance, annual_leave_override, iban, blood_type,
         emergency_contact_name, emergency_contact_phone, address, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
       RETURNING id, store_id, branch_id, user_id, employee_code, full_name, tc_no, phone, email,
                 role_title, department, employment_type, start_date, end_date, status,
                 shift_start, shift_end, late_tolerance_min, base_salary, salary_currency,
                 meal_allowance, transport_allowance, annual_leave_override, iban, blood_type,
                 emergency_contact_name, emergency_contact_phone, address, notes`,
      [
        storeId,
        branchId,
        userId,
        String(body.employee_code || "").trim() || null,
        fullName,
        String(body.tc_no || "").trim() || null,
        rawPhone,
        cleanPhone,
        String(body.email || "").trim() || null,
        pinHash,
        String(body.role_title || "Personel").trim(),
        String(body.department || "Genel").trim(),
        body.employment_type || "full_time",
        body.start_date || new Date().toISOString().slice(0, 10),
        body.end_date || null,
        body.status || "active",
        body.shift_start || "09:00",
        body.shift_end || "18:00",
        Number(body.late_tolerance_min ?? 15) || 15,
        Number(String(body.base_salary ?? 0).replace(/,/g, ".")) || 0,
        String(body.salary_currency || "TRY").toUpperCase(),
        Number(String(body.meal_allowance ?? 0).replace(/,/g, ".")) || 0,
        Number(String(body.transport_allowance ?? 0).replace(/,/g, ".")) || 0,
        body.annual_leave_override !== undefined && body.annual_leave_override !== "" && body.annual_leave_override !== null
          ? Number(body.annual_leave_override)
          : null,
        String(body.iban || "").trim() || null,
        String(body.blood_type || "").trim() || null,
        String(body.emergency_contact_name || "").trim() || null,
        String(body.emergency_contact_phone || "").trim() || null,
        String(body.address || "").trim() || null,
        String(body.notes || "").trim() || null,
      ]
    );

    res.json({ success: true, employee: ins.rows[0], generated_pin: plainPin });
  } catch (err: any) {
    console.error("[HR] POST /employees error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/employees/:id", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const empId = Number(req.params.id);
    const body = req.body || {};

    const existing = await pool.query(
      `SELECT * FROM hr_employees WHERE id = $1 AND store_id = $2 LIMIT 1`,
      [empId, storeId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Personel bulunamadı." });
    }
    const cur = existing.rows[0];

    const rawPhone = body.phone !== undefined ? String(body.phone).trim() : cur.phone;
    const cleanPhone = normalizePhone(rawPhone);
    if (!cleanPhone) {
      return res.status(400).json({ error: "Geçerli bir telefon numarası gereklidir." });
    }

    if (cleanPhone !== cur.phone_normalized && (body.status ?? cur.status) === "active") {
      const dupPhone = await pool.query(
        `SELECT id, full_name FROM hr_employees WHERE store_id = $1 AND phone_normalized = $2 AND status = 'active' AND id <> $3 LIMIT 1`,
        [storeId, cleanPhone, empId]
      );
      if (dupPhone.rows.length > 0) {
        return res.status(409).json({
          error: `Bu telefon numarası zaten aktif personel (${dupPhone.rows[0].full_name}) kaydında kullanılıyor.`,
        });
      }
    }

    let resolvedBranchId = cur.branch_id;
    if (body.branch_id !== undefined) {
      if (body.branch_id) {
        const reqBranchId = Number(body.branch_id);
        const branchCheck = await pool.query(
          `SELECT id FROM stores WHERE id = $1 AND (id = $2 OR parent_id = $2) LIMIT 1`,
          [reqBranchId, storeId]
        );
        if (branchCheck.rows.length === 0) {
          return res.status(403).json({ error: "Seçilen şube/depo bu işletmeye ait değil." });
        }
        resolvedBranchId = reqBranchId;
      } else {
        resolvedBranchId = storeId;
      }
    }

    let nextPinHash = cur.pin_hash;
    let updatedPin: string | null = null;
    if (body.pin && /^\d{4,6}$/.test(String(body.pin).trim())) {
      updatedPin = String(body.pin).trim();
      nextPinHash = await bcrypt.hash(updatedPin, 10);
    }

    const upd = await pool.query(
      `UPDATE hr_employees
       SET branch_id = $1, user_id = $2, employee_code = $3, full_name = $4, tc_no = $5,
           phone = $6, phone_normalized = $7, email = $8, pin_hash = $9,
           role_title = $10, department = $11, employment_type = $12,
           start_date = $13, end_date = $14, status = $15,
           shift_start = $16, shift_end = $17, late_tolerance_min = $18,
           base_salary = $19, salary_currency = $20, meal_allowance = $21, transport_allowance = $22,
           annual_leave_override = $23, iban = $24, blood_type = $25,
           emergency_contact_name = $26, emergency_contact_phone = $27, address = $28, notes = $29,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $30 AND store_id = $31
       RETURNING id, store_id, branch_id, user_id, employee_code, full_name, tc_no, phone, email,
                 role_title, department, employment_type, start_date, end_date, status,
                 shift_start, shift_end, late_tolerance_min, base_salary, salary_currency,
                 meal_allowance, transport_allowance, annual_leave_override, iban, blood_type,
                 emergency_contact_name, emergency_contact_phone, address, notes`,
      [
        resolvedBranchId,
        body.user_id !== undefined ? (body.user_id ? Number(body.user_id) : null) : cur.user_id,
        body.employee_code !== undefined ? (String(body.employee_code).trim() || null) : cur.employee_code,
        body.full_name !== undefined ? String(body.full_name).trim() : cur.full_name,
        body.tc_no !== undefined ? (String(body.tc_no).trim() || null) : cur.tc_no,
        rawPhone,
        cleanPhone,
        body.email !== undefined ? (String(body.email).trim() || null) : cur.email,
        nextPinHash,
        body.role_title !== undefined ? String(body.role_title).trim() : cur.role_title,
        body.department !== undefined ? String(body.department).trim() : cur.department,
        body.employment_type ?? cur.employment_type,
        body.start_date || cur.start_date,
        body.end_date !== undefined ? (body.end_date || null) : cur.end_date,
        body.status ?? cur.status,
        body.shift_start ?? cur.shift_start,
        body.shift_end ?? cur.shift_end,
        body.late_tolerance_min !== undefined ? Number(body.late_tolerance_min) : cur.late_tolerance_min,
        body.base_salary !== undefined ? (Number(String(body.base_salary).replace(/,/g, ".")) || 0) : cur.base_salary,
        body.salary_currency ? String(body.salary_currency).toUpperCase() : cur.salary_currency,
        body.meal_allowance !== undefined ? (Number(String(body.meal_allowance).replace(/,/g, ".")) || 0) : cur.meal_allowance,
        body.transport_allowance !== undefined ? (Number(String(body.transport_allowance).replace(/,/g, ".")) || 0) : cur.transport_allowance,
        body.annual_leave_override !== undefined
          ? (body.annual_leave_override === "" || body.annual_leave_override === null ? null : Number(body.annual_leave_override))
          : cur.annual_leave_override,
        body.iban !== undefined ? (String(body.iban).trim() || null) : cur.iban,
        body.blood_type !== undefined ? (String(body.blood_type).trim() || null) : cur.blood_type,
        body.emergency_contact_name !== undefined ? (String(body.emergency_contact_name).trim() || null) : cur.emergency_contact_name,
        body.emergency_contact_phone !== undefined ? (String(body.emergency_contact_phone).trim() || null) : cur.emergency_contact_phone,
        body.address !== undefined ? (String(body.address).trim() || null) : cur.address,
        body.notes !== undefined ? (String(body.notes).trim() || null) : cur.notes,
        empId,
        storeId,
      ]
    );

    res.json({ success: true, employee: upd.rows[0], ...(updatedPin ? { generated_pin: updatedPin } : {}) });
  } catch (err: any) {
    console.error("[HR] PUT /employees/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/employees/:id/reset-pin", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const empId = Number(req.params.id);
    const customPin = req.body?.pin && /^\d{4,6}$/.test(String(req.body.pin).trim())
      ? String(req.body.pin).trim()
      : generatePin4();
    const pinHash = await bcrypt.hash(customPin, 10);

    const upd = await pool.query(
      `UPDATE hr_employees
       SET pin_hash = $1, pin_failed_attempts = 0, pin_locked_until = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND store_id = $3
       RETURNING id, full_name, phone`,
      [pinHash, empId, storeId]
    );
    if (upd.rows.length === 0) return res.status(404).json({ error: "Personel bulunamadı." });

    res.json({ success: true, employee: upd.rows[0], pin: customPin });
  } catch (err: any) {
    console.error("[HR] POST /employees/:id/reset-pin error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/employees/:id", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const empId = Number(req.params.id);
    const del = await pool.query(
      `DELETE FROM hr_employees WHERE id = $1 AND store_id = $2 RETURNING id`,
      [empId, storeId]
    );
    if (del.rowCount === 0) return res.status(404).json({ error: "Personel bulunamadı." });
    res.json({ success: true });
  } catch (err: any) {
    console.error("[HR] DELETE /employees/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 360-degree Employee Detail Drawer payload
router.get("/employees/:id/detail", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const empId = Number(req.params.id);
    const empRes = await pool.query(
      `SELECT e.id, e.store_id, e.branch_id, e.user_id, e.employee_code, e.full_name,
              e.tc_no, e.phone, e.email, (e.pin_hash IS NOT NULL) AS has_pin,
              e.role_title, e.department, e.employment_type, e.start_date, e.end_date,
              e.status, e.shift_start, e.shift_end, e.late_tolerance_min,
              e.base_salary, e.salary_currency, e.meal_allowance, e.transport_allowance,
              e.annual_leave_override, e.iban, e.blood_type,
              e.emergency_contact_name, e.emergency_contact_phone, e.address, e.notes,
              s.name AS branch_name
       FROM hr_employees e
       LEFT JOIN stores s ON s.id = e.branch_id
       WHERE e.id = $1 AND e.store_id = $2 LIMIT 1`,
      [empId, storeId]
    );
    if (empRes.rows.length === 0) return res.status(404).json({ error: "Personel bulunamadı." });
    const emp = empRes.rows[0];

    const [attRes, payRes, leaveRes, docRes, assetRes] = await Promise.all([
      pool.query(
        `SELECT a.*, cp.label AS checkpoint_label
         FROM hr_attendance_logs a
         LEFT JOIN hr_location_checkpoints cp ON cp.id = a.checkpoint_id
         WHERE a.employee_id = $1 AND a.store_id = $2
         ORDER BY a.work_date DESC, a.id DESC LIMIT 30`,
        [empId, storeId]
      ),
      pool.query(
        `SELECT * FROM hr_payroll_ledger
         WHERE employee_id = $1 AND store_id = $2
         ORDER BY COALESCE(payment_date, created_at) DESC, id DESC LIMIT 40`,
        [empId, storeId]
      ),
      pool.query(
        `SELECT * FROM hr_leave_requests
         WHERE employee_id = $1 AND store_id = $2
         ORDER BY start_date DESC, id DESC LIMIT 30`,
        [empId, storeId]
      ),
      pool.query(
        `SELECT * FROM hr_documents
         WHERE employee_id = $1 AND store_id = $2
         ORDER BY expiry_date ASC NULLS LAST, id DESC`,
        [empId, storeId]
      ),
      pool.query(
        `SELECT * FROM hr_assets
         WHERE employee_id = $1 AND store_id = $2
         ORDER BY CASE WHEN status = 'assigned' THEN 0 ELSE 1 END, assigned_date DESC`,
        [empId, storeId]
      ),
    ]);

    const currentYear = new Date().getFullYear();
    const usedAnnual = leaveRes.rows
      .filter((l: any) => l.leave_type === "annual" && l.status === "approved" && new Date(l.start_date).getFullYear() === currentYear)
      .reduce((acc: number, l: any) => acc + Number(l.days_count || 0), 0);
    const { entitledDays, tenureYears } = computeAnnualLeaveEntitlement(emp.start_date, emp.annual_leave_override);

    res.json({
      employee: emp,
      leave_balance: {
        entitled_days: entitledDays,
        used_days: usedAnnual,
        remaining_days: Math.max(0, entitledDays - usedAnnual),
        tenure_years: tenureYears,
      },
      attendance: attRes.rows,
      payroll: payRes.rows,
      leaves: leaveRes.rows,
      documents: docRes.rows,
      assets: assetRes.rows,
    });
  } catch (err: any) {
    console.error("[HR] GET /employees/:id/detail error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 3. LOCATION CHECKPOINTS (QR + GPS)
// ============================================================================
router.get("/checkpoints", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    const checkpoints = await ensureCheckpointsForStore(pool, storeId);
    res.json(checkpoints);
  } catch (err: any) {
    console.error("[HR] GET /checkpoints error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/checkpoints/:branchId", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureCheckpointsForStore(pool, storeId);

    const branchId = Number(req.params.branchId);
    const { label, latitude, longitude, radius_meters, strict_gps, work_start, work_end, late_tolerance_min } = req.body || {};

    const parsedLat = latitude === "" || latitude === null || latitude === undefined ? null : Number(latitude);
    const parsedLng = longitude === "" || longitude === null || longitude === undefined ? null : Number(longitude);
    const parsedRadius = Math.min(5000, Math.max(30, Number(radius_meters || 150)));

    const upd = await pool.query(
      `UPDATE hr_location_checkpoints
       SET label = COALESCE(NULLIF($1, ''), label),
           latitude = $2,
           longitude = $3,
           radius_meters = $4,
           strict_gps = $5,
           work_start = COALESCE(NULLIF($6, ''), work_start),
           work_end = COALESCE(NULLIF($7, ''), work_end),
           late_tolerance_min = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE store_id = $9 AND branch_id = $10
       RETURNING *`,
      [
        label ? String(label).trim() : "",
        Number.isFinite(parsedLat) ? parsedLat : null,
        Number.isFinite(parsedLng) ? parsedLng : null,
        parsedRadius,
        strict_gps !== false,
        work_start || "",
        work_end || "",
        Math.max(0, Number(late_tolerance_min ?? 15) || 15),
        storeId,
        branchId,
      ]
    );
    if (upd.rows.length === 0) return res.status(404).json({ error: "Lokasyon kontrol noktası bulunamadı." });
    res.json({ success: true, checkpoint: upd.rows[0] });
  } catch (err: any) {
    console.error("[HR] PUT /checkpoints/:branchId error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/checkpoints/:branchId/rotate-qr", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureCheckpointsForStore(pool, storeId);

    const branchId = Number(req.params.branchId);
    const newToken = generateQrToken();
    const upd = await pool.query(
      `UPDATE hr_location_checkpoints
       SET qr_token = $1, updated_at = CURRENT_TIMESTAMP
       WHERE store_id = $2 AND branch_id = $3
       RETURNING *`,
      [newToken, storeId, branchId]
    );
    if (upd.rows.length === 0) return res.status(404).json({ error: "Lokasyon bulunamadı." });
    res.json({ success: true, checkpoint: upd.rows[0] });
  } catch (err: any) {
    console.error("[HR] POST /checkpoints/:branchId/rotate-qr error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 4. ATTENDANCE (PUANTAJ) LIST & MANUAL OVERRIDE
// ============================================================================
router.get("/attendance", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const { date, month, employee_id, branch_id } = req.query;
    const params: any[] = [storeId];
    let where = "WHERE a.store_id = $1";

    if (date) {
      params.push(String(date));
      where += ` AND a.work_date = $${params.length}::date`;
    } else if (month && /^\d{4}-\d{2}$/.test(String(month))) {
      params.push(`${month}-01`);
      where += ` AND a.work_date >= $${params.length}::date AND a.work_date < ($${params.length}::date + INTERVAL '1 month')`;
    }
    if (employee_id) {
      params.push(Number(employee_id));
      where += ` AND a.employee_id = $${params.length}`;
    }
    if (branch_id) {
      params.push(Number(branch_id));
      where += ` AND a.branch_id = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT a.*, e.full_name, e.role_title, e.department, e.shift_start, e.shift_end,
              cp.label AS checkpoint_label, s.name AS branch_name
       FROM hr_attendance_logs a
       JOIN hr_employees e ON e.id = a.employee_id
       LEFT JOIN hr_location_checkpoints cp ON cp.id = a.checkpoint_id
       LEFT JOIN stores s ON s.id = a.branch_id
       ${where}
       ORDER BY a.work_date DESC, a.check_in_at DESC, a.id DESC
       LIMIT 500`,
      params
    );

    res.json(result.rows);
  } catch (err: any) {
    console.error("[HR] GET /attendance error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/attendance/manual", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const { employee_id, branch_id, work_date, check_in_time, check_out_time, break_minutes, notes } = req.body || {};
    if (!employee_id || !work_date || !check_in_time) {
      return res.status(400).json({ error: "Personel, tarih ve giriş saati zorunludur." });
    }

    const empRes = await pool.query(
      `SELECT * FROM hr_employees WHERE id = $1 AND store_id = $2 LIMIT 1`,
      [Number(employee_id), storeId]
    );
    if (empRes.rows.length === 0) return res.status(404).json({ error: "Personel bulunamadı." });
    const emp = empRes.rows[0];

    const checkInIso = `${work_date}T${check_in_time.length === 5 ? check_in_time + ":00" : check_in_time}`;
    const checkOutIso = check_out_time
      ? `${work_date}T${check_out_time.length === 5 ? check_out_time + ":00" : check_out_time}`
      : null;

    const metrics = computeAttendanceMetrics({
      checkInAt: checkInIso,
      checkOutAt: checkOutIso,
      shiftStart: emp.shift_start,
      shiftEnd: emp.shift_end,
      lateToleranceMin: emp.late_tolerance_min,
      breakMinutes: Number(break_minutes || 0),
    });

    const ins = await pool.query(
      `INSERT INTO hr_attendance_logs (
         store_id, employee_id, branch_id, work_date, check_in_at, check_out_at,
         break_minutes, verification_status, late_minutes, early_leave_minutes,
         overtime_minutes, worked_minutes, notes, is_manual
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,'manual_admin',$8,$9,$10,$11,$12,TRUE)
       RETURNING *`,
      [
        storeId,
        Number(employee_id),
        branch_id ? Number(branch_id) : (emp.branch_id || storeId),
        work_date,
        new Date(checkInIso).toISOString(),
        checkOutIso ? new Date(checkOutIso).toISOString() : null,
        Number(break_minutes || 0),
        metrics.lateMinutes,
        metrics.earlyLeaveMinutes,
        metrics.overtimeMinutes,
        metrics.workedMinutes,
        String(notes || "Yönetici manuel puantaj kaydı").trim(),
      ]
    );

    res.json({ success: true, log: ins.rows[0] });
  } catch (err: any) {
    console.error("[HR] POST /attendance/manual error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/attendance/:id", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const del = await pool.query(
      `DELETE FROM hr_attendance_logs WHERE id = $1 AND store_id = $2 RETURNING id`,
      [Number(req.params.id), storeId]
    );
    if (del.rowCount === 0) return res.status(404).json({ error: "Puantaj kaydı bulunamadı." });
    res.json({ success: true });
  } catch (err: any) {
    console.error("[HR] DELETE /attendance/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 5. PAYROLL, ADVANCES & BIDIRECTIONAL FINANCE SYNC
// ============================================================================
router.get("/payroll", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const now = new Date();
    const period =
      typeof req.query.period === "string" && /^\d{4}-\d{2}$/.test(req.query.period)
        ? req.query.period
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [empRes, ledgerRes, attRes, unpaidLeavesRes, accountsRes] = await Promise.all([
      pool.query(
        `SELECT e.id, e.full_name, e.role_title, e.department, e.branch_id, e.status,
                e.base_salary, e.salary_currency, e.meal_allowance, e.transport_allowance, e.iban,
                s.name AS branch_name
         FROM hr_employees e
         LEFT JOIN stores s ON s.id = e.branch_id
         WHERE e.store_id = $1 AND e.status = 'active'
         ORDER BY e.full_name ASC`,
        [storeId]
      ),
      pool.query(
        `SELECT l.*, e.full_name, e.role_title
         FROM hr_payroll_ledger l
         JOIN hr_employees e ON e.id = l.employee_id
         WHERE l.store_id = $1 AND (l.period_month = $2 OR l.status = 'pending_request')
         ORDER BY CASE WHEN l.status = 'pending_request' THEN 0 ELSE 1 END,
                  COALESCE(l.payment_date, l.created_at) DESC, l.id DESC`,
        [storeId, period]
      ),
      pool.query(
        `SELECT employee_id,
                COUNT(*)::int AS worked_days,
                COALESCE(SUM(worked_minutes), 0)::int AS worked_minutes,
                COALESCE(SUM(overtime_minutes), 0)::int AS overtime_minutes,
                COALESCE(SUM(late_minutes), 0)::int AS late_minutes
         FROM hr_attendance_logs
         WHERE store_id = $1
           AND work_date >= ($2 || '-01')::date
           AND work_date < (($2 || '-01')::date + INTERVAL '1 month')
         GROUP BY employee_id`,
        [storeId, period]
      ),
      pool.query(
        `SELECT employee_id, COALESCE(SUM(days_count), 0)::numeric AS unpaid_days
         FROM hr_leave_requests
         WHERE store_id = $1 AND status = 'approved' AND leave_type = 'unpaid'
           AND start_date >= ($2 || '-01')::date
           AND start_date < (($2 || '-01')::date + INTERVAL '1 month')
         GROUP BY employee_id`,
        [storeId, period]
      ),
      pool.query(
        `SELECT id, account_type, account_name, bank_name, currency
         FROM store_financial_accounts
         WHERE store_id = $1 AND LOWER(COALESCE(account_type, '')) IN ('bank', 'cash', 'credit_card')
         ORDER BY account_type ASC, id ASC`,
        [storeId]
      ).catch(() => ({ rows: [] })),
    ]);

    const attByEmp = new Map<number, any>(attRes.rows.map((r: any) => [Number(r.employee_id), r]));
    const unpaidByEmp = new Map<number, number>(unpaidLeavesRes.rows.map((r: any) => [Number(r.employee_id), Number(r.unpaid_days || 0)]));

    const periodLedger = ledgerRes.rows.filter((r: any) => r.period_month === period);
    const pendingRequests = ledgerRes.rows.filter((r: any) => r.status === "pending_request");

    const sheet = empRes.rows.map((emp: any) => {
      const empId = Number(emp.id);
      const baseSalary = Number(emp.base_salary || 0);
      const mealTransport = Number(emp.meal_allowance || 0) + Number(emp.transport_allowance || 0);
      const att = attByEmp.get(empId) || { worked_days: 0, worked_minutes: 0, overtime_minutes: 0, late_minutes: 0 };
      const unpaidDays = unpaidByEmp.get(empId) || 0;
      const dailyRate = baseSalary > 0 ? baseSalary / 30 : 0;
      const unpaidDeduction = Math.round(unpaidDays * dailyRate * 100) / 100;

      const empItems = periodLedger.filter((l: any) => Number(l.employee_id) === empId && l.status === "paid");
      const paidSalary = empItems.filter((l: any) => l.item_type === "salary").reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
      const paidAdvances = empItems.filter((l: any) => l.item_type === "advance").reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
      const paidBonuses = empItems.filter((l: any) => ["bonus", "overtime"].includes(l.item_type)).reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
      const paidSgk = empItems.filter((l: any) => l.item_type === "sgk").reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
      const paidMealTransport = empItems.filter((l: any) => l.item_type === "meal_transport").reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
      const manualDeductions = empItems.filter((l: any) => l.item_type === "deduction").reduce((a: number, b: any) => a + Number(b.amount || 0), 0);

      const remainingNetPayable = Math.max(
        0,
        Math.round((baseSalary + mealTransport - paidAdvances - paidSalary - paidMealTransport - unpaidDeduction - manualDeductions) * 100) / 100
      );

      return {
        employee_id: empId,
        full_name: emp.full_name,
        role_title: emp.role_title,
        branch_name: emp.branch_name || "Merkez",
        iban: emp.iban || "",
        currency: emp.salary_currency || "TRY",
        base_salary: baseSalary,
        meal_transport: mealTransport,
        worked_days: Number(att.worked_days || 0),
        worked_minutes: Number(att.worked_minutes || 0),
        overtime_minutes: Number(att.overtime_minutes || 0),
        late_minutes: Number(att.late_minutes || 0),
        unpaid_leave_days: unpaidDays,
        unpaid_deduction: unpaidDeduction,
        paid_salary: paidSalary,
        paid_advances: paidAdvances,
        paid_bonuses: paidBonuses,
        paid_sgk: paidSgk,
        manual_deductions: manualDeductions,
        remaining_net_payable: remainingNetPayable,
        is_settled: baseSalary > 0 && remainingNetPayable <= 0.01,
      };
    });

    res.json({
      period,
      sheet,
      ledger: periodLedger,
      pending_requests: pendingRequests,
      accounts: accountsRes.rows,
    });
  } catch (err: any) {
    console.error("[HR] GET /payroll error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/payroll/ledger", async (req: any, res) => {
  const storeId = resolveStoreId(req);
  if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });

  const {
    employee_id,
    period_month,
    item_type,
    title,
    amount,
    currency,
    payment_date,
    payment_method,
    account_id,
    account_name,
    reference_no,
    description,
    sync_to_finance = true,
  } = req.body || {};

  const numericAmount = Number(String(amount ?? "").replace(/,/g, "."));
  if (!employee_id || !Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: "Personel ve geçerli pozitif tutar zorunludur." });
  }

  const validType = HR_PAYROLL_ITEM_LABELS[item_type] ? item_type : "salary";
  const now = new Date();
  const period =
    period_month && /^\d{4}-\d{2}$/.test(String(period_month))
      ? String(period_month)
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const client = await pool.connect();
  try {
    await ensureHrSchema(client);
    await client.query("BEGIN");

    const empRes = await client.query(
      `SELECT id, full_name, salary_currency FROM hr_employees WHERE id = $1 AND store_id = $2 LIMIT 1`,
      [Number(employee_id), storeId]
    );
    if (empRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Personel bulunamadı." });
    }
    const emp = empRes.rows[0];
    const curr = String(currency || emp.salary_currency || "TRY").toUpperCase();
    const resolvedTitle =
      String(title || "").trim() ||
      `${emp.full_name} — ${HR_PAYROLL_ITEM_LABELS[validType]} (${period})`;

    const insRes = await client.query(
      `INSERT INTO hr_payroll_ledger (
         store_id, employee_id, period_month, item_type, title, amount, currency,
         status, payment_date, payment_method, account_id, account_name,
         reference_no, description, requested_by_employee, created_by
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,'paid',$8,$9,$10,$11,$12,$13,FALSE,$14)
       RETURNING *`,
      [
        storeId,
        Number(employee_id),
        period,
        validType,
        resolvedTitle,
        numericAmount,
        curr,
        payment_date ? new Date(payment_date).toISOString() : now.toISOString(),
        payment_method || "bank_transfer",
        account_id ? Number(account_id) : null,
        account_name || "",
        String(reference_no || "").trim(),
        String(description || "").trim(),
        req.user?.id || null,
      ]
    );

    const ledgerRow = insRes.rows[0];
    let portfolioTxId: number | null = null;
    if (sync_to_finance !== false && validType !== "deduction") {
      portfolioTxId = await syncPayrollToPortfolioTransaction(client, ledgerRow, emp.full_name);
    }

    await client.query("COMMIT");
    res.json({
      success: true,
      item: { ...ledgerRow, portfolio_transaction_id: portfolioTxId },
      synced_to_finance: Boolean(portfolioTxId),
    });
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[HR] POST /payroll/ledger error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put("/payroll/ledger/:id/status", async (req: any, res) => {
  const storeId = resolveStoreId(req);
  if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });

  const ledgerId = Number(req.params.id);
  const { status, payment_method, account_id, account_name, sync_to_finance = true } = req.body || {};
  if (!["paid", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Geçersiz onay durumu." });
  }

  const client = await pool.connect();
  try {
    await ensureHrSchema(client);
    await client.query("BEGIN");

    const curRes = await client.query(
      `SELECT l.*, e.full_name
       FROM hr_payroll_ledger l
       JOIN hr_employees e ON e.id = l.employee_id
       WHERE l.id = $1 AND l.store_id = $2 LIMIT 1`,
      [ledgerId, storeId]
    );
    if (curRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Kayıt bulunamadı." });
    }
    const cur = curRes.rows[0];

    const upd = await client.query(
      `UPDATE hr_payroll_ledger
       SET status = $1,
           payment_date = CASE WHEN $1 = 'paid' THEN CURRENT_TIMESTAMP ELSE payment_date END,
           payment_method = COALESCE(NULLIF($2, ''), payment_method),
           account_id = COALESCE($3, account_id),
           account_name = COALESCE(NULLIF($4, ''), account_name),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND store_id = $6
       RETURNING *`,
      [
        status,
        payment_method || "",
        account_id ? Number(account_id) : null,
        account_name || "",
        ledgerId,
        storeId,
      ]
    );

    const updatedRow = upd.rows[0];
    if (status === "paid" && sync_to_finance !== false) {
      await syncPayrollToPortfolioTransaction(client, updatedRow, cur.full_name);
    }

    await client.query("COMMIT");
    res.json({ success: true, item: updatedRow });
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[HR] PUT /payroll/ledger/:id/status error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete("/payroll/ledger/:id", async (req: any, res) => {
  const storeId = resolveStoreId(req);
  if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });

  const ledgerId = Number(req.params.id);
  const client = await pool.connect();
  try {
    await ensureHrSchema(client);
    await client.query("BEGIN");

    const del = await client.query(
      `DELETE FROM hr_payroll_ledger WHERE id = $1 AND store_id = $2 RETURNING *`,
      [ledgerId, storeId]
    );
    if (del.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Bordro kaydı bulunamadı." });
    }
    const deleted = del.rows[0];

    // Cascade delete linked portfolio_transaction so Finance stays 100% in sync
    if (deleted.portfolio_transaction_id) {
      await client.query(
        `DELETE FROM portfolio_transactions WHERE id = $1 AND store_id = $2`,
        [Number(deleted.portfolio_transaction_id), storeId]
      );
    } else {
      await client.query(
        `DELETE FROM portfolio_transactions WHERE store_id = $1 AND source_type = 'hr_payroll_payment' AND source_id = $2`,
        [storeId, ledgerId]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[HR] DELETE /payroll/ledger/:id error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================================
// 6. LEAVES & ANNUAL BALANCE + BRANCH OVERLAP WARNINGS
// ============================================================================
router.get("/leaves", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const [leavesRes, empsRes] = await Promise.all([
      pool.query(
        `SELECT l.*, e.full_name, e.role_title, e.branch_id, s.name AS branch_name
         FROM hr_leave_requests l
         JOIN hr_employees e ON e.id = l.employee_id
         LEFT JOIN stores s ON s.id = e.branch_id
         WHERE l.store_id = $1
         ORDER BY CASE WHEN l.status = 'pending' THEN 0 ELSE 1 END, l.start_date DESC, l.id DESC
         LIMIT 250`,
        [storeId]
      ),
      pool.query(
        `SELECT e.id, e.full_name, e.role_title, e.branch_id, e.start_date, e.annual_leave_override, s.name AS branch_name
         FROM hr_employees e
         LEFT JOIN stores s ON s.id = e.branch_id
         WHERE e.store_id = $1 AND e.status = 'active'
         ORDER BY e.full_name ASC`,
        [storeId]
      ),
    ]);

    const currentYear = new Date().getFullYear();
    const balances = empsRes.rows.map((e: any) => {
      const { entitledDays, tenureYears } = computeAnnualLeaveEntitlement(e.start_date, e.annual_leave_override);
      const usedDays = leavesRes.rows
        .filter((l: any) => Number(l.employee_id) === Number(e.id) && l.leave_type === "annual" && l.status === "approved" && new Date(l.start_date).getFullYear() === currentYear)
        .reduce((acc: number, l: any) => acc + Number(l.days_count || 0), 0);
      return {
        employee_id: e.id,
        full_name: e.full_name,
        role_title: e.role_title,
        branch_name: e.branch_name || "Merkez",
        start_date: e.start_date,
        tenure_years: tenureYears,
        entitled_days: entitledDays,
        used_days: usedDays,
        remaining_days: Math.max(0, entitledDays - usedDays),
      };
    });

    // Flag same-branch overlapping leaves
    const leavesWithConflicts = leavesRes.rows.map((l: any) => {
      const overlaps = leavesRes.rows.filter(
        (other: any) =>
          other.id !== l.id &&
          other.status === "approved" &&
          other.branch_id === l.branch_id &&
          new Date(other.start_date) <= new Date(l.end_date) &&
          new Date(other.end_date) >= new Date(l.start_date)
      );
      return {
        ...l,
        branch_conflicts: overlaps.map((o: any) => o.full_name),
      };
    });

    res.json({ leaves: leavesWithConflicts, balances });
  } catch (err: any) {
    console.error("[HR] GET /leaves error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/leaves", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const { employee_id, leave_type, start_date, end_date, days_count, reason, status } = req.body || {};
    if (!employee_id || !start_date || !end_date) {
      return res.status(400).json({ error: "Personel, başlangıç ve bitiş tarihi zorunludur." });
    }
    const validType = HR_LEAVE_TYPE_LABELS[leave_type] ? leave_type : "annual";
    const s = new Date(start_date);
    const e = new Date(end_date);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) {
      return res.status(400).json({ error: "Geçersiz tarih aralığı." });
    }
    const computedDays = days_count && Number(days_count) > 0
      ? Number(days_count)
      : Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);

    const empCheck = await pool.query(
      `SELECT id FROM hr_employees WHERE id = $1 AND store_id = $2 LIMIT 1`,
      [Number(employee_id), storeId]
    );
    if (empCheck.rows.length === 0) {
      return res.status(404).json({ error: "Personel bulunamadı." });
    }

    const finalStatus = ["approved", "pending"].includes(status) ? status : "approved";

    const ins = await pool.query(
      `INSERT INTO hr_leave_requests (
         store_id, employee_id, leave_type, start_date, end_date, days_count,
         reason, status, reviewed_by, reviewed_at, requested_by_employee
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE)
       RETURNING *`,
      [
        storeId,
        Number(employee_id),
        validType,
        start_date,
        end_date,
        computedDays,
        String(reason || "").trim(),
        finalStatus,
        finalStatus === "approved" ? (req.user?.id || null) : null,
        finalStatus === "approved" ? new Date().toISOString() : null,
      ]
    );
    res.json({ success: true, leave: ins.rows[0] });
  } catch (err: any) {
    console.error("[HR] POST /leaves error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/leaves/:id/status", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const { status, review_note } = req.body || {};
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Geçersiz durum." });
    }

    const upd = await pool.query(
      `UPDATE hr_leave_requests
       SET status = $1, review_note = $2, reviewed_by = $3, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND store_id = $5
       RETURNING *`,
      [status, String(review_note || "").trim(), req.user?.id || null, Number(req.params.id), storeId]
    );
    if (upd.rows.length === 0) return res.status(404).json({ error: "İzin talebi bulunamadı." });
    res.json({ success: true, leave: upd.rows[0] });
  } catch (err: any) {
    console.error("[HR] PUT /leaves/:id/status error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/leaves/:id", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const del = await pool.query(
      `DELETE FROM hr_leave_requests WHERE id = $1 AND store_id = $2 RETURNING id`,
      [Number(req.params.id), storeId]
    );
    if (del.rowCount === 0) return res.status(404).json({ error: "Kayıt bulunamadı." });
    res.json({ success: true });
  } catch (err: any) {
    console.error("[HR] DELETE /leaves/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 7. OFFICIAL DOSSIER DOCUMENTS (AUTH-GATED UPLOAD & DOWNLOAD)
// ============================================================================
router.get("/documents", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const params: any[] = [storeId];
    let where = "WHERE d.store_id = $1";
    if (req.query.employee_id) {
      params.push(Number(req.query.employee_id));
      where += ` AND d.employee_id = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT d.id, d.store_id, d.employee_id, d.doc_type, d.title, d.file_name,
              (d.stored_path IS NOT NULL) AS has_file, d.mime_type, d.file_size,
              d.issue_date, d.expiry_date, d.notes, d.created_at,
              e.full_name, e.role_title
       FROM hr_documents d
       JOIN hr_employees e ON e.id = d.employee_id
       ${where}
       ORDER BY d.expiry_date ASC NULLS LAST, d.id DESC`,
      params
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error("[HR] GET /documents error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/documents", (req: any, res, next) => {
  hrDocUpload.single("file")(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || "Dosya yükleme hatası." });
    }
    next();
  });
}, async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const { employee_id, doc_type, title, issue_date, expiry_date, notes } = req.body || {};
    if (!employee_id || !title) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: "Personel ve belge başlığı zorunludur." });
    }

    const empCheck = await pool.query(
      `SELECT id FROM hr_employees WHERE id = $1 AND store_id = $2 LIMIT 1`,
      [Number(employee_id), storeId]
    );
    if (empCheck.rows.length === 0) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: "Personel bulunamadı." });
    }

    const ins = await pool.query(
      `INSERT INTO hr_documents (
         store_id, employee_id, doc_type, title, file_name, stored_path,
         mime_type, file_size, issue_date, expiry_date, notes, uploaded_by
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, store_id, employee_id, doc_type, title, file_name, (stored_path IS NOT NULL) AS has_file,
                 mime_type, file_size, issue_date, expiry_date, notes, created_at`,
      [
        storeId,
        Number(employee_id),
        String(doc_type || "other").trim(),
        String(title).trim(),
        req.file?.originalname || null,
        req.file?.filename || null,
        req.file?.mimetype || null,
        req.file?.size || 0,
        issue_date || null,
        expiry_date || null,
        String(notes || "").trim(),
        req.user?.id || null,
      ]
    );

    res.json({ success: true, document: ins.rows[0] });
  } catch (err: any) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    console.error("[HR] POST /documents error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/documents/:id/download", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const docRes = await pool.query(
      `SELECT file_name, stored_path, mime_type
       FROM hr_documents
       WHERE id = $1 AND store_id = $2 LIMIT 1`,
      [Number(req.params.id), storeId]
    );
    if (docRes.rows.length === 0 || !docRes.rows[0].stored_path) {
      return res.status(404).json({ error: "Belge dosyası bulunamadı." });
    }

    const { file_name, stored_path, mime_type } = docRes.rows[0];
    // Strict path confinement check
    const safeFilename = path.basename(String(stored_path));
    const resolvedPath = path.resolve(HR_DOCS_BASE_DIR, safeFilename);
    if (!resolvedPath.startsWith(HR_DOCS_BASE_DIR + path.sep)) {
      return res.status(403).json({ error: "Geçersiz dosya yolu." });
    }
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: "Dosya diskte bulunamadı." });
    }

    const safeMime = ALLOWED_DOC_MIMES.has(String(mime_type || "")) ? String(mime_type) : "application/octet-stream";
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", safeMime);
    res.setHeader(
      "Content-Disposition",
      `${safeMime === "application/octet-stream" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file_name || safeFilename)}`
    );
    res.sendFile(resolvedPath);
  } catch (err: any) {
    console.error("[HR] GET /documents/:id/download error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/documents/:id", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const del = await pool.query(
      `DELETE FROM hr_documents WHERE id = $1 AND store_id = $2 RETURNING stored_path`,
      [Number(req.params.id), storeId]
    );
    if (del.rowCount === 0) return res.status(404).json({ error: "Belge bulunamadı." });

    const stored = del.rows[0]?.stored_path;
    if (stored) {
      const resolvedPath = path.resolve(HR_DOCS_BASE_DIR, path.basename(String(stored)));
      if (resolvedPath.startsWith(HR_DOCS_BASE_DIR + path.sep) && fs.existsSync(resolvedPath)) {
        fs.unlink(resolvedPath, () => {});
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error("[HR] DELETE /documents/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 8. ASSET CUSTODY (ZİMMET)
// ============================================================================
router.get("/assets", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const params: any[] = [storeId];
    let where = "WHERE a.store_id = $1";
    if (req.query.employee_id) {
      params.push(Number(req.query.employee_id));
      where += ` AND a.employee_id = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT a.*, e.full_name, e.role_title, e.tc_no, e.phone
       FROM hr_assets a
       JOIN hr_employees e ON e.id = a.employee_id
       ${where}
       ORDER BY CASE WHEN a.status = 'assigned' THEN 0 ELSE 1 END, a.assigned_date DESC, a.id DESC`,
      params
    );
    res.json(result.rows);
  } catch (err: any) {
    console.error("[HR] GET /assets error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/assets", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const { employee_id, asset_name, category, serial_no, assigned_date, condition_note } = req.body || {};
    if (!employee_id || !asset_name) {
      return res.status(400).json({ error: "Personel ve zimmet eşya adı zorunludur." });
    }

    const empCheck = await pool.query(
      `SELECT id FROM hr_employees WHERE id = $1 AND store_id = $2 LIMIT 1`,
      [Number(employee_id), storeId]
    );
    if (empCheck.rows.length === 0) {
      return res.status(404).json({ error: "Personel bulunamadı." });
    }

    const ins = await pool.query(
      `INSERT INTO hr_assets (store_id, employee_id, asset_name, category, serial_no, assigned_date, status, condition_note)
       VALUES ($1,$2,$3,$4,$5,$6,'assigned',$7)
       RETURNING *`,
      [
        storeId,
        Number(employee_id),
        String(asset_name).trim(),
        String(category || "other").trim(),
        String(serial_no || "").trim() || null,
        assigned_date || new Date().toISOString().slice(0, 10),
        String(condition_note || "").trim(),
      ]
    );
    res.json({ success: true, asset: ins.rows[0] });
  } catch (err: any) {
    console.error("[HR] POST /assets error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/assets/:id", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const { status, return_date, condition_note } = req.body || {};
    const nextStatus = ["assigned", "returned", "damaged"].includes(status) ? status : "returned";

    const upd = await pool.query(
      `UPDATE hr_assets
       SET status = $1,
           return_date = CASE WHEN $1 = 'returned' THEN COALESCE($2::date, CURRENT_DATE) ELSE NULL END,
           condition_note = COALESCE($3, condition_note),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND store_id = $5
       RETURNING *`,
      [nextStatus, return_date || null, condition_note !== undefined ? String(condition_note).trim() : null, Number(req.params.id), storeId]
    );
    if (upd.rows.length === 0) return res.status(404).json({ error: "Zimmet kaydı bulunamadı." });
    res.json({ success: true, asset: upd.rows[0] });
  } catch (err: any) {
    console.error("[HR] PUT /assets/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/assets/:id", async (req: any, res) => {
  try {
    const storeId = resolveStoreId(req);
    if (!storeId) return res.status(403).json({ error: "Yetkisiz mağaza bağlamı." });
    await ensureHrSchema(pool);

    const del = await pool.query(
      `DELETE FROM hr_assets WHERE id = $1 AND store_id = $2 RETURNING id`,
      [Number(req.params.id), storeId]
    );
    if (del.rowCount === 0) return res.status(404).json({ error: "Zimmet kaydı bulunamadı." });
    res.json({ success: true });
  } catch (err: any) {
    console.error("[HR] DELETE /assets/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
