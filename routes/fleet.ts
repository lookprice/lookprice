import express from 'express';
import { pool } from '../models/db';
import { authenticate } from '../middleware/auth';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

async function uploadToSupabase(file: any) {
  try {
    const { supabase } = await import('../src/services/supabaseService.ts');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + '-' + file.originalname;

    const { data, error } = await supabase.storage
      .from('lookdocu')
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('lookdocu')
      .getPublicUrl(filename);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }
}

// Get all vehicles for a store
router.get('/vehicles', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
  try {
    const result = await pool.query(
      `SELECT v.*, 
        (SELECT COUNT(*) FROM vehicle_documents vd WHERE vd.vehicle_id = v.id AND vd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND vd.expiry_date >= CURRENT_DATE) as expiring_docs,
        (SELECT COUNT(*) FROM vehicle_maintenance vm WHERE vm.vehicle_id = v.id AND vm.status = 'scheduled' AND (vm.next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days' OR (v.current_mileage >= vm.next_maintenance_mileage - 1000 AND vm.next_maintenance_mileage > 0))) as maintenance_due
       FROM vehicles v 
       WHERE v.store_id = $1 
       ORDER BY v.plate ASC`,
      [storeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new vehicle
router.post('/vehicles', authenticate, async (req: any, res) => {
  const { plate, brand, model, year, type, chassis_number, engine_number, current_mileage } = req.body;
  const storeId = req.body.store_id || req.user.store_id;

  try {
    const result = await pool.query(
      `INSERT INTO vehicles (store_id, plate, brand, model, year, type, chassis_number, engine_number, current_mileage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [storeId, plate, brand, model, year, type, chassis_number, engine_number, current_mileage]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating vehicle:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Bu plaka zaten kayıtlı.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a vehicle
router.put('/vehicles/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { plate, brand, model, year, type, chassis_number, engine_number, current_mileage, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE vehicles 
       SET plate = $1, brand = $2, model = $3, year = $4, type = $5, chassis_number = $6, engine_number = $7, current_mileage = $8, status = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [plate, brand, model, year, type, chassis_number, engine_number, current_mileage, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a vehicle
router.put('/vehicles/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { plate, brand, model, year, type, chassis_number, engine_number, current_mileage, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vehicles 
       SET plate = $1, brand = $2, model = $3, year = $4, type = $5, chassis_number = $6, engine_number = $7, current_mileage = $8, status = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [plate, brand, model, year, type, chassis_number, engine_number, current_mileage, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/vehicles/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Documents ---
router.get('/documents', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
  try {
    const result = await pool.query(
      'SELECT vd.*, v.plate FROM vehicle_documents vd JOIN vehicles v ON vd.vehicle_id = v.id WHERE v.store_id = $1 ORDER BY vd.expiry_date ASC',
      [storeId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicles/:id/documents', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM vehicle_documents WHERE vehicle_id = $1 ORDER BY expiry_date ASC', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicles/:id/documents', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { type, document_url, expiry_date, notes, is_recurring, recurrence_period } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vehicle_documents (vehicle_id, type, document_url, expiry_date, notes, is_recurring, recurrence_period) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, type, document_url, expiry_date || null, notes, is_recurring || false, recurrence_period]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding document:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/vehicle-documents/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { type, document_url, expiry_date, notes, is_recurring, recurrence_period } = req.body;
  try {
    const result = await pool.query(
      'UPDATE vehicle_documents SET type = $1, document_url = $2, expiry_date = $3, notes = $4, is_recurring = $5, recurrence_period = $6 WHERE id = $7 RETURNING *',
      [type, document_url, expiry_date || null, notes, is_recurring || false, recurrence_period, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/vehicle-documents/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM vehicle_documents WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Maintenance ---
router.get('/maintenance', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
  try {
    const result = await pool.query(
      'SELECT vm.*, v.plate FROM vehicle_maintenance vm JOIN vehicles v ON vm.vehicle_id = v.id WHERE v.store_id = $1 ORDER BY vm.date DESC',
      [storeId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicles/:id/maintenance', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM vehicle_maintenance WHERE vehicle_id = $1 ORDER BY date DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicles/:id/maintenance', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { type, date, mileage, cost, currency, provider_name, description, status, next_maintenance_date, next_maintenance_mileage } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO vehicle_maintenance (vehicle_id, type, date, mileage, cost, currency, provider_name, description, status, next_maintenance_date, next_maintenance_mileage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [id, type, date || null, mileage, cost, currency, provider_name, description, status, next_maintenance_date || null, next_maintenance_mileage]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding maintenance:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/vehicle-maintenance/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { type, date, mileage, cost, currency, provider_name, description, status, next_maintenance_date, next_maintenance_mileage } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vehicle_maintenance 
       SET type = $1, date = $2, mileage = $3, cost = $4, currency = $5, provider_name = $6, description = $7, status = $8, next_maintenance_date = $9, next_maintenance_mileage = $10
       WHERE id = $11 RETURNING *`,
      [type, date || null, mileage, cost, currency, provider_name, description, status, next_maintenance_date || null, next_maintenance_mileage, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Maintenance record not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating maintenance:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Assignments ---
router.get('/assignments', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
  try {
    const result = await pool.query(
      'SELECT va.*, v.plate FROM vehicle_assignments va JOIN vehicles v ON va.vehicle_id = v.id WHERE v.store_id = $1 ORDER BY va.start_date DESC',
      [storeId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicles/:id/assignments', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT va.*, u.email as user_email, d.name as driver_name
       FROM vehicle_assignments va
       LEFT JOIN users u ON va.user_id = u.id
       LEFT JOIN drivers d ON va.driver_id = d.id
       WHERE va.vehicle_id = $1 ORDER BY va.start_date DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vehicle assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicles/:id/assignments', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { user_id, driver_id, start_date, start_mileage, notes } = req.body;
  if ((!user_id && !driver_id) || !start_date) {
    return res.status(400).json({ error: 'Missing required fields: user_id or driver_id and start_date are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO vehicle_assignments (vehicle_id, user_id, driver_id, start_date, start_mileage, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, user_id || null, driver_id || null, start_date, start_mileage, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding assignment:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/vehicle-assignments/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { end_date, end_mileage, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE vehicle_assignments SET end_date = $1, end_mileage = $2, status = $3 WHERE id = $4 RETURNING *',
      [end_date || null, end_mileage, status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Mileage Logs ---
router.get('/mileage', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
  try {
    const result = await pool.query(
      'SELECT vml.*, v.plate FROM vehicle_mileage_logs vml JOIN vehicles v ON vml.vehicle_id = v.id WHERE v.store_id = $1 ORDER BY vml.date DESC',
      [storeId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicles/:id/mileage', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM vehicle_mileage_logs WHERE vehicle_id = $1 ORDER BY date DESC, created_at DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicles/:id/mileage', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { date, mileage, notes } = req.body;
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'INSERT INTO vehicle_mileage_logs (vehicle_id, date, mileage, user_id, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, date || null, mileage, userId, notes]
    );
    // Also update current_mileage in vehicles table
    await pool.query('UPDATE vehicles SET current_mileage = $1 WHERE id = $2', [mileage, id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding mileage:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Incidents ---
router.get('/incidents', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
  try {
    const result = await pool.query(
      'SELECT vi.*, v.plate FROM vehicle_incidents vi JOIN vehicles v ON vi.vehicle_id = v.id WHERE v.store_id = $1 ORDER BY vi.date DESC',
      [storeId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/vehicles/:id/incidents', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM vehicle_incidents WHERE vehicle_id = $1 ORDER BY date DESC', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicles/:id/incidents', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { type, date, description, cost, status, report_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vehicle_incidents (vehicle_id, type, date, description, cost, status, report_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, type, date || null, description, cost, status, report_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding incident:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Drivers ---
router.get('/drivers', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
  try {
    const result = await pool.query(`
      SELECT d.*, 
        (SELECT COUNT(*) FROM driver_documents dd WHERE dd.driver_id = d.id AND dd.expiry_date <= CURRENT_DATE + INTERVAL '30 days') as expiring_docs
      FROM drivers d 
      WHERE d.store_id = $1 
      ORDER BY d.name ASC
    `, [storeId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/drivers', authenticate, async (req: any, res) => {
  const { name, license_number, license_class, blood_type, phone, email, address, status } = req.body;
  const storeId = req.body.store_id || req.user.store_id;
  try {
    const result = await pool.query(
      `INSERT INTO drivers (store_id, name, license_number, license_class, blood_type, phone, email, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [storeId, name, license_number, license_class, blood_type, phone, email, address, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/drivers/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { name, license_number, license_class, blood_type, phone, email, address, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE drivers 
       SET name = $1, license_number = $2, license_class = $3, blood_type = $4, phone = $5, email = $6, address = $7, status = $8
       WHERE id = $9 RETURNING *`,
      [name, license_number, license_class, blood_type, phone, email, address, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/drivers/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM drivers WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Driver Document Routes
router.get('/driver-documents', authenticate, async (req: any, res) => {
  const storeId = req.query.store_id || req.user.store_id;
  try {
    const result = await pool.query(
      'SELECT dd.*, d.name as driver_name FROM driver_documents dd JOIN drivers d ON dd.driver_id = d.id WHERE d.store_id = $1 ORDER BY dd.expiry_date ASC',
      [storeId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/drivers/:id/documents', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM driver_documents WHERE driver_id = $1 ORDER BY expiry_date ASC', [id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/drivers/:id/assignments', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT va.*, v.plate as vehicle_plate, v.brand as vehicle_brand, v.model as vehicle_model
       FROM vehicle_assignments va 
       JOIN vehicles v ON va.vehicle_id = v.id 
       WHERE va.driver_id = $1 ORDER BY va.start_date DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/drivers/:id/documents', authenticate, upload.single('file'), async (req: any, res) => {
  const { id } = req.params;
  const { type, expiry_date, notes, is_recurring, recurrence_period } = req.body;
  let document_url = req.body.document_url;

  try {
    if (req.file) {
      document_url = await uploadToSupabase(req.file);
    }

    const result = await pool.query(
      'INSERT INTO driver_documents (driver_id, type, document_url, expiry_date, notes, is_recurring, recurrence_period) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, type, document_url, expiry_date || null, notes, is_recurring === 'true' || is_recurring === true, recurrence_period]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding driver document:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/driver-documents/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { type, document_url, expiry_date, notes, is_recurring, recurrence_period } = req.body;
  try {
    const result = await pool.query(
      'UPDATE driver_documents SET type = $1, document_url = $2, expiry_date = $3, notes = $4, is_recurring = $5, recurrence_period = $6 WHERE id = $7 RETURNING *',
      [type, document_url, expiry_date || null, notes, is_recurring || false, recurrence_period, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating driver document:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/driver-documents/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM driver_documents WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting driver document:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
