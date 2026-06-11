import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'stores'
    `);
    console.log("Stores columns:", res.rows);
  } catch(e) {
    console.error(e);
  }
  pool.end();
}
run();
