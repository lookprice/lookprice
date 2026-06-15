import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkAmazonOrders() {
  try {
    const orderIds = ['407-7619711-6189168', '403-5685870-8092367'];
    
    console.log("--- AMAZON ORDERS TRACKING ---");
    const amazonRes = await pool.query("SELECT * FROM amazon_orders WHERE amazon_order_id = ANY($1)", [orderIds]);
    console.table(amazonRes.rows);

    for (const order of amazonRes.rows) {
      console.log(`\n--- ITEMS FOR INVOICE ID ${order.sales_invoice_id} (#${order.amazon_order_id}) ---`);
      const itemsRes = await pool.query("SELECT id, product_id, product_name, barcode, quantity FROM sales_invoice_items WHERE sales_invoice_id = $1", [order.sales_invoice_id]);
      console.table(itemsRes.rows);
    }

    await pool.end();
  } catch (e) {
    console.error(e);
  }
}

checkAmazonOrders();
