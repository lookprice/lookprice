import { pool } from "./models/db";
import { syncN11Orders, syncHepsiburadaOrders, syncTrendyolOrders, syncPazaramaOrders } from "./src/services/marketplaceSync";

async function runSync() {
    console.log("--- Sync Test Başlıyor ---");
    // Tüm store'ları kontrol edelim
    const storesRes = await pool.query("SELECT id, name, n11_settings, hepsiburada_settings, trendyol_settings, pazarama_settings FROM stores");
    
    for (const store of storesRes.rows) {
        console.log(`\nMağaza Kontrolü: ${store.name} (ID: ${store.id})`);
        console.log(`Ayarlar: N11:${!!store.n11_settings?.appKey}, HB:${!!store.hepsiburada_settings?.apiKey}, TY:${!!store.trendyol_settings?.apiKey}, PZ:${!!store.pazarama_settings?.apiKey}`);
        
        if (store.n11_settings?.appKey) {
            console.log("N11 Sync denemesi...");
            try { const orders = await syncN11Orders(pool, store.id, store.n11_settings); console.log(`N11 Başarılı: ${orders.length} sipariş.`); } catch(e: any) { console.error("N11 Hata:", e.message); }
        }
        if (store.hepsiburada_settings?.apiKey) {
            console.log("HB Sync denemesi...");
            try { const orders = await syncHepsiburadaOrders(pool, store.id, store.hepsiburada_settings); console.log(`HB Başarılı: ${orders.length} sipariş.`); } catch(e: any) { console.error("HB Hata:", e.message); }
        }
        if (store.trendyol_settings?.apiKey) {
            console.log("TY Sync denemesi...");
            try { const orders = await syncTrendyolOrders(pool, store.id, store.trendyol_settings); console.log(`TY Başarılı: ${orders.length} sipariş.`); } catch(e: any) { console.error("TY Hata:", e.message); }
        }
        if (store.pazarama_settings?.apiKey) {
            console.log("PZ Sync denemesi...");
            try { const orders = await syncPazaramaOrders(pool, store.id, store.pazarama_settings); console.log(`PZ Başarılı: ${orders.length} sipariş.`); } catch(e: any) { console.error("PZ Hata:", e.message); }
        }
    }
    console.log("\n--- Sync Test Bitti ---");
}
runSync().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
