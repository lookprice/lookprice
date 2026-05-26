import express from 'express';
import { pool } from '../models/db';
import { authenticate } from '../middleware/auth';
import multer from 'multer';
import ai from '../src/services/aiService';

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
    // Add new columns if they don't exist
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS authorized_branch_id INTEGER;`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS responsible_consultant_id INTEGER;`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS owner_name TEXT;`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS owner_phone TEXT;`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS owner_id_number TEXT;`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS is_shared_pool BOOLEAN DEFAULT FALSE;`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS pool_scope TEXT DEFAULT 'none';`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;`);
    
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS is_on_enrakipsiz BOOLEAN DEFAULT FALSE;`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS branch_name TEXT DEFAULT 'Merkez Ofis';`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS responsible_agent TEXT DEFAULT '';`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS sharing_scope TEXT DEFAULT 'shared_pool';`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS reserved_by_branch TEXT DEFAULT '';`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS reservation_notes TEXT DEFAULT '';`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS external_crm_id TEXT;`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS external_crm_name TEXT;`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';`);
    await pool.query(`ALTER TABLE real_estate_properties ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP;`);

    // Create Audit Log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_audit_log (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES real_estate_properties(id),
        action TEXT,
        changed_by INTEGER,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Tasks/Reminders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_tasks (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES real_estate_properties(id),
        consultant_id INTEGER,
        task_type TEXT,
        description TEXT,
        due_date TIMESTAMP,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Real estate table verification processed.");
  } catch (error) {
    console.error("Real estate table error:", error);
  }
})();

// Analyze Portfolio route
router.post('/properties/analyze', authenticate, async (req: any, res) => {
  const storeId = req.user.store_id;

  try {
    const properties = await pool.query(
      `SELECT id, title, description, price, status FROM real_estate_properties WHERE store_id = $1`,
      [storeId]
    );

    const prompt = `Aktif emlak portföyü için danışmanlara yönelik stratejik içgörüler üret. Portföy verileri: ${JSON.stringify(properties.rows.slice(0, 50))}. Sadece JSON formatında yanıt ver: { "insights": [ { "id": "property_id_or_null", "title": "...", "description": "...", "type": "warning" | "info" | "success" } ] }`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    res.json(JSON.parse(response.text!));
  } catch (error: any) {
    console.error('Error analyzing portfolio:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Create a task
router.post('/properties/tasks', authenticate, async (req: any, res) => {
  const { property_id, task_type, description, due_date } = req.body;
  const consultant_id = req.user.id;
  try {
    await pool.query(
      `INSERT INTO property_tasks (property_id, consultant_id, task_type, description, due_date) VALUES ($1, $2, $3, $4, $5)`,
      [property_id, consultant_id, task_type, description, due_date || new Date().toISOString()]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tasks
router.get('/properties/tasks', authenticate, async (req: any, res) => {
  const consultant_id = req.user.id;
  try {
    const result = await pool.query(
      `SELECT * FROM property_tasks WHERE consultant_id = $1 AND status = 'pending' ORDER BY due_date ASC`,
      [consultant_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete a task
router.patch('/properties/tasks/:id', authenticate, async (req: any, res) => {
    const { id } = req.params;
    try {
      await pool.query(
        `UPDATE property_tasks SET status = 'completed' WHERE id = $1`,
        [id]
      );
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Get Audit Log for a property
router.get('/properties/:id/audit-log', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM property_audit_log WHERE property_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Audit Logs for all store properties
router.get('/audit-logs', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.body.store_id || req.user.store_id;
  try {
    const result = await pool.query(
      `SELECT l.* FROM property_audit_log l
       JOIN real_estate_properties p ON l.property_id = p.id
       WHERE p.store_id = $1 ORDER BY l.created_at DESC`,
      [storeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authority Transfer Route
router.post('/properties/:id/transfer-authority', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { authorized_branch_id, responsible_consultant_id } = req.body;
  const storeId = req.user.store_id;

  try {
    const result = await pool.query(
      `UPDATE real_estate_properties 
       SET authorized_branch_id = $1, responsible_consultant_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND store_id = $4 RETURNING *`,
      [authorized_branch_id, responsible_consultant_id, id, storeId]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    // Log the action (Phase 3 task)
    await pool.query(
      `INSERT INTO property_audit_log (property_id, action, changed_by, details) VALUES ($1, $2, $3, $4)`,
      [id, 'AUTHORITY_TRANSFER', req.user.id, `Transferred to branch ${authorized_branch_id}, consultant ${responsible_consultant_id}`]
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error transferring authority:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Basic GET route to list properties
router.get('/properties', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.body.store_id || req.user.store_id;
  try {
    // Logic: 
    // 1. Properties owned by this store
    // 2. Properties where this store is the authorized branch
    // 3. Properties shared with the entire network (sharing_scope = 'all')
    const result = await pool.query(
      `SELECT p.*, 
              c.name as consultant_name, 
              c.phone as consultant_phone,
              s.name as branch_name_official
       FROM real_estate_properties p
       LEFT JOIN consultants c ON p.responsible_consultant_id = c.id
       LEFT JOIN stores s ON p.authorized_branch_id = s.id
       WHERE p.store_id = $1 
       OR p.authorized_branch_id = $1 
       OR p.sharing_scope = 'all'
       ORDER BY p.created_at DESC`,
      [storeId]
    );
    
    // Fallback logic for name display if joined names are missing
    const rows = result.rows.map(row => ({
      ...row,
      responsible_agent: row.consultant_name || row.responsible_agent || 'Belirtilmedi',
      branch_name: row.branch_name_official || row.branch_name || 'Merkez Ofis'
    }));

    res.json(rows);
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
        branch_name, responsible_agent, sharing_scope, reserved_by_branch, reservation_notes,
        authorized_branch_id, responsible_consultant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36) RETURNING *`,
      [
        storeId, property.title, property.description, property.price, property.currency, property.location, property.type, property.room_count, property.square_meters,
        property.sqm_gross, property.block_plot, property.facade, property.building_age, property.floor, property.total_floors, property.heating, property.furnished,
        property.in_gated_community, property.dues, property.dues_currency, property.country, property.kktc_region, property.kktc_title_type, property.images,
        property.virtual_tour_url, property.ai_tour_enabled, property.seller_type, property.status, !!property.is_on_enrakipsiz,
        property.branch_name || 'Merkez Ofis', property.responsible_agent || '', property.sharing_scope || 'shared_pool', property.reserved_by_branch || '', property.reservation_notes || '',
        property.authorized_branch_id, property.responsible_consultant_id
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
        branch_name = $29, responsible_agent = $30, sharing_scope = $31, reserved_by_branch = $32, reservation_notes = $33, 
        authorized_branch_id = $34, responsible_consultant_id = $35, updated_at = CURRENT_TIMESTAMP
       WHERE id = $36 AND store_id = $37 RETURNING *`,
      [
        property.title, property.description, property.price, property.currency, property.location, property.type, property.room_count, property.square_meters,
        property.sqm_gross, property.block_plot, property.facade, property.building_age, property.floor, property.total_floors, property.heating, property.furnished,
        property.in_gated_community, property.dues, property.dues_currency, property.country, property.kktc_region, property.kktc_title_type, property.images,
        property.virtual_tour_url, property.ai_tour_enabled, property.seller_type, property.status, !!property.is_on_enrakipsiz,
        property.branch_name || 'Merkez Ofis', property.responsible_agent || '', property.sharing_scope || 'shared_pool', property.reserved_by_branch || '', property.reservation_notes || '', 
        property.authorized_branch_id, property.responsible_consultant_id, id, storeId
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

// Fetch live AI news using Gemini + Google Search Grounding
router.post('/news', authenticate, async (req: any, res) => {
  try {
    const { tags } = req.body;
    const tagQuery = tags && tags.length > 0 ? tags.join(", ") : "Kıbrıs Emlak, İmar";
    
    // Using gemini-3.5-flash with googleSearch tool for live data
    const prompt = `Fetch the latest, real-world news and updates about Northern Cyprus real estate, zoning laws, property values, regional development and economy related to these topics/tags: ${tagQuery}. 
    Return the result as a JSON array of objects. 
    Each object should have:
    - id: random unique string
    - title: real news title (in Turkish)
    - category: appropriate category (e.g., 'İmar Durumu', 'Finans', 'Bölgesel Gelişme')
    - priority: 'high' or 'normal'
    - date: approximate relative time (e.g., '2 Saat Önce', 'Bugün', 'Dün')
    - img: a highly relevant Unsplash image URL (e.g., https://images.unsplash.com/photo-1563842145396-85750036ee7f?q=80&w=800)
    - tags: array of strings matching the queried tags
    - publishedOnStore: false
    - publishedOnEnrakipsiz: false
    Give me exactly 3-5 real, grounded news items.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const newsData = JSON.parse(response.text || "[]");
    res.json(newsData);
  } catch (error: any) {
    console.error('Error fetching live news via AI:', error);
    res.status(500).json({ error: 'AI haber akışı güncellenemedi.', details: error.message });
  }
});

export default router;
