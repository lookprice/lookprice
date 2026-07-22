import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'purchase_invoices'`);
    console.log("purchase_invoices columns:", res.rows.map(r => r.column_name).join(', '));
  } finally {
    await pool.end();
  }
}
run();
