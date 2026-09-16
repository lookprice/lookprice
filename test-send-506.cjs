const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  // Let's inspect invoice 506 details and items
  const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = 506");
  const invoice = invRes.rows[0];
  const itemsRes = await pool.query("SELECT * FROM sales_invoice_items WHERE sales_invoice_id = 506");
  console.log("Invoice:", invoice);
  console.log("Items count:", itemsRes.rows.length);
  process.exit(0);
}
run();
