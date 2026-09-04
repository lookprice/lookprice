import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    await pool.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_title TEXT;");
    console.log("Column added");
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
