import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

// --- Notifications & Alerts ---

router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const transfersCount = await pool.query(
      `SELECT COUNT(*) FROM stock_transfers 
       WHERE (to_store_id = $1 AND status = 'shipped')
          OR (from_store_id = $1 AND status IN ('pending', 'accepted', 'preparing'))`,
      [storeId]
    );

    const serviceCount = await pool.query(
      "SELECT COUNT(*) FROM service_records WHERE store_id = $1 AND status = 'received'",
      [storeId]
    );

    const quotationsCount = await pool.query(
      "SELECT COUNT(*) FROM quotations WHERE store_id = $1 AND status = 'pending'",
      [storeId]
    );

    const salesCount = await pool.query(
      "SELECT COUNT(*) FROM sales WHERE store_id = $1 AND status = 'pending' AND status != 'checkout_initiated'",
      [storeId]
    );

    const expiringDocsCount = await pool.query(
      `SELECT COUNT(*) FROM vehicle_documents vd
       JOIN vehicles v ON vd.vehicle_id = v.id
       WHERE v.store_id = $1 AND vd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND vd.expiry_date >= CURRENT_DATE`,
      [storeId]
    );

    const maintenanceDueCount = await pool.query(
      `SELECT COUNT(*) FROM vehicle_maintenance vm
       JOIN vehicles v ON vm.vehicle_id = v.id
       WHERE v.store_id = $1 
       AND vm.status = 'scheduled'
       AND (vm.next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days' OR (v.current_mileage >= vm.next_maintenance_mileage - 1000 AND vm.next_maintenance_mileage > 0))`,
      [storeId]
    );

    const salesInvoicesCount = await pool.query(
      `SELECT COUNT(*) FROM sales_invoices 
       WHERE store_id = $1 AND integration_status IN ('REJECTED', 'Hata', 'İptal', 'İptal Edildi', 'Hatalı', 'CANCELLED')`,
      [storeId]
    );

    const purchaseInvoicesCount = await pool.query(
      `SELECT COUNT(*) FROM purchase_invoices 
       WHERE store_id = $1 AND is_read = false`,
      [storeId]
    );

    res.json({
      transfers: parseInt(transfersCount.rows[0].count),
      service: parseInt(serviceCount.rows[0].count),
      quotations: parseInt(quotationsCount.rows[0].count),
      sales: parseInt(salesCount.rows[0].count),
      fleet: parseInt(expiringDocsCount.rows[0].count) + parseInt(maintenanceDueCount.rows[0].count),
      sales_invoices: parseInt(salesInvoicesCount.rows[0].count),
      purchase_invoices: parseInt(purchaseInvoicesCount.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.get("/list", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query(
      "SELECT * FROM notifications WHERE store_id = $1 ORDER BY created_at DESC LIMIT 50",
      [storeId]
    );
    res.json(result.rows);
  } catch (e: any) {
    res.json([]);
  }
});

export default router;
