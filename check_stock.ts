import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkStock() {
  try {
    console.log("--- PRODUCT STOCK ---");
    const prodRes = await pool.query("SELECT id, name, barcode, stock_quantity FROM products WHERE id = 7781");
    console.table(prodRes.rows);

    console.log("\n--- STOCK MOVEMENTS FOR PRODUCT 7781 ---");
    const movementsRes = await pool.query("SELECT * FROM stock_movements WHERE product_id = 7781 ORDER BY created_at DESC");
    console.table(movementsRes.rows);

    await pool.end();
  } catch (e) {
    console.error(e);
  }
}

checkStock();
