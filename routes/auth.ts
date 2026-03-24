import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../models/db.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Auth: Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userRes = await pool.query(`
    SELECT u.*, s.slug as store_slug 
    FROM users u 
    LEFT JOIN stores s ON u.store_id = s.id 
    WHERE u.email = $1
  `, [email]);
  
  const user = userRes.rows[0];
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  
  const token = jwt.sign({ 
    id: user.id, 
    role: user.role, 
    store_id: user.store_id,
    store_slug: user.store_slug 
  }, JWT_SECRET);
  
  res.json({ 
    token, 
    user: { 
      email: user.email, 
      role: user.role, 
      store_id: user.store_id,
      store_slug: user.store_slug 
    } 
  });
});

router.post("/change-password", authenticate, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  const user = userRes.rows[0];

  if (user && bcrypt.compareSync(currentPassword, user.password)) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, req.user.id]);
    res.json({ success: true });
  } else {
    res.status(400).json({ error: "Mevcut şifre hatalı" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = userRes.rows[0];

  if (!user) {
    return res.status(404).json({ error: "Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı" });
  }

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const expiry = new Date(Date.now() + 3600000); // 1 hour

  await pool.query("UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3", [token, expiry, user.id]);

  console.log(`Password reset link: /reset-password/${token}`);
  
  res.json({ 
    success: true, 
    message: "Şifre sıfırlama bağlantısı simüle edildi.",
    debug_token: token
  });
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  const userRes = await pool.query("SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()", [token]);
  const user = userRes.rows[0];

  if (!user) {
    return res.status(400).json({ error: "Geçersiz veya süresi dolmuş sıfırlama bağlantısı" });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  await pool.query("UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2", [hashedPassword, user.id]);
  res.json({ success: true });
});

export default router;
