import express from "express";
import { pool, addStockMovement } from "../../models/db";

const router = express.Router();

router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const result = await pool.query(
      `SELECT st.*, s1.name as from_store_name, s2.name as to_store_name 
       FROM stock_transfers st
       JOIN stores s1 ON st.from_store_id = s1.id
       JOIN stores s2 ON st.to_store_id = s2.id
       WHERE st.from_store_id = $1 OR st.to_store_id = $1
       ORDER BY st.created_at DESC`,
      [storeId]
    );
    
    const transfersWithItems = await Promise.all(result.rows.map(async (t: any) => {
      const items = await pool.query("SELECT * FROM stock_transfer_items WHERE transfer_id = $1", [t.id]);
      return { ...t, items: items.rows };
    }));
    
    res.json(transfersWithItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transfers" });
  }
});

router.post("/", async (req: any, res) => {
  const fromStoreId = req.user.store_id;
  const { toStoreId, items, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const transferRes = await client.query(
      "INSERT INTO stock_transfers (from_store_id, to_store_id, notes, status, created_by) VALUES ($1, $2, $3, 'pending', $4) RETURNING id",
      [fromStoreId, toStoreId, notes, req.user.id]
    );
    const transferId = transferRes.rows[0].id;

    for (const item of items) {
      await client.query(
        "INSERT INTO stock_transfer_items (transfer_id, product_id, barcode, product_name, quantity, product_type) VALUES ($1, $2, $3, $4, $5, $6)",
        [transferId, item.id, item.barcode, item.name, item.quantity, item.product_type || 'product']
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ id: transferId });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to create transfer" });
  } finally {
    client.release();
  }
});

router.put("/:id/status", async (req: any, res) => {
  const { id } = req.params;
  const { status, lang } = req.body;
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const transferRes = await client.query("SELECT * FROM stock_transfers WHERE id = $1 FOR UPDATE", [id]);
    const transfer = transferRes.rows[0];
    if (!transfer) throw new Error("Transfer not found");

    const itemsRes = await client.query("SELECT * FROM stock_transfer_items WHERE transfer_id = $1", [id]);
    const items = itemsRes.rows;

    if (status === 'shipped' && transfer.status !== 'shipped' && transfer.status !== 'completed') {
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
              ? `Yetersiz stok: ${product?.name || 'Ürün bulunamadı'} (Mevcut: ${product?.stock_quantity || 0}, Talep: ${item.quantity})` 
              : `Insufficient stock: ${product?.name || 'Product not found'} (Available: ${product?.stock_quantity || 0}, Requested: ${item.quantity})` 
          });
        }
      }

      for (const item of items) {
        if (item.product_type === 'service') continue;
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, transfer.from_store_id]
        );
        await addStockMovement(client, transfer.from_store_id, item.product_id, 'out', item.quantity, 'transfer', `Transfer Sevk Edildi (ID: ${id}) - Alıcı Mağaza ID: ${transfer.to_store_id}`);
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
          await addStockMovement(client, transfer.from_store_id, item.product_id, 'out', item.quantity, 'transfer', `Transfer Tamamlandı (ID: ${id}) - Alıcı Mağaza ID: ${transfer.to_store_id}`);
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

        await addStockMovement(client, transfer.to_store_id, receiverProductId, 'in', item.quantity, 'transfer', `Transfer Tamamlandı (ID: ${id}) - Gönderen Mağaza ID: ${transfer.from_store_id}`);
      }
    }

    if (status === 'cancelled' && transfer.status === 'shipped') {
      for (const item of items) {
        if (item.product_type === 'service') continue;
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, transfer.from_store_id]
        );
        await addStockMovement(client, transfer.from_store_id, item.product_id, 'in', item.quantity, 'transfer', `Transfer İptal Edildi (ID: ${id}) - Stok İade Edildi`);
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
    res.status(500).json({ error: "Failed to update transfer status" });
  } finally {
    client.release();
  }
});

router.delete("/:id", async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.store_id;

  try {
    const transferRes = await pool.query("SELECT * FROM stock_transfers WHERE id = $1", [id]);
    const transfer = transferRes.rows[0];

    if (!transfer) return res.status(404).json({ error: "Transfer not found" });

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
