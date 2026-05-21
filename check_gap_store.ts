import { pool } from "./models/db";
async function check() {
  try {
    const slug = 'GAP';
    const storeRes = await pool.query("SELECT id, slug, default_currency, currency_rates FROM stores WHERE LOWER(slug) = LOWER($1)", [slug]);
    console.log("Store found:", storeRes.rows.length);
    if (storeRes.rows.length > 0) {
      console.log("Store:", storeRes.rows[0]);
    }
  } catch (e) {
    console.error("Query failed", e);
  } finally {
    await pool.end();
  }
}
check();
