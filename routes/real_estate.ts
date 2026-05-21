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
        listing_features TEXT[],
        status TEXT DEFAULT 'active',
        documents JSONB,
        commission_rate NUMERIC,
        listing_agent_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS real_estate_owners (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id),
        name TEXT,
        phone TEXT,
        email TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS real_estate_activities (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id),
        type TEXT,
        title TEXT,
        detail TEXT,
        agent TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS real_estate_agents (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id),
        name TEXT,
        phone TEXT,
        status TEXT DEFAULT 'active',
        listing_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS real_estate_leads (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id),
        customer_name TEXT,
        customer_phone TEXT,
        source TEXT,
        status TEXT DEFAULT 'new',
        property_title TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='real_estate_properties' AND column_name='commission_rate') THEN
          ALTER TABLE real_estate_properties ADD COLUMN commission_rate NUMERIC;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='real_estate_properties' AND column_name='listing_agent_name') THEN
          ALTER TABLE real_estate_properties ADD COLUMN listing_agent_name TEXT;
        END IF;
      END $$;
    `);
    console.log("Real estate table verification processed.");
  } catch (error) {
    console.error("Real estate table error:", error);
  }
})();

// Basic GET route to list properties
router.get('/properties', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
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
  const storeId = req.user.store_id;
  const property = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO real_estate_properties (
        store_id, title, description, price, currency, location, type, room_count, square_meters, 
        sqm_gross, block_plot, facade, building_age, floor, total_floors, heating, furnished, 
        in_gated_community, dues, dues_currency, country, kktc_region, kktc_title_type, images, 
        virtual_tour_url, ai_tour_enabled, seller_type, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28) RETURNING *`,
      [
        storeId, property.title, property.description, property.price, property.currency, property.location, property.type, property.room_count, property.square_meters,
        property.sqm_gross, property.block_plot, property.facade, property.building_age, property.floor, property.total_floors, property.heating, property.furnished,
        property.in_gated_community, property.dues, property.dues_currency, property.country, property.kktc_region, property.kktc_title_type, property.images,
        property.virtual_tour_url, property.ai_tour_enabled, property.seller_type, property.status
      ]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT route to update a property
router.put('/properties/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const property = req.body;
  const storeId = req.user.store_id;

  try {
    const result = await pool.query(
      `UPDATE real_estate_properties SET 
        title = $1, description = $2, price = $3, currency = $4, location = $5, type = $6, room_count = $7, square_meters = $8,
        sqm_gross = $9, block_plot = $10, facade = $11, building_age = $12, floor = $13, total_floors = $14, heating = $15, furnished = $16,
        in_gated_community = $17, dues = $18, dues_currency = $19, country = $20, kktc_region = $21, kktc_title_type = $22, images = $23,
        virtual_tour_url = $24, ai_tour_enabled = $25, seller_type = $26, status = $27, updated_at = CURRENT_TIMESTAMP
       WHERE id = $28 AND store_id = $29 RETURNING *`,
      [
        property.title, property.description, property.price, property.currency, property.location, property.type, property.room_count, property.square_meters,
        property.sqm_gross, property.block_plot, property.facade, property.building_age, property.floor, property.total_floors, property.heating, property.furnished,
        property.in_gated_community, property.dues, property.dues_currency, property.country, property.kktc_region, property.kktc_title_type, property.images,
        property.virtual_tour_url, property.ai_tour_enabled, property.seller_type, property.status, id, storeId
      ]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE route
router.delete('/properties/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.store_id;

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

// Leads
router.get('/leads', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
  try {
    const result = await pool.query('SELECT * FROM real_estate_leads WHERE store_id = $1 ORDER BY created_at DESC', [storeId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/leads', authenticate, async (req: any, res) => {
  const storeId = req.user.store_id;
  const lead = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO real_estate_leads (store_id, customer_name, customer_phone, source, status, property_title, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [storeId, lead.customer_name, lead.customer_phone, lead.source, lead.status, lead.property_title, lead.notes]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/leads/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const lead = req.body;
  const storeId = req.user.store_id;
  try {
    const result = await pool.query(
      `UPDATE real_estate_leads SET 
        customer_name = $1, customer_phone = $2, source = $3, status = $4, property_title = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND store_id = $8 RETURNING *`,
      [lead.customer_name, lead.customer_phone, lead.source, lead.status, lead.property_title, lead.notes, id, storeId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/leads/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.store_id;
  try {
    await pool.query('DELETE FROM real_estate_leads WHERE id = $1 AND store_id = $2', [id, storeId]);
    res.json({ message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Owners
router.get('/owners', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
  try {
    const result = await pool.query('SELECT * FROM real_estate_owners WHERE store_id = $1 ORDER BY created_at DESC', [storeId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/owners', authenticate, async (req: any, res) => {
  const storeId = req.user.store_id;
  const owner = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO real_estate_owners (store_id, name, phone, email, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [storeId, owner.name, owner.phone, owner.email, owner.notes]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/owners/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const owner = req.body;
  const storeId = req.user.store_id;
  try {
    const result = await pool.query(
      'UPDATE real_estate_owners SET name = $1, phone = $2, email = $3, notes = $4 WHERE id = $5 AND store_id = $6 RETURNING *',
      [owner.name, owner.phone, owner.email, owner.notes, id, storeId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/owners/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.store_id;
  try {
    await pool.query('DELETE FROM real_estate_owners WHERE id = $1 AND store_id = $2', [id, storeId]);
    res.json({ message: 'Owner deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Activities
router.get('/activities', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
  try {
    const result = await pool.query('SELECT * FROM real_estate_activities WHERE store_id = $1 ORDER BY date DESC', [storeId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/activities', authenticate, async (req: any, res) => {
  const storeId = req.user.store_id;
  const activity = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO real_estate_activities (store_id, type, title, detail, agent, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [storeId, activity.type, activity.title, activity.detail, activity.agent, activity.date || new Date()]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/activities/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const activity = req.body;
  const storeId = req.user.store_id;
  try {
    const result = await pool.query(
      'UPDATE real_estate_activities SET type = $1, title = $2, detail = $3, agent = $4, date = $5 WHERE id = $6 AND store_id = $7 RETURNING *',
      [activity.type, activity.title, activity.detail, activity.agent, activity.date, id, storeId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/activities/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.store_id;
  try {
    await pool.query('DELETE FROM real_estate_activities WHERE id = $1 AND store_id = $2', [id, storeId]);
    res.json({ message: 'Activity deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Agents
router.get('/agents', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
  try {
    const result = await pool.query('SELECT * FROM real_estate_agents WHERE store_id = $1 ORDER BY name ASC', [storeId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/agents', authenticate, async (req: any, res) => {
  const storeId = req.user.store_id;
  const agent = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO real_estate_agents (store_id, name, phone, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [storeId, agent.name, agent.phone, agent.status || 'active']
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/agents/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const agent = req.body;
  const storeId = req.user.store_id;
  try {
    const result = await pool.query(
      'UPDATE real_estate_agents SET name = $1, phone = $2, status = $3 WHERE id = $4 AND store_id = $5 RETURNING *',
      [agent.name, agent.phone, agent.status, id, storeId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/agents/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.store_id;
  try {
    await pool.query('DELETE FROM real_estate_agents WHERE id = $1 AND store_id = $2', [id, storeId]);
    res.json({ message: 'Agent deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
