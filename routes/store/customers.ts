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
  const { full_name, email, phone, address, tax_number, tax_office } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO customers (store_id, full_name, email, phone, address, tax_number, tax_office) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [storeId, full_name, email, phone, address, tax_number, tax_office]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;
  const { full_name, email, phone, address, tax_number, tax_office } = req.body;

  try {
    const result = await pool.query(
      "UPDATE customers SET full_name = $1, email = $2, phone = $3, address = $4, tax_number = $5, tax_office = $6 WHERE id = $7 AND store_id = $8 RETURNING *",
      [full_name, email, phone, address, tax_number, tax_office, id, storeId]
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
