
import { pool } from './models/db.ts';

async function checkStores() {
  try {
    const res = await pool.query('SELECT id, custom_domain, cf_zone_id, cf_api_token FROM stores WHERE custom_domain IS NOT NULL');
    console.log("Stores with custom domains:", JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

checkStores();
