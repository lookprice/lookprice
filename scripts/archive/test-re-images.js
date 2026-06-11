import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT images FROM real_estate_properties LIMIT 1');
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  }
  pool.end();
}
run();
