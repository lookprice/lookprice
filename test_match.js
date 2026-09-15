import { pool } from "./models/db.js";
import { HepsiburadaService } from "./src/services/backend/hepsiburadaService.js";
import axios from "axios";

async function run() {
  const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = 2");
  const settings = storeRes.rows[0]?.hepsiburada_settings;
  const hbService = new HepsiburadaService(settings, 2);
  const headers = hbService.getHeaders();
  const merchantId = settings.merchantId;

  // Let's test the listing creation / matching endpoints for a merchant
  const testEndpoints = [
    {
      name: "Listings POST single",
      url: `https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}`,
      method: "POST",
      data: [{
        hepsiburadaSku: "HB00001BWW26",
        merchantSku: "4016032456063",
        price: 529.47,
        availableStock: 14,
        dispatchTime: 1
      }]
    },
    {
      name: "Listing V2 GW POST",
      url: `https://listing-external-v2-gw.hepsiburada.com/inventory/import/${merchantId}`,
      method: "POST",
      data: [{
        HepsiburadaSku: "HB00001BWW26",
        MerchantSku: "4016032456063",
        Price: 529.47,
        AvailableStock: 14,
        DispatchTime: 1
      }]
    }
  ];

  for (const ep of testEndpoints) {
    try {
      console.log("Testing", ep.name, ep.url);
      const res = await axios({
        method: ep.method,
        url: ep.url,
        data: ep.data,
        headers,
        timeout: 10000
      });
      console.log(ep.name, "STATUS:", res.status, "DATA:", res.data);
    } catch (e) {
      console.log(ep.name, "ERR:", e.response?.status, e.response?.data || e.message);
    }
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
