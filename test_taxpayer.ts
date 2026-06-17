import { pool } from "./models/db";
import { MySoftService } from "./src/services/backend/mysoftService";

async function run() {
  try {
    const res = await pool.query(
      "SELECT id, name, einvoice_settings FROM stores WHERE einvoice_settings IS NOT NULL"
    );
    console.log("Stores with settings:");
    for (const row of res.rows) {
      console.log(`- Store ID: ${row.id}, Name: ${row.name}, Active: ${row.einvoice_settings?.is_active}, Provider: ${row.einvoice_settings?.provider}`);
      if (row.einvoice_settings?.is_active && row.einvoice_settings?.provider === "mysoft") {
        console.log(`[test_taxpayer] Initializing MySoftService using settings of Store ID: ${row.id}...`);
        const service = new MySoftService(row.einvoice_settings);
        
        const vkn = "8970435823";
        console.log(`[test_taxpayer] Checking VKN: ${vkn}`);
        try {
          const result = await service.checkTaxpayer(vkn);
          console.log(`[test_taxpayer] RESULT:`, result);
        } catch (err: any) {
          console.error(`[test_taxpayer] ERROR checking VKN ${vkn}:`, err.message || err);
          if (err.response) {
            console.error(`[test_taxpayer] Error Response Data:`, err.response.data);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error in runner:", err);
  } finally {
    await pool.end();
  }
}

run();
