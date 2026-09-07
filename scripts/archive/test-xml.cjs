require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const storeRes = await pool.query("SELECT * FROM stores WHERE slug = 'GAP'");
  if(!storeRes.rows.length) return console.log("No GAP store");
  const store = storeRes.rows[0];
  const productsRes = await pool.query("SELECT barcode, id FROM products WHERE store_id = $1 LIMIT 5", [store.id]);
  console.log(productsRes.rows);
  pool.end();
}
check();
