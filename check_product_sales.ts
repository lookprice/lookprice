import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkAllSalesForProduct() {
  try {
    console.log("--- ALL SALES ITEMS FOR PRODUCT 7781 ---");
    const itemsRes = await pool.query(`
      SELECT si.id, si.sales_invoice_id, si.product_id, si.quantity, inv.invoice_number, inv.notes
      FROM sales_invoice_items si
      LEFT JOIN sales_invoices inv ON si.sales_invoice_id = inv.id
      WHERE si.product_id = 7781
    `);
    console.table(itemsRes.rows);

    await pool.end();
  } catch (e) {
    console.error(e);
  }
}

checkAllSalesForProduct();
