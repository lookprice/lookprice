import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
async function alter() {
  await pool.query(`ALTER TABLE purchase_invoices ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`);
  console.log("Column added");
  process.exit(0);
}
alter();
