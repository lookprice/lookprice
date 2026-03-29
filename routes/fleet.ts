import express from 'express';
import { pool } from '../models/db';
import { authenticate } from '../middleware/auth';

const router = express.Router();

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
  const { type, document_url, expiry_date, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vehicle_documents (vehicle_id, type, document_url, expiry_date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, type, document_url, expiry_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
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
      [id, type, date, mileage, cost, currency, provider_name, description, status, next_maintenance_date, next_maintenance_mileage]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Assignments ---
router.get('/vehicles/:id/assignments', authenticate, async (req: any, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT va.*, u.email as user_email 
       FROM vehicle_assignments va
       JOIN users u ON va.user_id = u.id
       WHERE va.vehicle_id = $1 ORDER BY va.start_date DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/vehicles/:id/assignments', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { user_id, start_date, start_mileage, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vehicle_assignments (vehicle_id, user_id, start_date, start_mileage, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, user_id, start_date, start_mileage, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/vehicle-assignments/:id', authenticate, async (req: any, res) => {
  const { id } = req.params;
  const { end_date, end_mileage, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE vehicle_assignments SET end_date = $1, end_mileage = $2, status = $3 WHERE id = $4 RETURNING *',
      [end_date, end_mileage, status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Mileage Logs ---
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
      [id, date, mileage, userId, notes]
    );
    // Also update current_mileage in vehicles table
    await pool.query('UPDATE vehicles SET current_mileage = $1 WHERE id = $2', [mileage, id]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Incidents ---
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
      [id, type, date, description, cost, status, report_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
