import { pool } from "./models/db.js";
import { HepsiburadaService } from "./src/services/backend/hepsiburadaService.js";
import axios from "axios";

async function run() {
  const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = 2");
  const settings = storeRes.rows[0]?.hepsiburada_settings;
  const hbService = new HepsiburadaService(settings, 2);

  const prodRes = await pool.query("SELECT * FROM products WHERE barcode = '4016032456063'");
  const p = prodRes.rows[0];

  const productPayload = {
    categoryId: 106861, // Notebook Standları
    attributes: {
      merchantSku: p.barcode.trim(),
      VaryantGroupID: `GRP-${p.barcode.trim()}`,
      Barcode: p.barcode.trim(),
      UrunAdi: p.name,
      UrunAciklamasi: `<p>${p.description || p.name}</p>`,
      Marka: "DIGITUS",
      GarantiSuresi: 24,
      tax_vat_rate: "20",
      price: "529.47",
      stock: "14",
      kg: "1",
      Image1: p.image_url || "https://de.assmann.shop/out/pictures/master/product/1/DA90368_4016032456063_Front_1_RGB.jpg"
    }
  };

  console.log("Submitting catalog product with categoryId 106861...");
  const catRes = await hbService.importCatalogProducts([productPayload]);
  console.log("CATALOG IMPORT RES:", catRes);

  if (catRes.trackingId) {
    // Wait 3 seconds and check tracking status
    await new Promise(r => setTimeout(r, 4000));
    const headers = hbService.getHeaders();
    const trackUrl = `https://mpop.hepsiburada.com/product/api/products/status/${catRes.trackingId}`;
    const statusRes = await axios.get(trackUrl, { headers });
    console.log("TRACKING STATUS:", JSON.stringify(statusRes.data, null, 2));

    // Also update product in db
    let mpData = p.marketplace_data;
    if (typeof mpData === "string") mpData = JSON.parse(mpData);
    mpData = mpData || {};
    mpData.hepsiburada = {
      categoryId: 106861,
      attributes: productPayload.attributes,
      catalogTrackingId: catRes.trackingId,
      lastSync: new Date().toISOString()
    };
    await pool.query(
      "UPDATE products SET marketplace_data = $1, is_hepsiburada_active = true, hepsiburada_last_sync = NOW() WHERE barcode = '4016032456063'",
      [JSON.stringify(mpData)]
    );
    console.log("Updated product in database!");
  }
}
run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
