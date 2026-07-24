import express from "express";
import { pool } from "../../models/db";
import { cleanDeepBase64 } from "../utils/imageStorage";

const router = express.Router();

// --- CONSULTANTS (CRM) ---

router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query(
      "SELECT * FROM consultants WHERE store_id = $1 ORDER BY name ASC",
      [storeId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch consultants" });
  }
});

router.post("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  req.body = cleanDeepBase64(req.body, `store_${storeId}_consultant`);
  let { name, email, phone, role, branch_id, image_url, performance } = req.body;
  
  const effectiveBranchId = (branch_id === "" || branch_id === null) ? null : branch_id;
  
  try {
    const result = await pool.query(
      `INSERT INTO consultants (store_id, branch_id, name, email, phone, role, image_url, performance) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [storeId, effectiveBranchId, name, email, phone, role, image_url, performance || {}]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Consultant creation error:", error);
    res.status(500).json({ error: "Failed to create consultant" });
  }
});

router.put("/:id", async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  req.body = cleanDeepBase64(req.body, `store_${storeId}_consultant_${id}`);
  let { name, email, phone, role, branch_id, image_url, performance } = req.body;
  
  const effectiveBranchId = (branch_id === "" || branch_id === null) ? null : branch_id;

  try {
    const result = await pool.query(
      `UPDATE consultants 
       SET name = $1, email = $2, phone = $3, role = $4, branch_id = $5, image_url = $6, performance = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND store_id = $9 RETURNING *`,
      [name, email, phone, role, effectiveBranchId, image_url, performance || {}, id, storeId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Consultant not found" });

    try {
      await pool.query(
        `UPDATE real_estate_properties SET responsible_agent = $1 WHERE responsible_consultant_id = $2`,
        [name, id]
      );
    } catch (syncErr) {
      console.warn("Failed to sync updated consultant name to real_estate_properties:", syncErr);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Consultant update error:", error);
    res.status(500).json({ error: "Failed to update consultant" });
  }
});

router.delete("/:id", async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query(
      "DELETE FROM consultants WHERE id = $1 AND store_id = $2 RETURNING *",
      [id, storeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Consultant not found" });
    res.json({ message: "Consultant deleted", consultant: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete consultant" });
  }
});

export default router;
