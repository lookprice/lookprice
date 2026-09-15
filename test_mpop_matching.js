import { pool } from "./models/db.js";
import { HepsiburadaService } from "./src/services/backend/hepsiburadaService.js";
import axios from "axios";

async function run() {
  const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = 2");
  const settings = storeRes.rows[0]?.hepsiburada_settings;
  const hbService = new HepsiburadaService(settings, 2);
  const headers = hbService.getHeaders();
  const merchantId = settings.merchantId;

  // Let's test catalog / matching endpoints
  const endpoints = [
    { url: `https://mpop.hepsiburada.com/product/api/products/import`, method: "OPTIONS" },
    { url: `https://mpop.hepsiburada.com/product/api/products/match`, method: "OPTIONS" },
    { url: `https://mpop.hepsiburada.com/product/api/products/match`, method: "POST", data: { barcode: "4016032456063" } },
    { url: `https://mpop.hepsiburada.com/product/api/products/match/barcode/4016032456063`, method: "GET" },
    { url: `https://mpop.hepsiburada.com/product/api/products/match/hepsiburadaSku/HB00001BWW26`, method: "GET" },
    { url: `https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}/inventory-uploads`, method: "POST", 
      data: [{ hepsiburadaSku: "HB00001BWW26", merchantSku: "HB00001BWW26", price: 529.47, availableStock: 14, dispatchTime: 1 }] 
    }
  ];

  for (const ep of endpoints) {
    try {
      const res = await axios({
        method: ep.method,
        url: ep.url,
        data: ep.data,
        headers,
        timeout: 6000
      });
      console.log(ep.method, ep.url, "STATUS:", res.status, "DATA:", res.data);
    } catch(e) {
      console.log(ep.method, ep.url, "ERR:", e.response?.status, e.response?.data || e.message);
    }
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
