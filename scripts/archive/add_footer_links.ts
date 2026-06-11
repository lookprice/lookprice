import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function addColumn() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS footer_links jsonb DEFAULT '[]'::jsonb`);
    console.log("Added footer_links column");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
addColumn();
