import { pool } from "../models/db.js";

async function run() {
  try {
    const res = await pool.query("SELECT id, title, store_id FROM companies WHERE title ILIKE '%Arçelik%' OR title ILIKE '%Arcelik%'");
    console.log("--- MATCHING COMPANIES ---");
    console.log(res.rows);

    if (res.rows.length > 0) {
      const companyId = res.rows[0].id;
      const txs = await pool.query("SELECT id, company_id, amount, type, currency, transaction_date, description FROM current_account_transactions WHERE company_id = $1", [companyId]);
      console.log(`--- TRANSACTIONS FOR COMPANY ${companyId} ---`);
      console.log(txs.rows);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await pool.end();
  }
}

run();
