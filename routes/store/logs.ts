import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

// --- Audit Logs ---

router.get("/audit-logs", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const rawLimit = Number(req.query.limit);
  const rawOffset = Number(req.query.offset);
  const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 500) : 100;
  const safeOffset = Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;

  const result = await pool.query(
    "SELECT l.*, u.email as user_email FROM audit_logs l LEFT JOIN users u ON l.user_id = u.id WHERE l.store_id = $1 ORDER BY l.created_at DESC LIMIT $2 OFFSET $3",
    [storeId, safeLimit, safeOffset]
  );
  res.json(result.rows);
});

export default router;
