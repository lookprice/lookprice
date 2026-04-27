require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
  const storeRes = await pool.query("SELECT * FROM stores WHERE slug = 'GAP'");
  const store = storeRes.rows[0];
  const productsRes = await pool.query("SELECT barcode, id FROM products WHERE store_id = $1 LIMIT 5", [store.id]);
  
  const protocol = 'https';
  const host = store.custom_domain || 'gapbilisim.com';
  const baseUrl = `https://${host}`;

  productsRes.rows.forEach(p => {
    const productUrl = store.custom_domain ? `${baseUrl}/p/${p.barcode || p.id}` : `${baseUrl}/s/${store.slug}/p/${p.barcode || p.id}`;
    console.log(productUrl);
  });
  pool.end();
}
check();
