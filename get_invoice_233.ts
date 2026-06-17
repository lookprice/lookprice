import { pool } from "./models/db";

async function run() {
  try {
    const res = await pool.query(
      "SELECT * FROM sales_invoices WHERE id = 233"
    );
    console.log("Invoice 233 Details:", JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
