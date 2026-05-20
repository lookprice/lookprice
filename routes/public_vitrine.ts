import express from 'express';
import { pool } from '../models/db';

const router = express.Router();

// Vitrine route - serves specific store vitrine based on slug or ID
router.get('/:storeIdentifier', async (req, res) => {
  const { storeIdentifier } = req.params;
  try {
    // 1. Find store
    const storeRes = await pool.query(
      "SELECT id, name, slug FROM stores WHERE slug = $1 OR id::text = $1",
      [storeIdentifier]
    );
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    const store = storeRes.rows[0];

    // 2. Fetch properties and vehicles
    const propertiesRes = await pool.query(
      "SELECT * FROM real_estate_properties WHERE store_id = $1 AND status = 'active'",
      [store.id]
    );
    
    // Assuming vehicles table exists
    const vehiclesRes = await pool.query(
      "SELECT * FROM vehicles WHERE store_id = $1 AND status = 'for_sale'",
      [store.id]
    );

    res.json({
      store,
      properties: propertiesRes.rows,
      vehicles: vehiclesRes.rows
    });
  } catch (error) {
    console.error('Error fetching vitrine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
