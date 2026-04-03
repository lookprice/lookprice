import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const res = await pool.query("SELECT * FROM stock_movements WHERE description LIKE '%Alış Faturası: 111%'");
    console.log("Movements:", res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
