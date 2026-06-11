import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const countRes = await pool.query('SELECT COUNT(*) FROM products');
    console.log("Total Products:", countRes.rows[0].count);
    
    const recentRes = await pool.query('SELECT id, store_id, barcode, name, price, stock_quantity, updated_at FROM products WHERE store_id = 1 ORDER BY updated_at DESC LIMIT 20');
    console.log("Recent Products (store 1):", recentRes.rows);
    
    const specificRes = await pool.query("SELECT id, store_id, barcode, name, price, stock_quantity, updated_at FROM products WHERE barcode = '9789750718533' AND store_id = 1");
    console.log("Specific Product (9789750718533) for store 1:", specificRes.rows);
    
    const storeRes = await pool.query("SELECT * FROM stores WHERE id = 1");
    console.log("Store 1 details:", storeRes.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
check();
