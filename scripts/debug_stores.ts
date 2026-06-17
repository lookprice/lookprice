import { pool } from "../models/db";

async function debugStores() {
  try {
    const result = await pool.query("SELECT id, name, slug, custom_domain, parent_id FROM stores");
    console.log("Stores in database:", JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error("Error fetching stores:", error);
  } finally {
    await pool.end();
  }
}

debugStores();
