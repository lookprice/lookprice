
import { pool } from './models/db.js';

async function updateSchema() {
  try {
    await pool.query(`
      ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;
      ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS descriptions JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("Table seo_pages updated successfully");
  } catch (error) {
    console.error("Error updating schema:", error);
  } finally {
    await pool.end();
  }
}

updateSchema();
