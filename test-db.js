const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const res = await pool.query("SELECT id, gi_ettn, gi_status, gi_invoice_number FROM invoices WHERE gi_invoice_number = 'GEF2026000000134'");
  console.log(res.rows);
  const res2 = await pool.query("SELECT id, gi_ettn, gi_status, gi_invoice_number FROM invoices WHERE gi_status = 'TASLAK' ORDER BY created_at DESC LIMIT 5");
  console.log(res2.rows);
  process.exit(0);
}
run();
