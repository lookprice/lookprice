import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query('SELECT * FROM stock_transfers ORDER BY id DESC LIMIT 5');
    console.log("Transfers:", res.rows);
    const items = await pool.query('SELECT * FROM stock_transfer_items ORDER BY id DESC LIMIT 5');
    console.log("Items:", items.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
