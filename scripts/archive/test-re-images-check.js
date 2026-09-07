import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT id, images FROM real_estate_properties ORDER BY id DESC LIMIT 5');
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  }
  pool.end();
}
run();
