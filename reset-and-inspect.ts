import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const invoiceNumbers = ['GEF2026000000135', 'GEF2026000000136'];
  
  for (const num of invoiceNumbers) {
    console.log(`--- Processing Invoice: ${num} ---`);
    const res = await pool.query(
      "SELECT id, status, gi_invoice_type, gi_exemption_reason_code FROM sales_invoices WHERE document_number = $1",
      [num]
    );

    if (res.rows.length === 0) {
      console.log("Not found.");
      continue;
    }

    const inv = res.rows[0];
    console.log("Current state:", inv);

    const itemsRes = await pool.query(
      "SELECT id, product_name, tax_rate FROM sales_invoice_items WHERE sales_invoice_id = $1",
      [inv.id]
    );
    console.log("Items:", itemsRes.rows);

    await pool.query(
      "UPDATE sales_invoices SET status = 'draft', integration_status = 'UNKNOWN', integration_message = NULL WHERE id = $1",
      [inv.id]
    );
    console.log("Reset to draft.");
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
