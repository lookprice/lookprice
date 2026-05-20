import express from 'express';
import { pool } from '../models/db';
import { authenticate } from '../middleware/auth';
import { sendLeadNotification } from '../src/services/messaging';

const router = express.Router();

// Self-Healing database schema updates for CRM
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS crm_leads (
        id SERIAL PRIMARY KEY,
        store_id INTEGER REFERENCES stores(id),
        name TEXT,
        phone TEXT,
        email TEXT,
        status TEXT DEFAULT 'new', 
        source TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS crm_appointments (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER REFERENCES crm_leads(id),
        appointment_time TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("CRM tables verification processed.");
  } catch (error) {
    console.error("CRM table error:", error);
  }
})();

// Basic GET route to list leads
router.get('/leads', authenticate, async (req: any, res) => {
  const storeId = req.user.store_id;
  try {
    const result = await pool.query(
      `SELECT * FROM crm_leads WHERE store_id = $1 ORDER BY created_at DESC`,
      [storeId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST route for lead
router.post('/leads', authenticate, async (req: any, res) => {
  const storeId = req.user.store_id;
  const { name, phone, email, source, notes } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO crm_leads (store_id, name, phone, email, source, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [storeId, name, phone, email, source, notes]
    );

    const newLead = result.rows[0];
    try {
        await sendLeadNotification(newLead, 'whatsapp');
    } catch(msgErr) {
        console.error("Failed to send notification:", msgErr);
    }
    
    res.json(newLead);
  } catch (error) {
    console.error('Error adding lead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
