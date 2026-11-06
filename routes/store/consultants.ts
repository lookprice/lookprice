import express from "express";
import { pool } from "../../models/db";
import { cleanDeepBase64 } from "../utils/imageStorage";

const router = express.Router();

// --- CONSULTANTS (CRM) ---

// Ensure external partner columns exist in consultants table
let columnsEnsured = false;
async function ensureConsultantColumns() {
  if (columnsEnsured) return;
  try {
    await pool.query(`
      ALTER TABLE consultants ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT FALSE;
      ALTER TABLE consultants ADD COLUMN IF NOT EXISTS partner_type VARCHAR(50) DEFAULT 'internal';
      ALTER TABLE consultants ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 20;
      ALTER TABLE consultants ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
      ALTER TABLE consultants ADD COLUMN IF NOT EXISTS iban VARCHAR(100);
    `);
    columnsEnsured = true;
  } catch (err) {
    console.warn("Notice ensuring consultant columns:", err);
  }
}

router.get("/", async (req: any, res) => {
  await ensureConsultantColumns();
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
  await ensureConsultantColumns();
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  req.body = await cleanDeepBase64(req.body, `store_${storeId}_consultant`);
  let { name, email, phone, role, branch_id, image_url, performance, is_external, partner_type, commission_rate, company_name, iban } = req.body;
  
  const effectiveBranchId = (branch_id === "" || branch_id === null) ? null : branch_id;
  const isExt = !!is_external || partner_type === 'external';
  const pType = partner_type || (isExt ? 'external' : 'internal');
  const commRate = Number(commission_rate) || 20;
  
  try {
    const result = await pool.query(
      `INSERT INTO consultants (
        store_id, branch_id, name, email, phone, role, image_url, performance, 
        is_external, partner_type, commission_rate, company_name, iban
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        storeId, effectiveBranchId, name, email, phone, role, image_url, performance || {},
        isExt, pType, commRate, company_name || null, iban || null
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Consultant creation error:", error);
    res.status(500).json({ error: "Failed to create consultant" });
  }
});

router.put("/:id", async (req: any, res) => {
  await ensureConsultantColumns();
  const { id } = req.params;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  req.body = await cleanDeepBase64(req.body, `store_${storeId}_consultant_${id}`);
  let { name, email, phone, role, branch_id, image_url, performance, is_external, partner_type, commission_rate, company_name, iban } = req.body;
  
  const effectiveBranchId = (branch_id === "" || branch_id === null) ? null : branch_id;
  const isExt = is_external !== undefined ? !!is_external : (partner_type === 'external');
  const pType = partner_type || (isExt ? 'external' : 'internal');
  const commRate = Number(commission_rate) || 20;

  try {
    const result = await pool.query(
      `UPDATE consultants 
       SET name = $1, email = $2, phone = $3, role = $4, branch_id = $5, image_url = $6, performance = $7,
           is_external = COALESCE($8, is_external),
           partner_type = COALESCE($9, partner_type),
           commission_rate = COALESCE($10, commission_rate),
           company_name = COALESCE($11, company_name),
           iban = COALESCE($12, iban),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 AND store_id = $14 RETURNING *`,
      [
        name, email, phone, role, effectiveBranchId, image_url, performance || {},
        isExt, pType, commRate, company_name || null, iban || null,
        id, storeId
      ]
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
