import { pool } from "./models/db";
async function check() {
  try {
    const storeId = 2; // GAP
    const res = await pool.query("SELECT einvoice_settings FROM stores WHERE id = $1", [storeId]);
    console.log("Settings:", res.rows[0].einvoice_settings);
  } catch (e) {
    console.error("Error", e);
  } finally {
    await pool.end();
  }
}
check();
