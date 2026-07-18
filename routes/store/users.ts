import express from "express";
import { pool } from "../../models/db";
import bcrypt from "bcryptjs";

const router = express.Router();

// --- Users Management ---

router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const result = await pool.query("SELECT id, username, email, role, full_name, is_active, created_at FROM users WHERE store_id = $1", [storeId]);
  res.json(result.rows);
});

router.post("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { username, password, email, role, full_name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const result = await pool.query(
      "INSERT INTO users (store_id, username, password, email, role, full_name) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, email, role, full_name",
      [storeId, username, hashedPassword, email, role || 'staff', full_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;
  const { username, email, role, full_name, is_active } = req.body;
  
  try {
    await pool.query(
      "UPDATE users SET username = $1, email = $2, role = $3, full_name = $4, is_active = $5 WHERE id = $6 AND store_id = $7",
      [username, email, role, full_name, is_active, id, storeId]
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
