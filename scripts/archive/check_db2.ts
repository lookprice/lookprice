import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const storeIds = [10];
    const transfersRes = await pool.query(
      `SELECT st.*, 
              fs.name as from_store_name, 
              ts.name as to_store_name,
              u.email as created_by_email,
              up.email as prepared_by_email,
              us.email as shipped_by_email
       FROM stock_transfers st
       JOIN stores fs ON st.from_store_id = fs.id
       JOIN stores ts ON st.to_store_id = ts.id
       LEFT JOIN users u ON st.created_by = u.id
       LEFT JOIN users up ON st.prepared_by = up.id
       LEFT JOIN users us ON st.shipped_by = us.id
       WHERE st.from_store_id = ANY($1) OR st.to_store_id = ANY($1)
       ORDER BY st.created_at DESC`,
      [storeIds]
    );
    console.log("Transfers:", transfersRes.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
