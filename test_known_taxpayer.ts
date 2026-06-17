import { pool } from "./models/db";
import { MySoftService } from "./src/services/backend/mysoftService";

async function run() {
  try {
    const invoicesRes = await pool.query(
      "SELECT * FROM sales_invoices ORDER BY created_at DESC LIMIT 5"
    );
    console.log("Recently created/sent invoices:");
    for (const inv of invoicesRes.rows) {
      console.log(`- Invoice ID: ${inv.id}, Customer Name: ${inv.customer_name}, VKN: ${inv.tax_number}, DocType: ${inv.e_document_type}, Status: ${inv.integration_status}`);
    }

    const storesRes = await pool.query(
      "SELECT id, einvoice_settings FROM stores WHERE id = 2"
    );
    if (storesRes.rows.length > 0 && storesRes.rows[0].einvoice_settings) {
      const service = new MySoftService(storesRes.rows[0].einvoice_settings);
      
      const testVkns = ["8790017566", "11111111111", "8970435823"]; 
      const dbEfaturaVkns = invoicesRes.rows.filter(inv => inv.e_document_type === "E-FATURA").map(inv => inv.tax_number);
      for (const v of dbEfaturaVkns) {
        if (!v) continue;
        const cleanV = String(v).replace(/\D/g, '');
        if (cleanV && !testVkns.includes(cleanV)) testVkns.push(cleanV);
      }
      
      console.log("\n--- RUNNING LIVE TAXPAYER TESTS ---");
      for (const vkn of testVkns) {
        console.log(`\nChecking VKN checkTaxpayer for: ${vkn}`);
        try {
          const res = await service.checkTaxpayer(vkn);
          console.log(`RESULT for ${vkn}:`, res);
        } catch (err: any) {
          console.error(`ERROR for ${vkn}:`, err.message || err);
        }
      }
    }
  } catch (err) {
    console.error("Error running test:", err);
  } finally {
    await pool.end();
  }
}

run();
