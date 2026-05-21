import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log("Tables in database:", tables.rows.map(r => r.table_name));

    const rePropExists = tables.rows.some(r => r.table_name === 'real_estate_properties');
    const reExists = tables.rows.some(r => r.table_name === 'real_estate');

    if (rePropExists) {
      const res = await pool.query('SELECT count(*) FROM real_estate_properties');
      console.log("real_estate_properties count:", res.rows[0].count);
      const data = await pool.query('SELECT * FROM real_estate_properties LIMIT 1');
      console.log("real_estate_properties sample:", data.rows[0]);
    }

    if (reExists) {
      const res = await pool.query('SELECT count(*) FROM real_estate');
      console.log("real_estate count:", res.rows[0].count);
    }
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
