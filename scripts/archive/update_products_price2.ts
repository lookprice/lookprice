import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateSchema() {
  const client = await pool.connect();
  try {
    console.log("Adding price_2 columns to products table...");
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS price_2 NUMERIC(15,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS price_2_currency VARCHAR(10) DEFAULT 'TRY';
    `);
    console.log("Schema updated successfully.");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSchema();
