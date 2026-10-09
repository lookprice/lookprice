import express from "express";
import { pool, addStockMovement, logAction } from "../../models/db";

const router = express.Router();

// --- BRANCHES ---

router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const currentStoreRes = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
    const parentId = currentStoreRes.rows[0]?.parent_id || storeId;

    const branchesRes = await pool.query(
      "SELECT id, name, slug, address, phone FROM stores WHERE (id = $1 OR parent_id = $1) AND id != $2",
      [parentId, storeId]
    );
    
    const branches = branchesRes.rows.filter(b => b.id !== storeId);
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

router.post("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { name, slug, address, phone } = req.body;
  if (!name || !slug) return res.status(400).json({ error: "Name and slug are required" });

  try {
    const parentStoreRes = await pool.query("SELECT parent_id, branding, theme, store_type, sector FROM stores WHERE id = $1", [storeId]);
    const parent = parentStoreRes.rows[0];
    const parentId = parent?.parent_id || storeId;

    const result = await pool.query(
      `INSERT INTO stores (name, slug, address, phone, parent_id, branding, theme, store_type, sector) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, slug, address || '', phone || '', parentId, parent?.branding || {}, parent?.theme || 'modern', parent?.store_type || 'general', parent?.sector || 'general']
    );

    await logAction(req.user.id, storeId, 'ADD_BRANCH', `Added branch: \${name} (ID: \${result.rows[0].id})`);
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(400).json({ error: "Bu slug zaten kullanımda" });
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;
  const { name, slug, address, phone } = req.body;

  try {
    const currentStoreRes = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
    const parentId = currentStoreRes.rows[0]?.parent_id || storeId;
    
    const checkRes = await pool.query("SELECT id FROM stores WHERE id = $1 AND parent_id = $2", [id, parentId]);
    if (checkRes.rows.length === 0) return res.status(403).json({ error: "Unauthorized" });

    const result = await pool.query(
      "UPDATE stores SET name = $1, slug = $2, address = $3, phone = $4 WHERE id = $5 RETURNING *",
      [name, slug, address, phone, id]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;

  try {
    const currentStoreRes = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
    const parentId = currentStoreRes.rows[0]?.parent_id || storeId;
    
    const checkRes = await pool.query("SELECT id FROM stores WHERE id = $1 AND parent_id = $2", [id, parentId]);
    if (checkRes.rows.length === 0) return res.status(403).json({ error: "Unauthorized" });

    await pool.query("DELETE FROM stores WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/stock/:barcode", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { barcode } = req.params;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const currentStoreRes = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
    const parentId = currentStoreRes.rows[0]?.parent_id || storeId;

    const stockRes = await pool.query(
      `SELECT s.name as store_name, p.stock_quantity, p.price, p.currency
       FROM products p
       JOIN stores s ON p.store_id = s.id
       WHERE p.barcode = $1 AND (s.id = $2 OR s.parent_id = $2) AND s.id != $3`,
      [barcode, parentId, storeId]
    );
    
    res.json(stockRes.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch branch stock" });
  }
});

// --- STOCK TRANSFERS ---

router.get("/transfers", async (req: any, res) => {
  const requestedStoreId = req.query.storeId || req.user.store_id;
  const currentStoreId = req.user.store_id;
  const includeBranches = req.query.includeBranches === 'true';
  
  if (!requestedStoreId) return res.status(400).json({ error: "Store ID required" });

  try {
    const storeIdNum = Number(requestedStoreId);
    if (isNaN(storeIdNum)) return res.status(400).json({ error: "Invalid Store ID" });

    let storeIds = [storeIdNum];

    const storeRes = await pool.query("SELECT id, parent_id FROM stores WHERE id = $1", [storeIdNum]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }
    
    const parentId = storeRes.rows[0].parent_id || storeIdNum;

    if (includeBranches) {
      const groupRes = await pool.query("SELECT id FROM stores WHERE id = $1 OR parent_id = $1", [parentId]);
      storeIds = groupRes.rows.map(r => r.id);
    }

    if (req.user.role !== "superadmin") {
      const currentStoreRes = await pool.query("SELECT id, parent_id FROM stores WHERE id = $1", [currentStoreId]);
      if (currentStoreRes.rows.length === 0) return res.status(403).json({ error: "User store not found" });
      
      const userParentId = currentStoreRes.rows[0].parent_id || currentStoreId;

      const unauthorizedIds = await pool.query(
        "SELECT id FROM stores WHERE id = ANY($1) AND id != $2 AND parent_id != $2",
        [storeIds, userParentId]
      );

      if (unauthorizedIds.rows.length > 0) {
        return res.status(403).json({ error: "Unauthorized to view transfers for these stores" });
      }
    }

    const transfersRes = await pool.query(
      `SELECT st.*, 
              fs.name as from_store_name, 
              ts.name as to_store_name,
              u.email as created_by_email,
              up.email as prepared_by_email,
              us.email as shipped_by_email
       FROM stock_transfers st
       JOIN stores fs ON st.from_store_id = fs.id
       JOIN stores ts ON st.to_store_id = ts.id
       LEFT JOIN users u ON st.created_by = u.id
       LEFT JOIN users up ON st.prepared_by = up.id
       LEFT JOIN users us ON st.shipped_by = us.id
       WHERE st.from_store_id = ANY($1) OR st.to_store_id = ANY($1)
       ORDER BY st.created_at DESC`,
      [storeIds]
    );

    const transfers = await Promise.all(transfersRes.rows.map(async (t) => {
      const itemsRes = await pool.query(
        `SELECT sti.*, COALESCE(sti.product_name, p.name) as product_name, COALESCE(sti.barcode, p.barcode) as barcode
         FROM stock_transfer_items sti
         LEFT JOIN products p ON sti.product_id = p.id
         WHERE sti.transfer_id = $1`,
        [t.id]
      );
      return { ...t, items: itemsRes.rows };
    }));

    res.json(transfers);
  } catch (error) {
    console.error("Error fetching stock transfers:", error);
    res.status(500).json({ error: "Failed to fetch stock transfers" });
  }
});

router.post("/transfers", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  const userId = req.user.id;
  const { from_store_id, to_store_id, notes, items } = req.body;

  if (!from_store_id || !to_store_id || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (req.user.role !== 'superadmin' && Number(from_store_id) !== Number(storeId) && Number(to_store_id) !== Number(storeId)) {
    return res.status(403).json({ error: "Unauthorized to create this transfer" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const transferRes = await client.query(
      `INSERT INTO stock_transfers (from_store_id, to_store_id, notes, created_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [from_store_id, to_store_id, notes, userId]
    );
    const transferId = transferRes.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO stock_transfer_items (transfer_id, product_id, quantity, barcode, product_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [transferId, item.product_id, item.quantity, item.barcode, item.product_name || item.name]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, transferId });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to create stock transfer" });
  } finally {
    client.release();
  }
});

router.put("/transfers/:id/status", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  const lang = req.query.lang || 'tr';

  if (!['pending', 'accepted', 'preparing', 'shipped', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const transferRes = await client.query(
      "SELECT * FROM stock_transfers WHERE id = $1",
      [id]
    );
    const transfer = transferRes.rows[0];

    if (!transfer) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Transfer not found" });
    }

    if (transfer.status === 'completed' || transfer.status === 'cancelled') {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cannot change status of a completed or cancelled transfer" });
    }

    const itemsRes = await client.query(
      "SELECT i.*, p.product_type FROM stock_transfer_items i JOIN products p ON i.product_id = p.id WHERE i.transfer_id = $1",
      [id]
    );
    const items = itemsRes.rows;

    if (req.user.role !== 'superadmin' && transfer.from_store_id !== storeId && transfer.to_store_id !== storeId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (status === 'shipped' && transfer.status !== 'shipped') {
      for (const item of items) {
        if (item.product_type === 'service') continue;
        const productRes = await client.query(
          "SELECT stock_quantity, name FROM products WHERE id = $1 AND store_id = $2",
          [item.product_id, transfer.from_store_id]
        );
        const product = productRes.rows[0];
        if (!product || product.stock_quantity < item.quantity) {
          await client.query("ROLLBACK");
          return res.status(400).json({ 
            error: lang === 'tr' 
              ? `Yetersiz stok: \${product?.name || 'Ürün bulunamadı'} (Mevcut: \${product?.stock_quantity || 0}, Talep: \${item.quantity})` 
              : `Insufficient stock: \${product?.name || 'Product not found'} (Available: \${product?.stock_quantity || 0}, Requested: \${item.quantity})` 
          });
        }
      }

      for (const item of items) {
        if (item.product_type === 'service') continue;
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, transfer.from_store_id]
        );
        await addStockMovement(client, transfer.from_store_id, item.product_id, 'out', item.quantity, 'transfer', `Transfer Sevk Edildi (ID: \${id}) - Alıcı Mağaza ID: \${transfer.to_store_id}`);
      }
    }

    if (status === 'completed' && transfer.status !== 'completed') {
      const wasShipped = transfer.status === 'shipped';
      
      for (const item of items) {
        if (item.product_type === 'service') continue;
        if (!wasShipped) {
          await client.query(
            "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
            [item.quantity, item.product_id, transfer.from_store_id]
          );
          await addStockMovement(client, transfer.from_store_id, item.product_id, 'out', item.quantity, 'transfer', `Transfer Tamamlandı (ID: \${id}) - Alıcı Mağaza ID: \${transfer.to_store_id}`);
        }

        const receiverProductRes = await client.query(
          "SELECT id FROM products WHERE store_id = $1 AND barcode = $2",
          [transfer.to_store_id, item.barcode]
        );

        let receiverProductId;
        if (receiverProductRes.rows.length > 0) {
          receiverProductId = receiverProductRes.rows[0].id;
          await client.query(
            "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2",
            [item.quantity, receiverProductId]
          );
        } else {
          const senderProductRes = await client.query("SELECT * FROM products WHERE id = $1", [item.product_id]);
          const sp = senderProductRes.rows[0];
          const newProductRes = await client.query(
            `INSERT INTO products (store_id, barcode, name, price, currency, cost_price, cost_currency, tax_rate, description, stock_quantity, unit, category, is_web_sale, product_type)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
            [transfer.to_store_id, sp.barcode, sp.name, sp.price, sp.currency, sp.cost_price, sp.cost_currency, sp.tax_rate, sp.description, item.quantity, sp.unit, sp.category, sp.is_web_sale, sp.product_type]
          );
          receiverProductId = newProductRes.rows[0].id;
        }

        await addStockMovement(client, transfer.to_store_id, receiverProductId, 'in', item.quantity, 'transfer', `Transfer Tamamlandı (ID: \${id}) - Gönderen Mağaza ID: \${transfer.from_store_id}`);
      }
    }

    if (status === 'cancelled' && transfer.status === 'shipped') {
      for (const item of items) {
        if (item.product_type === 'service') continue;
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, transfer.from_store_id]
        );
        await addStockMovement(client, transfer.from_store_id, item.product_id, 'in', item.quantity, 'transfer', `Transfer İptal Edildi (ID: \${id}) - Stok İade Edildi`);
      }
    }

    let updateQuery = "UPDATE stock_transfers SET status = $1, updated_at = CURRENT_TIMESTAMP";
    const params: any[] = [status, id];

    if (status === 'preparing') {
      updateQuery += ", prepared_by = $3";
      params.push(userId);
    } else if (status === 'shipped') {
      updateQuery += ", shipped_by = $3";
      params.push(userId);
    }

    updateQuery += " WHERE id = $2";
    await client.query(updateQuery, params);

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update transfer status error:", error);
    res.status(500).json({ error: "Failed to update transfer status" });
  } finally {
    client.release();
  }
});

router.delete("/transfers/:id", async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.store_id;

  try {
    const transferRes = await pool.query(
      "SELECT * FROM stock_transfers WHERE id = $1",
      [id]
    );
    const transfer = transferRes.rows[0];

    if (!transfer) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    if (req.user.role !== 'superadmin' && transfer.from_store_id !== storeId && transfer.to_store_id !== storeId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await pool.query("DELETE FROM stock_transfers WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete transfer" });
  }
});

export default router;
