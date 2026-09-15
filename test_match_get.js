import { pool } from "./models/db.js";
import { HepsiburadaService } from "./src/services/backend/hepsiburadaService.js";
import axios from "axios";

async function run() {
  const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = 2");
  const settings = storeRes.rows[0]?.hepsiburada_settings;
  const hbService = new HepsiburadaService(settings, 2);
  const headers = hbService.getHeaders();
  const merchantId = settings.merchantId;

  // 1. Check the result of trackingId 70126012-97bb-4a01-ada0-4a3df899c6b9
  const trackUrl = `https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}/inventory-uploads/id/70126012-97bb-4a01-ada0-4a3df899c6b9`;
  try {
    const res = await axios.get(trackUrl, { headers, timeout: 5000 });
    console.log("INVENTORY TRACKING RESULT:", JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.log("TRACK ERR:", e.message);
  }

  // 2. Test GET https://mpop.hepsiburada.com/product/api/products/match with query params
  const matchUrls = [
    `https://mpop.hepsiburada.com/product/api/products/match?barcode=4016032456063`,
    `https://mpop.hepsiburada.com/product/api/products/match?hepsiburadaSku=HB00001BWW26`,
    `https://mpop.hepsiburada.com/product/api/products/match?merchantSku=4016032456063`
  ];

  for (const u of matchUrls) {
    try {
      const res = await axios.get(u, { headers, timeout: 5000 });
      console.log("MATCH RES:", u, "DATA:", JSON.stringify(res.data, null, 2));
    } catch(e) {
      console.log("MATCH ERR:", u, e.response?.status, e.response?.data || e.message);
    }
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
