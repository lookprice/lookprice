require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const pRes = await pool.query("SELECT image_url, description FROM products WHERE barcode = '824142310328'");
  console.log(pRes.rows[0]);
  pool.end();
}
check();
