import { pool } from "./models/db";
import { syncN11Orders, syncHepsiburadaOrders, syncTrendyolOrders, syncPazaramaOrders } from "./src/services/marketplaceSync";

async function runSync() {
    console.log("Starting marketplace sync test...");
    const storesRes = await pool.query("SELECT id, n11_settings, hepsiburada_settings, trendyol_settings, pazarama_settings FROM stores WHERE id IS NOT NULL LIMIT 1");
    
    for (const store of storesRes.rows) {
        console.log(`Processing store: ${store.id}`);
        
        // N11
        if (store.n11_settings && store.n11_settings.appKey) {
            console.log("Syncing N11...");
            try { await syncN11Orders(pool, store.id, store.n11_settings); } catch(e) { console.error("N11 Sync Error:", e); }
        } else {
            console.log("Skipping N11 (settings missing)");
        }
        
        // HB
        if (store.hepsiburada_settings && store.hepsiburada_settings.apiKey) {
            console.log("Syncing HB...");
            try { await syncHepsiburadaOrders(pool, store.id, store.hepsiburada_settings); } catch(e) { console.error("HB Sync Error:", e); }
        } else {
            console.log("Skipping HB (settings missing)");
        }
        
        // TY
        if (store.trendyol_settings && store.trendyol_settings.apiKey) {
            console.log("Syncing TY...");
            try { await syncTrendyolOrders(pool, store.id, store.trendyol_settings); } catch(e) { console.error("TY Sync Error:", e); }
        } else {
            console.log("Skipping TY (settings missing)");
        }
        
        // PZ
        if (store.pazarama_settings && store.pazarama_settings.apiKey) {
            console.log("Syncing PZ...");
            try { await syncPazaramaOrders(pool, store.id, store.pazarama_settings); } catch(e) { console.error("PZ Sync Error:", e); }
        } else {
            console.log("Skipping PZ (settings missing)");
        }
    }
    console.log("Sync test finished.");
}
runSync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
