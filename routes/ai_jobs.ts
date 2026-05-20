import express from 'express';
import { pool } from '../models/db';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Schema
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_jobs (
        id SERIAL PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        payload JSONB,
        result JSONB,
        attempts INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("AI Jobs table verified.");
  } catch (error) {
    console.error("AI Jobs table error:", error);
  }
})();

// Trigger Job
router.post('/trigger', authenticate, async (req: any, res) => {
  const { entity_type, entity_id, payload } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO ai_jobs (entity_type, entity_id, payload) VALUES ($1, $2, $3) RETURNING id`,
      [entity_type, entity_id, payload]
    );
    res.json({ jobId: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: 'Trigger failed' });
  }
});

export default router;
