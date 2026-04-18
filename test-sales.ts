import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query("SELECT id, store_id, created_at, status FROM sales ORDER BY created_at DESC LIMIT 5");
    console.log("Sales:", res.rows);
    const count = await pool.query("SELECT COUNT(*) FROM sales");
    console.log("Total Sales:", count.rows[0].count);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
