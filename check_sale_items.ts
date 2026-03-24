import { pool } from './models/db.js';

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sale_items';
    `);
    console.log("sale_items columns:", res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
