import express from "express";
import { pool } from "../../models/db";
import { getAuthorizedStoreId } from "./utils";

const router = express.Router();

router.get("/", async (req: any, res) => {
  const requestedId = req.query.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  try {
    const result = await pool.query(
      "SELECT * FROM blog_posts WHERE store_id = $1 ORDER BY created_at DESC",
      [storeId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req: any, res) => {
  const requestedId = req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  const { title, excerpt, content, image_url, status } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO blog_posts (store_id, title, excerpt, content, image_url, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [storeId, title, excerpt || "", content, image_url || "", status || "published"]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating blog post:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req: any, res) => {
  const { id } = req.params;
  const requestedId = req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  const { title, excerpt, content, image_url, status } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  try {
    const result = await pool.query(
      `UPDATE blog_posts 
       SET title = $1, excerpt = $2, content = $3, image_url = $4, status = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND store_id = $7
       RETURNING *`,
      [title, excerpt || "", content, image_url || "", status || "published", id, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error updating blog post:", error);
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req: any, res) => {
  const { id } = req.params;
  const requestedId = req.query.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  try {
    const result = await pool.query(
      "DELETE FROM blog_posts WHERE id = $1 AND store_id = $2 RETURNING *",
      [id, storeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    res.json({ message: "Yazı başarıyla silindi", deletedPost: result.rows[0] });
  } catch (error: any) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
