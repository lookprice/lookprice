import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { pool } from "../models/db";
import { JWT_SECRET } from "../middleware/auth";
import {
  ensureHrSchema,
  ensureCheckpointsForStore,
  normalizePhone,
  haversineMeters,
  computeAttendanceMetrics,
  computeAnnualLeaveEntitlement,
  HR_LEAVE_TYPE_LABELS,
  HR_PAYROLL_ITEM_LABELS,
} from "../src/services/backend/hrService";

const router = express.Router();

// Rate limiter for employee PIN login (brute-force protection)
const employeePinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin." },
});

// Prevent caching on personal HR portal endpoints
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// Employee Bearer JWT verifier (strictly scoped to role === 'hr_employee')
function authenticateEmployee(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return res.status(401).json({ error: "Oturum gerekli. Lütfen telefon ve PIN ile giriş yapın." });
  }
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== "hr_employee" || !decoded.employee_id || !decoded.store_id) {
      return res.status(401).json({ error: "Geçersiz personel oturumu." });
    }
    req.employeeAuth = {
      employeeId: Number(decoded.employee_id),
      storeId: Number(decoded.store_id),
    };
    next();
  } catch {
    return res.status(401).json({ error: "Oturum süresi doldu. Lütfen tekrar giriş yapın." });
  }
}

/**
 * GET /api/hr-portal/store/:slug
 * Resolves public store display info + optional QR checkpoint preview (never exposes PII).
 */
router.get("/store/:slug", async (req, res) => {
  try {
    await ensureHrSchema(pool);
    const { slug } = req.params;
    const qrToken = typeof req.query.token === "string" ? req.query.token.trim() : "";

    const storeRes = await pool.query(
      `SELECT id, name, slug, branding, parent_id
       FROM stores
       WHERE LOWER(slug) = LOWER($1)
       LIMIT 1`,
      [slug]
    );
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "İşletme bulunamadı." });
    }

    const rawStore = storeRes.rows[0];
    // If slug belongs to a branch, resolve parent main store
    let mainStore = rawStore;
    if (rawStore.parent_id) {
      const parentRes = await pool.query(
        `SELECT id, name, slug, branding FROM stores WHERE id = $1 LIMIT 1`,
        [rawStore.parent_id]
      );
      if (parentRes.rows.length > 0) mainStore = parentRes.rows[0];
    }

    let brandingObj: any = {};
    try {
      brandingObj = typeof mainStore.branding === "string"
        ? JSON.parse(mainStore.branding)
        : (mainStore.branding || {});
    } catch {}

    const storeName = brandingObj?.store_name || brandingObj?.name || mainStore.name || "İşletme";
    const logoUrl = brandingObj?.logo_url || brandingObj?.logo || null;

    let checkpointInfo: any = null;
    if (qrToken) {
      const cpRes = await pool.query(
        `SELECT id, branch_id, label, branch_type, radius_meters, strict_gps,
                (latitude IS NOT NULL AND longitude IS NOT NULL) AS has_gps
         FROM hr_location_checkpoints
         WHERE store_id = $1 AND qr_token = $2
         LIMIT 1`,
        [mainStore.id, qrToken]
      );
      if (cpRes.rows.length > 0) {
        checkpointInfo = cpRes.rows[0];
      }
    }

    res.json({
      store_id: mainStore.id,
      slug: mainStore.slug,
      store_name: storeName,
      logo_url: logoUrl,
      checkpoint: checkpointInfo,
    });
  } catch (err: any) {
    console.error("[HR-PORTAL] GET /store/:slug error:", err);
    res.status(500).json({ error: "İşletme bilgisi alınamadı." });
  }
});

/**
 * POST /api/hr-portal/login
 * Phone + 4-digit PIN authentication with per-account lockout and server-side bcrypt verification.
 */
router.post("/login", employeePinLimiter, async (req, res) => {
  try {
    await ensureHrSchema(pool);
    const { storeSlug, phone, pin } = req.body || {};
    const cleanPhone = normalizePhone(phone);
    const cleanPin = String(pin || "").trim();

    if (!storeSlug || !cleanPhone || !/^\d{4,6}$/.test(cleanPin)) {
      return res.status(400).json({ error: "Telefon numarası ve 4 haneli PIN zorunludur." });
    }

    const storeRes = await pool.query(
      `SELECT id, parent_id, name, slug, branding FROM stores WHERE LOWER(slug) = LOWER($1) LIMIT 1`,
      [String(storeSlug).trim()]
    );
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "İşletme bulunamadı." });
    }

    const mainStoreId = Number(storeRes.rows[0].parent_id || storeRes.rows[0].id);

    const empRes = await pool.query(
      `SELECT * FROM hr_employees
       WHERE store_id = $1 AND phone_normalized = $2 AND status = 'active'
       LIMIT 1`,
      [mainStoreId, cleanPhone]
    );

    if (empRes.rows.length === 0) {
      return res.status(401).json({ error: "Telefon numarası veya PIN hatalı." });
    }

    const emp = empRes.rows[0];

    if (emp.pin_locked_until && new Date(emp.pin_locked_until).getTime() > Date.now()) {
      const waitMin = Math.ceil((new Date(emp.pin_locked_until).getTime() - Date.now()) / 60000);
      return res.status(429).json({
        error: `Ardışık hatalı deneme nedeniyle hesap geçici kilitli. ${waitMin} dk sonra tekrar deneyin.`,
      });
    }

    if (!emp.pin_hash) {
      return res.status(401).json({ error: "PIN tanımlı değil. Lütfen yöneticinizden 4 haneli PIN isteyin." });
    }

    const isMatch = await bcrypt.compare(cleanPin, emp.pin_hash);
    if (!isMatch) {
      const nextFails = Number(emp.pin_failed_attempts || 0) + 1;
      const lockUntil = nextFails >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
      await pool.query(
        `UPDATE hr_employees
         SET pin_failed_attempts = $1, pin_locked_until = $2
         WHERE id = $3`,
        [nextFails >= 5 ? 0 : nextFails, lockUntil, emp.id]
      );
      return res.status(401).json({
        error: lockUntil
          ? "5 kez hatalı PIN girildi. Güvenlik için 15 dakika kilitlendi."
          : "Telefon numarası veya PIN hatalı.",
      });
    }

    // Reset failed attempts on success
    await pool.query(
      `UPDATE hr_employees SET pin_failed_attempts = 0, pin_locked_until = NULL WHERE id = $1`,
      [emp.id]
    );

    const token = jwt.sign(
      {
        role: "hr_employee",
        employee_id: emp.id,
        store_id: mainStoreId,
      },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      token,
      employee: {
        id: emp.id,
        full_name: emp.full_name,
        role_title: emp.role_title,
        department: emp.department,
        phone: emp.phone,
        branch_id: emp.branch_id,
        shift_start: emp.shift_start,
        shift_end: emp.shift_end,
      },
    });
  } catch (err: any) {
    console.error("[HR-PORTAL] POST /login error:", err);
    res.status(500).json({ error: "Giriş işlemi başarısız." });
  }
});

/**
 * GET /api/hr-portal/me
 * Returns employee profile, today's live shift status, monthly stats, leave balance, and history.
 */
router.get("/me", authenticateEmployee, async (req: any, res) => {
  try {
    await ensureHrSchema(pool);
    const { employeeId, storeId } = req.employeeAuth;

    const empRes = await pool.query(
      `SELECT e.*, s.name AS branch_name, s.branch_type
       FROM hr_employees e
       LEFT JOIN stores s ON s.id = e.branch_id
       WHERE e.id = $1 AND e.store_id = $2
       LIMIT 1`,
      [employeeId, storeId]
    );
    if (empRes.rows.length === 0 || empRes.rows[0].status !== "active") {
      return res.status(401).json({ error: "Aktif personel kaydı bulunamadı." });
    }
    const emp = empRes.rows[0];

    const todayStr = new Date().toISOString().slice(0, 10);
    const currentMonth = todayStr.slice(0, 7);

    // Today's open or latest attendance record
    const todayLogRes = await pool.query(
      `SELECT a.*, cp.label AS checkpoint_label
       FROM hr_attendance_logs a
       LEFT JOIN hr_location_checkpoints cp ON cp.id = a.checkpoint_id
       WHERE a.employee_id = $1 AND a.store_id = $2 AND a.work_date = $3
       ORDER BY a.id DESC
       LIMIT 1`,
      [employeeId, storeId, todayStr]
    );

    // Recent 30 attendance records
    const recentLogsRes = await pool.query(
      `SELECT a.*, cp.label AS checkpoint_label
       FROM hr_attendance_logs a
       LEFT JOIN hr_location_checkpoints cp ON cp.id = a.checkpoint_id
       WHERE a.employee_id = $1 AND a.store_id = $2
       ORDER BY a.work_date DESC, a.id DESC
       LIMIT 31`,
      [employeeId, storeId]
    );

    // Monthly summary
    const monthLogs = recentLogsRes.rows.filter((r: any) => String(r.work_date || "").slice(0, 7) === currentMonth);
    const monthStats = {
      period: currentMonth,
      days_worked: monthLogs.length,
      total_worked_minutes: monthLogs.reduce((acc: number, r: any) => acc + Number(r.worked_minutes || 0), 0),
      total_late_minutes: monthLogs.reduce((acc: number, r: any) => acc + Number(r.late_minutes || 0), 0),
      total_overtime_minutes: monthLogs.reduce((acc: number, r: any) => acc + Number(r.overtime_minutes || 0), 0),
    };

    // Leaves & annual balance
    const leavesRes = await pool.query(
      `SELECT * FROM hr_leave_requests
       WHERE employee_id = $1 AND store_id = $2
       ORDER BY start_date DESC, id DESC
       LIMIT 25`,
      [employeeId, storeId]
    );

    const currentYear = new Date().getFullYear();
    const usedAnnualDays = leavesRes.rows
      .filter((l: any) => l.leave_type === "annual" && l.status === "approved" && new Date(l.start_date).getFullYear() === currentYear)
      .reduce((acc: number, l: any) => acc + Number(l.days_count || 0), 0);

    const { entitledDays, tenureYears } = computeAnnualLeaveEntitlement(emp.start_date, emp.annual_leave_override);

    // Payroll / advances history (last 25 items)
    const payrollRes = await pool.query(
      `SELECT id, period_month, item_type, title, amount, currency, status, payment_date, requested_by_employee, description
       FROM hr_payroll_ledger
       WHERE employee_id = $1 AND store_id = $2
       ORDER BY COALESCE(payment_date, created_at) DESC, id DESC
       LIMIT 25`,
      [employeeId, storeId]
    );

    const currentMonthAdvances = payrollRes.rows
      .filter((p: any) => p.period_month === currentMonth && p.item_type === "advance" && p.status === "paid")
      .reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);

    // Expiring documents warning for the employee
    const docsRes = await pool.query(
      `SELECT id, doc_type, title, expiry_date
       FROM hr_documents
       WHERE employee_id = $1 AND store_id = $2
       ORDER BY expiry_date ASC NULLS LAST`,
      [employeeId, storeId]
    );

    const checkpoints = await ensureCheckpointsForStore(pool, storeId);

    res.json({
      employee: {
        id: emp.id,
        full_name: emp.full_name,
        role_title: emp.role_title,
        department: emp.department,
        phone: emp.phone,
        branch_id: emp.branch_id,
        branch_name: emp.branch_name || "Merkez",
        shift_start: emp.shift_start || "09:00",
        shift_end: emp.shift_end || "18:00",
        start_date: emp.start_date,
        base_salary: Number(emp.base_salary || 0),
        salary_currency: emp.salary_currency || "TRY",
      },
      today_log: todayLogRes.rows[0] || null,
      month_stats: monthStats,
      leave_balance: {
        entitled_days: entitledDays,
        used_days: usedAnnualDays,
        remaining_days: Math.max(0, entitledDays - usedAnnualDays),
        tenure_years: tenureYears,
      },
      current_month_advances: currentMonthAdvances,
      attendance_logs: recentLogsRes.rows,
      leave_requests: leavesRes.rows,
      payroll_items: payrollRes.rows,
      documents: docsRes.rows,
      checkpoints: checkpoints.map((c: any) => ({
        id: c.id,
        branch_id: c.branch_id,
        label: c.label,
        branch_type: c.branch_type,
        radius_meters: c.radius_meters,
        strict_gps: c.strict_gps,
        has_gps: c.latitude !== null && c.longitude !== null,
      })),
    });
  } catch (err: any) {
    console.error("[HR-PORTAL] GET /me error:", err);
    res.status(500).json({ error: "Personel özeti yüklenemedi." });
  }
});

/**
 * POST /api/hr-portal/punch
 * Server-side QR token + Haversine GPS radius verification for check-in, break, and check-out.
 */
router.post("/punch", authenticateEmployee, async (req: any, res) => {
  try {
    await ensureHrSchema(pool);
    const { employeeId, storeId } = req.employeeAuth;
    const { action, qr_token, lat, lng } = req.body || {};

    if (!["check_in", "break_start", "break_end", "check_out"].includes(action)) {
      return res.status(400).json({ error: "Geçersiz puantaj işlemi." });
    }

    const empRes = await pool.query(
      `SELECT * FROM hr_employees WHERE id = $1 AND store_id = $2 AND status = 'active' LIMIT 1`,
      [employeeId, storeId]
    );
    if (empRes.rows.length === 0) {
      return res.status(401).json({ error: "Aktif personel bulunamadı." });
    }
    const emp = empRes.rows[0];

    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();

    // Break start / end do not require re-scanning the entrance QR
    if (action === "break_start" || action === "break_end") {
      const openLogRes = await pool.query(
        `SELECT * FROM hr_attendance_logs
         WHERE employee_id = $1 AND store_id = $2 AND work_date = $3 AND check_out_at IS NULL
         ORDER BY id DESC LIMIT 1`,
        [employeeId, storeId, todayStr]
      );
      if (openLogRes.rows.length === 0) {
        return res.status(400).json({ error: "Mola için önce işbaşı (giriş) yapmalısınız." });
      }
      const log = openLogRes.rows[0];

      if (action === "break_start") {
        if (log.break_started_at) {
          return res.status(400).json({ error: "Zaten moladasınız." });
        }
        const upd = await pool.query(
          `UPDATE hr_attendance_logs SET break_started_at = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
          [now.toISOString(), log.id]
        );
        return res.json({ success: true, log: upd.rows[0], message: "Mola başlatıldı." });
      } else {
        if (!log.break_started_at) {
          return res.status(400).json({ error: "Aktif mola bulunamadı." });
        }
        const addedMin = Math.max(1, Math.round((now.getTime() - new Date(log.break_started_at).getTime()) / 60000));
        const totalBreak = Number(log.break_minutes || 0) + addedMin;
        const upd = await pool.query(
          `UPDATE hr_attendance_logs
           SET break_started_at = NULL, break_minutes = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 RETURNING *`,
          [totalBreak, log.id]
        );
        return res.json({ success: true, log: upd.rows[0], message: `Mola bitirildi (${addedMin} dk).` });
      }
    }

    // For check_in and check_out: validate QR token belonging to store
    let cleanToken = String(qr_token || "").trim();
    // Allow passing full URL scanned by camera (extract ?token=... query param)
    if (cleanToken.includes("token=")) {
      try {
        const u = new URL(cleanToken);
        cleanToken = u.searchParams.get("token") || cleanToken;
      } catch {
        const match = cleanToken.match(/[?&]token=([^&]+)/i);
        if (match) cleanToken = decodeURIComponent(match[1]);
      }
    }

    if (!cleanToken) {
      return res.status(400).json({ error: "Lütfen şube/depo kapısındaki QR kodu okutun." });
    }

    const cpRes = await pool.query(
      `SELECT * FROM hr_location_checkpoints WHERE store_id = $1 AND qr_token = $2 LIMIT 1`,
      [storeId, cleanToken]
    );
    if (cpRes.rows.length === 0) {
      return res.status(403).json({ error: "Geçersiz veya süresi dolmuş şube QR kodu." });
    }
    const cp = cpRes.rows[0];

    const hasCheckpointGps = cp.latitude !== null && cp.longitude !== null && cp.latitude !== undefined && cp.longitude !== undefined;
    const parsedLat = lat !== undefined && lat !== null && lat !== "" ? Number(lat) : null;
    const parsedLng = lng !== undefined && lng !== null && lng !== "" ? Number(lng) : null;
    const hasUserGps = parsedLat !== null && parsedLng !== null && Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

    let distanceMeters: number | null = null;
    let verificationStatus = "qr_only";

    if (hasCheckpointGps) {
      if (!hasUserGps) {
        if (cp.strict_gps) {
          return res.status(400).json({
            error: "Konum izni gerekli. Lütfen telefonunuzda konum (GPS) iznini açıp tekrar deneyin.",
          });
        }
        verificationStatus = "qr_only";
      } else {
        distanceMeters = haversineMeters(Number(cp.latitude), Number(cp.longitude), parsedLat!, parsedLng!);
        const allowedRadius = Math.max(30, Number(cp.radius_meters || 150));
        if (distanceMeters <= allowedRadius) {
          verificationStatus = "qr_gps_verified";
        } else if (cp.strict_gps) {
          return res.status(403).json({
            error: `${cp.label} konumuna ${distanceMeters} m uzaktasınız (izin verilen yarıçap: ${allowedRadius} m). Giriş-çıkış yalnızca işyerinden yapılabilir.`,
            distance_m: distanceMeters,
            allowed_radius_m: allowedRadius,
          });
        } else {
          verificationStatus = "out_of_range";
        }
      }
    }

    if (action === "check_in") {
      // Check if already checked in and open today
      const openRes = await pool.query(
        `SELECT id FROM hr_attendance_logs
         WHERE employee_id = $1 AND store_id = $2 AND work_date = $3 AND check_out_at IS NULL
         LIMIT 1`,
        [employeeId, storeId, todayStr]
      );
      if (openRes.rows.length > 0) {
        return res.status(400).json({ error: "Bugün için zaten aktif bir giriş kaydınız var." });
      }

      const metrics = computeAttendanceMetrics({
        checkInAt: now,
        shiftStart: emp.shift_start || cp.work_start,
        shiftEnd: emp.shift_end || cp.work_end,
        lateToleranceMin: emp.late_tolerance_min ?? cp.late_tolerance_min ?? 15,
      });

      const ins = await pool.query(
        `INSERT INTO hr_attendance_logs (
           store_id, employee_id, branch_id, checkpoint_id, work_date,
           check_in_at, check_in_lat, check_in_lng, check_in_distance_m,
           verification_status, late_minutes
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          storeId,
          employeeId,
          cp.branch_id,
          cp.id,
          todayStr,
          now.toISOString(),
          parsedLat,
          parsedLng,
          distanceMeters,
          verificationStatus,
          metrics.lateMinutes,
        ]
      );

      const distMsg = distanceMeters !== null ? ` · ${distanceMeters} m doğrulandı` : " · QR doğrulandı";
      return res.json({
        success: true,
        log: ins.rows[0],
        message: `Giriş kaydedildi (${cp.label}${distMsg})`,
      });
    }

    // action === "check_out"
    const openLogRes = await pool.query(
      `SELECT * FROM hr_attendance_logs
       WHERE employee_id = $1 AND store_id = $2 AND check_out_at IS NULL
       ORDER BY id DESC LIMIT 1`,
      [employeeId, storeId]
    );
    if (openLogRes.rows.length === 0) {
      return res.status(400).json({ error: "Açık giriş kaydı bulunamadı." });
    }
    const openLog = openLogRes.rows[0];

    let finalBreakMin = Number(openLog.break_minutes || 0);
    if (openLog.break_started_at) {
      finalBreakMin += Math.max(1, Math.round((now.getTime() - new Date(openLog.break_started_at).getTime()) / 60000));
    }

    const metrics = computeAttendanceMetrics({
      checkInAt: openLog.check_in_at,
      checkOutAt: now,
      shiftStart: emp.shift_start || cp.work_start,
      shiftEnd: emp.shift_end || cp.work_end,
      lateToleranceMin: emp.late_tolerance_min ?? cp.late_tolerance_min ?? 15,
      breakMinutes: finalBreakMin,
    });

    const upd = await pool.query(
      `UPDATE hr_attendance_logs
       SET check_out_at = $1,
           break_started_at = NULL,
           break_minutes = $2,
           check_out_lat = $3,
           check_out_lng = $4,
           check_out_distance_m = $5,
           early_leave_minutes = $6,
           overtime_minutes = $7,
           worked_minutes = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        now.toISOString(),
        finalBreakMin,
        parsedLat,
        parsedLng,
        distanceMeters,
        metrics.earlyLeaveMinutes,
        metrics.overtimeMinutes,
        metrics.workedMinutes,
        openLog.id,
      ]
    );

    const hours = Math.floor(metrics.workedMinutes / 60);
    const mins = metrics.workedMinutes % 60;
    return res.json({
      success: true,
      log: upd.rows[0],
      message: `Çıkış kaydedildi · Toplam ${hours} sa ${mins} dk`,
    });
  } catch (err: any) {
    console.error("[HR-PORTAL] POST /punch error:", err);
    res.status(500).json({ error: "Giriş-çıkış işlemi kaydedilemedi." });
  }
});

/**
 * POST /api/hr-portal/leave-request
 * Employee creates a leave request for manager approval.
 */
router.post("/leave-request", authenticateEmployee, async (req: any, res) => {
  try {
    await ensureHrSchema(pool);
    const { employeeId, storeId } = req.employeeAuth;
    const { leave_type, start_date, end_date, reason } = req.body || {};

    if (!start_date || !end_date) {
      return res.status(400).json({ error: "Başlangıç ve bitiş tarihi zorunludur." });
    }
    const validType = HR_LEAVE_TYPE_LABELS[leave_type] ? leave_type : "annual";
    const s = new Date(start_date);
    const e = new Date(end_date);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) {
      return res.status(400).json({ error: "Geçerli bir tarih aralığı seçin." });
    }

    const daysCount = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);

    const ins = await pool.query(
      `INSERT INTO hr_leave_requests (
         store_id, employee_id, leave_type, start_date, end_date, days_count,
         reason, status, requested_by_employee
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', TRUE)
       RETURNING *`,
      [storeId, employeeId, validType, start_date, end_date, daysCount, String(reason || "").trim()]
    );

    res.json({ success: true, leave: ins.rows[0], message: "İzin talebiniz yönetici onayına gönderildi." });
  } catch (err: any) {
    console.error("[HR-PORTAL] POST /leave-request error:", err);
    res.status(500).json({ error: "İzin talebi gönderilemedi." });
  }
});

/**
 * POST /api/hr-portal/advance-request
 * Employee requests a salary advance for manager approval.
 */
router.post("/advance-request", authenticateEmployee, async (req: any, res) => {
  try {
    await ensureHrSchema(pool);
    const { employeeId, storeId } = req.employeeAuth;
    const { amount, description } = req.body || {};

    const numericAmount = Number(String(amount ?? "").replace(/,/g, "."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Geçerli bir avans tutarı girin." });
    }

    const empRes = await pool.query(
      `SELECT full_name, salary_currency FROM hr_employees WHERE id = $1 AND store_id = $2 LIMIT 1`,
      [employeeId, storeId]
    );
    if (empRes.rows.length === 0) {
      return res.status(404).json({ error: "Personel bulunamadı." });
    }

    const now = new Date();
    const periodMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const curr = empRes.rows[0].salary_currency || "TRY";

    const ins = await pool.query(
      `INSERT INTO hr_payroll_ledger (
         store_id, employee_id, period_month, item_type, title, amount, currency,
         status, description, requested_by_employee
       )
       VALUES ($1, $2, $3, 'advance', $4, $5, $6, 'pending_request', $7, TRUE)
       RETURNING *`,
      [
        storeId,
        employeeId,
        periodMonth,
        `${empRes.rows[0].full_name} — ${HR_PAYROLL_ITEM_LABELS.advance} Talebi`,
        numericAmount,
        curr,
        String(description || "").trim(),
      ]
    );

    res.json({ success: true, item: ins.rows[0], message: "Avans talebiniz yönetici onayına iletildi." });
  } catch (err: any) {
    console.error("[HR-PORTAL] POST /advance-request error:", err);
    res.status(500).json({ error: "Avans talebi gönderilemedi." });
  }
});

export default router;
