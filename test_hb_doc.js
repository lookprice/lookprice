import { pool } from "./models/db.js";
import { HepsiburadaService } from "./src/services/backend/hepsiburadaService.js";
import axios from "axios";

async function run() {
  const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = 2");
  const settings = storeRes.rows[0]?.hepsiburada_settings;
  const hbService = new HepsiburadaService(settings, 2);
  const headers = hbService.getHeaders();
  const merchantId = settings.merchantId;

  // Let's test checking merchant product catalog / search endpoints
  const endpoints = [
    `https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}/inventory-uploads`,
    `https://mpop.hepsiburada.com/product/api/categories/get-category/1000124`,
    `https://mpop.hepsiburada.com/product/api/categories/get-category/970`,
    `https://mpop.hepsiburada.com/product/api/categories/get-category/1067`
  ];

  for (const ep of endpoints) {
    try {
      const res = await axios.get(ep, { headers, timeout: 5000 });
      console.log("GET", ep, "STATUS:", res.status, "DATA:", res.data);
    } catch (e) {
      console.log("GET", ep, "ERR:", e.response?.status, e.response?.data || e.message);
    }
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
