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

    const payload = [
      {
        merchantSku: "4016032456063",
        hepsiburadaSku: "HB00001BWW26",
        price: 529.47,
        availableStock: 14,
        dispatchTime: 1,
        maximumPurchasableQuantity: 10
      }
    ];

    const url = `https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}/inventory-uploads`;
    console.log("Posting to:", url);
    const res = await axios.post(url, payload, { headers, timeout: 15000 });
    console.log("RESPONSE:", res.data);
    
    // update in database
    await pool.query(
      "UPDATE products SET hepsiburada_sku = 'HB00001BWW26', is_hepsiburada_active = true, hepsiburada_last_sync = NOW(), hepsiburada_last_error = NULL WHERE barcode = '4016032456063'"
    );
    console.log("UPDATED PRODUCT IN DATABASE TO HB00001BWW26");
  } catch (e) {
    console.error("FAIL:", e.response?.status, e.response?.data || e.message);
  } finally {
    process.exit(0);
  }
}
run();
