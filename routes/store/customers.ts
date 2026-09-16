import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { search } = req.query;

  let query = "SELECT * FROM customers WHERE store_id = $1";
  const params: any[] = [storeId];

  if (search) {
    query += " AND (full_name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)";
    params.push(`%${search}%`);
  }

  query += " ORDER BY created_at DESC";

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { full_name, name, surname, email, phone, address, tax_number, tax_office } = req.body;

  try {
    const rawFullName = (full_name || '').trim();
    let firstNameVal = name ? String(name).trim() : '';
    let surnameVal = surname ? String(surname).trim() : '';

    if (!surnameVal && rawFullName.includes(' ')) {
      const parts = rawFullName.split(' ');
      surnameVal = parts.pop() || '';
      firstNameVal = parts.join(' ');
    } else if (!firstNameVal) {
      firstNameVal = rawFullName;
    }

    const calculatedFullName = rawFullName || [firstNameVal, surnameVal].filter(Boolean).join(' ');

    const effectiveEmail = (email && email.trim()) || `cust_${storeId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@lookprice.local`;

    const result = await pool.query(
      `INSERT INTO customers (store_id, full_name, name, surname, email, phone, address, tax_number, tax_office) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       ON CONFLICT (store_id, email) DO UPDATE SET
         full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), customers.full_name),
         name = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
         surname = COALESCE(NULLIF(EXCLUDED.surname, ''), customers.surname),
         phone = COALESCE(NULLIF(EXCLUDED.phone, ''), customers.phone),
         address = COALESCE(NULLIF(EXCLUDED.address, ''), customers.address),
         tax_number = COALESCE(NULLIF(EXCLUDED.tax_number, ''), customers.tax_number),
         tax_office = COALESCE(NULLIF(EXCLUDED.tax_office, ''), customers.tax_office)
       RETURNING *`,
      [storeId, calculatedFullName, firstNameVal, surnameVal, effectiveEmail, phone, address, tax_number, tax_office]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505' || err.message?.includes('duplicate key')) {
      return res.status(400).json({ error: "Bu e-posta adresine sahip bir müşteri kaydı zaten mevcuttur." });
    }
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;
  const { full_name, name, surname, email, phone, address, tax_number, tax_office } = req.body;

  try {
    const rawFullName = (full_name || '').trim();
    let firstNameVal = name ? String(name).trim() : '';
    let surnameVal = surname ? String(surname).trim() : '';

    if (!surnameVal && rawFullName.includes(' ')) {
      const parts = rawFullName.split(' ');
      surnameVal = parts.pop() || '';
      firstNameVal = parts.join(' ');
    } else if (!firstNameVal) {
      firstNameVal = rawFullName;
    }

    const calculatedFullName = rawFullName || [firstNameVal, surnameVal].filter(Boolean).join(' ');

    const result = await pool.query(
      "UPDATE customers SET full_name = $1, name = $2, surname = $3, email = $4, phone = $5, address = $6, tax_number = $7, tax_office = $8 WHERE id = $9 AND store_id = $10 RETURNING *",
      [calculatedFullName, firstNameVal, surnameVal, email, phone, address, tax_number, tax_office, id, storeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Customer not found" });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  await pool.query("DELETE FROM customers WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
  res.json({ success: true });
});

export default router;
