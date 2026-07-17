const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://root:root@localhost:5432/lookprice_db' });

async function run() {
  try {
    const storeRes = await pool.query("SELECT id, name, slug FROM stores WHERE LOWER(slug) = 'orniti'");
    console.log("STORE:", storeRes.rows);
    if (storeRes.rows.length > 0) {
      const storeId = storeRes.rows[0].id;
      const vehiclesRes = await pool.query("SELECT id, plate, brand, model, status, is_on_enrakipsiz, type FROM vehicles WHERE store_id = $1 ORDER BY id DESC", [storeId]);
      console.log("VEHICLES COUNT:", vehiclesRes.rows.length);
      console.log("VEHICLES DETAILS:", vehiclesRes.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
