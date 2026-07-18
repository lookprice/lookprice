import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

// GET /api/store/supplier-apis
router.get("/", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const result = await pool.query(
      "SELECT * FROM supplier_apis WHERE store_id = $1 ORDER BY created_at DESC",
      [storeId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error in GET /api/store/supplier-apis:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/store/supplier-apis
router.post("/", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const { name, api_url, api_key } = req.body;

    if (!name || !api_url) {
      return res.status(400).json({ error: "Name and API URL are required" });
    }

    const result = await pool.query(
      `INSERT INTO supplier_apis (store_id, name, api_url, api_key)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [storeId, name, api_url, api_key]
    );

    res.status(210).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error in POST /api/store/supplier-apis:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/store/supplier-apis/:id
router.put("/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;
    const { name, api_url, api_key } = req.body;

    if (!name || !api_url) {
      return res.status(400).json({ error: "Name and API URL are required" });
    }

    const checkRes = await pool.query(
      "SELECT id FROM supplier_apis WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Supplier API not found" });
    }

    const result = await pool.query(
      `UPDATE supplier_apis
       SET name = $1, api_url = $2, api_key = $3
       WHERE id = $4 AND store_id = $5 RETURNING *`,
      [name, api_url, api_key, id, storeId]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error in PUT /api/store/supplier-apis/:id:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/store/supplier-apis/:id
router.delete("/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;

    const checkRes = await pool.query(
      "SELECT id FROM supplier_apis WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: "Supplier API not found" });
    }

    await pool.query(
      "DELETE FROM supplier_apis WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );

    res.json({ success: true, message: "Supplier API deleted successfully" });
  } catch (error: any) {
    console.error("Error in DELETE /api/store/supplier-apis/:id:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
