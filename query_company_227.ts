import { pool } from "./models/db";

async function run() {
  try {
    const res = await pool.query(
      "SELECT * FROM companies WHERE id = 227"
    );
    console.log("Company ID 227 Details:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
