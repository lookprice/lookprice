import express from 'express';
import { pool } from '../models/db';
import { authenticate } from '../middleware/auth';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Self-Healing database schema updates for real estate properties
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS real_estate_properties (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id),
        title TEXT,
        description TEXT,
        price NUMERIC,
        currency TEXT,
        location TEXT,
        type TEXT,
        room_count TEXT,
        square_meters NUMERIC,
        sqm_gross NUMERIC,
        block_plot TEXT,
        facade TEXT,
        building_age TEXT,
        floor TEXT,
        total_floors TEXT,
        heating TEXT,
        furnished BOOLEAN,
        in_gated_community BOOLEAN,
        dues NUMERIC,
        dues_currency TEXT,
        country TEXT,
        kktc_region TEXT,
        kktc_title_type TEXT,
        images TEXT[],
        virtual_tour_url TEXT,
        ai_tour_enabled BOOLEAN DEFAULT FALSE,
        seller_type TEXT DEFAULT 'professional',
        is_verified BOOLEAN DEFAULT FALSE,
        verification_status TEXT DEFAULT 'none',
        status TEXT DEFAULT 'active',
        documents JSONB,
        is_on_enrakipsiz BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS is_on_enrakipsiz BOOLEAN DEFAULT FALSE;`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS branch_name TEXT DEFAULT 'Merkez Ofis';`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS responsible_agent TEXT DEFAULT '';`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS sharing_scope TEXT DEFAULT 'shared_pool';`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS reserved_by_branch TEXT DEFAULT '';`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS reservation_notes TEXT DEFAULT '';`);
    console.log("Real estate table verification processed.");
  } catch (error) {
    console.error("Real estate table error:", error);
  }
})();

// Basic GET route to list properties
router.get('/properties', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.body.store_id || req.user.store_id;
  try {
    const result = await pool.query(
      `SELECT * FROM real_estate_properties WHERE store_id = $1 ORDER BY created_at DESC`,
      [storeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST route to add a property
router.post('/properties', authenticate, async (req: any, res) => {
  const storeId = req.body.store_id || req.query.store_id || req.user.store_id;
  const property = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO real_estate_properties (
        store_id, title, description, price, currency, location, type, room_count, square_meters, 
        sqm_gross, block_plot, facade, building_age, floor, total_floors, heating, furnished, 
        in_gated_community, dues, dues_currency, country, kktc_region, kktc_title_type, images, 
        virtual_tour_url, ai_tour_enabled, seller_type, status, is_on_enrakipsiz,
        branch_name, responsible_agent, sharing_scope, reserved_by_branch, reservation_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34) RETURNING *`,
      [
        storeId, property.title, property.description, property.price, property.currency, property.location, property.type, property.room_count, property.square_meters,
        property.sqm_gross, property.block_plot, property.facade, property.building_age, property.floor, property.total_floors, property.heating, property.furnished,
        property.in_gated_community, property.dues, property.dues_currency, property.country, property.kktc_region, property.kktc_title_type, property.images,
        property.virtual_tour_url, property.ai_tour_enabled, property.seller_type, property.status, !!property.is_on_enrakipsiz,
        property.branch_name || 'Merkez Ofis', property.responsible_agent || '', property.sharing_scope || 'shared_pool', property.reserved_by_branch || '', property.reservation_notes || ''
      ]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding property:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// PUT route to update a property
router.put('/properties/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const property = req.body;
  const storeId = req.body.store_id || req.query.store_id || req.user.store_id;

  try {
    const result = await pool.query(
      `UPDATE real_estate_properties SET 
        title = $1, description = $2, price = $3, currency = $4, location = $5, type = $6, room_count = $7, square_meters = $8,
        sqm_gross = $9, block_plot = $10, facade = $11, building_age = $12, floor = $13, total_floors = $14, heating = $15, furnished = $16,
        in_gated_community = $17, dues = $18, dues_currency = $19, country = $20, kktc_region = $21, kktc_title_type = $22, images = $23,
        virtual_tour_url = $24, ai_tour_enabled = $25, seller_type = $26, status = $27, is_on_enrakipsiz = $28,
        branch_name = $29, responsible_agent = $30, sharing_scope = $31, reserved_by_branch = $32, reservation_notes = $33, updated_at = CURRENT_TIMESTAMP
       WHERE id = $34 AND store_id = $35 RETURNING *`,
      [
        property.title, property.description, property.price, property.currency, property.location, property.type, property.room_count, property.square_meters,
        property.sqm_gross, property.block_plot, property.facade, property.building_age, property.floor, property.total_floors, property.heating, property.furnished,
        property.in_gated_community, property.dues, property.dues_currency, property.country, property.kktc_region, property.kktc_title_type, property.images,
        property.virtual_tour_url, property.ai_tour_enabled, property.seller_type, property.status, !!property.is_on_enrakipsiz,
        property.branch_name || 'Merkez Ofis', property.responsible_agent || '', property.sharing_scope || 'shared_pool', property.reserved_by_branch || '', property.reservation_notes || '', id, storeId
      ]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// DELETE route
router.delete('/properties/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.query.store_id || req.body.store_id || req.user.store_id;

  try {
    const result = await pool.query(
      `DELETE FROM real_estate_properties WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json({ message: 'Property deleted' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
