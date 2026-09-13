import cron from 'node-cron';
import { pool } from '../../models/db';
import axios from 'axios';
import xml2js from 'xml2js';
import { HepsiburadaService } from './backend/hepsiburadaService';
import { IntegrationService } from './IntegrationService';

export function startCronJobs() {
  console.log("Starting cron jobs...");

  // Run TCMB sync immediately on startup
  syncTCMBRates().catch(err => {
    console.warn("[CRON] Initial TCMB sync on startup failed:", err.message);
  });

  // Run initial Hepsiburada order sync on startup (after 5 seconds delay)
  setTimeout(() => {
    syncHepsiburadaOrdersCron().catch(err => {
      console.warn("[CRON] Initial Hepsiburada order sync failed:", err.message);
    });
  }, 5000);

  // High-frequency Hepsiburada Order Sync (Every 5 minutes)
  cron.schedule('*/5 * * * *', async () => {
    console.log("[CRON] Running Hepsiburada order sync (5-minute interval)...");
    await syncHepsiburadaOrdersCron();
  });

  // Amazon Order Sync (Every 10 minutes)
  cron.schedule('*/10 * * * *', async () => {
    console.log("[CRON] Running Amazon order sync...");
    try {
      const stores = await pool.query("SELECT id, amazon_settings FROM stores WHERE amazon_settings IS NOT NULL");
      for (const store of stores.rows) {
        if (store.amazon_settings && store.amazon_settings.accessToken) {
          console.log(`[CRON] Syncing Amazon for store ${store.id}`);
        }
      }
    } catch (e) {
      console.error("[CRON] Amazon sync failed", e);
    }
  });

  // TCMB Currency Rate Sync (Multiple daily syncs: 09:30, 12:00, 15:45 TCMB announcement, 18:00 official close)
  cron.schedule('30 9 * * *', async () => {
    console.log("[CRON] Running TCMB currency rate sync (Morning 09:30)...");
    await syncTCMBRates();
  });

  cron.schedule('0 12 * * *', async () => {
    console.log("[CRON] Running TCMB currency rate sync (Midday 12:00)...");
    await syncTCMBRates();
  });

  cron.schedule('45 15 * * *', async () => {
    console.log("[CRON] Running TCMB currency rate sync (Official TCMB Announcement 15:45)...");
    await syncTCMBRates();
  });

  cron.schedule('0 18 * * *', async () => {
    console.log("[CRON] Running TCMB currency rate sync (Evening Close 18:00)...");
    await syncTCMBRates();
  });

  console.log("Cron jobs started.");
}

/**
 * Periodically syncs Hepsiburada orders for all configured stores
 */
export async function syncHepsiburadaOrdersCron() {
  try {
    const storesRes = await pool.query("SELECT id, name, hepsiburada_settings, branding FROM stores");
    for (const store of storesRes.rows) {
      try {
        let settings = store.hepsiburada_settings;
        if (typeof settings === 'string') {
          try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
        }
        let branding = store.branding;
        if (typeof branding === 'string') {
          try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
        }

        if (!settings || !settings.merchantId) {
          settings = branding?.hepsiburada_settings || settings || {};
        }

        const merchantId = String(settings?.merchantId || "").trim();
        const apiSecret = String(settings?.apiSecret || "").trim();
        const apiKey = String(settings?.apiKey || "lookprice_dev").trim() || "lookprice_dev";

        // Only sync if credentials are configured
        if (merchantId && apiSecret) {
          const cleanSettings = {
            ...settings,
            merchantId,
            apiKey,
            apiSecret,
            isTestMode: Boolean(settings?.isTestMode)
          };

          const hbService = new HepsiburadaService(cleanSettings, store.id);
          const { syncedCount, errors } = await hbService.syncOrdersToDatabase({ timespan: 30 });
          if (syncedCount > 0) {
            console.log(`[CRON-HB] Store #${store.id} (${store.name}): ${syncedCount} yeni Hepsiburada siparişi başarıyla çekildi ve sisteme işlendi.`);
          }
          if (errors && errors.length > 0) {
            console.warn(`[CRON-HB] Store #${store.id} sipariş senkronizasyonunda bazı uyarılar:`, errors.map((e: any) => e.message || e));
          }
        }
      } catch (storeErr: any) {
        console.error(`[CRON-HB] Store #${store.id} senkronizasyon hatası:`, storeErr.message || storeErr);
      }
    }
  } catch (err: any) {
    console.error("[CRON-HB] Genel Hepsiburada sipariş senkronizasyonu hatası:", err.message || err);
  }
}

export async function syncTCMBRates() {
  try {
    const { data } = await axios.get('https://www.tcmb.gov.tr/kurlar/today.xml');
    const parser = new xml2js.Parser();
    await new Promise<void>((resolve, reject) => {
      parser.parseString(data, async (err: any, result: any) => {
        if (err) {
          console.error("[CRON] TCMB sync failed to parse XML:", err);
          return resolve();
        }

        const tcmbDate = result?.Tarih_Date?.['$']?.Tarih;
        console.log(`[CRON] TCMB exchange rates date from XML: ${tcmbDate || 'Unknown'}`);

        const currencies = result?.Tarih_Date?.Currency;
        if (!currencies || !Array.isArray(currencies)) {
          console.error("[CRON] TCMB sync failed: Invalid XML structure.");
          return resolve();
        }

        const rates: Record<string, number> = {};
        for (const c of currencies) {
          const code = c['$']?.CurrencyCode || c['$']?.Kod;
          if (['USD', 'EUR', 'GBP'].includes(code)) {
            // Kara Kaplı Kitap Kuralı: Çapraz kurlar ve faturalandırma için Döviz Alış (ForexBuying) esastır.
            const rateStr = (c.ForexBuying && c.ForexBuying[0]) || (c.ForexSelling && c.ForexSelling[0]) || (c.BanknoteSelling && c.BanknoteSelling[0]);
            if (rateStr) {
              const rate = parseFloat(rateStr);
              if (!isNaN(rate)) {
                rates[code] = rate;
              }
            }
          }
        }

        if (Object.keys(rates).length > 0) {
          console.log(`[CRON] Extracted TCMB ForexBuying rates for date ${tcmbDate}:`, rates);
          
          try {
            // Update all stores
            const storesRes = await pool.query("SELECT id, currency_rates FROM stores");
            for (const store of storesRes.rows) {
              let currentRates = {};
              try {
                if (typeof store.currency_rates === 'string') {
                  currentRates = JSON.parse(store.currency_rates);
                } else if (typeof store.currency_rates === 'object' && store.currency_rates !== null) {
                  currentRates = store.currency_rates;
                }
              } catch (e) {
                // Ignore parse errors, fallback to empty
              }

              const newRates = {
                ...currentRates,
                ...rates
              };

              await pool.query(
                "UPDATE stores SET currency_rates = $1 WHERE id = $2",
                [JSON.stringify(newRates), store.id]
              );

              // Auto-sync revised prices for active marketplace products in foreign currencies
              syncMarketplacePricesOnRateChange(store.id, newRates).catch((syncErr) => {
                console.warn(`[CRON-CURRENCY] Store #${store.id} pazaryeri fiyat revizyonu hatası:`, syncErr.message || syncErr);
              });
            }
            console.log(`[CRON] TCMB ForexBuying rates synced successfully for ${storesRes.rowCount} stores.`);
          } catch (e: any) {
            console.error("[CRON] TCMB sync db update failed:", e);
          }
        } else {
          console.error("[CRON] TCMB sync failed: Could not extract any rates.");
        }
        resolve();
      });
    });
  } catch (error: any) {
    console.error("[CRON] TCMB sync failed:", error.message);
  }
}

/**
 * Automatically recalculates and pushes updated prices to Hepsiburada and other marketplaces
 * when currency exchange rates change for products priced in foreign currencies (USD, EUR, GBP).
 */
export async function syncMarketplacePricesOnRateChange(storeId: number, rates?: Record<string, number>) {
  try {
    const storeRes = await pool.query(
      "SELECT id, name, currency_rates, hepsiburada_settings, branding FROM stores WHERE id = $1",
      [storeId]
    );
    if (storeRes.rows.length === 0) return;
    const store = storeRes.rows[0];

    let effectiveRates = rates;
    if (!effectiveRates) {
      try {
        if (typeof store.currency_rates === 'string') {
          effectiveRates = JSON.parse(store.currency_rates);
        } else if (typeof store.currency_rates === 'object') {
          effectiveRates = store.currency_rates;
        }
      } catch (e) {
        effectiveRates = {};
      }
    }
    effectiveRates = effectiveRates || {};

    let hbSettings = store.hepsiburada_settings;
    if (typeof hbSettings === 'string') {
      try { hbSettings = JSON.parse(hbSettings); } catch (e) { hbSettings = {}; }
    }
    if (!hbSettings?.merchantId) {
      hbSettings = store.branding?.hepsiburada_settings || hbSettings || {};
    }

    // 1. Hepsiburada Price & Stock Push
    if (hbSettings?.merchantId && hbSettings?.apiSecret) {
      const hbService = new HepsiburadaService(hbSettings, storeId);
      
      const hbProductsRes = await pool.query(
        `SELECT id, name, category, sub_category, barcode, price, currency, stock_quantity, hepsiburada_sku, is_hepsiburada_active, marketplace_data 
         FROM products 
         WHERE store_id = $1 AND (is_hepsiburada_active = true OR hepsiburada_sku IS NOT NULL) AND barcode IS NOT NULL AND barcode != ''`,
        [storeId]
      );

      if (hbProductsRes.rows.length > 0) {
        const inventoryItems = hbProductsRes.rows.map((p) => {
          let rawPrice = parseFloat(p.price || "0");
          const curr = (p.currency || "TRY").toUpperCase();
          if (curr === "USD" && effectiveRates!.USD) {
            rawPrice = rawPrice * Number(effectiveRates!.USD);
          } else if (curr === "EUR" && effectiveRates!.EUR) {
            rawPrice = rawPrice * Number(effectiveRates!.EUR);
          } else if (curr === "GBP" && effectiveRates!.GBP) {
            rawPrice = rawPrice * Number(effectiveRates!.GBP);
          }

          const effectivePrice = hbService.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);
          let mpData: any = p.marketplace_data;
          if (typeof mpData === "string") {
            try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
          }
          const hbMerchantSku = mpData?.hepsiburada?.merchantSku || p.barcode;

          return {
            MerchantSku: hbMerchantSku,
            HepsiburadaSku: p.hepsiburada_sku || "",
            Price: effectivePrice,
            AvailableStock: parseInt(p.stock_quantity || "0", 10),
            DispatchTime: hbSettings.defaultDispatchTime || 1,
          };
        });

        const updateRes = await hbService.updatePriceAndStock(inventoryItems);
        console.log(`[CRON-CURRENCY] Store #${storeId} (${store.name}): Hepsiburada ${inventoryItems.length} ürünün döviz bazlı fiyatı güncellendi. Sonuç:`, updateRes?.success ? 'BAŞARILI' : 'TAMAMLANDI');
        
        await pool.query(
          `UPDATE products 
           SET hepsiburada_last_sync = NOW(), hepsiburada_last_error = NULL 
           WHERE store_id = $1 AND (is_hepsiburada_active = true OR hepsiburada_sku IS NOT NULL)`,
          [storeId]
        );
      }
    }
  } catch (err: any) {
    console.error(`[CRON-CURRENCY] Store #${storeId} pazaryeri fiyat revizyonu hatası:`, err.message || err);
  }
}
