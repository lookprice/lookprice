import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
async function updateOld() {
  await pool.query(`UPDATE purchase_invoices SET is_read = TRUE`);
  console.log("Old rows marked as read");
  process.exit(0);
}
updateOld();
