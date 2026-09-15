import { pool } from "./models/db.js";
import { HepsiburadaService } from "./src/services/backend/hepsiburadaService.js";
import axios from "axios";

async function run() {
  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = 2");
    const settings = storeRes.rows[0]?.hepsiburada_settings;
    const hbService = new HepsiburadaService(settings, 2);
    const headers = hbService.getHeaders();
    const merchantId = settings.merchantId;
    const trackingId = "2ed93afd-5fa1-425a-a56a-0f29a62cd657";

    const urls = [
      `https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}/inventory-uploads/id/${trackingId}`,
      `https://listing-external.hepsiburada.com/inventory/import/status/${merchantId}/task/${trackingId}`,
      `https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}/sku/4016032456063`
    ];

    for (const u of urls) {
      try {
        const res = await axios.get(u, { headers, timeout: 10000 });
        console.log("URL:", u, "STATUS:", res.status, "DATA:", JSON.stringify(res.data, null, 2));
      } catch (e) {
        console.log("URL:", u, "ERR:", e.response?.status, e.response?.data || e.message);
      }
    }
  } finally {
    process.exit(0);
  }
}
run();
