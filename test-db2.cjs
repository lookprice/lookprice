const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const res = await pool.query("SELECT id, gi_invoice_type, gi_exemption_reason_code, tax_amount, grand_total, status, document_number, ettn, integration_status FROM sales_invoices WHERE id = 506");
  console.log(res.rows[0]);
  process.exit(0);
}
run();
