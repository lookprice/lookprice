import { pool } from "./models/db";

async function run() {
  try {
    const res = await pool.query(
      "SELECT id, name, einvoice_settings, branding FROM stores"
    );
    console.log("All Stores Settings:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
