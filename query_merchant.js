import { pool } from "./models/db.js";
import { HepsiburadaService } from "./src/services/backend/hepsiburadaService.js";
import axios from "axios";

async function run() {
  const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = 2");
  const settings = storeRes.rows[0]?.hepsiburada_settings;
  const hbService = new HepsiburadaService(settings, 2);
  const headers = hbService.getHeaders();
  const merchantId = settings.merchantId;

  // Let's check listing search endpoint on Hepsiburada
  const urls = [
    `https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}/sku/HB00001BWW26`,
    `https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}?hepsiburadaSku=HB00001BWW26`,
    `https://mpop.hepsiburada.com/product/api/products/search?hepsiburadaSku=HB00001BWW26`
  ];

  for (const u of urls) {
    try {
      const res = await axios.get(u, { headers, timeout: 10000 });
      console.log("URL:", u, "STATUS:", res.status, "DATA:", res.data);
    } catch (e) {
      console.log("URL:", u, "ERR:", e.response?.status, e.response?.data || e.message);
    }
  }
}
run();
