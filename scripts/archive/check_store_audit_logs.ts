import { pool } from "./models/db";
async function check() {
  try {
    const res = await pool.query("SELECT * FROM audit_logs WHERE store_id = 2 AND entity_type = 'store' ORDER BY created_at DESC LIMIT 10");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error("Error", e);
  } finally {
    await pool.end();
  }
}
check();
