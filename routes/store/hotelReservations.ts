import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

// GET /api/store/hotel-reservations
router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const { status } = req.query;
    let query = "SELECT * FROM hotel_reservations WHERE store_id = $1";
    const params: any[] = [storeId];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error("Error fetching hotel reservations:", err);
    res.status(500).json({ error: err.message || "Failed to fetch reservations" });
  }
});

// PATCH /api/store/hotel-reservations/:id
router.patch("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;
  const { status, notes, special_requests, details, room_id, room_number } = req.body;

  try {
    const existing = await pool.query(
      "SELECT * FROM hotel_reservations WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    const updated = await pool.query(
      `UPDATE hotel_reservations
       SET status = COALESCE($1, status),
           special_requests = COALESCE($2, special_requests),
           details = COALESCE($3, details),
           room_id = COALESCE($4, room_id),
           room_number = COALESCE($5, room_number),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND store_id = $7
       RETURNING *`,
      [
        status || null,
        special_requests || null,
        details ? JSON.stringify(details) : null,
        room_id || null,
        room_number || null,
        id,
        storeId
      ]
    );

    res.json(updated.rows[0]);
  } catch (err: any) {
    console.error("Error updating hotel reservation:", err);
    res.status(500).json({ error: err.message || "Failed to update reservation" });
  }
});

// DELETE /api/store/hotel-reservations/:id
router.delete("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;

  try {
    await pool.query(
      "DELETE FROM hotel_reservations WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting hotel reservation:", err);
    res.status(500).json({ error: err.message || "Failed to delete reservation" });
  }
});

export default router;
