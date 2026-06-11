import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query("SELECT id, store_id, created_at, status FROM sales");
    console.log("All sales in DB:");
    for (const r of res.rows) {
        console.log(`Store: ${r.store_id}, ID: ${r.id}, Date: ${r.created_at}, Status: ${r.status}`);
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
