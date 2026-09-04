import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(
      `SELECT 1 FROM sales WHERE $1 = 1 OR ($2 = 2 AND $4 = 4)`, 
      [1, 2, 'unused', 4]
    );
    console.log("Success");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
