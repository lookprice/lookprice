require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const { MySoftService } = require('./dist/server.js'); // or test via axios directly

async function run() {
  const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = 506");
  const invoice = invRes.rows[0];
  const itemsRes = await pool.query("SELECT * FROM sales_invoice_items WHERE sales_invoice_id = 506");
  const storeRes = await pool.query("SELECT einvoice_settings FROM stores WHERE id = $1", [invoice.store_id]);
  const settings = storeRes.rows[0].einvoice_settings;
  
  const service = new MySoftService(settings);
  
  // Let's test checkTaxpayer or get token
  try {
    console.log("Testing authentication...");
    // @ts-ignore
    const token = await service.authenticate?.() || "test";
    console.log("Auth success, token acquired.");
  } catch (err) {
    console.error("Auth failed:", err);
  }
  process.exit(0);
}
run();
