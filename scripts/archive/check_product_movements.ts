import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const productRes = await pool.query("SELECT id FROM products WHERE name = 'test satış ürünü' LIMIT 1");
    if (productRes.rows.length === 0) {
      console.log("Product not found");
      return;
    }
    const productId = productRes.rows[0].id;
    console.log("Product ID:", productId);
    const res = await pool.query("SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY created_at DESC LIMIT 10", [productId]);
    console.log("Movements:", res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
