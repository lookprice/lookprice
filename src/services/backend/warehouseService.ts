import { PoolClient } from "pg";
import { pool, addStockMovement } from "../../../models/db";

export interface WarehouseLocationTypeDef {
  key: string;
  label: string;
  prefix: string;
}

export interface WarehouseConfig {
  code_separator: string;
  location_types: WarehouseLocationTypeDef[];
  location_tags: string[];
  discrepancy_reasons: string[];
  pack_unit_labels: string[];
  label_format: "58mm" | "80mm" | "a4_3x8";
  default_receiving_sla_hours: number;
}

export const DEFAULT_WAREHOUSE_CONFIG: WarehouseConfig = {
  code_separator: "-",
  location_types: [
    { key: "ZONE", label: "Bölge / Alan", prefix: "B" },
    { key: "FLOOR", label: "Kat", prefix: "K" },
    { key: "AISLE", label: "Koridor", prefix: "KOR" },
    { key: "SIDE", label: "Taraf (Sağ/Sol)", prefix: "T" },
    { key: "RACK", label: "Raf Ünitesi", prefix: "R" },
    { key: "CABINET", label: "Dolap", prefix: "D" },
    { key: "DRAWER", label: "Çekmece", prefix: "C" },
    { key: "SHELF", label: "Raf / Göz", prefix: "G" },
    { key: "BIN", label: "Kutu / Sepet", prefix: "KT" },
    { key: "PALLET", label: "Palet", prefix: "P" },
    { key: "DISPLAY", label: "Reyon / Stant", prefix: "RY" },
    { key: "CUSTOM", label: "Özel", prefix: "OZ" }
  ],
  location_tags: ["Kırılabilir", "Ağır Yük", "Yüksek Değer", "Hızlı Tüketim", "Sezonluk"],
  discrepancy_reasons: [
    "Hasarlı / Kırık",
    "Eksik Teslimat",
    "Ambalaj Bozuk",
    "Yanlış Ürün / Barkod",
    "Fazla Teslimat"
  ],
  pack_unit_labels: ["Koli", "Paket", "Kutu", "Palet", "Adet"],
  label_format: "80mm",
  default_receiving_sla_hours: 24
};

export function normalizeWarehouseConfig(raw: any): WarehouseConfig {
  let obj = raw;
  if (typeof raw === "string") {
    try { obj = JSON.parse(raw); } catch { obj = {}; }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) obj = {};

  return {
    code_separator: typeof obj.code_separator === "string" && obj.code_separator.trim() ? obj.code_separator.trim().slice(0, 3) : DEFAULT_WAREHOUSE_CONFIG.code_separator,
    location_types: Array.isArray(obj.location_types) && obj.location_types.length > 0
      ? obj.location_types
          .filter((x: any) => x && x.key && x.label)
          .map((x: any) => ({
            key: String(x.key).trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 32),
            label: String(x.label).trim().slice(0, 50),
            prefix: String(x.prefix || x.key?.slice(0, 2) || "L").trim().toUpperCase().slice(0, 8)
          }))
      : DEFAULT_WAREHOUSE_CONFIG.location_types,
    location_tags: Array.isArray(obj.location_tags)
      ? obj.location_tags.map((t: any) => String(t).trim()).filter(Boolean).slice(0, 30)
      : DEFAULT_WAREHOUSE_CONFIG.location_tags,
    discrepancy_reasons: Array.isArray(obj.discrepancy_reasons) && obj.discrepancy_reasons.length > 0
      ? obj.discrepancy_reasons.map((r: any) => String(r).trim()).filter(Boolean).slice(0, 30)
      : DEFAULT_WAREHOUSE_CONFIG.discrepancy_reasons,
    pack_unit_labels: Array.isArray(obj.pack_unit_labels) && obj.pack_unit_labels.length > 0
      ? obj.pack_unit_labels.map((u: any) => String(u).trim()).filter(Boolean).slice(0, 20)
      : DEFAULT_WAREHOUSE_CONFIG.pack_unit_labels,
    label_format: ["58mm", "80mm", "a4_3x8"].includes(obj.label_format) ? obj.label_format : DEFAULT_WAREHOUSE_CONFIG.label_format,
    default_receiving_sla_hours: Number(obj.default_receiving_sla_hours) > 0 ? Math.min(720, Math.round(Number(obj.default_receiving_sla_hours))) : 24
  };
}

/**
 * Checks whether a store belongs to shopLP or bookLP (strict sectoral isolation).
 * Excludes horecaLP, real estate, automotive, corporate website, developer projects.
 */
export async function isWarehouseEligibleStore(client: PoolClient | typeof pool, storeId: number): Promise<{ eligible: boolean; rootStoreId: number; store: any }> {
  const res = await client.query(
    `SELECT s.id, s.parent_id, s.name, s.slug, s.store_type, s.sub_sector, s.branding,
            s.branch_type, s.has_pos, s.is_central_warehouse, s.allow_direct_sales,
            s.use_bin_locations, s.receiving_sla_hours, s.include_in_online_stock, s.sell_receiving_stock,
            COALESCE(p.store_type, s.store_type) AS effective_store_type,
            COALESCE(p.sub_sector, s.sub_sector) AS effective_sub_sector,
            COALESCE(p.branding, s.branding) AS effective_branding
     FROM stores s
     LEFT JOIN stores p ON p.id = s.parent_id
     WHERE s.id = $1`,
    [storeId]
  );

  if (res.rows.length === 0) {
    return { eligible: false, rootStoreId: storeId, store: null };
  }

  const row = res.rows[0];
  const rootStoreId = Number(row.parent_id || row.id);

  let br: any = row.effective_branding || {};
  if (typeof br === "string") {
    try { br = JSON.parse(br); } catch { br = {}; }
  }

  const st = String(row.effective_store_type || br?.store_type || "").toLowerCase();
  const sub = String(row.effective_sub_sector || br?.sub_sector || "").toLowerCase();
  const layoutSector = String(br?.page_layout_settings?.sector || br?.sector || "").toLowerCase();

  const forbiddenTokens = [
    "cafe", "restaurant", "horeca", "hotel", "bakery", "bar", "pub", "fastfood",
    "real_estate", "realestate", "emlak", "property", "gayrimenkul",
    "automotive", "auto", "otomotiv", "galeri", "fleet", "vehicle",
    "corporate", "developer", "construction", "proje"
  ];

  const isForbidden = forbiddenTokens.some(tok =>
    st.includes(tok) || sub.includes(tok) || layoutSector.includes(tok)
  );

  return {
    eligible: !isForbidden,
    rootStoreId,
    store: row
  };
}

export async function getRootStoreId(client: PoolClient | typeof pool, storeId: number): Promise<number> {
  const r = await client.query("SELECT COALESCE(parent_id, id) AS root_id FROM stores WHERE id = $1", [storeId]);
  return Number(r.rows[0]?.root_id || storeId);
}

export async function getStoreWarehouseConfig(client: PoolClient | typeof pool, rootStoreId: number): Promise<WarehouseConfig> {
  const r = await client.query("SELECT warehouse_config FROM stores WHERE id = $1", [rootStoreId]);
  return normalizeWarehouseConfig(r.rows[0]?.warehouse_config);
}

export function sanitizeCode(raw: string, fallback = "LOC"): string {
  const clean = String(raw || "")
    .replace(/ğ/gi, "g").replace(/ü/gi, "u").replace(/ş/gi, "s")
    .replace(/ı/g, "i").replace(/İ/g, "I").replace(/ö/gi, "o").replace(/ç/gi, "c")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 16);
  return clean || fallback;
}

/**
 * Ensures non-deletable system locations exist for a store:
 * - DEFAULT for every store/warehouse
 * - RECEIVING & DAMAGED additionally for WAREHOUSE (or when use_bin_locations is enabled)
 */
export async function ensureSystemLocationsForStore(client: PoolClient | typeof pool, storeId: number) {
  const storeRes = await client.query(
    `SELECT id, parent_id, name, branch_type, allow_direct_sales, use_bin_locations FROM stores WHERE id = $1`,
    [storeId]
  );
  if (storeRes.rows.length === 0) return;
  const s = storeRes.rows[0];
  const rootStoreId = Number(s.parent_id || s.id);
  const storeName = s.name || `Şube #${s.id}`;
  const isWarehouse = String(s.branch_type || "STORE").toUpperCase() === "WAREHOUSE";
  const prefix = isWarehouse ? `D${s.id}` : `S${s.id}`;

  const ensureOne = async (
    systemRole: "DEFAULT" | "RECEIVING" | "DAMAGED",
    name: string,
    code: string,
    isSellable: boolean,
    isPickable: boolean,
    sortOrder: number
  ) => {
    const existing = await client.query(
      "SELECT id FROM storage_locations WHERE store_id = $1 AND system_role = $2 LIMIT 1",
      [s.id, systemRole]
    );
    if (existing.rows.length > 0) return existing.rows[0].id;

    const fullCode = `${prefix}-${code}`;
    const fullPath = `${storeName} > ${name}`;
    const barcode = `LOC-${prefix}-${code}`;

    const ins = await client.query(
      `INSERT INTO storage_locations (
        root_store_id, store_id, parent_id, system_role, location_type,
        name, code, full_code, full_path, barcode, is_sellable, is_pickable, sort_order
      ) VALUES ($1, $2, NULL, $3, 'ZONE', $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (root_store_id, barcode) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [rootStoreId, s.id, systemRole, name, code, fullCode, fullPath, barcode, isSellable, isPickable, sortOrder]
    );
    return ins.rows[0]?.id;
  };

  await ensureOne("DEFAULT", "Genel Alan", "DEF", Boolean(s.allow_direct_sales ?? !isWarehouse), true, 0);

  if (isWarehouse || Boolean(s.use_bin_locations)) {
    await ensureOne("RECEIVING", "Mal Kabul Alanı", "RCV", false, true, -10);
    await ensureOne("DAMAGED", "Hasarlı / Karantina", "DMG", false, false, 9999);
  }
}

/**
 * Recomputes full_path and full_code for a location and all its descendants recursively.
 */
export async function recomputeLocationPathsRecursive(client: PoolClient | typeof pool, storeId: number) {
  const storeRes = await client.query("SELECT id, parent_id, name, branch_type FROM stores WHERE id = $1", [storeId]);
  if (storeRes.rows.length === 0) return;
  const s = storeRes.rows[0];
  const rootStoreId = Number(s.parent_id || s.id);
  const cfg = await getStoreWarehouseConfig(client, rootStoreId);
  const sep = cfg.code_separator || "-";
  const prefix = String(s.branch_type || "STORE").toUpperCase() === "WAREHOUSE" ? `D${s.id}` : `S${s.id}`;

  const locsRes = await client.query(
    `SELECT id, parent_id, name, code, system_role, barcode FROM storage_locations WHERE store_id = $1 ORDER BY sort_order ASC, id ASC`,
    [storeId]
  );

  const byId = new Map<number, any>();
  locsRes.rows.forEach((row: any) => byId.set(Number(row.id), row));

  const buildChain = (id: number): any[] => {
    const chain: any[] = [];
    const seen = new Set<number>();
    let cur = byId.get(id);
    while (cur && !seen.has(Number(cur.id))) {
      seen.add(Number(cur.id));
      chain.unshift(cur);
      cur = cur.parent_id ? byId.get(Number(cur.parent_id)) : null;
    }
    return chain;
  };

  for (const row of locsRes.rows) {
    const chain = buildChain(Number(row.id));
    const fullPath = [s.name, ...chain.map(c => c.name)].join(" > ");
    const fullCode = [prefix, ...chain.map(c => c.code)].join(sep);
    await client.query(
      `UPDATE storage_locations SET full_path = $1, full_code = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [fullPath, fullCode, row.id]
    );
  }
}

export async function getSystemLocationId(
  client: PoolClient | typeof pool,
  storeId: number,
  role: "DEFAULT" | "RECEIVING" | "DAMAGED"
): Promise<number> {
  let r = await client.query(
    "SELECT id FROM storage_locations WHERE store_id = $1 AND system_role = $2 LIMIT 1",
    [storeId, role]
  );
  if (r.rows.length === 0) {
    await ensureSystemLocationsForStore(client, storeId);
    r = await client.query(
      "SELECT id FROM storage_locations WHERE store_id = $1 AND system_role = $2 LIMIT 1",
      [storeId, role]
    );
  }
  if (r.rows.length === 0 && role === "DAMAGED") {
    const storeRes = await client.query(
      "SELECT id, parent_id, name, COALESCE(branch_type, 'STORE') AS branch_type FROM stores WHERE id = $1",
      [storeId]
    );
    if (storeRes.rows.length > 0) {
      const s = storeRes.rows[0];
      const rootId = Number(s.parent_id || s.id);
      const prefix = s.branch_type === "WAREHOUSE" ? `D${s.id}` : `S${s.id}`;
      const ins = await client.query(
        `INSERT INTO storage_locations (
          root_store_id, store_id, parent_id, system_role, location_type,
          name, code, full_code, full_path, barcode, is_sellable, is_pickable, sort_order
        ) VALUES ($1,$2,NULL,'DAMAGED','ZONE','Hasarlı / Karantina','DMG',$3,$4,$5,FALSE,FALSE,9999)
        ON CONFLICT DO NOTHING
        RETURNING id`,
        [rootId, s.id, `${prefix}-DMG`, `${s.name} > Hasarlı / Karantina`, `LOC-${prefix}-DMG`]
      );
      if (ins.rows.length > 0) return Number(ins.rows[0].id);
      r = await client.query(
        "SELECT id FROM storage_locations WHERE store_id = $1 AND system_role = 'DAMAGED' LIMIT 1",
        [storeId]
      );
    }
  }
  if (r.rows.length === 0 && role !== "DEFAULT") {
    // Fallback to DEFAULT if RECEIVING not created for a simple store
    const def = await client.query(
      "SELECT id FROM storage_locations WHERE store_id = $1 AND system_role = 'DEFAULT' LIMIT 1",
      [storeId]
    );
    if (def.rows.length > 0) return Number(def.rows[0].id);
  }
  if (r.rows.length === 0) {
    throw new Error(`Sistem lokasyonu (${role}) oluşturulamadı (Mağaza #${storeId})`);
  }
  return Number(r.rows[0].id);
}

/**
 * Synchronizes products.stock_quantity with the sum of non-DAMAGED product_location_stocks.
 * Keeps legacy POS / e-commerce / marketplace integrations 100% consistent.
 */
export async function syncProductTotalFromLocations(client: PoolClient | typeof pool, storeId: number, productId: number) {
  const sumRes = await client.query(
    `SELECT COALESCE(SUM(pls.quantity), 0) AS total_qty
     FROM product_location_stocks pls
     JOIN storage_locations sl ON sl.id = pls.location_id
     WHERE pls.store_id = $1 AND pls.product_id = $2 AND sl.system_role != 'DAMAGED'`,
    [storeId, productId]
  );
  const totalQty = Math.max(0, Number(sumRes.rows[0]?.total_qty || 0));
  await client.query(
    `UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND store_id = $3`,
    [totalQty, productId, storeId]
  );
  return totalQty;
}

/**
 * Ensures product_location_stocks reflects existing products.stock_quantity before doing location math
 * (for products that were modified via POS/web sales without bin prompts).
 */
export async function reconcileProductDefaultLocation(client: PoolClient | typeof pool, storeId: number, productId: number) {
  const pRes = await client.query("SELECT id, stock_quantity, product_type FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
  if (pRes.rows.length === 0 || pRes.rows[0].product_type === "service") return;
  const prodQty = Math.max(0, Number(pRes.rows[0].stock_quantity || 0));

  const sumRes = await client.query(
    `SELECT COALESCE(SUM(pls.quantity), 0) AS loc_qty, COUNT(*)::int AS row_cnt
     FROM product_location_stocks pls
     JOIN storage_locations sl ON sl.id = pls.location_id
     WHERE pls.store_id = $1 AND pls.product_id = $2 AND sl.system_role != 'DAMAGED'`,
    [storeId, productId]
  );
  const locQty = Number(sumRes.rows[0]?.loc_qty || 0);
  const rowCnt = Number(sumRes.rows[0]?.row_cnt || 0);
  const rootStoreId = await getRootStoreId(client, storeId);

  if (rowCnt === 0 && prodQty > 0) {
    const defLocId = await getSystemLocationId(client, storeId, "DEFAULT");
    await client.query(
      `INSERT INTO product_location_stocks (root_store_id, store_id, product_id, variant_key, location_id, quantity, is_primary)
       VALUES ($1, $2, $3, '', $4, $5, TRUE)
       ON CONFLICT (root_store_id, product_id, variant_key, location_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, last_moved_at = CURRENT_TIMESTAMP`,
      [rootStoreId, storeId, productId, defLocId, prodQty]
    );
  } else if (Math.abs(prodQty - locQty) > 0.0001) {
    // Reconcile delta onto primary / sellable / default location (caused by POS/web sale)
    const delta = prodQty - locQty;
    if (delta < 0) {
      // Deduct from sellable/primary/default bins without going negative
      let remaining = Math.abs(delta);
      const bins = await client.query(
        `SELECT pls.id, pls.quantity
         FROM product_location_stocks pls
         JOIN storage_locations sl ON sl.id = pls.location_id
         WHERE pls.store_id = $1 AND pls.product_id = $2 AND sl.system_role != 'DAMAGED' AND pls.quantity > 0
         ORDER BY sl.is_sellable DESC, pls.is_primary DESC, (sl.system_role = 'DEFAULT') DESC, pls.quantity DESC`,
        [storeId, productId]
      );
      for (const b of bins.rows) {
        if (remaining <= 0) break;
        const take = Math.min(Number(b.quantity), remaining);
        await client.query(
          "UPDATE product_location_stocks SET quantity = GREATEST(0, quantity - $1), last_moved_at = CURRENT_TIMESTAMP WHERE id = $2",
          [take, b.id]
        );
        remaining -= take;
      }
    } else {
      const defLocId = await getSystemLocationId(client, storeId, "DEFAULT");
      await client.query(
        `INSERT INTO product_location_stocks (root_store_id, store_id, product_id, variant_key, location_id, quantity, is_primary)
         VALUES ($1, $2, $3, '', $4, $5, FALSE)
         ON CONFLICT (root_store_id, product_id, variant_key, location_id)
         DO UPDATE SET quantity = product_location_stocks.quantity + EXCLUDED.quantity, last_moved_at = CURRENT_TIMESTAMP`,
        [rootStoreId, storeId, productId, defLocId, delta]
      );
    }
  }
}

/**
 * Records stock inbound into a store or warehouse.
 * Two-stage rule: if target is WAREHOUSE (or use_bin_locations=true with RECEIVING), routes to RECEIVING; else DEFAULT.
 * Damaged qty routes to DAMAGED location.
 */
export async function recordInboundToStore(
  client: PoolClient,
  opts: {
    storeId: number;
    productId: number;
    variantKey?: string;
    quantity: number;
    damagedQty?: number;
    movementType?: "INBOUND" | "BRANCH_TRANSFER_IN";
    referenceType?: string;
    referenceId?: number | null;
    reason?: string | null;
    note?: string | null;
    performedBy?: number | null;
    skipSyncProductTotal?: boolean;
  }
) {
  const {
    storeId,
    productId,
    variantKey = "",
    quantity,
    damagedQty = 0,
    movementType = "INBOUND",
    referenceType = "MANUAL",
    referenceId = null,
    reason = null,
    note = null,
    performedBy = null,
    skipSyncProductTotal = false
  } = opts;

  const sRes = await client.query(
    "SELECT id, parent_id, branch_type, use_bin_locations FROM stores WHERE id = $1",
    [storeId]
  );
  if (sRes.rows.length === 0) throw new Error("Hedef mağaza/depo bulunamadı.");
  const st = sRes.rows[0];
  const rootStoreId = Number(st.parent_id || st.id);
  const isWarehouse = String(st.branch_type || "STORE").toUpperCase() === "WAREHOUSE";
  const useReceiving = isWarehouse || Boolean(st.use_bin_locations);

  await ensureSystemLocationsForStore(client, storeId);

  let targetLocId: number | null = null;
  if (quantity > 0) {
    targetLocId = await getSystemLocationId(client, storeId, useReceiving ? "RECEIVING" : "DEFAULT");
    await client.query(
      `INSERT INTO product_location_stocks (root_store_id, store_id, product_id, variant_key, location_id, quantity, last_moved_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (root_store_id, product_id, variant_key, location_id)
       DO UPDATE SET quantity = product_location_stocks.quantity + EXCLUDED.quantity, last_moved_at = CURRENT_TIMESTAMP`,
      [rootStoreId, storeId, productId, variantKey, targetLocId, quantity]
    );
    await client.query(
      `INSERT INTO stock_location_movements (
        root_store_id, store_id, product_id, variant_key, from_location_id, to_location_id,
        quantity, movement_type, reference_type, reference_id, reason, note, performed_by
      ) VALUES ($1, $2, $3, $4, NULL, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [rootStoreId, storeId, productId, variantKey, targetLocId, quantity, movementType, referenceType, referenceId, reason, note, performedBy]
    );
  }

  if (damagedQty > 0) {
    const dmgLocId = await getSystemLocationId(client, storeId, "DAMAGED");
    await client.query(
      `INSERT INTO product_location_stocks (root_store_id, store_id, product_id, variant_key, location_id, quantity, last_moved_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (root_store_id, product_id, variant_key, location_id)
       DO UPDATE SET quantity = product_location_stocks.quantity + EXCLUDED.quantity, last_moved_at = CURRENT_TIMESTAMP`,
      [rootStoreId, storeId, productId, variantKey, dmgLocId, damagedQty]
    );
    await client.query(
      `INSERT INTO stock_location_movements (
        root_store_id, store_id, product_id, variant_key, from_location_id, to_location_id,
        quantity, movement_type, reference_type, reference_id, reason, note, performed_by
      ) VALUES ($1, $2, $3, $4, NULL, $5, $6, 'DAMAGE_MARK', $7, $8, $9, $10, $11)`,
      [rootStoreId, storeId, productId, variantKey, dmgLocId, damagedQty, referenceType, referenceId, reason || "Hasarlı Teslimat", note, performedBy]
    );
  }

  if (!skipSyncProductTotal) {
    await syncProductTotalFromLocations(client, storeId, productId);
  }

  return { targetLocationId: targetLocId, routedToReceiving: useReceiving };
}

/**
 * Shared transfer status processor used by BOTH /api/store/branches/transfers/:id/status
 * and /api/store/stock-transfers/:id/status to eliminate duplicate logic.
 * Handles:
 * - preparing: reserves stock in product_location_stocks (checks available qty = physical - reserved)
 * - shipped: deducts physical qty & releases reserved qty (supports picked_from_location_id & Cross-Docking from RECEIVING)
 * - completed: supports partial received_qty, damaged_qty, discrepancy_reason; routes to RECEIVING/DEFAULT/DAMAGED
 * - cancelled: releases reserved_quantity if preparing, or restores stock if shipped
 */
export async function processTransferStatusTransition(
  client: PoolClient,
  opts: {
    transferId: number;
    newStatus: string;
    userId: number;
    lang?: string;
    shippedItems?: Array<{ item_id?: number; product_id?: number; shipped_qty?: number; picked_from_location_id?: number | null }>;
    receivedItems?: Array<{ item_id?: number; product_id?: number; received_qty?: number; damaged_qty?: number; discrepancy_reason?: string }>;
    discrepancyNote?: string;
  }
) {
  const { transferId, newStatus, userId, lang = "tr", shippedItems, receivedItems, discrepancyNote } = opts;

  const transferRes = await client.query("SELECT * FROM stock_transfers WHERE id = $1 FOR UPDATE", [transferId]);
  const transfer = transferRes.rows[0];
  if (!transfer) {
    throw Object.assign(new Error("Transfer bulunamadı"), { statusCode: 404 });
  }
  if (transfer.status === "completed" || transfer.status === "cancelled") {
    throw Object.assign(new Error("Tamamlanmış veya iptal edilmiş transfer değiştirilemez."), { statusCode: 400 });
  }

  const itemsRes = await client.query(
    `SELECT sti.*, COALESCE(sti.product_type, p.product_type, 'product') AS effective_product_type,
            COALESCE(sti.barcode, p.barcode) AS effective_barcode,
            COALESCE(sti.product_name, p.name) AS effective_name
     FROM stock_transfer_items sti
     LEFT JOIN products p ON sti.product_id = p.id
     WHERE sti.transfer_id = $1
     ORDER BY sti.id ASC`,
    [transferId]
  );
  const items = itemsRes.rows;
  const rootStoreId = await getRootStoreId(client, transfer.from_store_id);

  // Helper to ensure sender location rows match products.stock_quantity
  const ensureSenderReconciled = async (productId: number) => {
    await ensureSystemLocationsForStore(client, transfer.from_store_id);
    await reconcileProductDefaultLocation(client, transfer.from_store_id, productId);
  };

  // Helper to release reserved stock for this transfer's items
  const releaseReservations = async () => {
    for (const item of items) {
      if (item.effective_product_type === "service") continue;
      let toRelease = Number(item.requested_qty ?? item.quantity ?? 0);
      if (toRelease <= 0) continue;

      if (item.picked_from_location_id) {
        const resRow = await client.query(
          `SELECT id, reserved_quantity FROM product_location_stocks
           WHERE store_id = $1 AND product_id = $2 AND location_id = $3 AND reserved_quantity > 0`,
          [transfer.from_store_id, item.product_id, item.picked_from_location_id]
        );
        if (resRow.rows.length > 0) {
          const dec = Math.min(Number(resRow.rows[0].reserved_quantity), toRelease);
          await client.query(
            "UPDATE product_location_stocks SET reserved_quantity = GREATEST(0, reserved_quantity - $1) WHERE id = $2",
            [dec, resRow.rows[0].id]
          );
          toRelease -= dec;
        }
      }

      if (toRelease > 0) {
        const rows = await client.query(
          `SELECT id, reserved_quantity FROM product_location_stocks
           WHERE store_id = $1 AND product_id = $2 AND reserved_quantity > 0
           ORDER BY reserved_quantity DESC`,
          [transfer.from_store_id, item.product_id]
        );
        for (const r of rows.rows) {
          if (toRelease <= 0) break;
          const dec = Math.min(Number(r.reserved_quantity), toRelease);
          await client.query(
            "UPDATE product_location_stocks SET reserved_quantity = GREATEST(0, reserved_quantity - $1) WHERE id = $2",
            [dec, r.id]
          );
          toRelease -= dec;
        }
      }
    }
  };

  // --- PREPARING: Reserve pickable stock in sender store/warehouse ---
  if (newStatus === "preparing" && transfer.status !== "preparing") {
    for (const item of items) {
      if (item.effective_product_type === "service") continue;
      await ensureSenderReconciled(Number(item.product_id));
      const reqQty = Number(item.requested_qty ?? item.quantity ?? 0);
      if (reqQty <= 0) continue;

      // Pickable locations ordered by sort_order, STANDARD first then DEFAULT then RECEIVING (Cross-Docking)
      const bins = await client.query(
        `SELECT pls.id, pls.location_id, pls.quantity, pls.reserved_quantity, sl.system_role
         FROM product_location_stocks pls
         JOIN storage_locations sl ON sl.id = pls.location_id
         WHERE pls.store_id = $1 AND pls.product_id = $2
           AND sl.is_pickable = TRUE AND sl.system_role != 'DAMAGED'
           AND (pls.quantity - pls.reserved_quantity) > 0
         ORDER BY (sl.system_role = 'STANDARD') DESC, (sl.system_role = 'DEFAULT') DESC, sl.sort_order ASC, pls.quantity DESC`,
        [transfer.from_store_id, item.product_id]
      );

      const totalAvail = bins.rows.reduce((sum: number, b: any) => sum + Math.max(0, Number(b.quantity) - Number(b.reserved_quantity)), 0);
      if (totalAvail < reqQty) {
        throw Object.assign(
          new Error(
            lang === "tr"
              ? `Yetersiz kullanılabilir stok (Rezerve hariç): ${item.effective_name} (Kullanılabilir: ${totalAvail}, Talep: ${reqQty})`
              : `Insufficient available stock: ${item.effective_name} (Available: ${totalAvail}, Requested: ${reqQty})`
          ),
          { statusCode: 400 }
        );
      }

      let rem = reqQty;
      let primaryPickedLocId: number | null = null;
      for (const b of bins.rows) {
        if (rem <= 0) break;
        const avail = Math.max(0, Number(b.quantity) - Number(b.reserved_quantity));
        const take = Math.min(avail, rem);
        if (take > 0) {
          if (!primaryPickedLocId) primaryPickedLocId = Number(b.location_id);
          await client.query(
            "UPDATE product_location_stocks SET reserved_quantity = reserved_quantity + $1 WHERE id = $2",
            [take, b.id]
          );
          rem -= take;
        }
      }

      if (primaryPickedLocId) {
        await client.query(
          "UPDATE stock_transfer_items SET picked_from_location_id = $1, requested_qty = COALESCE(requested_qty, quantity) WHERE id = $2",
          [primaryPickedLocId, item.id]
        );
      }
    }
  }

  // --- SHIPPED: Deduct stock & release reservation ---
  if (newStatus === "shipped" && transfer.status !== "shipped") {
    const wasPreparing = transfer.status === "preparing";
    const shipMap = new Map<number, any>();
    if (Array.isArray(shippedItems)) {
      for (const si of shippedItems) {
        const key = si.item_id ?? si.id;
        if (key) shipMap.set(Number(key), si);
        else if (si.product_id) shipMap.set(-Number(si.product_id), si);
      }
    }

    for (const item of items) {
      if (item.effective_product_type === "service") continue;
      await ensureSenderReconciled(Number(item.product_id));

      const override = shipMap.get(Number(item.id)) || shipMap.get(-Number(item.product_id));
      const shipQty = override?.shipped_qty !== undefined ? Math.max(0, Number(override.shipped_qty)) : Number(item.requested_qty ?? item.quantity ?? 0);
      const preferredLocId = override?.picked_from_location_id ? Number(override.picked_from_location_id) : (item.picked_from_location_id ? Number(item.picked_from_location_id) : null);

      const prodRes = await client.query(
        "SELECT stock_quantity, name FROM products WHERE id = $1 AND store_id = $2",
        [item.product_id, transfer.from_store_id]
      );
      const prod = prodRes.rows[0];
      if (!prod || Number(prod.stock_quantity || 0) < shipQty) {
        throw Object.assign(
          new Error(
            lang === "tr"
              ? `Yetersiz stok: ${prod?.name || item.effective_name} (Mevcut: ${prod?.stock_quantity || 0}, Sevk: ${shipQty})`
              : `Insufficient stock: ${prod?.name || item.effective_name}`
          ),
          { statusCode: 400 }
        );
      }

      // Deduct from preferred bin (supports Cross-Docking from RECEIVING), then remaining pickable bins
      let rem = shipQty;
      let usedLocId: number | null = preferredLocId;

      const binsRes = await client.query(
        `SELECT pls.id, pls.location_id, pls.quantity, pls.reserved_quantity, sl.system_role
         FROM product_location_stocks pls
         JOIN storage_locations sl ON sl.id = pls.location_id
         WHERE pls.store_id = $1 AND pls.product_id = $2 AND sl.system_role != 'DAMAGED' AND pls.quantity > 0
         ORDER BY (pls.location_id = $3) DESC, (pls.reserved_quantity > 0) DESC, (sl.system_role = 'STANDARD') DESC, sl.sort_order ASC`,
        [transfer.from_store_id, item.product_id, preferredLocId || -1]
      );

      for (const b of binsRes.rows) {
        if (rem <= 0) break;
        const take = Math.min(Number(b.quantity), rem);
        if (take > 0) {
          if (!usedLocId) usedLocId = Number(b.location_id);
          const relRes = wasPreparing ? Math.min(Number(b.reserved_quantity), take) : 0;
          await client.query(
            `UPDATE product_location_stocks
             SET quantity = GREATEST(0, quantity - $1),
                 reserved_quantity = GREATEST(0, reserved_quantity - $2),
                 last_moved_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [take, relRes, b.id]
          );
          await client.query(
            `INSERT INTO stock_location_movements (
              root_store_id, store_id, product_id, variant_key, from_location_id, to_location_id,
              quantity, movement_type, reference_type, reference_id, note, performed_by
            ) VALUES ($1, $2, $3, $4, $5, NULL, $6, 'BRANCH_TRANSFER_OUT', 'TRANSFER', $7, $8, $9)`,
            [
              rootStoreId,
              transfer.from_store_id,
              item.product_id,
              item.variant_key || "",
              b.location_id,
              take,
              transferId,
              `Sevkiyat Çıkışı #${transferId}${b.system_role === "RECEIVING" ? " (Cross-Docking)" : ""}`,
              userId
            ]
          );
          rem -= take;
        }
      }

      // If wasPreparing and requested > shipped, release remaining reservation
      if (wasPreparing && Number(item.requested_qty ?? item.quantity) > shipQty) {
        let extraRes = Number(item.requested_qty ?? item.quantity) - shipQty;
        const rRows = await client.query(
          "SELECT id, reserved_quantity FROM product_location_stocks WHERE store_id = $1 AND product_id = $2 AND reserved_quantity > 0",
          [transfer.from_store_id, item.product_id]
        );
        for (const rr of rRows.rows) {
          if (extraRes <= 0) break;
          const dec = Math.min(Number(rr.reserved_quantity), extraRes);
          await client.query("UPDATE product_location_stocks SET reserved_quantity = GREATEST(0, reserved_quantity - $1) WHERE id = $2", [dec, rr.id]);
          extraRes -= dec;
        }
      }

      await client.query(
        `UPDATE stock_transfer_items SET shipped_qty = $1, picked_from_location_id = COALESCE($2, picked_from_location_id) WHERE id = $3`,
        [shipQty, usedLocId, item.id]
      );

      await syncProductTotalFromLocations(client, transfer.from_store_id, Number(item.product_id));
      await addStockMovement(
        client,
        transfer.from_store_id,
        item.product_id,
        "out",
        shipQty,
        "transfer",
        `Transfer Sevk Edildi (ID: ${transferId}) - Alıcı Mağaza ID: ${transfer.to_store_id}`
      );
    }
  }

  // --- COMPLETED: Receive stock in target store/warehouse (supports partial & damaged discrepancy) ---
  let anyDiscrepancy = false;
  if (newStatus === "completed" && transfer.status !== "completed") {
    const wasShipped = transfer.status === "shipped";
    const recMap = new Map<number, any>();
    if (Array.isArray(receivedItems)) {
      for (const ri of receivedItems) {
        const key = ri.item_id ?? ri.id;
        if (key) recMap.set(Number(key), ri);
        else if (ri.product_id) recMap.set(-Number(ri.product_id), ri);
      }
    }

    for (const item of items) {
      if (item.effective_product_type === "service") continue;

      const expectedShipped = Number(item.shipped_qty ?? item.requested_qty ?? item.quantity ?? 0);

      // If transitioning directly without prior 'shipped' step, deduct from sender now
      if (!wasShipped) {
        await ensureSenderReconciled(Number(item.product_id));
        const prodRes = await client.query("SELECT stock_quantity, name FROM products WHERE id = $1 AND store_id = $2", [item.product_id, transfer.from_store_id]);
        const prod = prodRes.rows[0];
        if (!prod || Number(prod.stock_quantity || 0) < expectedShipped) {
          throw Object.assign(new Error(`Yetersiz stok: ${prod?.name || item.effective_name}`), { statusCode: 400 });
        }
        let rem = expectedShipped;
        const binsRes = await client.query(
          `SELECT pls.id, pls.location_id, pls.quantity, pls.reserved_quantity
           FROM product_location_stocks pls
           JOIN storage_locations sl ON sl.id = pls.location_id
           WHERE pls.store_id = $1 AND pls.product_id = $2 AND sl.system_role != 'DAMAGED' AND pls.quantity > 0
           ORDER BY (pls.reserved_quantity > 0) DESC, (sl.system_role = 'STANDARD') DESC, sl.sort_order ASC`,
          [transfer.from_store_id, item.product_id]
        );
        for (const b of binsRes.rows) {
          if (rem <= 0) break;
          const take = Math.min(Number(b.quantity), rem);
          const rel = transfer.status === "preparing" ? Math.min(Number(b.reserved_quantity), take) : 0;
          await client.query(
            "UPDATE product_location_stocks SET quantity = GREATEST(0, quantity - $1), reserved_quantity = GREATEST(0, reserved_quantity - $2), last_moved_at = CURRENT_TIMESTAMP WHERE id = $3",
            [take, rel, b.id]
          );
          await client.query(
            `INSERT INTO stock_location_movements (root_store_id, store_id, product_id, variant_key, from_location_id, quantity, movement_type, reference_type, reference_id, note, performed_by)
             VALUES ($1, $2, $3, $4, $5, $6, 'BRANCH_TRANSFER_OUT', 'TRANSFER', $7, $8, $9)`,
            [rootStoreId, transfer.from_store_id, item.product_id, item.variant_key || "", b.location_id, take, transferId, `Transfer Çıkışı #${transferId}`, userId]
          );
          rem -= take;
        }
        await syncProductTotalFromLocations(client, transfer.from_store_id, Number(item.product_id));
        await addStockMovement(client, transfer.from_store_id, item.product_id, "out", expectedShipped, "transfer", `Transfer Tamamlandı (ID: ${transferId}) - Alıcı Mağaza ID: ${transfer.to_store_id}`);
      }

      const recOverride = recMap.get(Number(item.id)) || recMap.get(-Number(item.product_id));
      const receivedQty = recOverride?.received_qty !== undefined ? Math.max(0, Number(recOverride.received_qty)) : expectedShipped;
      const damagedQty = recOverride?.damaged_qty !== undefined ? Math.max(0, Number(recOverride.damaged_qty)) : 0;
      const discReason = recOverride?.discrepancy_reason ? String(recOverride.discrepancy_reason).trim() : null;

      if (Math.abs(receivedQty - expectedShipped) > 0.0001 || damagedQty > 0) {
        anyDiscrepancy = true;
      }

      // Find or create product in receiver store (resolve barcode reliably from sender product)
      const senderProductRes = await client.query("SELECT * FROM products WHERE id = $1", [item.product_id]);
      const sp = senderProductRes.rows[0];
      const lookupBarcode = String(item.effective_barcode || sp?.barcode || "").trim();

      let receiverProductRes = lookupBarcode
        ? await client.query(
            "SELECT id FROM products WHERE store_id = $1 AND TRIM(barcode) = $2 LIMIT 1",
            [transfer.to_store_id, lookupBarcode]
          )
        : { rows: [] as any[] };

      if (receiverProductRes.rows.length === 0 && sp?.name) {
        receiverProductRes = await client.query(
          "SELECT id FROM products WHERE store_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) LIMIT 1",
          [transfer.to_store_id, sp.name]
        );
      }

      let receiverProductId: number;
      if (receiverProductRes.rows.length > 0) {
        receiverProductId = Number(receiverProductRes.rows[0].id);
        await reconcileProductDefaultLocation(client, transfer.to_store_id, receiverProductId);
      } else {
        const newProductRes = await client.query(
          `INSERT INTO products (store_id, barcode, name, price, currency, cost_price, cost_currency, tax_rate, description, stock_quantity, unit, category, is_web_sale, product_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12, $13) RETURNING id`,
          [transfer.to_store_id, sp.barcode, sp.name, sp.price, sp.currency, sp.cost_price, sp.cost_currency, sp.tax_rate, sp.description, sp.unit, sp.category, sp.is_web_sale, sp.product_type]
        );
        receiverProductId = Number(newProductRes.rows[0].id);
      }

      await recordInboundToStore(client, {
        storeId: transfer.to_store_id,
        productId: receiverProductId,
        variantKey: item.variant_key || "",
        quantity: receivedQty,
        damagedQty,
        movementType: "BRANCH_TRANSFER_IN",
        referenceType: "TRANSFER",
        referenceId: transferId,
        reason: discReason,
        note: `Transfer Teslim Alındı #${transferId}${discReason ? ` (${discReason})` : ""}`,
        performedBy: userId
      });

      await client.query(
        `UPDATE stock_transfer_items
         SET shipped_qty = COALESCE(shipped_qty, $1),
             received_qty = $2,
             damaged_qty = $3,
             discrepancy_reason = $4
         WHERE id = $5`,
        [expectedShipped, receivedQty, damagedQty, discReason, item.id]
      );

      if (receivedQty > 0) {
        await addStockMovement(
          client,
          transfer.to_store_id,
          receiverProductId,
          "in",
          receivedQty,
          "transfer",
          `Transfer Tamamlandı (ID: ${transferId}) - Gönderen Mağaza ID: ${transfer.from_store_id}`
        );
      }
    }
  }

  // --- CANCELLED: Release reservations if preparing, or return stock if shipped ---
  if (newStatus === "cancelled") {
    if (transfer.status === "preparing") {
      await releaseReservations();
    } else if (transfer.status === "shipped") {
      for (const item of items) {
        if (item.effective_product_type === "service") continue;
        const restoreQty = Number(item.shipped_qty ?? item.quantity ?? 0);
        if (restoreQty <= 0) continue;
        const targetLocId = item.picked_from_location_id
          ? Number(item.picked_from_location_id)
          : await getSystemLocationId(client, transfer.from_store_id, "DEFAULT");
        await client.query(
          `INSERT INTO product_location_stocks (root_store_id, store_id, product_id, variant_key, location_id, quantity, last_moved_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
           ON CONFLICT (root_store_id, product_id, variant_key, location_id)
           DO UPDATE SET quantity = product_location_stocks.quantity + EXCLUDED.quantity, last_moved_at = CURRENT_TIMESTAMP`,
          [rootStoreId, transfer.from_store_id, item.product_id, item.variant_key || "", targetLocId, restoreQty]
        );
        await client.query(
          `INSERT INTO stock_location_movements (root_store_id, store_id, product_id, variant_key, to_location_id, quantity, movement_type, reference_type, reference_id, note, performed_by)
           VALUES ($1, $2, $3, $4, $5, $6, 'INBOUND', 'TRANSFER_CANCEL', $7, $8, $9)`,
          [rootStoreId, transfer.from_store_id, item.product_id, item.variant_key || "", targetLocId, restoreQty, transferId, `Transfer İptali İadesi #${transferId}`, userId]
        );
        await syncProductTotalFromLocations(client, transfer.from_store_id, Number(item.product_id));
        await addStockMovement(client, transfer.from_store_id, item.product_id, "in", restoreQty, "transfer", `Transfer İptal Edildi (ID: ${transferId}) - Stok İade Edildi`);
      }
    }
  }

  // Update transfer header row
  const sets = ["status = $1", "updated_at = CURRENT_TIMESTAMP"];
  const params: any[] = [newStatus, transferId];
  let idx = 3;

  if (newStatus === "preparing") {
    sets.push(`prepared_by = $${idx++}`);
    params.push(userId);
  } else if (newStatus === "shipped") {
    sets.push(`shipped_by = $${idx++}`);
    params.push(userId);
  } else if (newStatus === "completed") {
    sets.push(`received_by = $${idx++}`);
    params.push(userId);
    sets.push(`received_at = CURRENT_TIMESTAMP`);
    if (anyDiscrepancy) {
      sets.push(`has_discrepancy = TRUE`);
    }
    if (discrepancyNote) {
      sets.push(`discrepancy_note = $${idx++}`);
      params.push(discrepancyNote);
    }
  }

  await client.query(`UPDATE stock_transfers SET ${sets.join(", ")} WHERE id = $2`, params);
  return { success: true, has_discrepancy: anyDiscrepancy };
}

/**
 * Computes online/marketplace available stock across a store family respecting:
 * - DAMAGED exclusion
 * - reserved_quantity deduction
 * - WAREHOUSE include_in_online_stock & sell_receiving_stock flags
 */
export async function getOnlineAvailableStockForProduct(
  client: PoolClient | typeof pool,
  rootStoreId: number,
  barcode: string
): Promise<{ total_available: number; by_store: Array<{ store_id: number; name: string; branch_type: string; available: number }> }> {
  const res = await client.query(
    `SELECT s.id AS store_id, s.name, COALESCE(s.branch_type, 'STORE') AS branch_type,
            COALESCE(s.include_in_online_stock, FALSE) AS include_in_online_stock,
            COALESCE(s.sell_receiving_stock, FALSE) AS sell_receiving_stock,
            COALESCE(p.stock_quantity, 0) AS raw_stock,
            COALESCE((
              SELECT SUM(GREATEST(0, pls.quantity - pls.reserved_quantity))
              FROM product_location_stocks pls
              JOIN storage_locations sl ON sl.id = pls.location_id
              WHERE pls.store_id = s.id AND pls.product_id = p.id
                AND sl.system_role != 'DAMAGED'
                AND (sl.system_role != 'RECEIVING' OR COALESCE(s.sell_receiving_stock, FALSE) = TRUE)
            ), 0) AS loc_avail,
            EXISTS(SELECT 1 FROM product_location_stocks pls2 WHERE pls2.store_id = s.id AND pls2.product_id = p.id) AS has_loc_rows
     FROM stores s
     JOIN products p ON p.store_id = s.id AND TRIM(p.barcode) = TRIM($2)
     WHERE s.id = $1 OR s.parent_id = $1`,
    [rootStoreId, barcode]
  );

  let total = 0;
  const byStore = res.rows.map((r: any) => {
    const isWh = r.branch_type === "WAREHOUSE";
    const eligible = !isWh || Boolean(r.include_in_online_stock);
    const avail = eligible ? (r.has_loc_rows ? Number(r.loc_avail) : Math.max(0, Number(r.raw_stock))) : 0;
    total += avail;
    return {
      store_id: Number(r.store_id),
      name: r.name,
      branch_type: r.branch_type,
      available: avail
    };
  });

  return { total_available: total, by_store: byStore };
}
