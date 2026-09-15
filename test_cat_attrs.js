import { pool } from "./models/db.js";
import { HepsiburadaService } from "./src/services/backend/hepsiburadaService.js";
import axios from "axios";

async function run() {
  const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = 2");
  const settings = storeRes.rows[0]?.hepsiburada_settings;
  const hbService = new HepsiburadaService(settings, 2);
  const headers = hbService.getHeaders();

  // Category 106861: Notebook Standları
  const url = `https://mpop.hepsiburada.com/product/api/categories/106861/attributes`;
  try {
    const res = await axios.get(url, { headers });
    console.log("ATTRIBUTES FOR 106861 (Notebook Standları):", JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log("ERR:", e.response?.status, e.response?.data || e.message);
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
