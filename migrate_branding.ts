
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query("ALTER TABLE stores ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}'");
    console.log("Migration successful: Added branding column to stores table.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}
migrate();
