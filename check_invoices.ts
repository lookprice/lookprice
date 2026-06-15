import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkInvoices() {
  try {
    const invoiceNumbers = ['#407-7619711-6189168', '#403-5685870-8092367', '407-7619711-6189168', '403-5685870-8092367'];
    
    console.log("--- SALES INVOICES ---");
    const invRes = await pool.query("SELECT id, invoice_number, notes FROM sales_invoices WHERE invoice_number = ANY($1) OR notes LIKE ANY($2)", [invoiceNumbers, invoiceNumbers.map(n => `%${n}%`)]);
    console.table(invRes.rows);

    for (const inv of invRes.rows) {
      console.log(`\n--- ITEMS FOR INVOICE ID ${inv.id} (${inv.invoice_number}) ---`);
      const itemsRes = await pool.query("SELECT id, product_id, product_name, barcode, quantity FROM sales_invoice_items WHERE sales_invoice_id = $1", [inv.id]);
      console.table(itemsRes.rows);
    }

    await pool.end();
  } catch (e) {
    console.error(e);
  }
}

checkInvoices();
