import express from "express";
import { pool, logAction } from "../../models/db";
import {
  ensureSystemLocationsForStore,
  recomputeLocationPathsRecursive,
  processTransferStatusTransition
} from "../../src/services/backend/warehouseService";

const router = express.Router();

// --- BRANCHES ---

router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const currentStoreRes = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
    const parentId = currentStoreRes.rows[0]?.parent_id || storeId;

    const branchesRes = await pool.query(
      `SELECT id, name, slug, address, phone,
              COALESCE(branch_type, 'STORE') AS branch_type,
              COALESCE(has_pos, TRUE) AS has_pos,
              COALESCE(is_central_warehouse, FALSE) AS is_central_warehouse,
              COALESCE(allow_direct_sales, TRUE) AS allow_direct_sales,
              COALESCE(use_bin_locations, FALSE) AS use_bin_locations,
              COALESCE(receiving_sla_hours, 24) AS receiving_sla_hours,
              COALESCE(include_in_online_stock, FALSE) AS include_in_online_stock,
              COALESCE(sell_receiving_stock, FALSE) AS sell_receiving_stock
       FROM stores WHERE (id = $1 OR parent_id = $1) AND id != $2`,
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
  const {
    name, slug, address, phone,
    branch_type = 'STORE',
    has_pos,
    is_central_warehouse = false,
    allow_direct_sales,
    use_bin_locations = false,
    receiving_sla_hours = 24,
    include_in_online_stock = false,
    sell_receiving_stock = false
  } = req.body;
  if (!name || !slug) return res.status(400).json({ error: "Name and slug are required" });

  const normType = String(branch_type).toUpperCase() === 'WAREHOUSE' ? 'WAREHOUSE' : 'STORE';
  const resolvedHasPos = has_pos !== undefined ? Boolean(has_pos) : normType !== 'WAREHOUSE';
  const resolvedDirectSales = allow_direct_sales !== undefined ? Boolean(allow_direct_sales) : normType !== 'WAREHOUSE';

  try {
    const parentStoreRes = await pool.query("SELECT parent_id, branding, store_type, sub_sector FROM stores WHERE id = $1", [storeId]);
    const parent = parentStoreRes.rows[0];
    const parentId = parent?.parent_id || storeId;

    if (Boolean(is_central_warehouse)) {
      await pool.query("UPDATE stores SET is_central_warehouse = FALSE WHERE id = $1 OR parent_id = $1", [parentId]);
    }

    const result = await pool.query(
      `INSERT INTO stores (
        name, slug, address, phone, parent_id, branding, store_type, sub_sector,
        branch_type, has_pos, is_central_warehouse, allow_direct_sales,
        use_bin_locations, receiving_sla_hours, include_in_online_stock, sell_receiving_stock
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [
        name, slug, address || '', phone || '', parentId,
        parent?.branding || {}, parent?.store_type || 'shop', parent?.sub_sector || null,
        normType, resolvedHasPos, Boolean(is_central_warehouse), resolvedDirectSales,
        Boolean(use_bin_locations), Math.max(1, Number(receiving_sla_hours) || 24),
        Boolean(include_in_online_stock), Boolean(sell_receiving_stock)
      ]
    );

    await ensureSystemLocationsForStore(pool, Number(result.rows[0].id));
    await recomputeLocationPathsRecursive(pool, Number(result.rows[0].id));

    await logAction(req.user.id, storeId, 'ADD_BRANCH', `Added ${normType}: ${name} (ID: ${result.rows[0].id})`);
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(400).json({ error: "Bu slug zaten kullanımda" });
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;
  const {
    name, slug, address, phone,
    branch_type, has_pos, is_central_warehouse, allow_direct_sales,
    use_bin_locations, receiving_sla_hours, include_in_online_stock, sell_receiving_stock
  } = req.body;

  try {
    const currentStoreRes = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
    const parentId = currentStoreRes.rows[0]?.parent_id || storeId;
    
    const checkRes = await pool.query("SELECT id FROM stores WHERE id = $1 AND parent_id = $2", [id, parentId]);
    if (checkRes.rows.length === 0) return res.status(403).json({ error: "Unauthorized" });

    if (is_central_warehouse === true) {
      await pool.query("UPDATE stores SET is_central_warehouse = FALSE WHERE (id = $1 OR parent_id = $1) AND id != $2", [parentId, id]);
    }

    const result = await pool.query(
      `UPDATE stores SET
         name = $1, slug = $2, address = $3, phone = $4,
         branch_type = COALESCE($5, branch_type),
         has_pos = COALESCE($6, has_pos),
         is_central_warehouse = COALESCE($7, is_central_warehouse),
         allow_direct_sales = COALESCE($8, allow_direct_sales),
         use_bin_locations = COALESCE($9, use_bin_locations),
         receiving_sla_hours = COALESCE($10, receiving_sla_hours),
         include_in_online_stock = COALESCE($11, include_in_online_stock),
         sell_receiving_stock = COALESCE($12, sell_receiving_stock)
       WHERE id = $13 RETURNING *`,
      [
        name, slug, address, phone,
        branch_type !== undefined ? (String(branch_type).toUpperCase() === 'WAREHOUSE' ? 'WAREHOUSE' : 'STORE') : null,
        has_pos !== undefined ? Boolean(has_pos) : null,
        is_central_warehouse !== undefined ? Boolean(is_central_warehouse) : null,
        allow_direct_sales !== undefined ? Boolean(allow_direct_sales) : null,
        use_bin_locations !== undefined ? Boolean(use_bin_locations) : null,
        receiving_sla_hours !== undefined ? Math.max(1, Number(receiving_sla_hours) || 24) : null,
        include_in_online_stock !== undefined ? Boolean(include_in_online_stock) : null,
        sell_receiving_stock !== undefined ? Boolean(sell_receiving_stock) : null,
        id
      ]
    );

    await ensureSystemLocationsForStore(pool, Number(id));
    await recomputeLocationPathsRecursive(pool, Number(id));
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
        `INSERT INTO stock_transfer_items (transfer_id, product_id, quantity, requested_qty, barcode, product_name, variant_key)
         VALUES ($1, $2, $3, $3, $4, $5, $6)`,
        [transferId, item.product_id, item.quantity, item.barcode, item.product_name || item.name, item.variant_key || '']
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
  const { status, shippedItems, receivedItems, discrepancyNote } = req.body;
  const userId = req.user.id;
  const lang = String(req.query.lang || req.body.lang || 'tr');

  if (!['pending', 'accepted', 'preparing', 'shipped', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const authCheck = await client.query("SELECT from_store_id, to_store_id FROM stock_transfers WHERE id = $1", [id]);
    if (authCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Transfer not found" });
    }
    const tr = authCheck.rows[0];
    if (req.user.role !== 'superadmin' && Number(tr.from_store_id) !== Number(storeId) && Number(tr.to_store_id) !== Number(storeId)) {
      // Also allow parent HQ managing child branch/warehouse transfers
      const parentCheck = await client.query(
        "SELECT 1 FROM stores WHERE id IN ($1, $2) AND parent_id = $3 LIMIT 1",
        [tr.from_store_id, tr.to_store_id, storeId]
      );
      if (parentCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "Unauthorized" });
      }
    }

    const result = await processTransferStatusTransition(client, {
      transferId: Number(id),
      newStatus: status,
      userId,
      lang,
      shippedItems,
      receivedItems,
      discrepancyNote
    });

    await client.query("COMMIT");
    res.json(result);
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Update transfer status error:", error);
    res.status(error.statusCode || 500).json({ error: error.message || "Failed to update transfer status" });
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
