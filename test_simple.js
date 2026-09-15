import { pool } from "./models/db.js";
import { HepsiburadaService } from "./src/services/backend/hepsiburadaService.js";
import axios from "axios";

async function run() {
  const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = 2");
  const settings = storeRes.rows[0]?.hepsiburada_settings;
  const hbService = new HepsiburadaService(settings, 2);
  const headers = hbService.getHeaders();
  const merchantId = settings.merchantId;

  console.log("Testing merchant listings count...");
  const res = await axios.get(`https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}?limit=10&offset=0`, { headers, timeout: 5000 });
  console.log("Total:", res.data?.total);
  if (res.data?.listings && res.data.listings.length > 0) {
    console.log("Sample Listing:", res.data.listings[0]);
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
