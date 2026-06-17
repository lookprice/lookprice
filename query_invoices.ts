import { pool } from "./models/db";

async function run() {
  try {
    const res = await pool.query(
      "SELECT id, document_number, ettn, integration_status, integration_message, e_document_type FROM sales_invoices WHERE integration_status IS NOT NULL ORDER BY id DESC LIMIT 50"
    );
    console.log("Invoice Audit Trail:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
