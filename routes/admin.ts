import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../models/db";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Middleware to ensure superadmin
const isSuperAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
  next();
};

router.use(authenticate);
router.use(isSuperAdmin);

// SuperAdmin: Stats
router.get("/stats", async (req: any, res) => {
  const totalStores = (await pool.query("SELECT COUNT(*)::INT as count FROM stores")).rows[0].count;
  const activeStores = (await pool.query("SELECT COUNT(*)::INT as count FROM stores WHERE subscription_end > CURRENT_DATE")).rows[0].count;
  const totalScans = (await pool.query("SELECT COUNT(*)::INT as count FROM scan_logs")).rows[0].count;
  const scansLast24h = (await pool.query("SELECT COUNT(*)::INT as count FROM scan_logs WHERE created_at > NOW() - INTERVAL '1 day'")).rows[0].count;

  res.json({
    totalStores: parseInt(totalStores),
    activeStores: parseInt(activeStores),
    totalScans: parseInt(totalScans),
    scansLast24h: parseInt(scansLast24h)
  });
});

// SuperAdmin: Manage Stores
router.get("/stores", async (req: any, res) => {
  const stores = await pool.query(`
    SELECT s.*, u.email as admin_email 
    FROM stores s 
    LEFT JOIN users u ON s.id = u.store_id AND u.role = 'storeadmin'
  `);
  res.json(stores.rows);
});

router.post("/stores", async (req: any, res) => {
  const { name, slug, address, contact_person, phone, country, email, subscription_end, admin_email, admin_password, default_currency, language, plan, parent_id } = req.body;
  try {
    await pool.query("BEGIN");
    const storeRes = await pool.query(
      "INSERT INTO stores (name, slug, address, contact_person, phone, country, email, subscription_end, default_currency, language, plan, parent_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id",
      [name, slug, address, contact_person, phone, country || 'TR', email, subscription_end, default_currency || 'TRY', language || 'tr', plan || 'free', parent_id || null]
    );
    const storeId = storeRes.rows[0].id;
    const hashedPassword = bcrypt.hashSync(admin_password, 10);
    await pool.query("INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)", [storeId, admin_email, hashedPassword, "storeadmin"]);
    await pool.query("COMMIT");
    res.json({ success: true, storeId });
  } catch (e: any) {
    await pool.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  }
});

router.put("/stores/:id", async (req: any, res) => {
  const { name, slug, address, contact_person, phone, country, email, subscription_end, default_currency, language, admin_password, plan, parent_id } = req.body;
  try {
    await pool.query("BEGIN");
    await pool.query(`
      UPDATE stores 
      SET name = $1, slug = $2, address = $3, contact_person = $4, phone = $5, country = $6, email = $7, subscription_end = $8, default_currency = $9, language = $10, plan = $11, parent_id = $12
      WHERE id = $13
    `, [name, slug, address, contact_person, phone, country || 'TR', email, subscription_end, default_currency || 'TRY', language || 'tr', plan || 'free', parent_id || null, req.params.id]);

    if (admin_password) {
      const hashedPassword = bcrypt.hashSync(admin_password, 10);
      await pool.query(`
        UPDATE users 
        SET password = $1 
        WHERE store_id = $2 AND role = 'storeadmin'
      `, [hashedPassword, req.params.id]);
    }

    await pool.query("COMMIT");
    res.json({ success: true });
  } catch (e: any) {
    await pool.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  }
});

router.post("/stores/:id/delete", async (req: any, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ error: "Password required" });

  try {
    // Verify admin password
    const admin = await pool.query("SELECT password FROM users WHERE id = $1", [req.user.id]);
    if (!bcrypt.compareSync(password, admin.rows[0].password)) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    await pool.query("BEGIN");
    // Delete related records that don't have ON DELETE CASCADE
    await pool.query("DELETE FROM scan_logs WHERE store_id = $1", [id]);
    await pool.query("DELETE FROM tickets WHERE store_id = $1", [id]);
    await pool.query("DELETE FROM users WHERE store_id = $1", [id]);
    await pool.query("DELETE FROM products WHERE store_id = $1", [id]);
    await pool.query("DELETE FROM stores WHERE id = $1", [id]);
    await pool.query("COMMIT");
    
    res.json({ success: true });
  } catch (e: any) {
    await pool.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  }
});

router.post("/stores/bulk-subscription", async (req: any, res) => {
  const { storeIds, days } = req.body;
  if (!storeIds || !Array.isArray(storeIds) || !days) return res.status(400).json({ error: "Invalid data" });

  try {
    await pool.query("BEGIN");
    for (const id of storeIds) {
      await pool.query(`
        UPDATE stores 
        SET subscription_end = COALESCE(subscription_end, CURRENT_DATE) + ($1 || ' days')::INTERVAL 
        WHERE id = $2
      `, [days, id]);
    }
    await pool.query("COMMIT");
    res.json({ success: true });
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: "Bulk update failed" });
  }
});

// Admin: Leads Management
router.get("/leads", async (req: any, res) => {
  try {
    const leads = await pool.query("SELECT * FROM leads ORDER BY created_at DESC");
    res.json(leads.rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/leads/:id", async (req: any, res) => {
  const { status, probability, notes } = req.body;
  try {
    await pool.query(
      "UPDATE leads SET status = $1, probability = $2, notes = $3 WHERE id = $4",
      [status, probability, notes, req.params.id]
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/leads/:id", async (req: any, res) => {
  try {
    await pool.query("DELETE FROM leads WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e: any) {
    console.error("Delete lead error:", e);
    res.status(400).json({ error: e.message });
  }
});

// Admin: Registration Requests
router.get("/registration-requests", async (req: any, res) => {
  try {
    const requests = await pool.query("SELECT * FROM registration_requests ORDER BY created_at DESC");
    res.json(requests.rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/stores/:id/custom-domain", async (req: any, res) => {
  const { id } = req.params;
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: "Domain required" });

  try {
    const { cloudflareService } = await import("../src/services/cloudflareService");
    const cfResult = await cloudflareService.addCustomHostname(domain);
    
    await pool.query("UPDATE stores SET custom_domain = $1 WHERE id = $2", [domain, id]);
    
    res.json({ success: true, cfResult });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/stores/:id/custom-domain/status", async (req: any, res) => {
  const { id } = req.params;
  try {
    const storeRes = await pool.query("SELECT custom_domain FROM stores WHERE id = $1", [id]);
    const domain = storeRes.rows[0]?.custom_domain;
    if (!domain) return res.status(404).json({ error: "No custom domain set for this store" });

    const { cloudflareService } = await import("../src/services/cloudflareService");
    const status = await cloudflareService.getCustomHostnameStatus(domain);
    
    res.json({ success: true, domain, status });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/registration-requests/:id/approve", async (req: any, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const requestRes = await client.query("SELECT * FROM registration_requests WHERE id = $1", [id]);
    const request = requestRes.rows[0];
    if (!request) throw new Error("Request not found");
    if (request.status !== 'pending') throw new Error("Request already processed");

    // 1. Create Store
    const slug = request.store_name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).substring(2, 5);
    const storeRes = await client.query(
      "INSERT INTO stores (name, slug, address, contact_person, phone, email, default_currency, language, plan, country, subscription_end) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE + INTERVAL '1 year') RETURNING id",
      [request.store_name, slug, request.address, request.company_title, request.phone, request.username, request.currency, request.language, request.plan || 'free', request.country || 'TR']
    );
    const storeId = storeRes.rows[0].id;

    // 2. Create User
    const hashedPassword = bcrypt.hashSync(request.password, 10);
    await client.query("INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)", [storeId, request.username, hashedPassword, "storeadmin"]);

    // 3. Import Products if any
    if (request.upload_method === 'excel' && request.excel_data && request.mapping) {
      const products = request.excel_data;
      const mapping = request.mapping;
      for (const p of products) {
        const barcode = String(p[mapping.barcode] || "");
        const name = String(p[mapping.name] || "");
        const price = parseFloat(p[mapping.price]) || 0;
        const description = String(p[mapping.description] || "");
        
        if (barcode && name) {
          await client.query(
            "INSERT INTO products (store_id, barcode, name, price, currency, description) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
            [storeId, barcode, name, price, request.currency, description]
          );
        }
      }
    }

    // 4. Update request status
    await client.query("UPDATE registration_requests SET status = 'approved' WHERE id = $1", [id]);

    await client.query("COMMIT");
    res.json({ success: true, slug });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.post("/registration-requests/:id/reject", async (req: any, res) => {
  try {
    await pool.query("UPDATE registration_requests SET status = 'rejected' WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
