const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const inv = await pool.query("SELECT id, invoice_number, document_number, integration_status, integration_message, gi_invoice_type, gi_exemption_reason_code FROM sales_invoices WHERE document_number LIKE '%136%' OR invoice_number LIKE '%136%'");
  console.log(inv.rows);
  process.exit(0);
}
run();
