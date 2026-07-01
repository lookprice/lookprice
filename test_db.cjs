const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres" });
async function run() {
  const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = 2");
  const row = storeRes.rows[0];
  console.log("einvoice_settings:", row.einvoice_settings);
  console.log("branding:", row.branding);
}
run().then(() => process.exit(0)).catch(console.error);
