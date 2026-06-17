import { pool } from "../models/db";

async function debugEnrakipsiz() {
  try {
    const result = await pool.query("SELECT * FROM enrakipsiz_settings");
    console.log("enrakipsiz_settings:", JSON.stringify(result.rows, null, 2));
  } catch (error) {
    console.error("Error fetching settings:", error);
  } finally {
    await pool.end();
  }
}

debugEnrakipsiz();
