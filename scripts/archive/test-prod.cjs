require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const pRes = await pool.query("SELECT * FROM products WHERE (barcode = '824142310328' OR id::text = '824142310328') AND store_id = 2");
  console.log(pRes.rows[0]);
  pool.end();
}
check();
