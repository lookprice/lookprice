import express from "express";
import { pool } from "../../models/db";
import bcrypt from "bcryptjs";

const router = express.Router();

// --- Users Management ---

router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query(
      "SELECT id, username, email, role, full_name, name, phone, COALESCE(is_active, true) as is_active, permissions, created_at FROM users WHERE store_id = $1 ORDER BY id ASC",
      [storeId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { username, password, email, role, full_name, name, phone, is_active, permissions } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "E-posta ve şifre zorunludur." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const displayName = full_name || name || email.split("@")[0];
  const userUsername = username || email.split("@")[0];
  const activeStatus = is_active !== undefined ? is_active : true;
  const permsStr = Array.isArray(permissions) ? JSON.stringify(permissions) : (permissions || null);

  try {
    const result = await pool.query(
      "INSERT INTO users (store_id, username, password, email, role, full_name, name, phone, is_active, permissions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, username, email, role, full_name, name, phone, is_active, permissions, created_at",
      [storeId, userUsername, hashedPassword, email, role || 'staff', displayName, displayName, phone || null, activeStatus, permsStr]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;
  const { username, password, email, role, full_name, name, phone, is_active, permissions } = req.body;
  
  const displayName = full_name || name || email?.split("@")[0];
  const activeStatus = is_active !== undefined ? is_active : true;
  const permsStr = Array.isArray(permissions) ? JSON.stringify(permissions) : (permissions || null);

  try {
    if (password && password.trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      await pool.query(
        "UPDATE users SET username = $1, password = $2, email = $3, role = $4, full_name = $5, name = $6, phone = $7, is_active = $8, permissions = $9 WHERE id = $10 AND store_id = $11",
        [username || email?.split("@")[0], hashedPassword, email, role, displayName, displayName, phone || null, activeStatus, permsStr, id, storeId]
      );
    } else {
      await pool.query(
        "UPDATE users SET username = $1, email = $2, role = $3, full_name = $4, name = $5, phone = $6, is_active = $7, permissions = $8 WHERE id = $9 AND store_id = $10",
        [username || email?.split("@")[0], email, role, displayName, displayName, phone || null, activeStatus, permsStr, id, storeId]
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch("/:id/toggle-status", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    await pool.query(
      "UPDATE users SET is_active = $1 WHERE id = $2 AND store_id = $3",
      [is_active, id, storeId]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  await pool.query("DELETE FROM users WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
  res.json({ success: true });
});

export default router;
