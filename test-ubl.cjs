const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const res = await pool.query("SELECT * FROM sales_invoices WHERE id = 506");
  console.log("Invoice keys:", Object.keys(res.rows[0]));
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log("Tables:", tables.rows.map(r => r.table_name));
  process.exit(0);
}
run();
