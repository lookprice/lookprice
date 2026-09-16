import { Pool } from 'pg';
import { getEInvoiceService } from './src/services/backend/mysoftService'; // or wherever getEInvoiceService is

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const invoiceId = 506;
  const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
  const invoice = invRes.rows[0];
  const storeId = invoice.store_id;

  const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
  const settings = storeRes.rows[0].einvoice_settings;
  const branding = storeRes.rows[0].branding;

  console.log("Invoice 506 data:", invoice);
  console.log("Store settings:", settings);
  console.log("Branding:", branding);

  process.exit(0);
}
run();
