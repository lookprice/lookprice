
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log("Starting migration: Adding Cloudflare columns to stores table...");
    
    await pool.query(`
      ALTER TABLE stores 
      ADD COLUMN IF NOT EXISTS cf_api_token TEXT,
      ADD COLUMN IF NOT EXISTS cf_account_id TEXT;
    `);
    
    console.log("Migration successful: Columns added.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
