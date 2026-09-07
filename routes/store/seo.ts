import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

// SEO Pages
router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query(
      "SELECT * FROM seo_pages WHERE store_id = $1 ORDER BY created_at DESC",
      [storeId]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { category_id, features_hash, slug, h1, title, description, keywords, breadcrumb, status, is_manual, faq, descriptions } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO seo_pages (id, store_id, category_id, features_hash, slug, h1, title, description, keywords, breadcrumb, status, is_manual, created_at, updated_at, faq, descriptions)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $12, $13) RETURNING *`,
      [storeId, category_id, features_hash, slug, h1, title, description, keywords, breadcrumb, status, is_manual, JSON.stringify(faq || []), JSON.stringify(descriptions || [])]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { category_id, features_hash, slug, h1, title, description, keywords, breadcrumb, status, is_manual, faq, descriptions } = req.body;
  try {
    const result = await pool.query(
      `UPDATE seo_pages 
       SET category_id = $1, features_hash = $2, slug = $3, h1 = $4, title = $5, description = $6, keywords = $7, breadcrumb = $8, status = $9, is_manual = $10, updated_at = CURRENT_TIMESTAMP, faq = $13, descriptions = $14
       WHERE id = $11 AND store_id = $12 RETURNING *`,
      [category_id, features_hash, slug, h1, title, description, keywords, breadcrumb, status, is_manual, id, storeId, JSON.stringify(faq || []), JSON.stringify(descriptions || [])]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "SEO page not found" });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query(
      "DELETE FROM seo_pages WHERE id = $1 AND store_id = $2 RETURNING *",
      [id, storeId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "SEO page not found" });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
