import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const p = await pool.query("SELECT id, name, store_id FROM products WHERE barcode = $1", ['5099206066205']);
    if (p.rows.length === 0) {
        console.log("No product found");
        return;
    }
    const productId = p.rows[0].id;
    const storeId = p.rows[0].store_id;
    console.log("Product:", p.rows[0]);
    
    const movs = await pool.query("SELECT * FROM stock_movements WHERE product_id = $1", [productId]);
    console.log("Movements count:", movs.rows.length);
    console.log("Movements for productId", productId, "and storeId", storeId, ":", movs.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
