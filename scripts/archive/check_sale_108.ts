import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query("SELECT * FROM sales WHERE id = 108");
    console.log("Sale:", res.rows);
    const itemsRes = await pool.query("SELECT * FROM sale_items WHERE sale_id = 108");
    console.log("Items:", itemsRes.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
