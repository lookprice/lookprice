const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const res = await pool.query("SELECT id, integration_status, integration_message FROM sales_invoices WHERE id = 506");
  console.log(res.rows[0]);
  process.exit(0);
}
run();
