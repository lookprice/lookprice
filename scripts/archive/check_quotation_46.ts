import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const qRes = await pool.query("SELECT * FROM quotations WHERE id = 46");
    console.log("Quotation:", qRes.rows);
    const itemsRes = await pool.query("SELECT * FROM quotation_items WHERE quotation_id = 46");
    console.log("Items:", itemsRes.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
