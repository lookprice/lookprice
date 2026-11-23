import express from "express";
import { pool, logAction } from "../../models/db";
import { getAuthorizedStoreId } from "../../middleware/auth";
import {
  isWarehouseEligibleStore,
  getStoreWarehouseConfig,
  normalizeWarehouseConfig,
  ensureSystemLocationsForStore,
  recomputeLocationPathsRecursive,
  getSystemLocationId,
  syncProductTotalFromLocations,
  reconcileProductDefaultLocation,
  recordInboundToStore,
  sanitizeCode,
  getOnlineAvailableStockForProduct
} from "../../src/services/backend/warehouseService";

const router = express.Router();

// Middleware: Enforce ShopLP / BookLP sectoral isolation on every warehouse endpoint
router.use(async (req: any, res, next) => {
  try {
    const requestedStoreId = req.query.storeId || req.body?.storeId || req.user?.store_id;
    const authStoreId = await getAuthorizedStoreId(req, requestedStoreId ? Number(requestedStoreId) : undefined);
    if (!authStoreId) {
      return res.status(403).json({ error: "Yetkisiz mağaza erişimi." });
    }
    const check = await isWarehouseEligibleStore(pool, Number(authStoreId));
    if (!check.store) {
      return res.status(404).json({ error: "Mağaza bulunamadı." });
    }
    if (!check.eligible) {
      return res.status(403).json({
        error: "Depo ve dinamik raf adresleme modülü yalnızca ShopLP ve BookLP mağazaları için kullanılabilir."
      });
    }
    req.warehouseStoreId = Number(authStoreId);
    req.warehouseRootStoreId = check.rootStoreId;
    req.warehouseStore = check.store;
    next();
  } catch (err: any) {
    console.error("[Warehouse Guard Error]:", err);
    res.status(500).json({ error: err.message || "Yetki kontrolü başarısız." });
  }
});

// Helper: verify a target storeId belongs to the caller's root_store_id family
async function verifyFamilyStore(rootStoreId: number, targetStoreId: number): Promise<any | null> {
  const r = await pool.query(
    `SELECT * FROM stores WHERE id = $1 AND (id = $2 OR parent_id = $2)`,
    [targetStoreId, rootStoreId]
  );
  return r.rows[0] || null;
}

// ============================================================
// 1. CUSTOMIZABLE WAREHOUSE CONFIGURATION
// ============================================================

router.get("/config", async (req: any, res) => {
  try {
    const config = await getStoreWarehouseConfig(pool, req.warehouseRootStoreId);
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/config", async (req: any, res) => {
  try {
    const normalized = normalizeWarehouseConfig(req.body);
    await pool.query(
      "UPDATE stores SET warehouse_config = $1::jsonb WHERE id = $2",
      [JSON.stringify(normalized), req.warehouseRootStoreId]
    );
    // Recompute location codes if separator changed across family stores
    const familyRes = await pool.query("SELECT id FROM stores WHERE id = $1 OR parent_id = $1", [req.warehouseRootStoreId]);
    for (const s of familyRes.rows) {
      await recomputeLocationPathsRecursive(pool, Number(s.id));
    }
    res.json({ success: true, config: normalized });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 2. FAMILY STORES & WAREHOUSES MANAGEMENT
// ============================================================

router.get("/stores", async (req: any, res) => {
  try {
    const rootId = req.warehouseRootStoreId;
    const rowsRes = await pool.query(
      `SELECT s.id, s.parent_id, s.name, s.slug, s.address, s.phone,
              COALESCE(s.branch_type, 'STORE') AS branch_type,
              COALESCE(s.has_pos, TRUE) AS has_pos,
              COALESCE(s.is_central_warehouse, FALSE) AS is_central_warehouse,
              COALESCE(s.allow_direct_sales, TRUE) AS allow_direct_sales,
              COALESCE(s.use_bin_locations, FALSE) AS use_bin_locations,
              COALESCE(s.receiving_sla_hours, 24) AS receiving_sla_hours,
              COALESCE(s.include_in_online_stock, FALSE) AS include_in_online_stock,
              COALESCE(s.sell_receiving_stock, FALSE) AS sell_receiving_stock,
              (SELECT COUNT(*)::int FROM storage_locations sl WHERE sl.store_id = s.id AND sl.system_role = 'STANDARD') AS custom_location_count,
              (SELECT COALESCE(SUM(pls.quantity), 0)
               FROM product_location_stocks pls
               JOIN storage_locations sl ON sl.id = pls.location_id
               WHERE pls.store_id = s.id AND sl.system_role = 'RECEIVING' AND pls.quantity > 0) AS receiving_pending_qty,
              (SELECT COUNT(*)::int
               FROM product_location_stocks pls
               JOIN storage_locations sl ON sl.id = pls.location_id
               WHERE pls.store_id = s.id AND sl.system_role = 'RECEIVING' AND pls.quantity > 0) AS receiving_pending_skus,
              (SELECT COUNT(*)::int
               FROM product_location_stocks pls
               JOIN storage_locations sl ON sl.id = pls.location_id
               WHERE pls.store_id = s.id AND sl.system_role = 'RECEIVING' AND pls.quantity > 0
                 AND EXTRACT(EPOCH FROM (NOW() - pls.last_moved_at)) / 3600.0 >= COALESCE(s.receiving_sla_hours, 24)) AS receiving_overdue_skus
       FROM stores s
       WHERE s.id = $1 OR s.parent_id = $1
       ORDER BY (s.parent_id IS NULL) DESC, (s.branch_type = 'WAREHOUSE') DESC, s.is_central_warehouse DESC, s.id ASC`,
      [rootId]
    );
    res.json(rowsRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/stores", async (req: any, res) => {
  const {
    name,
    slug,
    address = "",
    phone = "",
    branch_type = "WAREHOUSE",
    has_pos,
    is_central_warehouse = false,
    allow_direct_sales,
    use_bin_locations = true,
    receiving_sla_hours = 24,
    include_in_online_stock = false,
    sell_receiving_stock = false
  } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "Depo / şube adı zorunludur." });
  }

  const normalizedType = String(branch_type).toUpperCase() === "WAREHOUSE" ? "WAREHOUSE" : "STORE";
  const resolvedHasPos = has_pos !== undefined ? Boolean(has_pos) : normalizedType !== "WAREHOUSE";
  const resolvedDirectSales = allow_direct_sales !== undefined ? Boolean(allow_direct_sales) : normalizedType !== "WAREHOUSE";

  const baseSlug = (slug && String(slug).trim())
    ? String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")
    : `${String(name).toLowerCase().replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString().slice(-4)}`;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const rootRes = await client.query(
      "SELECT id, branding, store_type, sub_sector, default_currency, language, currency_rates FROM stores WHERE id = $1",
      [req.warehouseRootStoreId]
    );
    const root = rootRes.rows[0];

    if (Boolean(is_central_warehouse)) {
      await client.query(
        "UPDATE stores SET is_central_warehouse = FALSE WHERE id = $1 OR parent_id = $1",
        [req.warehouseRootStoreId]
      );
    }

    const ins = await client.query(
      `INSERT INTO stores (
        name, slug, address, phone, parent_id, branding, store_type, sub_sector,
        default_currency, language, currency_rates,
        branch_type, has_pos, is_central_warehouse, allow_direct_sales,
        use_bin_locations, receiving_sla_hours, include_in_online_stock, sell_receiving_stock
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *`,
      [
        String(name).trim(),
        baseSlug,
        address,
        phone,
        req.warehouseRootStoreId,
        root?.branding || {},
        root?.store_type || "shop",
        root?.sub_sector || null,
        root?.default_currency || "TRY",
        root?.language || "tr",
        root?.currency_rates || {},
        normalizedType,
        resolvedHasPos,
        Boolean(is_central_warehouse),
        resolvedDirectSales,
        Boolean(use_bin_locations),
        Math.max(1, Number(receiving_sla_hours) || 24),
        Boolean(include_in_online_stock),
        Boolean(sell_receiving_stock)
      ]
    );

    const created = ins.rows[0];
    await ensureSystemLocationsForStore(client, Number(created.id));
    await recomputeLocationPathsRecursive(client, Number(created.id));
    await client.query("COMMIT");

    await logAction(req.warehouseStoreId, req.user?.id, "ADD_WAREHOUSE_BRANCH", "stores", created.id, `${normalizedType}: ${created.name}`).catch(() => {});
    res.status(201).json(created);
  } catch (err: any) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return res.status(400).json({ error: "Bu kısa ad (slug) zaten kullanımda." });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put("/stores/:id", async (req: any, res) => {
  const targetId = Number(req.params.id);
  const target = await verifyFamilyStore(req.warehouseRootStoreId, targetId);
  if (!target) return res.status(404).json({ error: "Şube/depo bulunamadı." });

  const {
    name,
    address,
    phone,
    branch_type,
    has_pos,
    is_central_warehouse,
    allow_direct_sales,
    use_bin_locations,
    receiving_sla_hours,
    include_in_online_stock,
    sell_receiving_stock
  } = req.body || {};

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (is_central_warehouse === true) {
      await client.query(
        "UPDATE stores SET is_central_warehouse = FALSE WHERE (id = $1 OR parent_id = $1) AND id != $2",
        [req.warehouseRootStoreId, targetId]
      );
    }

    const nextType = branch_type !== undefined
      ? (String(branch_type).toUpperCase() === "WAREHOUSE" ? "WAREHOUSE" : "STORE")
      : (target.branch_type || "STORE");

    const upd = await client.query(
      `UPDATE stores SET
         name = COALESCE($1, name),
         address = COALESCE($2, address),
         phone = COALESCE($3, phone),
         branch_type = $4,
         has_pos = COALESCE($5, has_pos),
         is_central_warehouse = COALESCE($6, is_central_warehouse),
         allow_direct_sales = COALESCE($7, allow_direct_sales),
         use_bin_locations = COALESCE($8, use_bin_locations),
         receiving_sla_hours = COALESCE($9, receiving_sla_hours),
         include_in_online_stock = COALESCE($10, include_in_online_stock),
         sell_receiving_stock = COALESCE($11, sell_receiving_stock)
       WHERE id = $12
       RETURNING *`,
      [
        name !== undefined ? String(name).trim() : null,
        address !== undefined ? address : null,
        phone !== undefined ? phone : null,
        nextType,
        has_pos !== undefined ? Boolean(has_pos) : null,
        is_central_warehouse !== undefined ? Boolean(is_central_warehouse) : null,
        allow_direct_sales !== undefined ? Boolean(allow_direct_sales) : null,
        use_bin_locations !== undefined ? Boolean(use_bin_locations) : null,
        receiving_sla_hours !== undefined ? Math.max(1, Number(receiving_sla_hours) || 24) : null,
        include_in_online_stock !== undefined ? Boolean(include_in_online_stock) : null,
        sell_receiving_stock !== undefined ? Boolean(sell_receiving_stock) : null,
        targetId
      ]
    );

    await ensureSystemLocationsForStore(client, targetId);
    await recomputeLocationPathsRecursive(client, targetId);
    await client.query("COMMIT");
    res.json(upd.rows[0]);
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================
// 3. DYNAMIC HIERARCHICAL STORAGE LOCATIONS
// ============================================================

router.get("/locations", async (req: any, res) => {
  try {
    const targetStoreId = req.query.targetStoreId ? Number(req.query.targetStoreId) : null;
    if (targetStoreId) {
      const ok = await verifyFamilyStore(req.warehouseRootStoreId, targetStoreId);
      if (!ok) return res.status(403).json({ error: "Yetkisiz şube/depo." });
      await ensureSystemLocationsForStore(pool, targetStoreId);
    }

    const params: any[] = [req.warehouseRootStoreId];
    let where = "sl.root_store_id = $1";
    if (targetStoreId) {
      where += " AND sl.store_id = $2";
      params.push(targetStoreId);
    }

    const rowsRes = await pool.query(
      `SELECT sl.*, s.name AS store_name, COALESCE(s.branch_type, 'STORE') AS store_branch_type,
              COALESCE((SELECT COUNT(DISTINCT pls.product_id)::int FROM product_location_stocks pls WHERE pls.location_id = sl.id AND pls.quantity > 0), 0) AS sku_count,
              COALESCE((SELECT SUM(pls.quantity) FROM product_location_stocks pls WHERE pls.location_id = sl.id), 0) AS total_qty,
              COALESCE((SELECT SUM(pls.reserved_quantity) FROM product_location_stocks pls WHERE pls.location_id = sl.id), 0) AS total_reserved
       FROM storage_locations sl
       JOIN stores s ON s.id = sl.store_id
       WHERE ${where}
       ORDER BY sl.store_id ASC,
                CASE sl.system_role WHEN 'RECEIVING' THEN 0 WHEN 'DEFAULT' THEN 1 WHEN 'STANDARD' THEN 2 ELSE 3 END,
                sl.sort_order ASC, sl.full_code ASC, sl.id ASC`,
      params
    );
    res.json(rowsRes.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/locations", async (req: any, res) => {
  const {
    target_store_id,
    parent_id = null,
    location_type = "SHELF",
    name,
    code,
    barcode,
    tags = [],
    is_sellable = false,
    is_pickable = true,
    sort_order = 0
  } = req.body || {};

  const storeId = Number(target_store_id || req.warehouseStoreId);
  const storeRow = await verifyFamilyStore(req.warehouseRootStoreId, storeId);
  if (!storeRow) return res.status(403).json({ error: "Hedef şube/depo bulunamadı." });
  if (!name || !String(name).trim()) return res.status(400).json({ error: "Lokasyon adı zorunludur." });

  const cleanCode = sanitizeCode(code || name, "L");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (parent_id) {
      const pCheck = await client.query("SELECT id, store_id FROM storage_locations WHERE id = $1 AND store_id = $2", [parent_id, storeId]);
      if (pCheck.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Üst lokasyon bu depoda/şubede bulunamadı." });
      }
    }

    const tempBarcode = barcode && String(barcode).trim()
      ? String(barcode).trim()
      : `LOC-S${storeId}-${cleanCode}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const ins = await client.query(
      `INSERT INTO storage_locations (
        root_store_id, store_id, parent_id, system_role, location_type,
        name, code, full_code, full_path, barcode, tags, is_sellable, is_pickable, sort_order
      ) VALUES ($1,$2,$3,'STANDARD',$4,$5,$6,'','',$7,$8::jsonb,$9,$10,$11)
      RETURNING id`,
      [
        req.warehouseRootStoreId,
        storeId,
        parent_id || null,
        String(location_type).trim().toUpperCase().slice(0, 40),
        String(name).trim(),
        cleanCode,
        tempBarcode,
        JSON.stringify(Array.isArray(tags) ? tags : []),
        Boolean(is_sellable),
        Boolean(is_pickable),
        Number(sort_order) || 0
      ]
    );

    const newId = Number(ins.rows[0].id);
    await recomputeLocationPathsRecursive(client, storeId);

    // If user didn't pass custom barcode, try setting clean full_code as barcode when unique
    const updatedRes = await client.query("SELECT * FROM storage_locations WHERE id = $1", [newId]);
    const loc = updatedRes.rows[0];
    if (!barcode) {
      const dupCheck = await client.query(
        "SELECT 1 FROM storage_locations WHERE root_store_id = $1 AND barcode = $2 AND id != $3",
        [req.warehouseRootStoreId, loc.full_code, newId]
      );
      if (dupCheck.rows.length === 0 && loc.full_code) {
        await client.query("UPDATE storage_locations SET barcode = $1 WHERE id = $2", [loc.full_code, newId]);
        loc.barcode = loc.full_code;
      }
    }

    await client.query("COMMIT");
    res.status(201).json(loc);
  } catch (err: any) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return res.status(400).json({ error: "Bu lokasyon barkodu zaten kullanımda." });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put("/locations/:id", async (req: any, res) => {
  const locId = Number(req.params.id);
  const { name, code, parent_id, location_type, barcode, tags, is_sellable, is_pickable, sort_order } = req.body || {};

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const curRes = await client.query(
      "SELECT * FROM storage_locations WHERE id = $1 AND root_store_id = $2",
      [locId, req.warehouseRootStoreId]
    );
    if (curRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Lokasyon bulunamadı." });
    }
    const cur = curRes.rows[0];

    if (parent_id !== undefined && parent_id !== null && Number(parent_id) === locId) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Bir lokasyon kendisinin üst lokasyonu olamaz." });
    }

    const nextCode = code !== undefined ? sanitizeCode(code, cur.code) : cur.code;

    await client.query(
      `UPDATE storage_locations SET
         name = COALESCE($1, name),
         code = $2,
         parent_id = CASE WHEN $3::boolean THEN $4::int ELSE parent_id END,
         location_type = COALESCE($5, location_type),
         barcode = COALESCE($6, barcode),
         tags = CASE WHEN $7::boolean THEN $8::jsonb ELSE tags END,
         is_sellable = COALESCE($9, is_sellable),
         is_pickable = COALESCE($10, is_pickable),
         sort_order = COALESCE($11, sort_order),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $12`,
      [
        name !== undefined ? String(name).trim() : null,
        nextCode,
        parent_id !== undefined && cur.system_role === "STANDARD",
        parent_id || null,
        location_type !== undefined ? String(location_type).trim().toUpperCase().slice(0, 40) : null,
        barcode !== undefined && String(barcode).trim() ? String(barcode).trim() : null,
        Array.isArray(tags),
        JSON.stringify(Array.isArray(tags) ? tags : []),
        is_sellable !== undefined ? Boolean(is_sellable) : null,
        is_pickable !== undefined && cur.system_role !== "DAMAGED" ? Boolean(is_pickable) : null,
        sort_order !== undefined ? Number(sort_order) : null,
        locId
      ]
    );

    await recomputeLocationPathsRecursive(client, Number(cur.store_id));
    const refreshed = await client.query("SELECT * FROM storage_locations WHERE id = $1", [locId]);
    await client.query("COMMIT");
    res.json(refreshed.rows[0]);
  } catch (err: any) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      return res.status(400).json({ error: "Bu barkod başka bir lokasyonda kullanılıyor." });
    }
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete("/locations/:id", async (req: any, res) => {
  const locId = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const curRes = await client.query(
      "SELECT * FROM storage_locations WHERE id = $1 AND root_store_id = $2",
      [locId, req.warehouseRootStoreId]
    );
    if (curRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Lokasyon bulunamadı." });
    }
    const loc = curRes.rows[0];
    if (loc.system_role !== "STANDARD") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Sistem lokasyonları (Genel Alan, Mal Kabul, Hasarlı) silinemez." });
    }

    // Check stock in this node or any descendants
    const stockCheck = await client.query(
      `WITH RECURSIVE tree AS (
         SELECT id FROM storage_locations WHERE id = $1
         UNION ALL
         SELECT sl.id FROM storage_locations sl JOIN tree t ON sl.parent_id = t.id
       )
       SELECT COALESCE(SUM(pls.quantity), 0) AS qty
       FROM product_location_stocks pls
       WHERE pls.location_id IN (SELECT id FROM tree) AND pls.quantity > 0`,
      [locId]
    );
    if (Number(stockCheck.rows[0]?.qty || 0) > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Bu lokasyonda veya alt raflarında stok bulunuyor. Önce stokları başka bir rafa taşıyın."
      });
    }

    await client.query("DELETE FROM storage_locations WHERE id = $1", [locId]);
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post("/locations/bulk-generate", async (req: any, res) => {
  const {
    target_store_id,
    parent_id = null,
    location_type = "RACK",
    name_prefix = "Raf",
    code_prefix = "R",
    start_num = 1,
    end_num = 10,
    pad_digits = 2,
    sub_bins = "", // e.g. "A,B,C,D" or "1,2,3"
    sub_type = "BIN",
    sub_name_prefix = "Göz",
    is_sellable = false
  } = req.body || {};

  const storeId = Number(target_store_id || req.warehouseStoreId);
  const storeRow = await verifyFamilyStore(req.warehouseRootStoreId, storeId);
  if (!storeRow) return res.status(403).json({ error: "Hedef şube/depo bulunamadı." });

  const start = Math.max(1, Number(start_num) || 1);
  const end = Math.min(start + 99, Math.max(start, Number(end_num) || start));
  const pad = Math.min(4, Math.max(1, Number(pad_digits) || 2));
  const subList = String(sub_bins || "")
    .split(/[,\s;]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 26);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let createdCount = 0;

    for (let i = start; i <= end; i++) {
      const numStr = String(i).padStart(pad, "0");
      const name = `${String(name_prefix).trim()} ${numStr}`;
      const code = sanitizeCode(`${code_prefix}${numStr}`, `R${numStr}`);
      const tempBc = `LOC-S${storeId}-${code}-${Date.now().toString(36)}-${i}`;

      const pIns = await client.query(
        `INSERT INTO storage_locations (
          root_store_id, store_id, parent_id, system_role, location_type,
          name, code, full_code, full_path, barcode, is_sellable, is_pickable, sort_order
        ) VALUES ($1,$2,$3,'STANDARD',$4,$5,$6,'','',$7,$8,TRUE,$9)
        RETURNING id`,
        [req.warehouseRootStoreId, storeId, parent_id || null, String(location_type).toUpperCase(), name, code, tempBc, Boolean(is_sellable), i * 10]
      );
      const createdParentId = Number(pIns.rows[0].id);
      createdCount++;

      for (let j = 0; j < subList.length; j++) {
        const sub = subList[j];
        const subName = `${String(sub_name_prefix || "Göz").trim()} ${sub}`;
        const subCode = sanitizeCode(sub, `G${j + 1}`);
        const subBc = `LOC-S${storeId}-${code}-${subCode}-${Date.now().toString(36)}-${i}-${j}`;
        await client.query(
          `INSERT INTO storage_locations (
            root_store_id, store_id, parent_id, system_role, location_type,
            name, code, full_code, full_path, barcode, is_sellable, is_pickable, sort_order
          ) VALUES ($1,$2,$3,'STANDARD',$4,$5,$6,'','',$7,$8,TRUE,$9)`,
          [req.warehouseRootStoreId, storeId, createdParentId, String(sub_type).toUpperCase(), subName, subCode, subBc, Boolean(is_sellable), j + 1]
        );
        createdCount++;
      }
    }

    await recomputeLocationPathsRecursive(client, storeId);

    // Upgrade temp barcodes to clean full_code where unique
    const locsRes = await client.query("SELECT id, full_code, barcode FROM storage_locations WHERE store_id = $1 AND system_role = 'STANDARD'", [storeId]);
    for (const l of locsRes.rows) {
      if (String(l.barcode || "").includes("-")) {
        const dup = await client.query(
          "SELECT 1 FROM storage_locations WHERE root_store_id = $1 AND barcode = $2 AND id != $3",
          [req.warehouseRootStoreId, l.full_code, l.id]
        );
        if (dup.rows.length === 0 && l.full_code) {
          await client.query("UPDATE storage_locations SET barcode = $1 WHERE id = $2", [l.full_code, l.id]);
        }
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, created_count: createdCount });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post("/locations/apply-template", async (req: any, res) => {
  const { target_store_id, template } = req.body || {};
  const storeId = Number(target_store_id || req.warehouseStoreId);
  const storeRow = await verifyFamilyStore(req.warehouseRootStoreId, storeId);
  if (!storeRow) return res.status(403).json({ error: "Hedef şube/depo bulunamadı." });

  const templates: Record<string, Array<{ name: string; code: string; type: string; sellable?: boolean; children?: Array<{ name: string; code: string; type: string; children?: Array<{ name: string; code: string; type: string }> }> }>> = {
    warehouse_standard: [
      {
        name: "1. Alan", code: "A1", type: "ZONE",
        children: [
          { name: "Sağ Koridor", code: "SG", type: "SIDE", children: [{ name: "Raf 01", code: "R01", type: "RACK" }, { name: "Raf 02", code: "R02", type: "RACK" }, { name: "Raf 03", code: "R03", type: "RACK" }] },
          { name: "Sol Koridor", code: "SL", type: "SIDE", children: [{ name: "Raf 01", code: "R01", type: "RACK" }, { name: "Raf 02", code: "R02", type: "RACK" }] }
        ]
      }
    ],
    store_showroom: [
      {
        name: "Zemin Kat", code: "K0", type: "FLOOR", sellable: true,
        children: [
          { name: "Yeni Gelenler", code: "YNG", type: "DISPLAY", children: [{ name: "1. Raf", code: "R1", type: "SHELF" }, { name: "2. Raf", code: "R2", type: "SHELF" }] },
          { name: "Ana Reyon", code: "ANA", type: "DISPLAY", children: [{ name: "1. Raf", code: "R1", type: "SHELF" }, { name: "2. Raf", code: "R2", type: "SHELF" }] }
        ]
      },
      {
        name: "Arka Depo", code: "ARK", type: "ZONE", sellable: false,
        children: [{ name: "Yedek Raf 01", code: "YR1", type: "RACK" }]
      }
    ],
    cabinet_drawer: [
      {
        name: "Dolap 01", code: "D01", type: "CABINET",
        children: [
          { name: "Çekmece 1", code: "C1", type: "DRAWER" },
          { name: "Çekmece 2", code: "C2", type: "DRAWER" },
          { name: "Çekmece 3", code: "C3", type: "DRAWER" }
        ]
      },
      {
        name: "Dolap 02", code: "D02", type: "CABINET",
        children: [
          { name: "Çekmece 1", code: "C1", type: "DRAWER" },
          { name: "Çekmece 2", code: "C2", type: "DRAWER" }
        ]
      }
    ]
  };

  const spec = templates[String(template || "")];
  if (!spec) return res.status(400).json({ error: "Geçersiz şablon seçimi." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let count = 0;

    const insertNodes = async (nodes: any[], parentId: number | null, inheritedSellable: boolean) => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const sell = n.sellable !== undefined ? n.sellable : inheritedSellable;
        const bc = `TPL-S${storeId}-${n.code}-${Date.now().toString(36)}-${count}`;
        const r = await client.query(
          `INSERT INTO storage_locations (
            root_store_id, store_id, parent_id, system_role, location_type,
            name, code, full_code, full_path, barcode, is_sellable, is_pickable, sort_order
          ) VALUES ($1,$2,$3,'STANDARD',$4,$5,$6,'','',$7,$8,TRUE,$9) RETURNING id`,
          [req.warehouseRootStoreId, storeId, parentId, n.type, n.name, n.code, bc, sell, (i + 1) * 10]
        );
        count++;
        if (Array.isArray(n.children) && n.children.length > 0) {
          await insertNodes(n.children, Number(r.rows[0].id), sell);
        }
      }
    };

    await insertNodes(spec, null, storeRow.branch_type !== "WAREHOUSE");
    await recomputeLocationPathsRecursive(client, storeId);

    // Clean barcodes to full_code where unique
    const locs = await client.query("SELECT id, full_code FROM storage_locations WHERE store_id = $1 AND barcode LIKE 'TPL-%'", [storeId]);
    for (const l of locs.rows) {
      const dup = await client.query("SELECT 1 FROM storage_locations WHERE root_store_id = $1 AND barcode = $2 AND id != $3", [req.warehouseRootStoreId, l.full_code, l.id]);
      if (dup.rows.length === 0 && l.full_code) {
        await client.query("UPDATE storage_locations SET barcode = $1 WHERE id = $2", [l.full_code, l.id]);
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, created_count: count });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get("/locations/:id/items", async (req: any, res) => {
  try {
    const locId = Number(req.params.id);
    const includeChildren = req.query.includeChildren !== "false";

    const check = await pool.query("SELECT id, store_id FROM storage_locations WHERE id = $1 AND root_store_id = $2", [locId, req.warehouseRootStoreId]);
    if (check.rows.length === 0) return res.status(404).json({ error: "Lokasyon bulunamadı." });

    const query = includeChildren
      ? `WITH RECURSIVE tree AS (
           SELECT id FROM storage_locations WHERE id = $1
           UNION ALL
           SELECT sl.id FROM storage_locations sl JOIN tree t ON sl.parent_id = t.id
         )
         SELECT pls.id, pls.product_id, pls.variant_key, pls.location_id, pls.quantity, pls.reserved_quantity,
                GREATEST(0, pls.quantity - pls.reserved_quantity) AS available_quantity,
                pls.is_primary, pls.last_moved_at,
                p.name AS product_name, p.barcode, p.sku, p.unit, p.image_url,
                sl.full_path, sl.full_code, sl.system_role
         FROM product_location_stocks pls
         JOIN products p ON p.id = pls.product_id
         JOIN storage_locations sl ON sl.id = pls.location_id
         WHERE pls.location_id IN (SELECT id FROM tree) AND pls.quantity > 0
         ORDER BY sl.sort_order ASC, p.name ASC`
      : `SELECT pls.id, pls.product_id, pls.variant_key, pls.location_id, pls.quantity, pls.reserved_quantity,
                GREATEST(0, pls.quantity - pls.reserved_quantity) AS available_quantity,
                pls.is_primary, pls.last_moved_at,
                p.name AS product_name, p.barcode, p.sku, p.unit, p.image_url,
                sl.full_path, sl.full_code, sl.system_role
         FROM product_location_stocks pls
         JOIN products p ON p.id = pls.product_id
         JOIN storage_locations sl ON sl.id = pls.location_id
         WHERE pls.location_id = $1 AND pls.quantity > 0
         ORDER BY p.name ASC`;

    const r = await pool.query(query, [locId]);
    res.json(r.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 4. PUT-AWAY (İSTİF BEKLEYENLER - TWO-STAGE RECEIVING)
// ============================================================

router.get("/putaway", async (req: any, res) => {
  try {
    const targetStoreId = req.query.targetStoreId ? Number(req.query.targetStoreId) : null;
    const params: any[] = [req.warehouseRootStoreId];
    let storeFilter = "";
    if (targetStoreId) {
      const ok = await verifyFamilyStore(req.warehouseRootStoreId, targetStoreId);
      if (!ok) return res.status(403).json({ error: "Yetkisiz şube/depo." });
      storeFilter = "AND pls.store_id = $2";
      params.push(targetStoreId);
    }

    const r = await pool.query(
      `SELECT pls.id, pls.store_id, s.name AS store_name, COALESCE(s.receiving_sla_hours, 24) AS sla_hours,
              pls.product_id, pls.variant_key, pls.location_id AS receiving_location_id,
              pls.quantity, pls.reserved_quantity, pls.last_moved_at,
              ROUND((EXTRACT(EPOCH FROM (NOW() - pls.last_moved_at)) / 3600.0)::numeric, 1) AS hours_waiting,
              (EXTRACT(EPOCH FROM (NOW() - pls.last_moved_at)) / 3600.0 >= COALESCE(s.receiving_sla_hours, 24)) AS is_overdue,
              p.name AS product_name, p.barcode, p.sku, p.unit, p.image_url,
              pbs.default_location_id,
              COALESCE(pbs.units_per_pack, 1) AS units_per_pack,
              COALESCE(pbs.pack_unit_label, 'Koli') AS pack_unit_label,
              dl.full_path AS default_location_path,
              dl.full_code AS default_location_code
       FROM product_location_stocks pls
       JOIN storage_locations sl ON sl.id = pls.location_id AND sl.system_role = 'RECEIVING'
       JOIN stores s ON s.id = pls.store_id
       JOIN products p ON p.id = pls.product_id
       LEFT JOIN product_branch_settings pbs
         ON pbs.root_store_id = pls.root_store_id AND pbs.store_id = pls.store_id
        AND pbs.product_id = pls.product_id AND pbs.variant_key = pls.variant_key
       LEFT JOIN storage_locations dl ON dl.id = pbs.default_location_id
       WHERE pls.root_store_id = $1 AND pls.quantity > 0 ${storeFilter}
       ORDER BY is_overdue DESC, pls.last_moved_at ASC`,
      params
    );

    res.json(r.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/putaway", async (req: any, res) => {
  const {
    target_store_id,
    product_id,
    variant_key = "",
    placements, // Array<{ location_id?: number; location_barcode?: string; quantity: number; is_damaged?: boolean; reason?: string }>
    set_as_default = false,
    note = ""
  } = req.body || {};

  const storeId = Number(target_store_id || req.warehouseStoreId);
  const storeRow = await verifyFamilyStore(req.warehouseRootStoreId, storeId);
  if (!storeRow) return res.status(403).json({ error: "Hedef şube/depo bulunamadı." });

  if (!product_id || !Array.isArray(placements) || placements.length === 0) {
    return res.status(400).json({ error: "Ürün ve en az bir hedef raf seçilmelidir." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const rcvLocId = await getSystemLocationId(client, storeId, "RECEIVING");
    const rcvRowRes = await client.query(
      `SELECT id, quantity FROM product_location_stocks
       WHERE store_id = $1 AND product_id = $2 AND variant_key = $3 AND location_id = $4 FOR UPDATE`,
      [storeId, Number(product_id), String(variant_key || ""), rcvLocId]
    );
    const availableInRcv = Number(rcvRowRes.rows[0]?.quantity || 0);
    const totalToPlace = placements.reduce((s: number, pl: any) => s + Math.max(0, Number(pl.quantity) || 0), 0);

    if (totalToPlace <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Yerleştirilecek miktar 0'dan büyük olmalıdır." });
    }
    if (totalToPlace > availableInRcv + 0.0001) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `Mal kabulde bekleyen miktardan fazla istif yapılamaz (Bekleyen: ${availableInRcv}, Girilen: ${totalToPlace}).`
      });
    }

    let firstStandardLocId: number | null = null;

    for (const pl of placements) {
      const qty = Math.max(0, Number(pl.quantity) || 0);
      if (qty <= 0) continue;

      let destLocId: number | null = null;
      let isDamaged = Boolean(pl.is_damaged);

      if (isDamaged) {
        destLocId = await getSystemLocationId(client, storeId, "DAMAGED");
      } else if (pl.location_id) {
        const lRes = await client.query("SELECT id, system_role FROM storage_locations WHERE id = $1 AND store_id = $2", [Number(pl.location_id), storeId]);
        if (lRes.rows.length === 0) throw new Error("Hedef lokasyon bu depoda bulunamadı.");
        destLocId = Number(lRes.rows[0].id);
        if (lRes.rows[0].system_role === "DAMAGED") isDamaged = true;
      } else if (pl.location_barcode) {
        const lRes = await client.query(
          "SELECT id, system_role FROM storage_locations WHERE store_id = $1 AND (LOWER(barcode) = LOWER($2) OR LOWER(full_code) = LOWER($2)) LIMIT 1",
          [storeId, String(pl.location_barcode).trim()]
        );
        if (lRes.rows.length === 0) throw new Error(`Lokasyon barkodu bulunamadı: ${pl.location_barcode}`);
        destLocId = Number(lRes.rows[0].id);
        if (lRes.rows[0].system_role === "DAMAGED") isDamaged = true;
      }

      if (!destLocId || destLocId === rcvLocId) {
        throw new Error("Geçerli bir hedef raf seçilmelidir.");
      }
      if (!isDamaged && !firstStandardLocId) {
        firstStandardLocId = destLocId;
      }

      // Deduct from RECEIVING
      await client.query(
        "UPDATE product_location_stocks SET quantity = GREATEST(0, quantity - $1), last_moved_at = CURRENT_TIMESTAMP WHERE id = $2",
        [qty, rcvRowRes.rows[0].id]
      );

      // Add to target location
      await client.query(
        `INSERT INTO product_location_stocks (root_store_id, store_id, product_id, variant_key, location_id, quantity, is_primary, last_moved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP)
         ON CONFLICT (root_store_id, product_id, variant_key, location_id)
         DO UPDATE SET quantity = product_location_stocks.quantity + EXCLUDED.quantity, last_moved_at = CURRENT_TIMESTAMP`,
        [req.warehouseRootStoreId, storeId, Number(product_id), String(variant_key || ""), destLocId, qty, Boolean(set_as_default && !isDamaged)]
      );

      // Immutable audit movement
      await client.query(
        `INSERT INTO stock_location_movements (
          root_store_id, store_id, product_id, variant_key, from_location_id, to_location_id,
          quantity, movement_type, reference_type, reason, note, performed_by
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'PUTAWAY',$9,$10,$11)`,
        [
          req.warehouseRootStoreId,
          storeId,
          Number(product_id),
          String(variant_key || ""),
          rcvLocId,
          destLocId,
          qty,
          isDamaged ? "DAMAGE_MARK" : "PUTAWAY",
          pl.reason || null,
          note || (isDamaged ? "Mal kabulde hasarlı ayrıldı" : "Mal kabulden rafa istiflendi"),
          req.user?.id || null
        ]
      );
    }

    if (set_as_default && firstStandardLocId) {
      await client.query(
        `INSERT INTO product_branch_settings (root_store_id, store_id, product_id, variant_key, default_location_id, updated_at)
         VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP)
         ON CONFLICT (root_store_id, store_id, product_id, variant_key)
         DO UPDATE SET default_location_id = EXCLUDED.default_location_id, updated_at = CURRENT_TIMESTAMP`,
        [req.warehouseRootStoreId, storeId, Number(product_id), String(variant_key || ""), firstStandardLocId]
      );
    }

    await syncProductTotalFromLocations(client, storeId, Number(product_id));
    await client.query("COMMIT");
    res.json({ success: true, placed_quantity: totalToPlace });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================
// 5. FAST MOBILE OPERATIONS: BIN TRANSFER, CYCLE COUNT, DAMAGE, MANUAL INBOUND
// ============================================================

async function resolveProductInStore(client: any, storeId: number, productId?: number, barcode?: string) {
  if (productId) {
    const r = await client.query("SELECT id, name, barcode FROM products WHERE id = $1 AND store_id = $2", [Number(productId), storeId]);
    if (r.rows[0]) return r.rows[0];
  }
  if (barcode) {
    const r = await client.query("SELECT id, name, barcode FROM products WHERE store_id = $1 AND TRIM(barcode) = TRIM($2) LIMIT 1", [storeId, barcode]);
    if (r.rows[0]) return r.rows[0];
  }
  return null;
}

async function resolveLocationInStore(client: any, storeId: number, locationId?: number, locationCode?: string) {
  if (locationId) {
    const r = await client.query("SELECT * FROM storage_locations WHERE id = $1 AND store_id = $2", [Number(locationId), storeId]);
    if (r.rows[0]) return r.rows[0];
  }
  if (locationCode) {
    const r = await client.query(
      "SELECT * FROM storage_locations WHERE store_id = $1 AND (LOWER(barcode) = LOWER($2) OR LOWER(full_code) = LOWER($2)) LIMIT 1",
      [storeId, String(locationCode).trim()]
    );
    if (r.rows[0]) return r.rows[0];
  }
  return null;
}

router.post("/move", async (req: any, res) => {
  const {
    target_store_id,
    product_id,
    product_barcode,
    variant_key = "",
    from_location_id,
    from_location_barcode,
    to_location_id,
    to_location_barcode,
    quantity,
    note = ""
  } = req.body || {};

  const storeId = Number(target_store_id || req.warehouseStoreId);
  const storeRow = await verifyFamilyStore(req.warehouseRootStoreId, storeId);
  if (!storeRow) return res.status(403).json({ error: "Hedef şube/depo bulunamadı." });

  const qty = Number(quantity || 0);
  if (qty <= 0) return res.status(400).json({ error: "Taşınacak miktar 0'dan büyük olmalıdır." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const prod = await resolveProductInStore(client, storeId, product_id, product_barcode);
    if (!prod) throw new Error("Ürün bu şubede/depoda bulunamadı.");

    await reconcileProductDefaultLocation(client, storeId, Number(prod.id));

    const fromLoc = await resolveLocationInStore(client, storeId, from_location_id, from_location_barcode);
    const toLoc = await resolveLocationInStore(client, storeId, to_location_id, to_location_barcode);
    if (!fromLoc || !toLoc) throw new Error("Kaynak veya hedef raf bulunamadı.");
    if (Number(fromLoc.id) === Number(toLoc.id)) throw new Error("Kaynak ve hedef raf aynı olamaz.");

    const srcStock = await client.query(
      `SELECT id, quantity, reserved_quantity FROM product_location_stocks
       WHERE store_id = $1 AND product_id = $2 AND variant_key = $3 AND location_id = $4 FOR UPDATE`,
      [storeId, prod.id, String(variant_key || ""), fromLoc.id]
    );
    const avail = Math.max(0, Number(srcStock.rows[0]?.quantity || 0) - Number(srcStock.rows[0]?.reserved_quantity || 0));
    if (avail < qty - 0.0001) {
      throw new Error(`Kaynak rafta yeterli kullanılabilir stok yok (Mevcut: ${avail}).`);
    }

    await client.query(
      "UPDATE product_location_stocks SET quantity = GREATEST(0, quantity - $1), last_moved_at = CURRENT_TIMESTAMP WHERE id = $2",
      [qty, srcStock.rows[0].id]
    );
    await client.query(
      `INSERT INTO product_location_stocks (root_store_id, store_id, product_id, variant_key, location_id, quantity, last_moved_at)
       VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP)
       ON CONFLICT (root_store_id, product_id, variant_key, location_id)
       DO UPDATE SET quantity = product_location_stocks.quantity + EXCLUDED.quantity, last_moved_at = CURRENT_TIMESTAMP`,
      [req.warehouseRootStoreId, storeId, prod.id, String(variant_key || ""), toLoc.id, qty]
    );

    const movType = toLoc.system_role === "DAMAGED" ? "DAMAGE_MARK" : "INTERNAL_TRANSFER";
    await client.query(
      `INSERT INTO stock_location_movements (
        root_store_id, store_id, product_id, variant_key, from_location_id, to_location_id,
        quantity, movement_type, reference_type, note, performed_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'MOBILE_MOVE',$9,$10)`,
      [req.warehouseRootStoreId, storeId, prod.id, String(variant_key || ""), fromLoc.id, toLoc.id, qty, movType, note || `${fromLoc.full_code} -> ${toLoc.full_code}`, req.user?.id || null]
    );

    await syncProductTotalFromLocations(client, storeId, Number(prod.id));
    await client.query("COMMIT");
    res.json({ success: true, from: fromLoc.full_path, to: toLoc.full_path, quantity: qty });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post("/count-adjust", async (req: any, res) => {
  const {
    target_store_id,
    product_id,
    product_barcode,
    variant_key = "",
    location_id,
    location_barcode,
    counted_quantity,
    reason = "",
    note = ""
  } = req.body || {};

  const storeId = Number(target_store_id || req.warehouseStoreId);
  const storeRow = await verifyFamilyStore(req.warehouseRootStoreId, storeId);
  if (!storeRow) return res.status(403).json({ error: "Hedef şube/depo bulunamadı." });

  const counted = Math.max(0, Number(counted_quantity));
  if (isNaN(counted)) return res.status(400).json({ error: "Geçerli bir sayım adedi girin." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const prod = await resolveProductInStore(client, storeId, product_id, product_barcode);
    if (!prod) throw new Error("Ürün bu şubede/depoda bulunamadı.");

    await reconcileProductDefaultLocation(client, storeId, Number(prod.id));

    const loc = await resolveLocationInStore(client, storeId, location_id, location_barcode);
    if (!loc) throw new Error("Lokasyon bulunamadı.");

    const existing = await client.query(
      `SELECT id, quantity FROM product_location_stocks
       WHERE store_id = $1 AND product_id = $2 AND variant_key = $3 AND location_id = $4 FOR UPDATE`,
      [storeId, prod.id, String(variant_key || ""), loc.id]
    );
    const oldQty = Number(existing.rows[0]?.quantity || 0);
    const diff = counted - oldQty;

    await client.query(
      `INSERT INTO product_location_stocks (root_store_id, store_id, product_id, variant_key, location_id, quantity, last_moved_at)
       VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP)
       ON CONFLICT (root_store_id, product_id, variant_key, location_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, last_moved_at = CURRENT_TIMESTAMP`,
      [req.warehouseRootStoreId, storeId, prod.id, String(variant_key || ""), loc.id, counted]
    );

    await client.query(
      `INSERT INTO stock_location_movements (
        root_store_id, store_id, product_id, variant_key, from_location_id, to_location_id,
        quantity, movement_type, reference_type, reason, note, performed_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'COUNT_ADJUST','CYCLE_COUNT',$8,$9,$10)`,
      [
        req.warehouseRootStoreId,
        storeId,
        prod.id,
        String(variant_key || ""),
        diff < 0 ? loc.id : null,
        diff >= 0 ? loc.id : null,
        Math.abs(diff),
        reason || "Raf Sayım Düzeltmesi",
        note || `Önceki: ${oldQty} -> Sayılan: ${counted}`,
        req.user?.id || null
      ]
    );

    const newTotal = await syncProductTotalFromLocations(client, storeId, Number(prod.id));
    await client.query("COMMIT");
    res.json({ success: true, old_quantity: oldQty, counted_quantity: counted, diff, new_store_total: newTotal });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post("/manual-inbound", async (req: any, res) => {
  const {
    target_store_id,
    product_id,
    product_barcode,
    variant_key = "",
    quantity,
    damaged_qty = 0,
    reason = "",
    note = ""
  } = req.body || {};

  const storeId = Number(target_store_id || req.warehouseStoreId);
  const storeRow = await verifyFamilyStore(req.warehouseRootStoreId, storeId);
  if (!storeRow) return res.status(403).json({ error: "Hedef şube/depo bulunamadı." });

  const qty = Math.max(0, Number(quantity || 0));
  const dmg = Math.max(0, Number(damaged_qty || 0));
  if (qty <= 0 && dmg <= 0) return res.status(400).json({ error: "Giriş miktarı 0'dan büyük olmalıdır." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let prod = await resolveProductInStore(client, storeId, product_id, product_barcode);

    // If product exists in HQ/root but not yet in this warehouse/branch, clone minimal product card automatically
    if (!prod && (product_id || product_barcode)) {
      const srcRes = product_id
        ? await client.query("SELECT * FROM products WHERE id = $1 AND store_id IN (SELECT id FROM stores WHERE id = $2 OR parent_id = $2) LIMIT 1", [Number(product_id), req.warehouseRootStoreId])
        : await client.query("SELECT * FROM products WHERE TRIM(barcode) = TRIM($1) AND store_id IN (SELECT id FROM stores WHERE id = $2 OR parent_id = $2) LIMIT 1", [product_barcode, req.warehouseRootStoreId]);
      if (srcRes.rows.length > 0) {
        const sp = srcRes.rows[0];
        const cloned = await client.query(
          `INSERT INTO products (store_id, barcode, name, price, currency, cost_price, cost_currency, tax_rate, description, stock_quantity, unit, category, is_web_sale, product_type)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,$10,$11,$12,$13) RETURNING id, name, barcode`,
          [storeId, sp.barcode, sp.name, sp.price, sp.currency, sp.cost_price, sp.cost_currency, sp.tax_rate, sp.description, sp.unit, sp.category, sp.is_web_sale, sp.product_type]
        );
        prod = cloned.rows[0];
      }
    }

    if (!prod) throw new Error("Ürün bulunamadı.");

    await reconcileProductDefaultLocation(client, storeId, Number(prod.id));
    const result = await recordInboundToStore(client, {
      storeId,
      productId: Number(prod.id),
      variantKey: String(variant_key || ""),
      quantity: qty,
      damagedQty: dmg,
      movementType: "INBOUND",
      referenceType: "MANUAL_INBOUND",
      reason: reason || null,
      note: note || "Manuel Mal Kabul",
      performedBy: req.user?.id || null
    });

    await client.query("COMMIT");
    res.status(201).json({ success: true, product_id: prod.id, ...result });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================
// 6. PRODUCT CARD "STOK & YERLEŞİM (NEREDE?)" + BRANCH SETTINGS
// ============================================================

router.get("/product/:productId/placement", async (req: any, res) => {
  try {
    const productId = Number(req.params.productId);
    const rootId = req.warehouseRootStoreId;

    const prodRes = await pool.query(
      `SELECT p.id, p.store_id, p.barcode, p.name, p.unit, p.stock_quantity, p.min_stock_level
       FROM products p
       JOIN stores s ON s.id = p.store_id
       WHERE p.id = $1 AND (s.id = $2 OR s.parent_id = $2)`,
      [productId, rootId]
    );
    if (prodRes.rows.length === 0) return res.status(404).json({ error: "Ürün bulunamadı." });
    const baseProd = prodRes.rows[0];

    const storesRes = await pool.query(
      `SELECT id, name, slug, parent_id, COALESCE(branch_type, 'STORE') AS branch_type,
              COALESCE(use_bin_locations, FALSE) AS use_bin_locations,
              COALESCE(is_central_warehouse, FALSE) AS is_central_warehouse,
              COALESCE(include_in_online_stock, FALSE) AS include_in_online_stock,
              COALESCE(sell_receiving_stock, FALSE) AS sell_receiving_stock
       FROM stores
       WHERE id = $1 OR parent_id = $1
       ORDER BY (parent_id IS NULL) DESC, (branch_type = 'WAREHOUSE') DESC, id ASC`,
      [rootId]
    );

    // Find matching product rows across all stores in family by barcode (or exact id)
    const familyProdsRes = baseProd.barcode
      ? await pool.query(
          `SELECT id, store_id, stock_quantity, min_stock_level FROM products
           WHERE store_id = ANY($1::int[]) AND TRIM(barcode) = TRIM($2)`,
          [storesRes.rows.map((s: any) => Number(s.id)), baseProd.barcode]
        )
      : { rows: [baseProd] };

    const prodByStore = new Map<number, any>();
    familyProdsRes.rows.forEach((p: any) => prodByStore.set(Number(p.store_id), p));

    const matchedProdIds = familyProdsRes.rows.map((p: any) => Number(p.id));

    const locStocksRes = matchedProdIds.length > 0
      ? await pool.query(
          `SELECT pls.store_id, pls.product_id, pls.variant_key, pls.location_id,
                  pls.quantity, pls.reserved_quantity, pls.is_primary, pls.last_moved_at,
                  sl.name AS location_name, sl.code, sl.full_code, sl.full_path, sl.system_role, sl.is_sellable, sl.is_pickable
           FROM product_location_stocks pls
           JOIN storage_locations sl ON sl.id = pls.location_id
           WHERE pls.product_id = ANY($1::int[]) AND (pls.quantity > 0 OR pls.reserved_quantity > 0)
           ORDER BY (sl.system_role = 'STANDARD') DESC, sl.sort_order ASC, pls.quantity DESC`,
          [matchedProdIds]
        )
      : { rows: [] };

    const settingsRes = matchedProdIds.length > 0
      ? await pool.query(
          `SELECT pbs.*, dl.full_path AS default_location_path, dl.full_code AS default_location_code
           FROM product_branch_settings pbs
           LEFT JOIN storage_locations dl ON dl.id = pbs.default_location_id
           WHERE pbs.root_store_id = $1 AND pbs.product_id = ANY($2::int[])`,
          [rootId, matchedProdIds]
        )
      : { rows: [] };

    const settingsByStore = new Map<number, any>();
    settingsRes.rows.forEach((r: any) => settingsByStore.set(Number(r.store_id), r));

    const branches = storesRes.rows.map((st: any) => {
      const sid = Number(st.id);
      const mp = prodByStore.get(sid);
      const bins = locStocksRes.rows.filter((ls: any) => Number(ls.store_id) === sid);
      const stSetting = settingsByStore.get(sid) || null;

      let physical = 0;
      let reserved = 0;
      let damaged = 0;
      let receiving = 0;

      if (bins.length > 0) {
        for (const b of bins) {
          const q = Number(b.quantity || 0);
          const rq = Number(b.reserved_quantity || 0);
          if (b.system_role === "DAMAGED") {
            damaged += q;
          } else {
            physical += q;
            reserved += rq;
            if (b.system_role === "RECEIVING") receiving += q;
          }
        }
      } else if (mp) {
        physical = Math.max(0, Number(mp.stock_quantity || 0));
      }

      const available = Math.max(0, physical - reserved);
      const minLevel = stSetting?.min_stock_level !== null && stSetting?.min_stock_level !== undefined
        ? Number(stSetting.min_stock_level)
        : (mp?.min_stock_level !== null && mp?.min_stock_level !== undefined ? Number(mp.min_stock_level) : null);

      return {
        store_id: sid,
        store_name: st.name,
        branch_type: st.branch_type,
        is_hq: !st.parent_id,
        is_central_warehouse: Boolean(st.is_central_warehouse),
        use_bin_locations: Boolean(st.use_bin_locations),
        product_id: mp ? Number(mp.id) : null,
        physical_qty: physical,
        reserved_qty: reserved,
        damaged_qty: damaged,
        receiving_qty: receiving,
        available_qty: available,
        min_stock_level: minLevel,
        is_below_min: minLevel !== null && available < minLevel,
        default_location_id: stSetting?.default_location_id || null,
        default_location_path: stSetting?.default_location_path || null,
        default_location_code: stSetting?.default_location_code || null,
        units_per_pack: Number(stSetting?.units_per_pack || 1),
        pack_unit_label: stSetting?.pack_unit_label || "Koli",
        locations: bins
      };
    });

    const onlinePool = baseProd.barcode
      ? await getOnlineAvailableStockForProduct(pool, rootId, baseProd.barcode)
      : { total_available: branches.reduce((a: number, b: any) => a + b.available_qty, 0), by_store: [] };

    res.json({
      product: baseProd,
      online_available_total: onlinePool.total_available,
      branches
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/product/:productId/branch-settings", async (req: any, res) => {
  const baseProductId = Number(req.params.productId);
  const { target_store_id, min_stock_level, default_location_id, units_per_pack, pack_unit_label, variant_key = "" } = req.body || {};
  const storeId = Number(target_store_id || req.warehouseStoreId);

  const storeRow = await verifyFamilyStore(req.warehouseRootStoreId, storeId);
  if (!storeRow) return res.status(403).json({ error: "Hedef şube/depo bulunamadı." });

  try {
    // Resolve matching product_id in target store by barcode
    const baseProdRes = await pool.query("SELECT id, store_id, barcode FROM products WHERE id = $1", [baseProductId]);
    if (baseProdRes.rows.length === 0) return res.status(404).json({ error: "Ürün bulunamadı." });
    const bp = baseProdRes.rows[0];

    let targetProdId = baseProductId;
    if (Number(bp.store_id) !== storeId && bp.barcode) {
      const mRes = await pool.query("SELECT id FROM products WHERE store_id = $1 AND TRIM(barcode) = TRIM($2) LIMIT 1", [storeId, bp.barcode]);
      if (mRes.rows.length > 0) targetProdId = Number(mRes.rows[0].id);
    }

    const r = await pool.query(
      `INSERT INTO product_branch_settings (
        root_store_id, store_id, product_id, variant_key,
        min_stock_level, default_location_id, units_per_pack, pack_unit_label, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP)
      ON CONFLICT (root_store_id, store_id, product_id, variant_key)
      DO UPDATE SET
        min_stock_level = EXCLUDED.min_stock_level,
        default_location_id = EXCLUDED.default_location_id,
        units_per_pack = EXCLUDED.units_per_pack,
        pack_unit_label = EXCLUDED.pack_unit_label,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        req.warehouseRootStoreId,
        storeId,
        targetProdId,
        String(variant_key || ""),
        min_stock_level === "" || min_stock_level === null || min_stock_level === undefined ? null : Number(min_stock_level),
        default_location_id ? Number(default_location_id) : null,
        Math.max(1, Number(units_per_pack) || 1),
        String(pack_unit_label || "Koli").slice(0, 30)
      ]
    );
    res.json({ success: true, settings: r.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 7. PICK LIST (SORTED BY SORT_ORDER / FULL_CODE) & REPLENISHMENT
// ============================================================

router.get("/picklist/:transferId", async (req: any, res) => {
  try {
    const transferId = Number(req.params.transferId);
    const tRes = await pool.query(
      `SELECT st.*, fs.name AS from_store_name, ts.name AS to_store_name,
              COALESCE(fs.branch_type, 'STORE') AS from_branch_type,
              COALESCE(ts.branch_type, 'STORE') AS to_branch_type
       FROM stock_transfers st
       JOIN stores fs ON fs.id = st.from_store_id
       JOIN stores ts ON ts.id = st.to_store_id
       WHERE st.id = $1 AND (fs.id = $2 OR fs.parent_id = $2)`,
      [transferId, req.warehouseRootStoreId]
    );
    if (tRes.rows.length === 0) return res.status(404).json({ error: "Transfer bulunamadı." });
    const transfer = tRes.rows[0];

    const itemsRes = await pool.query(
      `SELECT sti.*, COALESCE(sti.product_name, p.name) AS product_name,
              COALESCE(sti.barcode, p.barcode) AS barcode, p.unit, p.image_url,
              pl.full_path AS picked_location_path, pl.full_code AS picked_location_code,
              COALESCE(pl.sort_order, 999999) AS pick_sort_order
       FROM stock_transfer_items sti
       LEFT JOIN products p ON p.id = sti.product_id
       LEFT JOIN storage_locations pl ON pl.id = sti.picked_from_location_id
       WHERE sti.transfer_id = $1
       ORDER BY pick_sort_order ASC, picked_location_code ASC, sti.id ASC`,
      [transferId]
    );

    // Attach all pickable bins (including RECEIVING for Cross-Docking) in from_store for each item
    const enrichedItems = await Promise.all(itemsRes.rows.map(async (it: any) => {
      const binsRes = await pool.query(
        `SELECT pls.location_id, pls.quantity, pls.reserved_quantity,
                GREATEST(0, pls.quantity - pls.reserved_quantity) AS available_quantity,
                sl.full_path, sl.full_code, sl.barcode AS location_barcode, sl.system_role, sl.sort_order
         FROM product_location_stocks pls
         JOIN storage_locations sl ON sl.id = pls.location_id
         WHERE pls.store_id = $1 AND pls.product_id = $2 AND sl.is_pickable = TRUE AND sl.system_role != 'DAMAGED' AND pls.quantity > 0
         ORDER BY (sl.system_role = 'STANDARD') DESC, sl.sort_order ASC, sl.full_code ASC`,
        [transfer.from_store_id, it.product_id]
      );
      const firstBin = binsRes.rows[0];
      return {
        ...it,
        suggested_location_id: it.picked_from_location_id || firstBin?.location_id || null,
        suggested_location_path: it.picked_location_path || firstBin?.full_path || "Genel Alan",
        suggested_location_code: it.picked_location_code || firstBin?.full_code || "DEF",
        sort_key: firstBin?.sort_order ?? 999999,
        available_bins: binsRes.rows
      };
    }));

    enrichedItems.sort((a, b) => (a.sort_key - b.sort_key) || String(a.suggested_location_code).localeCompare(String(b.suggested_location_code)));

    res.json({ transfer, items: enrichedItems });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/replenishment", async (req: any, res) => {
  try {
    const rootId = req.warehouseRootStoreId;
    // Find central warehouse(s) or HQ as default supply source
    const whRes = await pool.query(
      `SELECT id, name, branch_type, is_central_warehouse
       FROM stores
       WHERE (id = $1 OR parent_id = $1)
       ORDER BY is_central_warehouse DESC, (branch_type = 'WAREHOUSE') DESC, (parent_id IS NULL) DESC, id ASC`,
      [rootId]
    );
    const sourceWh = whRes.rows.find((s: any) => s.branch_type === "WAREHOUSE") || whRes.rows[0];
    if (!sourceWh) return res.json({ source_store: null, suggestions: [] });

    const lowRes = await pool.query(
      `SELECT p.id AS product_id, p.store_id, s.name AS store_name, p.name AS product_name, p.barcode, p.unit,
              COALESCE(p.stock_quantity, 0) AS current_stock,
              COALESCE(pbs.min_stock_level, p.min_stock_level) AS min_stock_level,
              COALESCE(pbs.units_per_pack, 1) AS units_per_pack,
              wh_p.id AS source_product_id,
              COALESCE(wh_p.stock_quantity, 0) AS source_stock
       FROM products p
       JOIN stores s ON s.id = p.store_id
       LEFT JOIN product_branch_settings pbs
         ON pbs.root_store_id = $1 AND pbs.store_id = p.store_id AND pbs.product_id = p.id AND pbs.variant_key = ''
       LEFT JOIN products wh_p
         ON wh_p.store_id = $2 AND TRIM(wh_p.barcode) = TRIM(p.barcode) AND COALESCE(p.barcode, '') != ''
       WHERE (s.id = $1 OR s.parent_id = $1)
         AND s.id != $2
         AND COALESCE(p.product_type, 'product') != 'service'
         AND COALESCE(pbs.min_stock_level, p.min_stock_level) IS NOT NULL
         AND COALESCE(pbs.min_stock_level, p.min_stock_level) > 0
         AND COALESCE(p.stock_quantity, 0) < COALESCE(pbs.min_stock_level, p.min_stock_level)
       ORDER BY (COALESCE(pbs.min_stock_level, p.min_stock_level) - COALESCE(p.stock_quantity, 0)) DESC
       LIMIT 100`,
      [rootId, sourceWh.id]
    );

    const suggestions = lowRes.rows.map((r: any) => {
      const deficit = Math.max(1, Math.ceil(Number(r.min_stock_level) - Number(r.current_stock)));
      return {
        ...r,
        suggested_qty: Math.min(deficit, Math.max(0, Number(r.source_stock))) || deficit
      };
    });

    res.json({ source_store: sourceWh, suggestions });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// 8. IMMUTABLE AUDIT LOG (STOCK LOCATION MOVEMENTS)
// ============================================================

router.get("/movements", async (req: any, res) => {
  try {
    const targetStoreId = req.query.targetStoreId ? Number(req.query.targetStoreId) : null;
    const movementType = req.query.movementType ? String(req.query.movementType) : null;
    const limit = Math.min(200, Math.max(10, Number(req.query.limit) || 60));

    const params: any[] = [req.warehouseRootStoreId];
    const wheres = ["m.root_store_id = $1"];

    if (targetStoreId) {
      wheres.push(`m.store_id = $${params.length + 1}`);
      params.push(targetStoreId);
    }
    if (movementType && movementType !== "ALL") {
      wheres.push(`m.movement_type = $${params.length + 1}`);
      params.push(movementType);
    }
    params.push(limit);

    const r = await pool.query(
      `SELECT m.*, s.name AS store_name, p.name AS product_name, p.barcode,
              fl.full_code AS from_code, fl.full_path AS from_path,
              tl.full_code AS to_code, tl.full_path AS to_path,
              COALESCE(u.full_name, u.name, u.email) AS performed_by_name
       FROM stock_location_movements m
       JOIN stores s ON s.id = m.store_id
       JOIN products p ON p.id = m.product_id
       LEFT JOIN storage_locations fl ON fl.id = m.from_location_id
       LEFT JOIN storage_locations tl ON tl.id = m.to_location_id
       LEFT JOIN users u ON u.id = m.performed_by
       WHERE ${wheres.join(" AND ")}
       ORDER BY m.created_at DESC, m.id DESC
       LIMIT $${params.length}`,
      params
    );

    res.json(r.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
