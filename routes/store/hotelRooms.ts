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

export default router;
