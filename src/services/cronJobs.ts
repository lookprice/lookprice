import cron from 'node-cron';
import { pool } from '../../models/db';
import axios from 'axios';
import xml2js from 'xml2js';
import { HepsiburadaService } from './backend/hepsiburadaService';
import { AmazonService } from './backend/amazonService';
import { IntegrationService } from './IntegrationService';
import { fetchTCMBRatesWithRetry } from '../utils/tcmbFetcher';

export function startCronJobs() {
  console.log("Starting cron jobs...");

  // Run TCMB sync immediately on startup
  syncTCMBRates().catch(err => {
    console.warn("[CRON] Initial TCMB sync on startup failed:", err.message);
  });

  // Run initial marketplace order syncs on startup (after 5 seconds delay)
  setTimeout(() => {
    syncHepsiburadaOrdersCron().catch(err => {
      console.warn("[CRON] Initial Hepsiburada order sync failed:", err.message);
    });
    syncAmazonOrdersCron().catch(err => {
      console.warn("[CRON] Initial Amazon order sync failed:", err.message);
    });
    syncHepsiburadaPendingAndListingsCron().catch(err => {
      console.warn("[CRON] Initial Hepsiburada listings sync failed:", err.message);
    });
  }, 5000);

  // High-frequency Hepsiburada Order Sync (Every 5 minutes)
  cron.schedule('*/5 * * * *', async () => {
    console.log("[CRON] Running Hepsiburada order sync (5-minute interval)...");
    await syncHepsiburadaOrdersCron();
  });

  // Hepsiburada Pending Approval & Listings Reconciliation (Every 15 minutes)
  cron.schedule('*/15 * * * *', async () => {
    console.log("[CRON] Running Hepsiburada pending approvals & listings reconciliation...");
    await syncHepsiburadaPendingAndListingsCron();
  });

  // Amazon Order Sync (Every 10 minutes)
  cron.schedule('*/10 * * * *', async () => {
    console.log("[CRON] Running Amazon order sync...");
    await syncAmazonOrdersCron();
  });

  // Comprehensive Marketplace Inventory & Price Reconciliation (Every 30 minutes)
  cron.schedule('*/30 * * * *', async () => {
    console.log("[CRON] Running 30-min Marketplace Price & Inventory Reconciliation...");
    await reconcileMarketplaceInventoriesAndPrices();
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

/**
 * Periodically reconciles Hepsiburada live listings and auto-promotes approved items from "Onay Bekliyor" to "Satışta"
 */
export async function syncHepsiburadaPendingAndListingsCron() {
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

        if (merchantId && apiSecret) {
          const cleanSettings = {
            ...settings,
            merchantId,
            apiKey,
            apiSecret,
            isTestMode: Boolean(settings?.isTestMode)
          };

          const hbService = new HepsiburadaService(cleanSettings, store.id);
          const result = await hbService.matchListingsWithStoreProducts({ importMissing: false });

          if (result.matchedCount > 0) {
            console.log(`[CRON-HB] Store #${store.id} (${store.name}): ${result.matchedCount} onay bekleyen/eşleşen ürün Hepsiburada canlı satışına bağlandı.`);
          }
        }
      } catch (storeErr: any) {
        console.warn(`[CRON-HB] Store #${store.id} ilan/onay senkronizasyon uyarısı:`, storeErr.message || storeErr);
      }
    }
  } catch (err: any) {
    console.error("[CRON-HB] Genel Hepsiburada ilan senkronizasyon hatası:", err.message || err);
  }
}

export async function syncTCMBRates() {
  try {
    const { rates, tcmbDate } = await fetchTCMBRatesWithRetry();
    
    if (Object.keys(rates).length > 0) {
      console.log(`[CRON] Extracted TCMB ForexBuying rates for date ${tcmbDate || 'Current'}:`, rates);
      
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
          mpData = mpData || {};
          if (!mpData.hepsiburada) mpData.hepsiburada = {};
          if (!mpData.hepsiburada.attributes) mpData.hepsiburada.attributes = {};
          mpData.hepsiburada.attributes.price = String(effectivePrice);
          mpData.hepsiburada.lastSync = new Date().toISOString();
          p.marketplace_data = mpData;

          const hbMerchantSku = mpData?.hepsiburada?.merchantSku || p.barcode;

          return {
            productId: p.id,
            marketplaceData: mpData,
            MerchantSku: hbMerchantSku,
            HepsiburadaSku: p.hepsiburada_sku || "",
            Price: effectivePrice,
            AvailableStock: parseInt(p.stock_quantity || "0", 10),
            DispatchTime: hbSettings.defaultDispatchTime || 1,
          };
        });

        const updateRes = await hbService.updatePriceAndStock(inventoryItems.map(({ MerchantSku, HepsiburadaSku, Price, AvailableStock, DispatchTime }) => ({
          MerchantSku, HepsiburadaSku, Price, AvailableStock, DispatchTime
        })));
        console.log(`[CRON-CURRENCY] Store #${storeId} (${store.name}): Hepsiburada ${inventoryItems.length} ürünün döviz bazlı fiyatı güncellendi. Sonuç:`, updateRes?.success ? 'BAŞARILI' : 'TAMAMLANDI');
        
        for (const it of inventoryItems) {
          await pool.query(
            `UPDATE products 
             SET hepsiburada_last_sync = NOW(), hepsiburada_last_error = NULL, marketplace_data = $1 
             WHERE id = $2`,
            [JSON.stringify(it.marketplaceData), it.productId]
          );
        }
      }
    }

    // 2. Amazon TR Price & Stock Push
    let amzSettings = store.amazon_settings;
    if (typeof amzSettings === 'string') {
      try { amzSettings = JSON.parse(amzSettings); } catch (e) { amzSettings = {}; }
    }
    if (!amzSettings?.sellerId) {
      amzSettings = store.branding?.amazon_settings || amzSettings || {};
    }

    if (amzSettings?.sellerId && (amzSettings?.refresh_token || amzSettings?.refreshToken)) {
      const amzService = new AmazonService(amzSettings, storeId);
      const amzProductsRes = await pool.query(
        `SELECT id, name, category, sub_category, barcode, sku, price, currency, stock_quantity, amazon_asin, amazon_sku, is_amazon_active, marketplace_data 
         FROM products 
         WHERE store_id = $1 AND is_amazon_active = true AND amazon_asin IS NOT NULL AND amazon_asin != '' AND amazon_asin NOT LIKE 'http%'`,
        [storeId]
      );

      for (const p of amzProductsRes.rows) {
        try {
          let rawPrice = parseFloat(p.price || "0");
          const curr = (p.currency || "TRY").toUpperCase();
          if (curr === "USD" && effectiveRates!.USD) {
            rawPrice = rawPrice * Number(effectiveRates!.USD);
          } else if (curr === "EUR" && effectiveRates!.EUR) {
            rawPrice = rawPrice * Number(effectiveRates!.EUR);
          } else if (curr === "GBP" && effectiveRates!.GBP) {
            rawPrice = rawPrice * Number(effectiveRates!.GBP);
          }

          const effectivePrice = amzService.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);
          const sellerSku = p.amazon_sku || p.sku || p.barcode;
          const stock = parseInt(p.stock_quantity || "0", 10);

          let mpData: any = p.marketplace_data;
          if (typeof mpData === "string") {
            try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
          }
          mpData = mpData || {};
          if (!mpData.amazon) mpData.amazon = {};
          if (!mpData.amazon.attributes) mpData.amazon.attributes = {};
          mpData.amazon.attributes.price = String(effectivePrice);
          mpData.amazon.lastSync = new Date().toISOString();
          if (!mpData.attributes) mpData.attributes = {};
          mpData.attributes.price = String(effectivePrice);

          if (sellerSku && effectivePrice > 0) {
            const res = await amzService.updateListingsItem(sellerSku, effectivePrice, stock);
            await pool.query(
              "UPDATE products SET amazon_last_sync = NOW(), amazon_last_error = $1, marketplace_data = $2 WHERE id = $3",
              [res.success ? null : res.message, JSON.stringify(mpData), p.id]
            );
          }
        } catch (itemErr: any) {
          console.warn(`[CRON-CURRENCY-AMZ] Product #${p.id} update error:`, itemErr.message);
        }
      }
      console.log(`[CRON-CURRENCY] Store #${storeId} (${store.name}): Amazon TR ${amzProductsRes.rows.length} ürünün fiyat ve stoğu güncellendi.`);
    }

    // 3. Update marketplace_data prices for other active channels (Trendyol, N11, Pazarama)
    const otherProductsRes = await pool.query(
      `SELECT id, name, category, sub_category, price, currency, marketplace_data 
       FROM products 
       WHERE store_id = $1 AND currency IN ('USD', 'EUR', 'GBP')`,
      [storeId]
    );

    const hbHelper = new HepsiburadaService(hbSettings || {}, storeId);
    for (const p of otherProductsRes.rows) {
      let rawPrice = parseFloat(p.price || "0");
      const curr = (p.currency || "TRY").toUpperCase();
      if (curr === "USD" && effectiveRates!.USD) rawPrice *= Number(effectiveRates!.USD);
      else if (curr === "EUR" && effectiveRates!.EUR) rawPrice *= Number(effectiveRates!.EUR);
      else if (curr === "GBP" && effectiveRates!.GBP) rawPrice *= Number(effectiveRates!.GBP);

      const calculatedPrice = hbHelper.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);
      if (calculatedPrice > 0) {
        let mpData: any = p.marketplace_data;
        if (typeof mpData === "string") {
          try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
        }
        mpData = mpData || {};
        
        ['trendyol', 'n11', 'pazarama', 'attributes'].forEach((ch) => {
          if (!mpData[ch]) mpData[ch] = {};
          if (ch === 'attributes') {
            mpData.attributes.price = String(calculatedPrice);
          } else {
            if (!mpData[ch].attributes) mpData[ch].attributes = {};
            mpData[ch].attributes.price = String(calculatedPrice);
          }
        });

        await pool.query(
          "UPDATE products SET marketplace_data = $1 WHERE id = $2",
          [JSON.stringify(mpData), p.id]
        );
      }
    }
  } catch (err: any) {
    console.error(`[CRON-CURRENCY] Store #${storeId} pazaryeri fiyat revizyonu hatası:`, err.message || err);
  }
}

/**
 * Periodically reconciles all active marketplace product prices and stocks across all channels
 */
export async function reconcileMarketplaceInventoriesAndPrices() {
  try {
    const storesRes = await pool.query("SELECT id, name FROM stores");
    for (const store of storesRes.rows) {
      await syncMarketplacePricesOnRateChange(store.id);
    }
  } catch (err: any) {
    console.error("[CRON-RECONCILE] Marketplace reconciliation error:", err.message || err);
  }
}

/**
 * Periodically syncs Amazon orders for all configured stores
 */
export async function syncAmazonOrdersCron() {
  try {
    const storesRes = await pool.query("SELECT id, name, amazon_settings, branding FROM stores");
    for (const store of storesRes.rows) {
      try {
        let settings = store.amazon_settings;
        if (typeof settings === 'string') {
          try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
        }
        let branding = store.branding;
        if (typeof branding === 'string') {
          try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
        }

        if (!settings || (!settings.refresh_token && !settings.refreshToken)) {
          settings = branding?.amazon_settings || settings || {};
        }

        const refreshToken = (settings?.refresh_token || settings?.refreshToken || "").trim();
        if (refreshToken) {
          const amzService = new AmazonService(settings, store.id);
          const { syncedCount, errors } = await amzService.syncOrdersToDatabase({ days: 30 });
          if (syncedCount > 0) {
            console.log(`[CRON-AMZ] Store #${store.id} (${store.name}): ${syncedCount} yeni Amazon siparişi başarıyla çekildi ve sisteme işlendi.`);
          }
          if (errors && errors.length > 0) {
            console.warn(`[CRON-AMZ] Store #${store.id} Amazon sipariş senkronizasyonunda bazı uyarılar:`, errors.map((e: any) => e.error || e.message || e));
          }
        }
      } catch (storeErr: any) {
        console.error(`[CRON-AMZ] Store #${store.id} senkronizasyon hatası:`, storeErr.message || storeErr);
      }
    }
  } catch (err: any) {
    console.error("[CRON-AMZ] Genel Amazon sipariş senkronizasyonu hatası:", err.message || err);
  }
}
