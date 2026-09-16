const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const inv = await pool.query("SELECT * FROM sales_invoices WHERE id = 506");
  console.log("gi_invoice_type:", inv.rows[0].gi_invoice_type);
  console.log("gi_exemption_reason_code:", inv.rows[0].gi_exemption_reason_code);
  process.exit(0);
}
run();
