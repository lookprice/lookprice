const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const inv = await pool.query("SELECT gi_exemption_reason_code FROM sales_invoices WHERE id = 506");
  console.log(inv.rows[0]);
  process.exit(0);
}
run();
