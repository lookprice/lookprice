import { pool } from './models/db.ts';

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'current_account_transactions';
    `);
    console.log("current_account_transactions columns:", res.rows);
    
    const res2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sales';
    `);
    console.log("sales columns:", res2.rows);

    const res3 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'quotations';
    `);
    console.log("quotations columns:", res3.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
