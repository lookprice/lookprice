const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'sales_invoices'");
  console.log(res.rows.map(r => r.column_name).join(', '));
  const invoice = await pool.query("SELECT * FROM sales_invoices WHERE invoice_number = 'GEF2026000000134' OR document_number = 'GEF2026000000134' ORDER BY created_at DESC LIMIT 1");
  console.log(invoice.rows[0]);
  process.exit(0);
}
run();
