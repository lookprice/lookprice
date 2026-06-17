import { pool } from "../models/db";

async function debugStores() {
  try {
    const result = await pool.query("SELECT custom_domain, count(*) as cnt FROM stores WHERE custom_domain IS NOT NULL GROUP BY custom_domain HAVING count(*) > 1");
    console.log("Duplicate custom domains:", JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error("Error fetching stores:", error);
  } finally {
    await pool.end();
  }
}

debugStores();
