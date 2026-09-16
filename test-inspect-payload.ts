import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const invoiceId = 506;
  const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
  const invoice = invRes.rows[0];
  const itemsRes = await pool.query("SELECT * FROM sales_invoice_items WHERE sales_invoice_id = $1", [invoiceId]);
  const items = itemsRes.rows;

  console.log("Invoice:", invoice);
  console.log("Items:", items);
  process.exit(0);
}
run();
