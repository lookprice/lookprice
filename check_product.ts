import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const c = new pg.Client({connectionString: process.env.DATABASE_URL});
  await c.connect();
  const res = await c.query("SELECT id, name, barcode, store_id FROM products WHERE barcode LIKE '%195908300977%'");
  console.log(res.rows);
  
  const res2 = await c.query("SELECT * FROM stores WHERE LOWER(slug) IN ('gap', 'gap')");
  console.log(res2.rows.map(r => ({ id: r.id, name: r.name, slug: r.slug })));
  
  await c.end();
}
run();
