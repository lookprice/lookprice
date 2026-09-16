const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const res = await pool.query("SELECT id, name, einvoice_settings FROM stores");
  for (const row of res.rows) {
    console.log(`Store ID: ${row.id}, Name: ${row.name}, einvoice_settings:`, row.einvoice_settings);
  }
  process.exit(0);
}
run();
