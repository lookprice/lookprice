import express from 'express';
import { pool } from '../models/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Auto-heal / create ai_jobs table
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_jobs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        property_id INTEGER,
        store_id INTEGER,
        job_type TEXT CHECK(job_type IN ('virtual_tour_3d', 'virtual_staging')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'canceled')),
        payload JSONB,
        result_payload JSONB,
        external_job_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);
    
    // Add external_job_id column if it doesn't exist
    try {
      await pool.query(`ALTER TABLE ai_jobs ADD COLUMN external_job_id TEXT`);
    } catch (e: any) {
      if (e.code !== '42701') { // 42701 is duplicate_column
        throw e;
      }
    }
    
    console.log("ai_jobs table checked/created");
  } catch (err) {
    console.error("Failed to check/create ai_jobs table:", err);
  }
})();

// CREATE A NEW AI JOB 
// Triggered by the "3D OLUŞTUR" or "Virtual Staging" button
router.post('/trigger', authenticate, async (req: any, res: any) => {
  const { propertyId, jobType, images, prompt } = req.body;
  const storeId = req.user.storeId;

  if (!propertyId || !jobType) {
    return res.status(400).json({ message: "propertyId and jobType are required" });
  }

  try {
    // Basic validation
    if (jobType === 'virtual_staging' && (!images || !images[0] || !prompt)) {
      return res.status(400).json({ message: "Virtual staging requires an image and a prompt." });
    }

    if (jobType === 'virtual_tour_3d' && (!images || images.length === 0)) {
       return res.status(400).json({ message: "3D Virtual tour requires images." });
    }

    const payload = jobType === 'virtual_staging' ? { image: images[0], prompt } : { images };

    const { rows } = await pool.query(
      `INSERT INTO ai_jobs (property_id, store_id, job_type, payload) 
       VALUES ($1, $2, $3, $4) RETURNING id, status, job_type`,
      [propertyId, storeId, jobType, JSON.stringify(payload)]
    );

    res.json({ message: "Job queued successfully", job: rows[0] });
  } catch (error) {
    console.error("AI trigger error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET JOB STATUS
router.get('/status/:propertyId', authenticate, async (req: any, res: any) => {
  const { propertyId } = req.params;
  
  try {
    const { rows } = await pool.query(
      "SELECT id, job_type, status, result_payload, created_at, completed_at FROM ai_jobs WHERE property_id = $1 ORDER BY created_at DESC",
      [propertyId]
    );
    res.json({ jobs: rows });
  } catch (error) {
    console.error("AI jobs error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
