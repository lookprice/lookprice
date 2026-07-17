const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://root:root@localhost:5432/lookprice_db' });

async function run() {
  try {
    const res = await pool.query("SELECT id, name, slug, store_type FROM stores");
    console.log("STORES:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
