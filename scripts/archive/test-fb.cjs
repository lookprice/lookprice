require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const storeRes = await pool.query("SELECT * FROM stores WHERE id = 2");
  console.log(storeRes.rows[0]);
  pool.end();
}
check();
