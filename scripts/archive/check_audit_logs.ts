import { pool } from "./models/db";
async function check() {
  try {
    const res = await pool.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5");
    console.log(res.rows);
  } catch (e) {
    console.error("Error", e);
  } finally {
    await pool.end();
  }
}
check();
