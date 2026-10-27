import cron from 'node-cron';
import { pool } from '../../models/db';
import axios from 'axios';
import xml2js from 'xml2js';
import { HepsiburadaService } from './backend/hepsiburadaService';
import { AmazonService } from './backend/amazonService';
import { IntegrationService } from './IntegrationService';
import { fetchTCMBRatesWithRetry } from '../utils/tcmbFetcher';
import { syncStoreN11OrdersToDatabase } from './marketplaceSync';
import { runAutomatedSuperAdminDriveBackup, runSuperAdminArchiveAndSlimDB } from '../../routes/googleDrive';

export function startCronJobs() {
  console.log("Starting cron jobs...");

  // Run TCMB sync immediately on startup
  syncTCMBRates().catch(err => {
    console.warn("[CRON] Initial TCMB sync on startup failed:", err.message);
  });

  // Run initial marketplace order syncs on startup (after 15 seconds delay, skip in non-production preview if desired or run lightweight)
  setTimeout(() => {
    syncHepsiburadaOrdersCron().catch(err => {
      console.warn("[CRON] Initial Hepsiburada order sync failed:", err.message);
    });
    syncN11OrdersCron().catch(err => {
      console.warn("[CRON] Initial N11 order sync failed:", err.message);
    });
    syncAmazonOrdersCron().catch(err => {
      console.warn("[CRON] Initial Amazon order sync failed:", err.message);
    });
  }, 15000);

  // Hepsiburada & N11 Order Sync (Every 10 minutes - optimized for low DB egress)
  cron.schedule('*/10 * * * *', async () => {
    console.log("[CRON] Running Hepsiburada & N11 order sync (10-minute interval)...");
    await syncHepsiburadaOrdersCron();
    await syncN11OrdersCron();
  });

  // Hepsiburada Pending Approval & Listings Reconciliation (Every 30 minutes)
  cron.schedule('*/30 * * * *', async () => {
    console.log("[CRON] Running Hepsiburada pending approvals & listings reconciliation...");
    await syncHepsiburadaPendingAndListingsCron();
  });

  // Amazon Order Sync (Every 15 minutes)
  cron.schedule('*/15 * * * *', async () => {
    console.log("[CRON] Running Amazon order sync...");
    await syncAmazonOrdersCron();
  });

  // Comprehensive Marketplace Inventory & Price Reconciliation (Every 2 hours)
  cron.schedule('0 */2 * * *', async () => {
    console.log("[CRON] Running 2-hour Marketplace Price & Inventory Reconciliation...");
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

  // Nightly Full Database Backup to 5 TB Google Drive Vault (03:30 AM)
  cron.schedule('30 3 * * *', async () => {
    console.log("[CRON] Running Nightly Full Database Backup to 5 TB Google Drive Vault (03:30)...");
    try {
      const res = await runAutomatedSuperAdminDriveBackup();
      console.log(`[CRON-5TB-BACKUP] Success: ${res.fileName} (${res.sizeKB} KB)`);
    } catch (err: any) {
      console.warn("[CRON-5TB-BACKUP] Skipped or failed:", err?.message || err);
    }
  });

  // Nightly E-Invoice Ledger Archiving & PostgreSQL DB Slimming to 5 TB Google Drive (03:45 AM)
  cron.schedule('45 3 * * *', async () => {
    console.log("[CRON] Running Nightly E-Invoice Archive & DB Slimming to 5 TB Google Drive (03:45)...");
    try {
      const res = await runSuperAdminArchiveAndSlimDB();
      console.log(`[CRON-5TB-ARCHIVE] Success: ${res.message}`);
    } catch (err: any) {
      console.warn("[CRON-5TB-ARCHIVE] Skipped or failed:", err?.message || err);
    }
  });

  console.log("Cron jobs started.");
}

const n11AuthBackoffStores = new Map<number, number>();
const hbAuthBackoffStores = new Map<number, number>();
const HB_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Periodically syncs Hepsiburada orders for all configured stores (Zero-Egress projection: no full branding blob)
 */
export async function syncHepsiburadaOrdersCron() {
  try {
    const storesRes = await pool.query(`
      SELECT id, name,
             COALESCE(hepsiburada_settings, branding->'hepsiburada_settings') as hepsiburada_settings
      FROM stores
      WHERE COALESCE(branding->>'is_demo', 'false') != 'true'
        AND (hepsiburada_settings IS NOT NULL OR branding->'hepsiburada_settings' IS NOT NULL)
    `);
    for (const store of storesRes.rows) {
      try {
        let settings = store.hepsiburada_settings;
        if (typeof settings === 'string') {
          try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
        }

        const backoffUntil = hbAuthBackoffStores.get(store.id);
        if (backoffUntil && Date.now() < backoffUntil) continue;

        const merchantId = String(settings?.merchantId || "").trim();
        const apiSecret = String(settings?.apiSecret || "").trim();
        const apiKey = String(settings?.apiKey || "lookprice_dev").trim() || "lookprice_dev";

        // Only sync if credentials are configured and merchantId is a valid UUID
        if (merchantId && HB_UUID_REGEX.test(merchantId) && apiSecret) {
          const cleanSettings = {
            ...settings,
            merchantId,
            apiKey,
            apiSecret,
            isTestMode: Boolean(settings?.isTestMode)
          };

          const hbService = new HepsiburadaService(cleanSettings, store.id);
          const { syncedCount } = await hbService.syncOrdersToDatabase({ timespan: 30 });
          if (syncedCount > 0) {
            console.log(`[CRON-HB] Store #${store.id} (${store.name}): ${syncedCount} yeni Hepsiburada siparişi başarıyla çekildi ve sisteme işlendi.`);
          }
        }
      } catch (storeErr: any) {
        const msg = String(storeErr?.message || storeErr || '');
        if (msg.includes('401') || msg.includes('403') || msg.includes('Merchant ID')) {
          hbAuthBackoffStores.set(store.id, Date.now() + 60 * 60 * 1000);
        }
      }
    }
  } catch (err: any) {
    // ignore background cron query issues
  }
}

/**
 * Periodically syncs N11 orders for all configured stores (Zero-Egress projection: no full branding blob)
 */
export async function syncN11OrdersCron() {
  try {
    const storesRes = await pool.query(`
      SELECT id, name,
             COALESCE(n11_settings, branding->'n11_settings') as n11_settings
      FROM stores
      WHERE COALESCE(branding->>'is_demo', 'false') != 'true'
        AND (n11_settings IS NOT NULL OR branding->'n11_settings' IS NOT NULL)
    `);
    for (const store of storesRes.rows) {
      try {
        let settings = store.n11_settings;
        if (typeof settings === 'string') {
          try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
        }

        const backoffUntil = n11AuthBackoffStores.get(store.id);
        if (backoffUntil && Date.now() < backoffUntil) continue;

        const appKey = String(settings?.appKey || "").trim();
        const appSecret = String(settings?.appSecret || "").trim();

        if (appKey && appSecret) {
          const cleanSettings = {
            ...settings,
            appKey,
            appSecret
          };

          const { syncedCount, newOrdersCount } = await syncStoreN11OrdersToDatabase(store.id, cleanSettings, 30);
          n11AuthBackoffStores.delete(store.id);
          if (newOrdersCount > 0) {
            console.log(`[CRON-N11] Store #${store.id} (${store.name}): ${newOrdersCount} yeni N11 siparişi (toplam ${syncedCount}) başarıyla çekildi ve sisteme işlendi.`);
          }
        }
      } catch (storeErr: any) {
        const errMsg = storeErr.message || String(storeErr);
        if (errMsg.includes("403") || errMsg.includes("401") || errMsg.includes("Forbidden") || errMsg.includes("Unauthorized")) {
          // Back off for 60 minutes for stores with unauthorized/invalid N11 keys
          n11AuthBackoffStores.set(store.id, Date.now() + 60 * 60 * 1000);
        }
      }
    }
  } catch (err: any) {
    // ignore background cron query issues
  }
}

/**
 * Periodically reconciles Hepsiburada live listings and auto-promotes approved items from "Onay Bekliyor" to "Satışta"
 */
export async function syncHepsiburadaPendingAndListingsCron() {
  try {
    const storesRes = await pool.query(`
      SELECT id, name,
             COALESCE(hepsiburada_settings, branding->'hepsiburada_settings') as hepsiburada_settings
      FROM stores
      WHERE COALESCE(branding->>'is_demo', 'false') != 'true'
        AND (hepsiburada_settings IS NOT NULL OR branding->'hepsiburada_settings' IS NOT NULL)
    `);
    for (const store of storesRes.rows) {
      try {
        let settings = store.hepsiburada_settings;
        if (typeof settings === 'string') {
          try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
        }

        const backoffUntil = hbAuthBackoffStores.get(store.id);
        if (backoffUntil && Date.now() < backoffUntil) continue;

        const merchantId = String(settings?.merchantId || "").trim();
        const apiSecret = String(settings?.apiSecret || "").trim();
        const apiKey = String(settings?.apiKey || "lookprice_dev").trim() || "lookprice_dev";

        if (merchantId && HB_UUID_REGEX.test(merchantId) && apiSecret) {
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
        const msg = String(storeErr?.message || storeErr || '');
        if (msg.includes('401') || msg.includes('403') || msg.includes('Merchant ID')) {
          hbAuthBackoffStores.set(store.id, Date.now() + 60 * 60 * 1000);
        }
      }
    }
  } catch (err: any) {
    // ignore background cron query issues
  }
}

export async function syncTCMBRates() {
  try {
    const { rates, tcmbDate } = await fetchTCMBRatesWithRetry();
    
    if (Object.keys(rates).length > 0 && Number(rates.USD) > 0) {
      console.log(`[CRON] Extracted TCMB ForexBuying rates for date ${tcmbDate || 'Current'}:`, rates);
      
      try {
        // Lightweight select: avoid pulling full branding JSONB over network
        const storesRes = await pool.query(`
          SELECT id, currency_rates,
                 branding->'currency_rates' as branding_currency_rates,
                 COALESCE(branding->>'is_demo', 'false') as is_demo
          FROM stores
        `);
        let updatedStoreCount = 0;

        for (const store of storesRes.rows) {
          let currentRates: any = {};
          try {
            if (typeof store.currency_rates === 'string') {
              currentRates = JSON.parse(store.currency_rates);
            } else if (typeof store.currency_rates === 'object' && store.currency_rates !== null) {
              currentRates = store.currency_rates;
            }
          } catch (e) {
            currentRates = {};
          }

          let brRates: any = {};
          try {
            if (typeof store.branding_currency_rates === 'string') {
              brRates = JSON.parse(store.branding_currency_rates);
            } else if (typeof store.branding_currency_rates === 'object' && store.branding_currency_rates !== null) {
              brRates = store.branding_currency_rates;
            }
          } catch (e) {
            brRates = {};
          }

          const newRates: any = {
            ...brRates,
            ...currentRates,
            ...rates
          };

          const rateChanged =
            Number(currentRates?.USD || 0) !== Number(newRates.USD || 0) ||
            Number(currentRates?.EUR || 0) !== Number(newRates.EUR || 0) ||
            Number(currentRates?.GBP || 0) !== Number(newRates.GBP || 0) ||
            Number(brRates?.USD || 0) !== Number(newRates.USD || 0) ||
            Number(brRates?.EUR || 0) !== Number(newRates.EUR || 0);

          if (rateChanged) {
            const newRatesJson = JSON.stringify(newRates);
            await pool.query(
              `UPDATE stores 
               SET currency_rates = $1::jsonb, 
                   branding = jsonb_set(COALESCE(branding, '{}'::jsonb), '{currency_rates}', $1::jsonb, true)
               WHERE id = $2`,
              [newRatesJson, store.id]
            );
            updatedStoreCount++;

            if (store.is_demo !== 'true' && store.is_demo !== true) {
              syncMarketplacePricesOnRateChange(store.id, newRates).catch((syncErr) => {
                console.warn(`[CRON-CURRENCY] Store #${store.id} pazaryeri fiyat revizyonu hatası:`, syncErr.message || syncErr);
              });
            }
          }
        }
        console.log(`[CRON] TCMB ForexBuying rates checked for ${storesRes.rowCount} stores (${updatedStoreCount} stores updated with new rates).`);
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
 * Automatically recalculates and pushes updated prices to Hepsiburada, Amazon, N11, Trendyol, and Pazarama
 * when currency exchange rates or marketplace commission/fixed-fee settings change.
 */
export async function syncMarketplacePricesOnRateChange(storeId: number, rates?: Record<string, number>) {
  try {
    const storeRes = await pool.query(
      `SELECT id, name, currency_rates,
              branding->'currency_rates' as branding_currency_rates,
              COALESCE(amazon_settings, branding->'amazon_settings') as amazon_settings,
              COALESCE(hepsiburada_settings, branding->'hepsiburada_settings') as hepsiburada_settings,
              COALESCE(n11_settings, branding->'n11_settings') as n11_settings,
              COALESCE(trendyol_settings, branding->'trendyol_settings') as trendyol_settings,
              COALESCE(pazarama_settings, branding->'pazarama_settings') as pazarama_settings,
              COALESCE(branding->>'is_demo', 'false') as is_demo
       FROM stores WHERE id = $1`,
      [storeId]
    );
    if (storeRes.rows.length === 0) return;
    const store = storeRes.rows[0];
    if (store.is_demo === true || store.is_demo === 'true') return;

    let dbRates: Record<string, number> = {};
    try {
      if (typeof store.currency_rates === 'string') {
        dbRates = JSON.parse(store.currency_rates);
      } else if (typeof store.currency_rates === 'object' && store.currency_rates !== null) {
        dbRates = store.currency_rates;
      }
    } catch (e) {
      dbRates = {};
    }

    let brRates: Record<string, number> = {};
    try {
      if (typeof store.branding_currency_rates === 'string') {
        brRates = JSON.parse(store.branding_currency_rates);
      } else if (typeof store.branding_currency_rates === 'object' && store.branding_currency_rates !== null) {
        brRates = store.branding_currency_rates;
      }
    } catch (e) {
      brRates = {};
    }

    const effectiveRates: Record<string, number> = {
      ...brRates,
      ...dbRates,
      ...(rates || {})
    };

    // Keep branding.currency_rates in sync with stores.currency_rates using in-database jsonb_set (zero network bloat)
    if (
      effectiveRates.USD &&
      (Number(brRates.USD) !== Number(effectiveRates.USD) ||
        Number(brRates.EUR) !== Number(effectiveRates.EUR) ||
        Number(brRates.GBP) !== Number(effectiveRates.GBP))
    ) {
      const ratesJson = JSON.stringify(effectiveRates);
      await pool.query(
        `UPDATE stores 
         SET currency_rates = $1::jsonb, 
             branding = jsonb_set(COALESCE(branding, '{}'::jsonb), '{currency_rates}', $1::jsonb, true) 
         WHERE id = $2`,
        [ratesJson, storeId]
      );
    }

    let hbSettings = store.hepsiburada_settings;
    if (typeof hbSettings === 'string') {
      try { hbSettings = JSON.parse(hbSettings); } catch (e) { hbSettings = {}; }
    }
    hbSettings = hbSettings || {};

    let amzSettings = store.amazon_settings;
    if (typeof amzSettings === 'string') {
      try { amzSettings = JSON.parse(amzSettings); } catch (e) { amzSettings = {}; }
    }
    amzSettings = amzSettings || {};

    let n11Settings = store.n11_settings;
    if (typeof n11Settings === 'string') {
      try { n11Settings = JSON.parse(n11Settings); } catch (e) { n11Settings = {}; }
    }
    n11Settings = n11Settings || {};

    let tySettings = store.trendyol_settings;
    if (typeof tySettings === 'string') {
      try { tySettings = JSON.parse(tySettings); } catch (e) { tySettings = {}; }
    }
    tySettings = tySettings || {};

    let pzSettings = store.pazarama_settings;
    if (typeof pzSettings === 'string') {
      try { pzSettings = JSON.parse(pzSettings); } catch (e) { pzSettings = {}; }
    }
    pzSettings = pzSettings || {};

    const { N11Service } = await import("./backend/n11Service.js");
    const hbHelper = new HepsiburadaService(hbSettings || {}, storeId);
    const amzHelper = new AmazonService(amzSettings || {}, storeId);

    // 0. Recalculate and persist channel-specific marketplace_data prices ONLY for marketplace-linked or foreign-currency products
    const allProductsRes = await pool.query(
      `SELECT id, name, category, sub_category, price, currency, marketplace_data
       FROM products
       WHERE store_id = $1 AND price > 0
         AND (
           UPPER(COALESCE(currency, 'TRY')) != 'TRY'
           OR is_hepsiburada_active = true
           OR hepsiburada_sku IS NOT NULL
           OR is_amazon_active = true
           OR amazon_asin IS NOT NULL
           OR is_n11_active = true
           OR (marketplace_data IS NOT NULL AND marketplace_data::text != '{}' AND marketplace_data::text != 'null')
         )`,
      [storeId]
    );

    const pendingUpdates: Array<{ id: number; mpData: any }> = [];
    for (const p of allProductsRes.rows) {
      let rawPrice = parseFloat(p.price || "0");
      if (rawPrice <= 0) continue;
      const curr = (p.currency || "TRY").toUpperCase();
      if (curr === "USD" && effectiveRates.USD) rawPrice *= Number(effectiveRates.USD);
      else if (curr === "EUR" && effectiveRates.EUR) rawPrice *= Number(effectiveRates.EUR);
      else if (curr === "GBP" && effectiveRates.GBP) rawPrice *= Number(effectiveRates.GBP);

      const hbPrice = hbHelper.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);
      const amzPrice = amzHelper.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);
      const n11Price = N11Service.calculateMarketplacePrice(rawPrice, p.category, p.sub_category, n11Settings);
      const tyPrice = N11Service.calculateMarketplacePrice(rawPrice, p.category, p.sub_category, tySettings);
      const pzPrice = N11Service.calculateMarketplacePrice(rawPrice, p.category, p.sub_category, pzSettings);

      let mpData: any = p.marketplace_data;
      if (typeof mpData === "string") {
        try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
      }
      mpData = mpData || {};

      const changed =
        Math.abs(Number(mpData?.hepsiburada?.attributes?.price || 0) - hbPrice) > 0.01 ||
        Math.abs(Number(mpData?.amazon?.attributes?.price || 0) - amzPrice) > 0.01 ||
        Math.abs(Number(mpData?.n11?.attributes?.price || 0) - n11Price) > 0.01 ||
        Math.abs(Number(mpData?.trendyol?.attributes?.price || 0) - tyPrice) > 0.01 ||
        Math.abs(Number(mpData?.pazarama?.attributes?.price || 0) - pzPrice) > 0.01;

      if (changed) {
        if (!mpData.hepsiburada) mpData.hepsiburada = {};
        if (!mpData.hepsiburada.attributes) mpData.hepsiburada.attributes = {};
        mpData.hepsiburada.attributes.price = String(hbPrice);
        mpData.hepsiburada.price = hbPrice;

        if (!mpData.amazon) mpData.amazon = {};
        if (!mpData.amazon.attributes) mpData.amazon.attributes = {};
        mpData.amazon.attributes.price = String(amzPrice);
        mpData.amazon.price = amzPrice;

        if (!mpData.n11) mpData.n11 = {};
        if (!mpData.n11.attributes) mpData.n11.attributes = {};
        mpData.n11.attributes.price = String(n11Price);
        mpData.n11.price = n11Price;

        if (!mpData.trendyol) mpData.trendyol = {};
        if (!mpData.trendyol.attributes) mpData.trendyol.attributes = {};
        mpData.trendyol.attributes.price = String(tyPrice);
        mpData.trendyol.price = tyPrice;

        if (!mpData.pazarama) mpData.pazarama = {};
        if (!mpData.pazarama.attributes) mpData.pazarama.attributes = {};
        mpData.pazarama.attributes.price = String(pzPrice);
        mpData.pazarama.price = pzPrice;

        if (!mpData.attributes) mpData.attributes = {};
        mpData.attributes.price = String(hbPrice);

        pendingUpdates.push({ id: p.id, mpData });
      }
    }

    const CHUNK = 50;
    for (let i = 0; i < pendingUpdates.length; i += CHUNK) {
      const slice = pendingUpdates.slice(i, i + CHUNK);
      await Promise.all(
        slice.map((u) =>
          pool.query("UPDATE products SET marketplace_data = $1 WHERE id = $2", [JSON.stringify(u.mpData), u.id])
        )
      );
    }

    // 1. Hepsiburada Price & Stock Push
    if (
      hbSettings?.merchantId &&
      hbSettings?.apiSecret &&
      HB_UUID_REGEX.test(String(hbSettings.merchantId).trim()) &&
      (!hbAuthBackoffStores.get(storeId) || Date.now() >= hbAuthBackoffStores.get(storeId)!)
    ) {
      try {
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
            if (curr === "USD" && effectiveRates.USD) {
              rawPrice = rawPrice * Number(effectiveRates.USD);
            } else if (curr === "EUR" && effectiveRates.EUR) {
              rawPrice = rawPrice * Number(effectiveRates.EUR);
            } else if (curr === "GBP" && effectiveRates.GBP) {
              rawPrice = rawPrice * Number(effectiveRates.GBP);
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
            mpData.hepsiburada.price = effectivePrice;
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
          }))).catch(err => ({ success: false, message: err.message }));
          
          if (updateRes?.success) {
            console.log(`[CRON-CURRENCY] Store #${storeId} (${store.name}): Hepsiburada ${inventoryItems.length} ürünün döviz bazlı fiyatı güncellendi.`);
          } else {
            console.info(`[CRON-CURRENCY] Store #${storeId} (${store.name}): Hepsiburada price sync note: ${updateRes?.message || 'Skipped'}`);
          }
          
          for (const it of inventoryItems) {
            await pool.query(
              `UPDATE products 
               SET hepsiburada_last_sync = NOW(), hepsiburada_last_error = NULL, marketplace_data = $1 
               WHERE id = $2`,
              [JSON.stringify(it.marketplaceData), it.productId]
            );
          }
        }
      } catch (hbErr: any) {
        console.info(`[CRON-CURRENCY] Store #${storeId} Hepsiburada sync note (demo store ignored):`, hbErr.message);
      }
    }

    // 2. Amazon TR Price & Stock Push
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
          if (curr === "USD" && effectiveRates.USD) {
            rawPrice = rawPrice * Number(effectiveRates.USD);
          } else if (curr === "EUR" && effectiveRates.EUR) {
            rawPrice = rawPrice * Number(effectiveRates.EUR);
          } else if (curr === "GBP" && effectiveRates.GBP) {
            rawPrice = rawPrice * Number(effectiveRates.GBP);
          }

          let mpData: any = p.marketplace_data;
          if (typeof mpData === "string") {
            try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
          }
          mpData = mpData || {};

          const effectivePrice = amzService.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);
          const sellerSku = p.amazon_sku || mpData?.amazon?.sku || p.sku || p.barcode;
          const stock = parseInt(p.stock_quantity || "0", 10);

          if (!mpData.amazon) mpData.amazon = {};
          if (!mpData.amazon.attributes) mpData.amazon.attributes = {};
          mpData.amazon.attributes.price = String(effectivePrice);
          mpData.amazon.price = effectivePrice;
          mpData.amazon.lastSync = new Date().toISOString();

          if (sellerSku && effectivePrice > 0) {
            const res = await amzService.updateListingsItem(sellerSku, effectivePrice, stock, 3, {
              asin: p.amazon_asin,
              productType: mpData?.amazon?.productType
            });
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

    // 3. N11 Live Price & Stock Push
    if (
      n11Settings?.appKey &&
      n11Settings?.appSecret &&
      (!n11AuthBackoffStores.get(storeId) || Date.now() >= n11AuthBackoffStores.get(storeId)!)
    ) {
      try {
        const auth = { appKey: n11Settings.appKey.trim(), appSecret: n11Settings.appSecret.trim() };
        const n11ProductsRes = await pool.query(
          `SELECT id, name, category, sub_category, barcode, sku, price, currency, stock_quantity, marketplace_data 
           FROM products 
           WHERE store_id = $1 AND (is_n11_active = true OR (marketplace_data->'n11'->>'status' = 'ACTIVE'))`,
          [storeId]
        );

        for (const p of n11ProductsRes.rows) {
          try {
            let rawPrice = parseFloat(p.price || "0");
            const curr = (p.currency || "TRY").toUpperCase();
            if (curr === "USD" && effectiveRates.USD) rawPrice *= Number(effectiveRates.USD);
            else if (curr === "EUR" && effectiveRates.EUR) rawPrice *= Number(effectiveRates.EUR);
            else if (curr === "GBP" && effectiveRates.GBP) rawPrice *= Number(effectiveRates.GBP);

            const effectivePrice = N11Service.calculateMarketplacePrice(rawPrice, p.category, p.sub_category, n11Settings);
            let mpData: any = p.marketplace_data;
            if (typeof mpData === "string") {
              try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
            }
            mpData = mpData || {};

            const sellerCode = (
              mpData?.n11?.attributes?.merchantSku || 
              mpData?.n11?.attributes?.stockCode || 
              mpData?.n11?.attributes?.Barcode || 
              p.barcode || 
              p.sku || 
              ""
            ).trim();

            const stock = parseInt(p.stock_quantity || "0", 10);

            if (!mpData.n11) mpData.n11 = {};
            if (!mpData.n11.attributes) mpData.n11.attributes = {};
            mpData.n11.attributes.price = String(effectivePrice);
            mpData.n11.price = effectivePrice;
            mpData.n11.lastSync = new Date().toISOString();

            if (sellerCode && effectivePrice > 0) {
              await new Promise(r => setTimeout(r, 100));
              const n11Res = await N11Service.updatePriceAndStock(auth, sellerCode, effectivePrice, stock);
              if (n11Res.success) {
                mpData.n11.status = 'ACTIVE';
                mpData.n11.lastError = null;
              } else {
                mpData.n11.lastError = n11Res.message;
                if (n11Res.message?.includes('403') || n11Res.message?.includes('401') || n11Res.message?.includes('Unauthorized')) {
                  n11AuthBackoffStores.set(storeId, Date.now() + 6 * 60 * 60 * 1000);
                  break;
                }
              }
              await pool.query(
                "UPDATE products SET marketplace_data = $1 WHERE id = $2",
                [JSON.stringify(mpData), p.id]
              );
            }
          } catch (n11Err: any) {
            if (n11Err.message?.includes('403') || n11Err.message?.includes('401')) {
              n11AuthBackoffStores.set(storeId, Date.now() + 6 * 60 * 60 * 1000);
              break;
            }
          }
        }
        console.log(`[CRON-CURRENCY] Store #${storeId} (${store.name}): N11 ${n11ProductsRes.rows.length} ürünün fiyat ve stoğu güncellendi.`);
      } catch (n11InitErr: any) {
        // Ignore N11 init warning in background cron
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
    const storesRes = await pool.query(`
      SELECT id, name 
      FROM stores 
      WHERE COALESCE(branding->>'is_demo', 'false') != 'true'
        AND (
          hepsiburada_settings IS NOT NULL OR branding->'hepsiburada_settings' IS NOT NULL
          OR amazon_settings IS NOT NULL OR branding->'amazon_settings' IS NOT NULL
          OR n11_settings IS NOT NULL OR branding->'n11_settings' IS NOT NULL
          OR trendyol_settings IS NOT NULL OR branding->'trendyol_settings' IS NOT NULL
          OR pazarama_settings IS NOT NULL OR branding->'pazarama_settings' IS NOT NULL
        )
    `);
    for (const store of storesRes.rows) {
      await syncMarketplacePricesOnRateChange(store.id);
    }
  } catch (err: any) {
    console.error("[CRON-RECONCILE] Marketplace reconciliation error:", err.message || err);
  }
}

/**
 * Periodically syncs Amazon orders for all configured stores (Zero-Egress projection: no full branding blob)
 */
export async function syncAmazonOrdersCron() {
  try {
    const storesRes = await pool.query(`
      SELECT id, name,
             COALESCE(amazon_settings, branding->'amazon_settings') as amazon_settings
      FROM stores
      WHERE COALESCE(branding->>'is_demo', 'false') != 'true'
        AND (amazon_settings IS NOT NULL OR branding->'amazon_settings' IS NOT NULL)
    `);
    for (const store of storesRes.rows) {
      try {
        let settings = store.amazon_settings;
        if (typeof settings === 'string') {
          try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
        }

        const refreshToken = (settings?.refresh_token || settings?.refreshToken || "").trim();
        if (refreshToken) {
          const amzService = new AmazonService(settings, store.id);
          const { syncedCount } = await amzService.syncOrdersToDatabase({ days: 30 });
          if (syncedCount > 0) {
            console.log(`[CRON-AMZ] Store #${store.id} (${store.name}): ${syncedCount} yeni Amazon siparişi başarıyla çekildi ve sisteme işlendi.`);
          }
        }
      } catch (storeErr: any) {
        // Ignore individual store sync errors during background cron
      }
    }
  } catch (err: any) {
    console.error("[CRON-AMZ] Genel Amazon sipariş senkronizasyonu hatası:", err.message || err);
  }
}

