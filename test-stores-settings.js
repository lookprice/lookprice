import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT id, name, google_drive_settings FROM stores LIMIT 10');
    console.log("Stores settings:", res.rows);
  } catch(e) {
    console.error(e);
  }
  pool.end();
}
run();
