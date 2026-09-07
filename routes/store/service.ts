import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

// --- Technical Service ---

router.get("/records", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  const result = await pool.query("SELECT * FROM service_records WHERE store_id = $1 ORDER BY created_at DESC", [storeId]);
  res.json(result.rows);
});

router.get("/records/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  const { id } = req.params;
  const recordRes = await pool.query("SELECT * FROM service_records WHERE id = $1 AND store_id = $2", [id, storeId]);
  if (recordRes.rows.length === 0) return res.status(404).json({ error: "Service record not found" });
  const itemsRes = await pool.query("SELECT * FROM service_items WHERE service_id = $1", [id]);
  res.json({ ...recordRes.rows[0], items: itemsRes.rows });
});

router.post("/records", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  const { customer_name, customer_phone, device_model, device_serial, issue_description, notes, items, currency } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const recordRes = await client.query(
      "INSERT INTO service_records (store_id, customer_name, customer_phone, device_model, device_serial, issue_description, notes, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      [storeId, customer_name, customer_phone, device_model, device_serial, issue_description, notes, currency || 'TRY']
    );
    const serviceId = recordRes.rows[0].id;
    let totalAmount = 0;
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await client.query(
          "INSERT INTO service_items (service_id, product_id, item_name, quantity, unit_price, tax_rate, total_price, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [serviceId, item.product_id, item.item_name, item.quantity, item.unit_price, item.tax_rate, item.total_price, item.type]
        );
        totalAmount += Number(item.total_price);
      }
    }
    await client.query("UPDATE service_records SET total_amount = $1 WHERE id = $2", [totalAmount, serviceId]);
    await client.query("COMMIT");
    res.json({ success: true, id: serviceId });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.put("/records/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  const { id } = req.params;
  const { customer_name, customer_phone, device_model, device_serial, issue_description, notes, status, items, currency } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE service_records SET customer_name = $1, customer_phone = $2, device_model = $3, device_serial = $4, issue_description = $5, notes = $6, status = $7, currency = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 AND store_id = $10",
      [customer_name, customer_phone, device_model, device_serial, issue_description, notes, status, currency || 'TRY', id, storeId]
    );
    let totalAmount = 0;
    if (items && Array.isArray(items)) {
      await client.query("DELETE FROM service_items WHERE service_id = $1", [id]);
      for (const item of items) {
        await client.query(
          "INSERT INTO service_items (service_id, product_id, item_name, quantity, unit_price, tax_rate, total_price, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [id, item.product_id, item.item_name, item.quantity, item.unit_price, item.tax_rate, item.total_price, item.type]
        );
        totalAmount += Number(item.total_price);
      }
    }
    await client.query("UPDATE service_records SET total_amount = $1 WHERE id = $2", [totalAmount, id]);

    if (status === 'waiting_approval') {
      const serviceRes = await client.query("SELECT quotation_id, customer_name, customer_phone, total_amount, currency, device_model FROM service_records WHERE id = $1", [id]);
      const service = serviceRes.rows[0];
      
      if (!service.quotation_id) {
        const quotRes = await client.query(
          "INSERT INTO quotations (store_id, customer_name, total_amount, currency, status, notes, service_id) VALUES ($1, $2, $3, $4, 'pending', $5, $6) RETURNING id",
          [storeId, service.customer_name, totalAmount, service.currency || 'TRY', `Teknik Servis #\${id} - \${service.device_model}`, id]
        );
        const quotationId = quotRes.rows[0].id;

        const serviceItemsRes = await client.query("SELECT * FROM service_items WHERE service_id = $1", [id]);
        for (const item of serviceItemsRes.rows) {
          await client.query(
            "INSERT INTO quotation_items (quotation_id, product_id, product_name, quantity, unit_price, tax_rate, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [quotationId, item.product_id, item.item_name, item.quantity, item.unit_price, item.tax_rate, item.total_price]
          );
        }

        await client.query("UPDATE service_records SET quotation_id = $1 WHERE id = $2", [quotationId, id]);
      }
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.delete("/records/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  await pool.query("DELETE FROM service_records WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
  res.json({ success: true });
});

export default router;
