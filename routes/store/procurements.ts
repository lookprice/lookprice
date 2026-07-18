import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

// --- Procurements ---

router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const procurements = await pool.query(`
    SELECT pr.*, p.name as product_name, p.barcode
    FROM procurements pr
    JOIN products p ON pr.product_id = p.id
    WHERE pr.store_id = $1 
    ORDER BY pr.created_at DESC
  `, [storeId]);
  res.json(procurements.rows);
});

router.put("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  const { id } = req.params;
  const { status, supplier_id, supplier_stock, supplier_price } = req.body;
  await pool.query(`
    UPDATE procurements 
    SET status = $1, supplier_id = $2, supplier_stock = $3, supplier_price = $4 
    WHERE id = $5 AND store_id = $6
  `, [status, supplier_id, supplier_stock, supplier_price, id, storeId]);
  res.json({ success: true });
});

router.delete("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  await pool.query("DELETE FROM procurements WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
  res.json({ success: true });
});

router.post("/:id/query", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  const { id } = req.params;
  
  try {
    const procRes = await pool.query("SELECT * FROM procurements WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (procRes.rows.length === 0) return res.status(404).json({ error: "Procurement not found" });
    const procurement = procRes.rows[0];
    
    const apisRes = await pool.query("SELECT * FROM supplier_apis WHERE store_id = $1", [storeId]);
    const apis = apisRes.rows;
    
    const results = [];
    for (const api of apis) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`\${api.api_url}?barcode=\${procurement.barcode}`, {
          headers: api.api_key ? { 'Authorization': `Bearer \${api.api_key}` } : {},
          signal: controller.signal
        });
        clearTimeout(timeout);
        
        if (response.ok) {
          const data = await response.json();
          results.push({
            supplier_id: api.id,
            supplier_name: api.name,
            stock: data.stock,
            price: data.price
          });
        }
      } catch (err) {
        console.error(`Error querying API \${api.name}:`, err);
      }
    }
    
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
