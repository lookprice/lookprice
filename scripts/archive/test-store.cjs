require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const pRes = await pool.query("SELECT * FROM stores WHERE id = 2");
  console.log(pRes.rows[0].slug, pRes.rows[0].custom_domain);
  pool.end();
}
check();
