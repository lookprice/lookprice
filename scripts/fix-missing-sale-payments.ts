import { pool } from '../models/db.js';

async function fix() {
  try {
    const res = await pool.query(`
      INSERT INTO sale_payments (sale_id, payment_method, amount, created_at)
      SELECT s.id, COALESCE(s.payment_method, 'cash'), s.total_amount, s.created_at
      FROM sales s
      LEFT JOIN sale_payments sp ON s.id = sp.sale_id
      WHERE s.status IN ('completed', 'processing', 'shipped', 'delivered')
        AND sp.id IS NULL
      RETURNING *;
    `);
    console.log("Fixed missing sale payments:", res.rowCount);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

fix();
