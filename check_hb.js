import { pool } from "./models/db.js";
import { HepsiburadaService } from "./src/services/backend/hepsiburadaService.js";
import axios from "axios";

async function checkHBStatus() {
  try {
    const prodRes = await pool.query(
      "SELECT id, store_id, name, barcode, price, stock_quantity, marketplace_data FROM products WHERE barcode LIKE '%4016032456063%'"
    );
    const p = prodRes.rows[0];
    if (!p) {
      console.log("PRODUCT NOT FOUND");
      process.exit(0);
    }
    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [p.store_id]);
    const settings = storeRes.rows[0]?.hepsiburada_settings;
    
    const hbService = new HepsiburadaService(settings, p.store_id);
    const headers = hbService.getHeaders();
    const merchantId = settings.merchantId;
    
    let mpData = p.marketplace_data;
    if (typeof mpData === "string") mpData = JSON.parse(mpData);
    const hbData = mpData?.hepsiburada || {};

    console.log("Product:", {
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      hbData: {
        categoryId: hbData.categoryId,
        catalogTrackingId: hbData.catalogTrackingId,
        listingTrackingId: hbData.listingTrackingId,
        lastSync: hbData.lastSync
      }
    });

    // 1. Check Catalog Tracking ID
    if (hbData.catalogTrackingId) {
      try {
        const catTrackUrl = `https://mpop.hepsiburada.com/product/api/products/status/${hbData.catalogTrackingId}`;
        const catRes = await axios.get(catTrackUrl, { headers, timeout: 10000 });
        console.log("CATALOG TRACKING STATUS RESULT:", JSON.stringify(catRes.data, null, 2));
      } catch (e) {
        console.log("CATALOG STATUS ERROR:", e.response?.data || e.message);
      }
    }

    // 2. Check Listing Tracking ID
    if (hbData.listingTrackingId) {
      try {
        const listTrackUrl = `https://listing-external.hepsiburada.com/inventory/import/status/${merchantId}/task/${hbData.listingTrackingId}`;
        const listRes = await axios.get(listTrackUrl, { headers, timeout: 10000 });
        console.log("LISTING TRACKING STATUS RESULT:", JSON.stringify(listRes.data, null, 2));
      } catch (e) {
        console.log("LISTING STATUS ERROR:", e.response?.data || e.message);
      }
    }

    // 3. Search HB Listings by MerchantSku / Barcode
    try {
      const listingUrl = `https://listing-external.hepsiburada.com/listings/merchantid/${merchantId}?limit=100&offset=0`;
      const allListings = await axios.get(listingUrl, { headers, timeout: 10000 });
      const listings = allListings.data?.listings || allListings.data || [];
      console.log("TOTAL LISTINGS IN HB FOR MERCHANT:", listings.length);
      const match = listings.find((l) => 
        l.merchantSku === p.barcode || 
        l.barcode === p.barcode ||
        l.hepsiburadaSku === 'HB00001BWW26' ||
        (l.productName && l.productName.toLowerCase().includes('da-90368'))
      );
      console.log("MATCH IN LISTINGS:", match ? JSON.stringify(match, null, 2) : "NOT FOUND IN CURRENT LISTINGS");
    } catch (e) {
      console.log("LISTINGS QUERY ERROR:", e.response?.data || e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error("Fatal:", err);
    process.exit(1);
  }
}

checkHBStatus();
