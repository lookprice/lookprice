import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../models/db";
import { authenticate, JWT_SECRET } from "../middleware/auth";

const router = express.Router();

// Helper for password policy (LookPrice Corporate Security Standards)
const isValidPassword = (password: string) => {
  if (!password || password.length < 12) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
};

// Auth: Login
router.post("/login", async (req, res) => {
  const { email, password, storeCode } = req.body || {};

  const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
  if (!normalizedEmail || typeof password !== "string" || password.length === 0) {
    return res.status(401).json({ error: "Geçersiz e-posta veya şifre." });
  }

  let user: any = null;

  try {
    let query = `
      SELECT u.*, s.slug as store_slug, s.status as store_status, s.is_approved as store_is_approved, s.store_code
      FROM users u 
      LEFT JOIN stores s ON u.store_id = s.id 
      WHERE LOWER(u.email) = LOWER($1)
    `;
    const params: any[] = [normalizedEmail];

    if (storeCode) {
      query += ` AND (s.store_code = $2 OR u.role = 'superadmin')`;
      params.push(storeCode);
    }

    const userRes = await pool.query(query, params);
    if (userRes.rows.length > 0) {
      const dbUser = userRes.rows[0];
      const storedHash = typeof dbUser.password === "string" ? dbUser.password : "";

      if (storedHash.length > 0) {
        let isPasswordValid = false;
        const isBcryptHash =
          storedHash.startsWith("$2a$") ||
          storedHash.startsWith("$2b$") ||
          storedHash.startsWith("$2y$");

        if (isBcryptHash) {
          try {
            isPasswordValid = bcrypt.compareSync(password, storedHash);
          } catch {
            isPasswordValid = false;
          }
        } else if (storedHash === password) {
          // Legacy non-empty plaintext record: verify and upgrade in DB to bcrypt hash
          isPasswordValid = true;
          try {
            const upgradedHash = bcrypt.hashSync(password, 10);
            await pool.query("UPDATE users SET password = $1 WHERE id = $2", [upgradedHash, dbUser.id]);
          } catch (upgradeErr) {
            console.warn("Legacy password hash upgrade warning:", upgradeErr);
          }
        }

        if (isPasswordValid) {
          user = dbUser;
        }
      }
    }
  } catch (dbErr) {
    console.warn("DB login query error:", dbErr);
  }

  if (!user || user.is_active === false) {
    return res.status(401).json({ error: "Geçersiz e-posta veya şifre." });
  }

  // Check store approval/suspension status for store users
  if (user.role !== "superadmin" && user.store_id) {
    if (user.store_is_approved === false || user.store_status === "suspended") {
      return res.status(403).json({ 
        error: "store_suspended", 
        message: "Mağazanız askıya alınmıştır veya onaylanmamıştır. Lütfen sistem yöneticisi ile iletişime geçiniz." 
      });
    }
  }

  // If user has store_id but store_slug is missing, fetch it from stores table
  let storeSlug = user.store_slug;
  if (user.store_id && !storeSlug) {
    try {
      const storeRes = await pool.query("SELECT slug FROM stores WHERE id = $1", [user.store_id]);
      if (storeRes.rows.length > 0) {
        storeSlug = storeRes.rows[0].slug;
      }
    } catch {}
  }
  
  const finalSlug = user.role === "superadmin" ? null : (storeSlug || null);

  const token = jwt.sign(
    { 
      id: user.id, 
      role: user.role, 
      store_id: user.store_id,
      store_slug: finalSlug
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
  
  res.json({ 
    token, 
    user: { 
      id: user.id,
      email: user.email, 
      role: user.role, 
      store_id: user.store_id,
      store_slug: finalSlug,
      password_needs_update: false
    } 
  });
});

// Auth: Register
router.post("/register", async (req, res) => {
  const { name, email, password, phone, address, store_id } = req.body || {};
  
  try {
    if (!isValidPassword(password)) {
      return res.status(400).json({ error: "LookPrice Kurumsal Güvenlik Standartları: Şifreniz en az 12 karakter olmalı ve büyük/küçük harf, rakam ve sembol içermelidir." });
    }

    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
    if (!normalizedEmail) {
      return res.status(400).json({ error: "Geçerli bir e-posta adresi giriniz." });
    }

    // Check if user exists
    const existingUser = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Bu e-posta adresi zaten kayıtlı." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const newUser = await pool.query(`
      INSERT INTO users (name, email, password, phone, address, role, store_id) 
      VALUES ($1, $2, $3, $4, $5, 'customer', $6) 
      RETURNING id, name, email, role, store_id
    `, [name, normalizedEmail, hashedPassword, phone, address, store_id || null]);

    const user = newUser.rows[0];
    
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        store_id: user.store_id 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    res.json({ 
      token, 
      user: { 
        email: user.email, 
        role: user.role, 
        store_id: user.store_id,
        password_needs_update: false
      } 
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Kayıt olurken bir hata oluştu." });
  }
});

router.post("/change-password", authenticate, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ error: "LookPrice Kurumsal Güvenlik Standartları: Şifreniz en az 12 karakter olmalı ve büyük/küçük harf, rakam ve sembol içermelidir." });
  }

  const userRes = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
  const user = userRes.rows[0];

  if (user && typeof currentPassword === "string" && bcrypt.compareSync(currentPassword, user.password)) {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, req.user.id]);
    res.json({ success: true, password_needs_update: false });
  } else {
    res.status(400).json({ error: "Mevcut şifre hatalı" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const normalizedEmail = typeof req.body?.email === "string" ? req.body.email.toLowerCase().trim() : "";
  const genericResponse = {
    success: true,
    message: "Eğer bu e-posta sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderildi."
  };

  if (!normalizedEmail) {
    return res.json(genericResponse);
  }

  try {
    const userRes = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [normalizedEmail]);
    const user = userRes.rows[0];

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      await pool.query("UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3", [tokenHash, expiry, user.id]);
    }
  } catch (err) {
    console.error("Forgot password error:", err);
  }

  return res.json(genericResponse);
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body || {};

  if (typeof token !== "string" || token.trim().length < 16) {
    return res.status(400).json({ error: "Geçersiz veya süresi dolmuş sıfırlama bağlantısı" });
  }

  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ error: "LookPrice Kurumsal Güvenlik Standartları: Şifreniz en az 12 karakter olmalı ve büyük/küçük harf, rakam ve sembol içermelidir." });
  }

  const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
  const userRes = await pool.query(
    "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
    [tokenHash]
  );
  const user = userRes.rows[0];

  if (!user) {
    return res.status(400).json({ error: "Geçersiz veya süresi dolmuş sıfırlama bağlantısı" });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  await pool.query(
    "UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
    [hashedPassword, user.id]
  );
  res.json({ success: true });
});

export default router;
