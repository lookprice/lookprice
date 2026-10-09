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
  const { 
    status, 
    notes, 
    special_requests, 
    details, 
    room_id, 
    room_number,
    room_type,
    guest_first_name,
    guest_last_name,
    guest_identity_no,
    guest_phone,
    guest_email,
    check_in_date,
    check_out_date,
    nights,
    board_type,
    board_name,
    adults_count,
    children_count,
    total_amount
  } = req.body;

  try {
    const existing = await pool.query(
      "SELECT * FROM hotel_reservations WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    const computedGuestName = (guest_first_name !== undefined || guest_last_name !== undefined)
      ? `${guest_first_name ?? existing.rows[0].guest_first_name ?? ''} ${guest_last_name ?? existing.rows[0].guest_last_name ?? ''}`.trim()
      : null;

    const updated = await pool.query(
      `UPDATE hotel_reservations
       SET status = COALESCE($1, status),
           special_requests = COALESCE($2, special_requests),
           details = COALESCE($3, details),
           room_id = COALESCE($4, room_id),
           room_number = COALESCE($5, room_number),
           room_type = COALESCE($6, room_type),
           guest_first_name = COALESCE($7, guest_first_name),
           guest_last_name = COALESCE($8, guest_last_name),
           guest_identity_no = COALESCE($9, guest_identity_no),
           guest_phone = COALESCE($10, guest_phone),
           guest_email = COALESCE($11, guest_email),
           guest_name = COALESCE($12, guest_name),
           check_in_date = COALESCE($13, check_in_date),
           check_out_date = COALESCE($14, check_out_date),
           nights = COALESCE($15, nights),
           board_type = COALESCE($16, board_type),
           board_name = COALESCE($17, board_name),
           adults_count = COALESCE($18, adults_count),
           children_count = COALESCE($19, children_count),
           total_amount = COALESCE($20, total_amount),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $21 AND store_id = $22
       RETURNING *`,
      [
        status || null,
        special_requests || notes || null,
        details ? JSON.stringify(details) : null,
        room_id || null,
        room_number || null,
        room_type || null,
        guest_first_name !== undefined ? (guest_first_name || null) : null,
        guest_last_name !== undefined ? (guest_last_name || null) : null,
        guest_identity_no !== undefined ? (guest_identity_no || null) : null,
        guest_phone !== undefined ? (guest_phone || null) : null,
        guest_email !== undefined ? (guest_email || null) : null,
        computedGuestName || null,
        check_in_date || null,
        check_out_date || null,
        nights ? Number(nights) : null,
        board_type || null,
        board_name || null,
        adults_count ? Number(adults_count) : null,
        children_count !== undefined ? Number(children_count) : null,
        total_amount ? Number(total_amount) : null,
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
