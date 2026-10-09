import express from "express";
import { pool } from "../../models/db";
import { getAuthorizedStoreId } from "./utils";
import { cleanDeepBase64 } from "../utils/imageStorage";
import { publicApiCache } from "../public";

const router = express.Router();

// GET /api/store/hotel-rooms
router.get("/", async (req: any, res) => {
  try {
    const reqStoreId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;
    const targetStoreId = await getAuthorizedStoreId(req, reqStoreId);
    if (!targetStoreId) {
      return res.status(403).json({ error: "Unauthorized store access" });
    }

    const storeRes = await pool.query(
      "SELECT branding, name, slug FROM stores WHERE id = $1",
      [targetStoreId]
    );

    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    let branding = storeRes.rows[0].branding || {};
    if (typeof branding === "string") {
      try {
        branding = JSON.parse(branding);
      } catch (e) {
        branding = {};
      }
    }

    const rooms = Array.isArray(branding.hotel_rooms) ? branding.hotel_rooms : [];
    return res.json({ success: true, rooms });
  } catch (err: any) {
    console.error("Error in GET /api/store/hotel-rooms:", err);
    return res.status(500).json({ error: err.message || "Failed to fetch hotel rooms" });
  }
});

// POST /api/store/hotel-rooms
router.post("/", async (req: any, res) => {
  try {
    const reqStoreId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;
    const targetStoreId = await getAuthorizedStoreId(req, reqStoreId);
    if (!targetStoreId) {
      return res.status(403).json({ error: "Unauthorized store access" });
    }

    const { rooms } = req.body;
    if (!Array.isArray(rooms)) {
      return res.status(400).json({ error: "Rooms array is required" });
    }

    const storeRes = await pool.query(
      "SELECT branding, slug, custom_domain FROM stores WHERE id = $1",
      [targetStoreId]
    );

    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    let branding = storeRes.rows[0].branding || {};
    if (typeof branding === "string") {
      try {
        branding = JSON.parse(branding);
      } catch (e) {
        branding = {};
      }
    }

    // Clean base64 in room objects
    const cleanedRooms = await cleanDeepBase64(rooms, `store_${targetStoreId}_rooms`);

    branding.hotel_rooms = cleanedRooms;

    await pool.query(
      "UPDATE stores SET branding = $1 WHERE id = $2",
      [JSON.stringify(branding), targetStoreId]
    );

    // Invalidate public caches immediately
    try {
      const sSlug = storeRes.rows[0].slug;
      const sCustomDomain = storeRes.rows[0].custom_domain;
      publicApiCache.del(`store_${targetStoreId}`);
      if (sSlug) {
        publicApiCache.del(`store_${sSlug.toLowerCase()}`);
        publicApiCache.del(`products_${sSlug.toLowerCase()}`);
      }
      if (sCustomDomain) {
        publicApiCache.del(`domain_${sCustomDomain.toLowerCase()}`);
      }
      publicApiCache.del("enrakipsiz_portal");
    } catch (cacheErr) {
      console.warn("Failed to invalidate cache for hotel rooms:", cacheErr);
    }

    return res.json({ success: true, rooms: cleanedRooms });
  } catch (err: any) {
    console.error("Error in POST /api/store/hotel-rooms:", err);
    return res.status(500).json({ error: err.message || "Failed to update hotel rooms" });
  }
});

// POST /api/store/hotel-rooms/payment
router.post("/payment", async (req: any, res) => {
  const client = await pool.connect();
  try {
    const reqStoreId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;
    const targetStoreId = await getAuthorizedStoreId(req, reqStoreId);
    if (!targetStoreId) {
      return res.status(403).json({ error: "Unauthorized store access" });
    }

    const { 
      roomNumber, 
      boardType, 
      amount, 
      currency, 
      paymentMethod, 
      guestName, 
      paymentType,
      exchangeRate 
    } = req.body;

    if (!roomNumber || amount === undefined || amount === null) {
      return res.status(400).json({ error: "Room number and amount are required" });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.json({ success: true, message: "No payment recorded (amount is 0 or negative)" });
    }

    const finalCurrency = currency || 'TRY';
    const finalMethod = paymentMethod || 'cash';
    const finalGuestName = guestName || 'Misafir';
    const finalExchangeRate = Number(exchangeRate) || 1;

    await client.query("BEGIN");

    const typeLabel = paymentType === 'check_in_advance' ? 'Giriş Ön Ödemesi' : 'Çıkış Tahsilatı';
    const notes = `Otel Oda Ödemesi - Oda: ${roomNumber}, Misafir: ${finalGuestName}, Pansiyon: ${boardType || 'Sadece Oda'} (${typeLabel})`;
    
    const saleRes = await client.query(
      `INSERT INTO sales (
        store_id, total_amount, currency, exchange_rate, status, 
        customer_name, payment_method, notes, source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        targetStoreId, 
        numericAmount, 
        finalCurrency, 
        finalExchangeRate, 
        'completed', 
        `Oda ${roomNumber} - ${finalGuestName}`, 
        finalMethod, 
        notes, 
        'hotel'
      ]
    );
    const saleId = saleRes.rows[0].id;

    const pName = `Oda ${roomNumber} Konaklama Ödemesi (${boardType || 'RO'})`;
    await client.query(
      `INSERT INTO sale_items (
        sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        saleId, 
        null, 
        pName, 
        '', 
        1, 
        numericAmount, 
        numericAmount, 
        finalCurrency
      ]
    );

    await client.query(
      `INSERT INTO sale_payments (
        sale_id, payment_method, amount
      ) VALUES ($1, $2, $3)`,
      [
        saleId, 
        finalMethod, 
        numericAmount
      ]
    );

    await client.query("COMMIT");

    return res.json({ success: true, saleId });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error in POST /api/store/hotel-rooms/payment:", err);
    return res.status(500).json({ error: err.message || "Failed to record hotel payment" });
  } finally {
    client.release();
  }
});

export default router;
