import express from "express";
import { pool } from "../models/db";
import axios from "axios";
import { authenticate, getAuthorizedStoreId } from "../middleware/auth";
import { IntegrationService } from "../src/services/IntegrationService";
import { HepsiburadaService } from "../src/services/backend/hepsiburadaService";
import { HepsiburadaServiceV3 } from "../src/services/backend/HepsiburadaServiceV3";
import { AmazonService } from "../src/services/backend/amazonService";
import { isHepsiburadaMasterCatalogId, slugifyText, buildHepsiburadaProductUrl } from "../src/utils/marketplaceUrls";
import { 
  processMarketplaceOrderLines, 
  syncN11Orders, 
  syncStoreN11OrdersToDatabase,
  syncHepsiburadaOrders, 
  syncTrendyolOrders, 
  syncPazaramaOrders,
  testN11Connection,
  testHepsiburadaConnection,
  testTrendyolConnection,
  testPazaramaConnection,
  computeSellableStock
} from "../src/services/marketplaceSync";
import { syncMarketplaceOrderTreasury } from "./store/treasurySync";

const router = express.Router();

async function checkIsDemoStore(storeId: number): Promise<boolean> {
  try {
    const res = await pool.query("SELECT slug, name, branding FROM stores WHERE id = $1", [storeId]);
    const row = res.rows[0];
    if (!row) return false;
    const slug = (row.slug || "").toLowerCase();
    const name = (row.name || "").toLowerCase();
    let branding = row.branding || {};
    if (typeof branding === 'string') {
      try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
    }
    return slug.includes("demo") || name.includes("demo") || branding.is_demo === true;
  } catch (e) {
    return false;
  }
}



// Amazon SP-API Constants for Turkey
const AMAZON_TR_MARKETPLACE_ID = "A33AVAJ2PDY3EV";
const AMAZON_AUTH_ENDPOINT = "https://sellercentral.amazon.com.tr/apps/authorize/consent";
const AMAZON_TOKEN_ENDPOINT = "https://api.amazon.com/auth/o2/token";
const AMAZON_API_ENDPOINT = "https://sellingpartnerapi-eu.amazon.com";
const DEFAULT_LOOKPRICE_AMAZON_APP_ID = "amzn1.sp.solution.d6950e6e-a94f-4d43-a258-a6e0cbd2d3e9";

async function getCentralAmazonCredentials() {
  let appId = process.env.AMAZON_APP_ID || DEFAULT_LOOKPRICE_AMAZON_APP_ID;
  let clientId = process.env.AMAZON_CLIENT_ID || "";
  let clientSecret = process.env.AMAZON_CLIENT_SECRET || "";

  if (!clientId || !clientSecret) {
    try {
      const res = await pool.query(
        `SELECT amazon_settings FROM stores 
         WHERE amazon_settings->>'clientId' IS NOT NULL 
           AND amazon_settings->>'clientId' != '' 
           AND amazon_settings->>'clientSecret' IS NOT NULL 
           AND amazon_settings->>'clientSecret' != ''
         ORDER BY CASE WHEN id = 2 THEN 0 ELSE 1 END, id ASC LIMIT 1`
      );
      const master = res.rows[0]?.amazon_settings;
      if (master) {
        if (!clientId && master.clientId) clientId = String(master.clientId).trim();
        if (!clientSecret && master.clientSecret) clientSecret = String(master.clientSecret).trim();
        if (master.appId) appId = String(master.appId).trim();
      }
    } catch (e) {
      // ignore fallback query error
    }
  }

  return { appId, clientId, clientSecret };
}

// 1. Get Amazon Auth URL
router.get("/amazon/auth-url", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const storeRes = await pool.query("SELECT slug, amazon_settings FROM stores WHERE id = $1", [storeId]);
  const storeSettings = storeRes.rows[0]?.amazon_settings || {};
  const slug = storeRes.rows[0]?.slug || "store";
  const central = await getCentralAmazonCredentials();
  const appId = storeSettings.appId || central.appId || DEFAULT_LOOKPRICE_AMAZON_APP_ID;

  const state = Buffer.from(JSON.stringify({ storeId, slug })).toString('base64');
  const authUrl = `${AMAZON_AUTH_ENDPOINT}?application_id=${encodeURIComponent(appId)}&state=${encodeURIComponent(state)}&version=beta`;
  
  res.json({ url: authUrl, appId });
});

// 2. Save Amazon Settings (Manual or Central OAuth)
router.post("/amazon/settings", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId);
  const { appId, clientId, clientSecret, refreshToken, sellerId, categoryMappings, categoryMappingLabels, categoryAttributes, categoryMarkups, defaultCommissionRate, defaultFixedFee, isSandbox } = req.body;

  try {
    const storeRes = await pool.query("SELECT amazon_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });

    let prev = storeRes.rows[0]?.amazon_settings || {};
    if (typeof prev === 'string') { try { prev = JSON.parse(prev); } catch { prev = {}; } }
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch { br = {}; } }
    const prevMerged = { ...(br.amazon_settings || {}), ...prev };

    const central = await getCentralAmazonCredentials();
    const finalAppId = (appId !== undefined ? String(appId).trim() : String(prevMerged.appId || "").trim()) || central.appId || DEFAULT_LOOKPRICE_AMAZON_APP_ID;
    const finalClientId = (clientId !== undefined ? String(clientId).trim() : String(prevMerged.clientId || "").trim()) || central.clientId || "";
    const finalClientSecret = (clientSecret !== undefined ? String(clientSecret).trim() : String(prevMerged.clientSecret || "").trim()) || central.clientSecret || "";
    const finalRefreshToken = refreshToken !== undefined ? String(refreshToken).trim() : String(prevMerged.refresh_token || "").trim();
    const finalSellerId = sellerId !== undefined ? String(sellerId).trim() : String(prevMerged.sellerId || "").trim();

    const settings = {
      ...prevMerged,
      connected: !!((finalClientId && finalClientSecret && finalRefreshToken) || (finalRefreshToken && finalSellerId)),
      appId: finalAppId,
      clientId: finalClientId,
      clientSecret: finalClientSecret,
      refresh_token: finalRefreshToken,
      sellerId: finalSellerId,
      isSandbox: typeof isSandbox === 'boolean' ? isSandbox : (prevMerged.isSandbox || false),
      marketplace_id: AMAZON_TR_MARKETPLACE_ID,
      defaultCommissionRate: defaultCommissionRate !== undefined ? Number(defaultCommissionRate) : (prevMerged.defaultCommissionRate ?? 15),
      defaultFixedFee: defaultFixedFee !== undefined ? Number(defaultFixedFee) : (prevMerged.defaultFixedFee ?? 20),
      categoryMappings: categoryMappings !== undefined ? categoryMappings : (prevMerged.categoryMappings || {}),
      categoryMappingLabels: categoryMappingLabels !== undefined ? categoryMappingLabels : (prevMerged.categoryMappingLabels || {}),
      categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : (prevMerged.categoryAttributes || {}),
      categoryMarkups: categoryMarkups !== undefined ? categoryMarkups : (prevMerged.categoryMarkups || {}),
      last_sync: prevMerged.last_sync || null
    };

    br.amazon_settings = settings;
    await pool.query("UPDATE stores SET amazon_settings = $1, branding = $2 WHERE id = $3", [settings, br, storeId]);
    import("../src/services/cronJobs").then(({ syncMarketplacePricesOnRateChange }) => {
      syncMarketplacePricesOnRateChange(Number(storeId)).catch(() => {});
    }).catch(() => {});
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2b. Test Amazon SP-API Connection Endpoint
router.post("/amazon/test-connection", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { clientId, clientSecret, refreshToken, sellerId, isSandbox } = req.body || {};

  try {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, message: "Demo mağaza simülasyonu: Amazon bağlantısı başarılı." });
    }

    const storeRes = await pool.query("SELECT amazon_settings FROM stores WHERE id = $1", [storeId]);
    const prev = storeRes.rows[0]?.amazon_settings || {};
    const central = await getCentralAmazonCredentials();

    const settings = {
      clientId: clientId ? String(clientId).trim() : (prev.clientId || central.clientId || ""),
      clientSecret: clientSecret ? String(clientSecret).trim() : (prev.clientSecret || central.clientSecret || ""),
      refresh_token: refreshToken ? String(refreshToken).trim() : (prev.refresh_token || ""),
      sellerId: sellerId ? String(sellerId).trim() : (prev.sellerId || ""),
      isSandbox: typeof isSandbox === 'boolean' ? isSandbox : (prev.isSandbox || false)
    };

    const amazonService = new AmazonService(settings, storeId);
    const testResult = await amazonService.testConnection();

    res.json({
      success: true,
      message: testResult.message,
      sellerId: testResult.sellerId,
      marketplaceName: testResult.marketplaceName,
    });
  } catch (error: any) {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, message: "Demo mağaza simülasyonu: Amazon bağlantısı başarılı." });
    }
    console.error("[Amazon Test Connection Error]:", error.message);
    res.status(400).json({
      success: false,
      error: error.message || "Amazon SP-API bağlantı testi başarısız oldu.",
    });
  }
});

// 2c. Amazon Bulk Sync Stock & Price Endpoint
router.post("/amazon/bulk-sync", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;

  try {
    const storeRes = await pool.query("SELECT amazon_settings, currency_rates, branding FROM stores WHERE id = $1", [storeId]);
    const row = storeRes.rows[0];
    const settings = row?.amazon_settings || row?.branding?.amazon_settings;
    const rates = row?.currency_rates || row?.branding?.currency_rates || {};

    if (!settings || (!settings.refresh_token && !settings.clientId)) {
      return res.status(400).json({ error: "Amazon hesabı bağlı veya ayarları tam değil" });
    }

    const prodRes = await pool.query(
      `SELECT id, name, sku, barcode, price, stock_quantity, COALESCE(reserved_stock, 0) as reserved_stock, currency, category, sub_category, amazon_asin, amazon_sku, is_amazon_active, marketplace_data 
       FROM products 
       WHERE store_id = $1 AND (is_amazon_active = true OR (amazon_asin IS NOT NULL AND amazon_asin != '' AND amazon_asin NOT LIKE 'http%'))`,
      [storeId]
    );
    const products = prodRes.rows || [];

    const amazonService = new AmazonService(settings, storeId);
    const result = await amazonService.bulkSyncInventory(products, { rates });

    const newSettings = { ...settings, last_sync: new Date().toISOString() };
    await pool.query("UPDATE stores SET amazon_settings = $1 WHERE id = $2", [newSettings, storeId]);

    res.json({
      success: true,
      syncedCount: result.syncedCount,
      errorsCount: result.errorsCount,
      total: products.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Amazon ürün güncellemesi başarısız oldu" });
  }
});

// Amazon Categories Endpoint
router.get("/amazon/categories", authenticate, async (req: any, res) => {
  try {
    const { AMAZON_DEFAULT_CATEGORIES } = await import("../src/data/marketplaceCategoriesData");
    res.json({ success: true, categories: AMAZON_DEFAULT_CATEGORIES });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Amazon Category Attributes Endpoint
router.get("/amazon/categories/:categoryId/attributes", authenticate, async (req: any, res) => {
  try {
    const { getAttributesForCategory } = await import("../src/data/marketplaceCategoriesData");
    const catName = String(req.query.categoryName || req.params.categoryId);
    const paths = req.query.subCategoryName ? [String(req.query.categoryName || ""), String(req.query.subCategoryName)] : [];
    res.json({ success: true, attributes: getAttributesForCategory(catName, paths, String(req.params.categoryId)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Amazon OAuth Callback
router.get("/amazon/callback", async (req: any, res) => {
  const { spapi_oauth_code, state, selling_partner_id } = req.query;
  
  if (!spapi_oauth_code) {
    return res.status(400).send("Missing required parameters (spapi_oauth_code)");
  }

  try {
    let targetStoreId: number | null = null;
    let targetSlug: string | null = null;

    if (state) {
      try {
        const decodedString = Buffer.from(String(state), 'base64').toString('utf-8');
        const parsed = JSON.parse(decodedString);
        if (parsed?.storeId) targetStoreId = Number(parsed.storeId);
        if (parsed?.slug) targetSlug = String(parsed.slug);
      } catch (e) {
        // State might be raw slug or raw storeId
        if (!isNaN(Number(state))) {
          targetStoreId = Number(state);
        } else {
          targetSlug = String(state);
        }
      }
    }

    let storeRes: any;
    if (targetStoreId) {
      storeRes = await pool.query("SELECT id, name, slug, amazon_settings, branding FROM stores WHERE id = $1", [targetStoreId]);
    } else if (targetSlug) {
      storeRes = await pool.query("SELECT id, name, slug, amazon_settings, branding FROM stores WHERE slug ILIKE $1 OR name ILIKE $2 LIMIT 1", [targetSlug, `%${targetSlug}%`]);
    } else {
      // Fallback: Pick store with slug 'gap' or first active store
      storeRes = await pool.query("SELECT id, name, slug, amazon_settings, branding FROM stores WHERE slug = 'gap' OR name ILIKE '%gap%' ORDER BY id ASC LIMIT 1");
    }

    const store = storeRes.rows[0];
    if (!store) {
      return res.status(404).send("Mağaza bulunamadı.");
    }

    const currentSettings = store.amazon_settings || {};
    let branding = store.branding || {};
    if (typeof branding === 'string') {
      try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
    }
    const brandingAmz = branding.amazon_settings || {};

    const central = await getCentralAmazonCredentials();
    const clientId = currentSettings.clientId || brandingAmz.clientId || central.clientId;
    const clientSecret = currentSettings.clientSecret || brandingAmz.clientSecret || central.clientSecret;
    const sellerId = String(selling_partner_id || currentSettings.sellerId || brandingAmz.sellerId || "").trim();

    let refreshToken = currentSettings.refresh_token || brandingAmz.refresh_token;

    // Exchange code for refresh token if clientId & secret are available
    if (clientId && clientSecret) {
      try {
        const tokenRes = await axios.post(AMAZON_TOKEN_ENDPOINT, {
          grant_type: "authorization_code",
          code: spapi_oauth_code,
          client_id: clientId,
          client_secret: clientSecret
        }, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        if (tokenRes.data?.refresh_token) {
          refreshToken = tokenRes.data.refresh_token;
        }
      } catch (tokenErr: any) {
        console.error("Token Exchange Error:", tokenErr.response?.data || tokenErr.message);
      }
    }

    const newSettings = {
      ...currentSettings,
      connected: Boolean(refreshToken && refreshToken.trim() !== ""),
      refresh_token: refreshToken || null,
      sellerId: sellerId || currentSettings.sellerId,
      appId: currentSettings.appId || brandingAmz.appId || central.appId || DEFAULT_LOOKPRICE_AMAZON_APP_ID,
      clientId: clientId || currentSettings.clientId,
      clientSecret: clientSecret || currentSettings.clientSecret,
      marketplace_id: AMAZON_TR_MARKETPLACE_ID,
      isSandbox: false,
      last_sync: new Date().toISOString()
    };

    branding.amazon_settings = newSettings;

    await pool.query("UPDATE stores SET amazon_settings = $1, branding = $2 WHERE id = $3", [newSettings, branding, store.id]);

    const isConnected = Boolean(newSettings.connected);

    res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Amazon Yetkilendirmesi | LookPrice</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 480px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); padding: 6px 14px; border-radius: 9999px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #ffffff; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px; }
    .info-box { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px; text-align: left; font-size: 12px; font-family: monospace; color: #cbd5e1; margin-bottom: 20px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .info-label { color: #64748b; }
    .info-val { color: #f59e0b; font-weight: 600; }
    .btn { display: inline-block; background: #ea580c; hover: #c2410c; color: white; text-decoration: none; font-weight: 600; font-size: 13px; padding: 10px 20px; border-radius: 8px; transition: background 0.2s; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">✓ Amazon OAuth 2.0 Yetkisi Onaylandı</div>
    <h1>${store.name || "Mağaza"} Hesabı Yetkilendirildi</h1>
    <p>Amazon Seller Central mağaza izinleriniz LookPrice Merkezi SP-API altyapısına başarıyla bağlandı.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Satıcı Kimliği (Seller ID):</span> <span class="info-val">${sellerId || "-"}</span></div>
      <div class="info-row"><span class="info-label">Pazaryeri:</span> <span class="info-val">Amazon Türkiye (TR)</span></div>
      <div class="info-row"><span class="info-label">Bağlantı Durumu:</span> <span class="info-val" style="color:#34d399;">${isConnected ? "Aktif / Bağlı" : "Yetki Alındı"}</span></div>
    </div>
    <a href="/admin?tab=estores" class="btn">Mağaza Paneline Dön</a>
    <script>
      if (window.opener) {
        window.opener.postMessage({
          type: 'AMAZON_AUTH_SUCCESS',
          sellerId: ${JSON.stringify(sellerId || "")},
          refreshToken: ${JSON.stringify(refreshToken || "")},
          connected: ${JSON.stringify(isConnected)}
        }, '*');
        setTimeout(() => { window.close(); }, 2000);
      }
    </script>
  </div>
</body>
</html>`);
  } catch (error: any) {
    console.error("Amazon Callback Error:", error.response?.data || error.message);
    res.status(500).send("Amazon bağlantısı sırasında bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
  }
});

router.post("/amazon/sync", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;

  try {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, count: 0, message: "Demo mağaza simülasyonu: Amazon siparişleri senkronize edildi." });
    }

    const storeRes = await pool.query("SELECT amazon_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Mağaza bulunamadı" });
    }

    const row = storeRes.rows[0];
    let settings = row?.amazon_settings;
    if (typeof settings === 'string') { try { settings = JSON.parse(settings); } catch(e) { settings = {}; } }
    let branding = row?.branding;
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch(e) { branding = {}; } }
    if (!settings || !settings.refresh_token) {
      settings = branding?.amazon_settings || settings || {};
    }

    if (!settings || !settings.refresh_token) {
      return res.status(400).json({ error: "Amazon hesabı bağlı değil" });
    }

    const central = await getCentralAmazonCredentials();
    settings = {
      ...settings,
      clientId: settings.clientId || central.clientId,
      clientSecret: settings.clientSecret || central.clientSecret,
      appId: settings.appId || central.appId
    };

    const amazonService = new AmazonService(settings, storeId);
    const { syncedCount, errors } = await amazonService.syncOrdersToDatabase({ days: 30 });

    // Update last sync time
    const newSettings = { ...settings, last_sync: new Date().toISOString() };
    await pool.query("UPDATE stores SET amazon_settings = $1 WHERE id = $2", [newSettings, storeId]);

    res.json({ success: true, count: syncedCount, errors });
  } catch (error: any) {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, count: 0, message: "Demo mağaza simülasyonu: Amazon siparişleri senkronize edildi." });
    }
    const detailedError = error.response?.data?.errors?.[0]?.message || error.response?.data?.message || error.message || "Amazon siparişleri senkronize edilemedi";
    await IntegrationService.logIntegrationError(storeId, 'Amazon', 'Sync All Orders', error);
    res.status(500).json({ error: detailedError });
  }
});

// Amazon Listing Match Endpoint
router.post("/amazon/match-listings", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.user?.store_id;
  const storeId = req.user.role === "superadmin" 
    ? Number(rawStoreId || req.user.store_id || 1) 
    : Number(req.user.store_id || rawStoreId);

  try {
    const storeRes = await pool.query("SELECT amazon_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Mağaza bulunamadı" });
    }

    const row = storeRes.rows[0];
    let branding = row?.branding;
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch(e) { branding = {}; } }
    branding = branding || {};
    const amzStore = typeof row?.amazon_settings === 'string' ? JSON.parse(row.amazon_settings || '{}') : (row?.amazon_settings || {});
    const amzBranding = typeof branding?.amazon_settings === 'string' ? JSON.parse(branding.amazon_settings || '{}') : (branding?.amazon_settings || {});
    const settings = {
      ...amzBranding,
      ...amzStore
    };

    if (!settings.sellerId) {
      settings.sellerId = "A2M0PNCK7GMIY6";
    }

    const importMissing = Boolean(req.body?.importMissing);
    const amazonService = new AmazonService(settings, storeId);
    const result = await amazonService.matchListingsWithStoreProducts({ importMissing });

    res.json(result);
  } catch (error: any) {
    console.error("[Amazon Match Listings Error]:", error?.message || error);
    await IntegrationService.logIntegrationError(storeId, 'Amazon', 'Match Listings', error);
    res.status(400).json({ error: error.message || "Amazon ürünleri eşleştirilemedi." });
  }
});

// Get Live Amazon Listings
router.get("/amazon/listings", authenticate, async (req: any, res) => {
  const rawStoreId = req.query?.storeId || req.user?.store_id;
  const storeId = req.user.role === "superadmin" 
    ? Number(rawStoreId || req.user.store_id || 1) 
    : Number(req.user.store_id || rawStoreId);

  try {
    const storeRes = await pool.query("SELECT amazon_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Mağaza bulunamadı" });
    }

    const row = storeRes.rows[0];
    let settings = row?.amazon_settings;
    if (typeof settings === 'string') { try { settings = JSON.parse(settings); } catch(e) { settings = {}; } }
    let branding = row?.branding;
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch(e) { branding = {}; } }
    if (!settings || !settings.refresh_token) {
      settings = branding?.amazon_settings || settings || {};
    }

    const amazonService = new AmazonService(settings, storeId);
    const listings = await amazonService.fetchListings();

    res.json({ success: true, listings });
  } catch (error: any) {
    console.error("[Amazon Get Listings Error]:", error?.message || error);
    res.status(400).json({ error: error.message || "Amazon ilanları çekilemedi." });
  }
});

// 3.5 Submit Shipment Tracking to Amazon
router.post("/amazon/orders/:orderId/ship", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { orderId } = req.params;
  const { carrierCode, trackingNumber } = req.body;

  try {
    const storeRes = await pool.query("SELECT amazon_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.amazon_settings;

    if (!settings || !settings.refresh_token) {
      return res.status(400).json({ error: "Amazon hesabı bağlı değil" });
    }
    
    if (!carrierCode || !trackingNumber) {
      return res.status(400).json({ error: "Kargo firması (CarrierCode) ve Takip Numarası zorunludur." });
    }

    const amazonService = new AmazonService(settings, storeId);
    const result = await amazonService.submitShipmentTracking(orderId, carrierCode, trackingNumber);

    if (result.success) {
      // Update local database to reflect shipped status
      await pool.query(
        "UPDATE amazon_orders SET status = 'Shipped' WHERE store_id = $1 AND amazon_order_id = $2",
        [storeId, orderId]
      );
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ success: false, error: result.message });
    }
  } catch (error: any) {
    await IntegrationService.logIntegrationError(storeId, 'Amazon', 'Submit Shipment', error);
    res.status(500).json({ error: "Amazon'a kargo bilgisi gönderilemedi." });
  }
});

// 4. Get Amazon Settings
router.get("/amazon/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT amazon_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = result.rows[0];
    let amz = row?.amazon_settings || {};
    if (typeof amz === 'string') { try { amz = JSON.parse(amz); } catch(e) { amz = {}; } }
    let br = row?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch(e) { br = {}; } }
    const amzBr = br.amazon_settings || {};
    res.json({ ...amzBr, ...amz });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Disconnect Amazon
router.post("/amazon/disconnect", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch (e) { br = {}; } }
    delete br.amazon_settings;
    await pool.query("UPDATE stores SET amazon_settings = '{}', branding = $1 WHERE id = $2", [br, storeId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Publish Product to Amazon TR (Auto-resolves ASIN by Barcode/Title via Catalog API & Pushes Offer via SP-API)
router.post("/amazon/publish", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.headers?.["x-store-id"] || req.user?.store_id;
  const storeId = req.user.role === "superadmin" ? Number(rawStoreId || req.user?.store_id || 1) : Number(req.user?.store_id || rawStoreId);
  const productId = Number(req.body?.productId || req.query?.productId);

  if (!productId || isNaN(productId)) {
    return res.status(400).json({ error: "Geçersiz veya eksik ürün ID." });
  }

  try {
    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    const p = prodRes.rows[0];
    if (!p) return res.status(404).json({ error: "Ürün bulunamadı" });

    if (String(p.product_type || "").toLowerCase() === "service" || /^servis$|^hizmet$/i.test(String(p.category || "").trim())) {
      return res.status(400).json({ error: `"${p.name}" bir Hizmet/Servis kalemi olduğu için e-Mağaza (Amazon) listelerine eklenemez.` });
    }

    const sellableAmzStock = computeSellableStock(p.stock_quantity, p.reserved_stock);
    if (Number(p.price || 0) <= 0 || sellableAmzStock <= 0) {
      const reasons = [];
      if (Number(p.price || 0) <= 0) reasons.push("fiyatı 0₺");
      if (sellableAmzStock <= 0) reasons.push(Number(p.reserved_stock || 0) > 0 ? "tüm stok rezerveli (satılabilir 0)" : "stoğu yetersiz (0/negatif)");
      return res.status(400).json({ error: `"${p.name}" ürününün ${reasons.join(" ve ")} olduğu için Amazon'da satışa açılamaz. Lütfen fiyat ve stoğu güncelleyin.` });
    }

    // Load store Amazon settings & currency rates
    const storeRes = await pool.query("SELECT amazon_settings, currency_rates, branding FROM stores WHERE id = $1", [storeId]);
    const storeRow = storeRes.rows[0] || {};
    let branding = storeRow.branding || {};
    if (typeof branding === "string") {
      try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
    }
    const rawAmzSettings = storeRow.amazon_settings || branding?.amazon_settings || {};
    const central = await getCentralAmazonCredentials();
    const amzSettings = {
      ...rawAmzSettings,
      clientId: rawAmzSettings.clientId || central.clientId,
      clientSecret: rawAmzSettings.clientSecret || central.clientSecret,
      appId: rawAmzSettings.appId || central.appId,
      sellerId: rawAmzSettings.sellerId || "A2M0PNCK7GMIY6",
    };
    const rates = storeRow.currency_rates || branding?.currency_rates || {};
    const amazonService = new AmazonService(amzSettings, storeId);

    let mpData: any = p.marketplace_data;
    if (typeof mpData === "string") {
      try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
    }
    mpData = mpData || {};

    // 1. Check existing ASIN or automatically resolve it from Amazon SP-API Catalog by Barcode (EAN/GTIN) or Product Name
    let cleanAsin =
      p.amazon_asin && String(p.amazon_asin).trim().toLowerCase() !== "null" && !String(p.amazon_asin).startsWith("http")
        ? String(p.amazon_asin).trim().toUpperCase()
        : null;
    let resolvedProductType = mpData.amazon?.productType || "";

    if (!cleanAsin || cleanAsin.length < 9) {
      const catalogLookup = await amazonService.resolveCatalogItem({
        barcode: p.barcode,
        title: p.name,
      });
      if (catalogLookup.found && catalogLookup.asin) {
        cleanAsin = catalogLookup.asin;
        resolvedProductType = catalogLookup.productType || "PRODUCT";
      }
    }

    if (!cleanAsin || cleanAsin.length < 9) {
      return res.status(400).json({
        error: `"${p.name}" ürünü için Amazon TR kataloğunda barkod (${p.barcode || "yok"}) veya ürün adıyla eşleşen bir ASIN bulunamadı. Lütfen ürün barkodunu kontrol edin veya geçerli bir ASIN (örn: B0...) giriniz.`,
      });
    }

    // 2. Calculate TRY Marketplace Price
    let rawPrice = parseFloat(p.price || "0");
    const curr = String(p.currency || "TRY").toUpperCase();
    if (curr === "USD" && rates.USD) rawPrice *= Number(rates.USD);
    else if (curr === "EUR" && rates.EUR) rawPrice *= Number(rates.EUR);
    else if (curr === "GBP" && rates.GBP) rawPrice *= Number(rates.GBP);

    const effectivePrice = amazonService.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);
    const resolvedSku = String(p.amazon_sku || mpData.amazon?.sku || p.sku || p.barcode || `SKU-${p.id}`).trim();
    const stockQty = computeSellableStock(p.stock_quantity, p.reserved_stock);

    // 3. Push real Offer (LISTING_OFFER_ONLY) to Amazon SP-API so the seller appears on the Amazon product page
    let spApiMessage = "";
    if (amzSettings.refresh_token) {
      const offerRes = await amazonService.upsertListingOffer({
        sku: resolvedSku,
        asin: cleanAsin,
        price: effectivePrice,
        quantity: stockQty,
        productType: resolvedProductType || undefined,
      });

      if (!offerRes.success) {
        await pool.query(
          "UPDATE products SET amazon_asin = $1, amazon_sku = $2, amazon_last_error = $3 WHERE id = $4 AND store_id = $5",
          [cleanAsin, resolvedSku, offerRes.message || "Amazon SP-API teklif gönderimi başarısız.", productId, storeId]
        );
        return res.status(400).json({
          error: `Amazon SP-API Hatası (${cleanAsin}): ${offerRes.message || "Teklif oluşturulamadı."}`,
        });
      }
      resolvedProductType = offerRes.productType || resolvedProductType;
      spApiMessage = ` (ASIN: ${cleanAsin}, SKU: ${resolvedSku}, Fiyat: ₺${effectivePrice.toFixed(2)})`;
    }

    mpData.amazon = {
      ...(mpData.amazon || {}),
      status: "ACTIVE",
      asin: cleanAsin,
      sku: resolvedSku,
      productType: resolvedProductType || mpData.amazon?.productType || "PRODUCT",
      attributes: {
        ...(mpData.amazon?.attributes || {}),
        price: String(effectivePrice),
      },
      lastSync: new Date().toISOString(),
    };
    delete mpData.amazon.manuallyUnpublished;

    await pool.query(
      "UPDATE products SET is_amazon_active = true, amazon_asin = $1, amazon_sku = $2, amazon_last_sync = NOW(), amazon_last_error = NULL, marketplace_data = $3 WHERE id = $4 AND store_id = $5",
      [cleanAsin, resolvedSku, JSON.stringify(mpData), productId, storeId]
    );

    res.json({
      success: true,
      asin: cleanAsin,
      sku: resolvedSku,
      effectivePrice,
      message: `"${p.name}" Amazon TR kataloğunda eşleştirildi ve canlı satışa açıldı!${spApiMessage}`,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6b. Resolve Amazon ASIN by Barcode or Product Name from SP-API Catalog
router.post("/amazon/resolve-asin", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId, barcode, title } = req.body;

  try {
    const storeRes = await pool.query("SELECT amazon_settings, branding FROM stores WHERE id = $1", [storeId]);
    const storeRow = storeRes.rows[0] || {};
    let branding = storeRow.branding || {};
    if (typeof branding === "string") {
      try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
    }
    const rawAmzSettings = storeRow.amazon_settings || branding?.amazon_settings || {};
    const central = await getCentralAmazonCredentials();
    const amzSettings = {
      ...rawAmzSettings,
      clientId: rawAmzSettings.clientId || central.clientId,
      clientSecret: rawAmzSettings.clientSecret || central.clientSecret,
      appId: rawAmzSettings.appId || central.appId,
      sellerId: rawAmzSettings.sellerId || "A2M0PNCK7GMIY6",
    };

    let targetBarcode = barcode;
    let targetTitle = title;
    if (productId && (!targetBarcode || !targetTitle)) {
      const pRes = await pool.query("SELECT name, barcode FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
      if (pRes.rows[0]) {
        targetBarcode = targetBarcode || pRes.rows[0].barcode;
        targetTitle = targetTitle || pRes.rows[0].name;
      }
    }

    const amazonService = new AmazonService(amzSettings, storeId);
    const resolved = await amazonService.resolveCatalogItem({
      barcode: targetBarcode,
      title: targetTitle,
    });

    if (!resolved.found || !resolved.asin) {
      return res.status(404).json({
        success: false,
        error: "Amazon TR kataloğunda bu barkod veya ürün adıyla eşleşen ASIN bulunamadı.",
      });
    }

    if (productId) {
      await pool.query(
        "UPDATE products SET amazon_asin = $1 WHERE id = $2 AND store_id = $3",
        [resolved.asin, productId, storeId]
      );
    }

    res.json({
      success: true,
      asin: resolved.asin,
      productType: resolved.productType,
      itemName: resolved.itemName,
      brand: resolved.brand,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- N11 Integration ---

// 1. Save N11 Settings (Unified canonical endpoint)
router.post("/n11/settings", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId);
  const {
    appKey,
    appSecret,
    shipmentTemplate,
    preparingDay,
    categoryMappings,
    categoryMappingLabels,
    categoryAttributes,
    categoryMarkups,
    defaultCommissionRate,
    defaultFixedFee,
    connected
  } = req.body;

  try {
    const storeRes = await pool.query("SELECT n11_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });

    let prev = storeRes.rows[0]?.n11_settings || {};
    if (typeof prev === 'string') { try { prev = JSON.parse(prev); } catch { prev = {}; } }
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch { br = {}; } }
    const prevMerged = { ...(br.n11_settings || {}), ...prev };

    const finalKey = appKey !== undefined ? String(appKey).trim() : String(prevMerged.appKey || "").trim();
    const finalSecret = appSecret !== undefined ? String(appSecret).trim() : String(prevMerged.appSecret || "").trim();
    const finalShipmentTemplate = shipmentTemplate !== undefined
      ? (String(shipmentTemplate).trim() || "Alıcı Öder")
      : (prevMerged.shipmentTemplate || "Alıcı Öder");
    const finalPreparingDay = preparingDay !== undefined
      ? Math.max(1, Math.min(30, Math.floor(Number(preparingDay) || 1)))
      : Math.max(1, Math.floor(Number(prevMerged.preparingDay) || 1));

    const settings = {
      ...prevMerged,
      connected: connected !== undefined ? Boolean(connected) : !!(finalKey && finalSecret),
      appKey: finalKey,
      appSecret: finalSecret,
      shipmentTemplate: finalShipmentTemplate,
      preparingDay: finalPreparingDay,
      defaultCommissionRate: defaultCommissionRate !== undefined ? Number(defaultCommissionRate) : (prevMerged.defaultCommissionRate ?? 18),
      defaultFixedFee: defaultFixedFee !== undefined ? Number(defaultFixedFee) : (prevMerged.defaultFixedFee ?? 20),
      categoryMappings: categoryMappings !== undefined ? categoryMappings : (prevMerged.categoryMappings || {}),
      categoryMappingLabels: categoryMappingLabels !== undefined ? categoryMappingLabels : (prevMerged.categoryMappingLabels || {}),
      categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : (prevMerged.categoryAttributes || {}),
      categoryMarkups: categoryMarkups !== undefined ? categoryMarkups : (prevMerged.categoryMarkups || {}),
      last_sync: prevMerged.last_sync || null
    };

    br.n11_settings = settings;
    await pool.query("UPDATE stores SET n11_settings = $1, branding = $2 WHERE id = $3", [settings, br, storeId]);
    import("../src/services/cronJobs").then(({ syncMarketplacePricesOnRateChange }) => {
      syncMarketplacePricesOnRateChange(Number(storeId)).catch(() => {});
    }).catch(() => {});
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get N11 Settings
router.get("/n11/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT n11_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = result.rows[0];
    let n11 = row?.n11_settings || {};
    if (typeof n11 === 'string') { try { n11 = JSON.parse(n11); } catch(e) { n11 = {}; } }
    let br = row?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch(e) { br = {}; } }
    const n11Br = br.n11_settings || {};
    res.json({ ...n11Br, ...n11 });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

import { parseStringPromise } from 'xml2js';

// ... existing code ...

    // Helper to parse Turkish / ISO marketplace order dates safely
    const parseMarketplaceOrderDate = (rawDateStr: any): Date => {
      if (!rawDateStr) return new Date();
      if (rawDateStr instanceof Date) return rawDateStr;

      const str = String(rawDateStr).trim();
      if (!str) return new Date();

      // 1. Match DD/MM/YYYY or DD.MM.YYYY (e.g., "28/09/2026 15:34:00" or "28.09.2026 15:34:00")
      const trMatch = str.match(/^(\d{2})[\/\.](\d{2})[\/\.](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
      if (trMatch) {
        const day = parseInt(trMatch[1], 10);
        const month = parseInt(trMatch[2], 10) - 1;
        const year = parseInt(trMatch[3], 10);
        const hour = trMatch[4] ? parseInt(trMatch[4], 10) : 0;
        const min = trMatch[5] ? parseInt(trMatch[5], 10) : 0;
        const sec = trMatch[6] ? parseInt(trMatch[6], 10) : 0;
        const parsed = new Date(year, month, day, hour, min, sec);
        if (!isNaN(parsed.getTime())) return parsed;
      }

      // 2. Standard ISO / timestamp parse
      const parsedIso = new Date(str);
      if (!isNaN(parsedIso.getTime())) return parsedIso;

      return new Date();
    };

    // Sync N11 Orders
router.post("/n11/sync", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const days = req.body.days !== undefined && req.body.days !== "routine" ? Number(req.body.days) : undefined;

  try {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, count: 0, newOrdersCount: 0, message: "Demo mağaza simülasyonu: N11 senkronizasyonu başarılı." });
    }

    const storeRes = await pool.query("SELECT n11_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });

    let settings = storeRes.rows[0]?.n11_settings;
    if (typeof settings === 'string') { try { settings = JSON.parse(settings); } catch(e) { settings = {}; } }
    let branding = storeRes.rows[0]?.branding;
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch(e) { branding = {}; } }

    if (!settings || !settings.appKey || !settings.appSecret) {
      settings = branding?.n11_settings || settings || {};
    }

    if (!settings || !settings.appKey || !settings.appSecret) {
      return res.status(400).json({ error: "N11 API bilgileri eksik (Ayarlar > E-Mağazalar sekmesinden N11 App Key ve App Secret kaydedin)" });
    }

    const { syncedCount, newOrdersCount } = await syncStoreN11OrdersToDatabase(storeId, settings, days);
    res.json({ success: true, count: syncedCount, newOrdersCount });
  } catch (error: any) {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, count: 0, newOrdersCount: 0, message: "Demo mağaza simülasyonu: N11 işlem başarılı." });
    }
    await IntegrationService.logIntegrationError(storeId, 'N11', 'Sync All Orders', error);
    res.status(400).json({ error: error?.message || "N11 siparişleri senkronize edilemedi." });
  }
});

router.post("/n11/test", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
  try {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, message: "Demo mağaza simülasyonu: N11 bağlantısı başarılı." });
    }

    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const dbSettings = storeRes.rows[0]?.n11_settings || {};
    const appKey = (req.body.appKey || dbSettings.appKey || "").trim();
    const appSecret = (req.body.appSecret || dbSettings.appSecret || "").trim();

    if (!appKey || !appSecret) {
      return res.status(400).json({ success: false, error: "N11 API AppKey ve AppSecret bilgileri eksik." });
    }

    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.testConnection({ appKey, appSecret });
    
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message || "N11 API Kimlik doğrulaması başarısız." });
    }

    res.json({ success: true, message: result.message });
  } catch (error: any) { 
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, message: "Demo mağaza simülasyonu: N11 bağlantısı başarılı." });
    }
    res.status(500).json({ success: false, error: error.message || "N11 API Bağlantı testi başarısız." }); 
  }
});



router.get("/n11/categories", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId);
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    const { N11_DEFAULT_CATEGORIES } = await import("../src/data/marketplaceCategoriesData");

    if (settings && settings.appKey && settings.appSecret) {
      try {
        const { N11Service } = await import("../src/services/backend/n11Service");
        const liveCats = await N11Service.getTopLevelCategories(settings);
        if (Array.isArray(liveCats) && liveCats.length > 0) {
          const formatted = liveCats.map((c: any) => ({
            id: c.id,
            name: c.name,
            displayName: c.name,
            paths: [c.name],
            leaf: false
          }));
          return res.json({ success: true, categories: [...N11_DEFAULT_CATEGORIES, ...formatted] });
        }
      } catch (soapErr) {
        console.warn("[N11 Live Categories Fetch Warning]:", soapErr);
      }
    }
    res.json({ success: true, categories: N11_DEFAULT_CATEGORIES });
  } catch (error: any) {
    const { N11_DEFAULT_CATEGORIES } = await import("../src/data/marketplaceCategoriesData");
    res.json({ success: true, categories: N11_DEFAULT_CATEGORIES });
  }
});

router.get("/n11/categories/:id/attributes", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId);
  const { id } = req.params;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;

    if (settings && settings.appKey && settings.appSecret) {
      const { N11Service } = await import("../src/services/backend/n11Service");
      const attrs = await N11Service.getCategoryAttributes(settings, Number(id));
      if (Array.isArray(attrs)) {
        return res.json({ success: true, attributes: attrs });
      }
    }
    res.json({ success: true, attributes: [] });
  } catch (error: any) {
    res.json({ success: true, attributes: [] });
  }
});

router.get("/n11/cities", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    const { N11Service } = await import("../src/services/backend/n11Service");
    const cities = await N11Service.getCities(settings);
    res.json({ success: true, cities });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/cities/:cityCode", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { cityCode } = req.params;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    const { N11Service } = await import("../src/services/backend/n11Service");
    const city = await N11Service.getCity(cityCode, settings);
    res.json({ success: true, city });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/cities/:cityCode/districts", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { cityCode } = req.params;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    const { N11Service } = await import("../src/services/backend/n11Service");
    const districts = await N11Service.getDistricts(cityCode, settings);
    res.json({ success: true, districts });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/districts/:districtId/neighborhoods", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { districtId } = req.params;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    const { N11Service } = await import("../src/services/backend/n11Service");
    const neighborhoods = await N11Service.getNeighborhoods(districtId, settings);
    res.json({ success: true, neighborhoods });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/products", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const currentPage = Number(req.query.page || 0);
  const pageSize = Number(req.query.pageSize || 100);
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.getProductList(settings, currentPage, pageSize);
    res.json({ success: true, ...result });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/products/by-id/:productId", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { productId } = req.params;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const product = await N11Service.getProductByProductId(settings, productId);
    res.json({ success: true, product });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/products/by-seller-code/:sellerCode", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { sellerCode } = req.params;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const product = await N11Service.getProductBySellerCode(settings, sellerCode);
    res.json({ success: true, product });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/products/search", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { name, startDate, endDate, approvalStatus, page, pageSize } = req.query;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.searchProducts(settings, {
      name: name ? String(name) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      approvalStatus: approvalStatus ? String(approvalStatus) : undefined,
      currentPage: page ? Number(page) : 0,
      pageSize: pageSize ? Number(pageSize) : 20
    });
    res.json({ success: true, ...result });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.delete("/n11/products/by-id/:productId", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId } = req.params;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.deleteProductById(settings, productId);
    if (result.success) {
      await pool.query("UPDATE products SET is_n11_active = false WHERE n11_id = $1 AND store_id = $2", [productId, storeId]);
    }
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.delete("/n11/products/by-seller-code/:sellerCode", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { sellerCode } = req.params;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.deleteProductBySellerCode(settings, sellerCode);
    if (result.success) {
      await pool.query("UPDATE products SET is_n11_active = false WHERE (sku = $1 OR barcode = $1) AND store_id = $2", [sellerCode, storeId]);
    }
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/products/discount/by-id", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId, discountType, discountValue, discountStartDate, discountEndDate } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.updateDiscountValueByProductId(settings, productId, {
      discountType,
      discountValue,
      discountStartDate,
      discountEndDate
    });
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/products/discount/by-seller-code", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { sellerCode, discountType, discountValue, discountStartDate, discountEndDate } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.updateDiscountValueBySellerCode(settings, sellerCode, {
      discountType,
      discountValue,
      discountStartDate,
      discountEndDate
    });
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/products/price/by-id", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId, price, stockItems, currencyType } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.updateProductPriceById(settings, productId, price, stockItems, currencyType);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/products/price/by-seller-code", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { sellerCode, price, stockItems, currencyType } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.updateProductPriceBySellerCode(settings, sellerCode, price, stockItems, currencyType);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/products/basic-update", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId, productSellerCode, price, description, discount, images, stockItems } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.updateProductBasic(settings, {
      productId,
      productSellerCode,
      price,
      description,
      discount,
      images,
      stockItems
    });
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/products/status-counts", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const counts = await N11Service.getProductApprovalStatusCounts(settings);
    res.json({ success: true, counts });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/products/start-selling/by-id", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.startSellingProductByProductId(settings, productId);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/products/start-selling/by-seller-code", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { sellerCode } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.startSellingProductBySellerCode(settings, sellerCode);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/products/stop-selling/by-id", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.stopSellingProductByProductId(settings, productId);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/products/stop-selling/by-seller-code", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { sellerCode } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.stopSellingProductBySellerCode(settings, sellerCode);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/stocks/by-product-id/:productId", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { productId } = req.params;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const stockItems = await N11Service.getProductStockByProductId(settings, productId);
    res.json({ success: true, stockItems });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/stocks/by-seller-code/:sellerCode", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { sellerCode } = req.params;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const stockItems = await N11Service.getProductStockBySellerCode(settings, sellerCode);
    res.json({ success: true, stockItems });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/stocks/update/by-stock-id", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { stockItems } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.updateStockByStockId(settings, stockItems);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/stocks/update/by-seller-code", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { stockItems } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.updateStockByStockSellerCode(settings, stockItems);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/stocks/update/by-attributes", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId, stockItems } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.deleteAndUpdateStockByStockAttributes(settings, productId, stockItems);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/stocks/increase/by-stock-id", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { stockItems } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.increaseStockByStockId(settings, stockItems);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/stocks/increase/by-seller-code", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { stockItems } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.increaseStockByStockSellerCode(settings, stockItems);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/stocks/increase/by-attributes", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId, stockItems } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.increaseStockByStockAttributes(settings, productId, stockItems);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/orders/summary-list", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId, status, buyerName, orderNumber, productSellerCode, recipient, startDate, endDate, sortForUpdateDate, page, pageSize } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.getOrderList(settings, {
      productId,
      status,
      buyerName,
      orderNumber,
      productSellerCode,
      recipient,
      startDate,
      endDate,
      sortForUpdateDate,
      currentPage: page || 0,
      pageSize: pageSize || 100
    });
    res.json({ success: true, ...result });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/orders/detail/:orderId", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { orderId } = req.params;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const orderDetail = await N11Service.getOrderDetail(settings, orderId);
    res.json({ success: true, orderDetail });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/orders/accept-item", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { orderItemId, numberOfPackages } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.acceptOrderItem(settings, orderItemId, numberOfPackages || 1);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/orders/reject-item", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { orderItemId, rejectReason, rejectReasonType } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.rejectOrderItem(settings, orderItemId, rejectReason, rejectReasonType);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/orders/make-shipment", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { orderItemId, shipmentCompanyId, campaignNumber, trackingNumber, shipmentMethod } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.makeOrderItemShipment(settings, {
      orderItemId,
      shipmentCompanyId,
      campaignNumber,
      trackingNumber,
      shipmentMethod
    });
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/shipment-companies", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    const { N11Service } = await import("../src/services/backend/n11Service");
    const companies = await N11Service.getShipmentCompanies(settings);
    res.json({ success: true, companies });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/shipment-templates", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const templates = await N11Service.getShipmentTemplateList(settings);
    res.json({ success: true, templates });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.get("/n11/shipment-templates/detail/:name", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { name } = req.params;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const template = await N11Service.getShipmentTemplate(settings, name);
    res.json({ success: true, template });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/shipment-templates/create-or-update", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { shipment } = req.body;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const { N11Service } = await import("../src/services/backend/n11Service");
    const result = await N11Service.createOrUpdateShipmentTemplate(settings, shipment);
    res.json(result);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post("/n11/publish", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.headers?.["x-store-id"] || req.user?.store_id;
  const storeId = req.user.role === "superadmin" ? Number(rawStoreId || req.user?.store_id || 1) : Number(req.user?.store_id || rawStoreId);
  const productId = Number(req.body?.productId || req.query?.productId);
  const { categoryId, attributes } = req.body || {};

  if (!productId || isNaN(productId)) {
    return res.status(400).json({ error: "Geçersiz veya eksik ürün ID." });
  }

  try {
    const storeRes = await pool.query("SELECT n11_settings, currency_rates, branding, default_currency FROM stores WHERE id = $1", [storeId]);
    const storeRow = storeRes.rows[0] || {};
    let settings = storeRow.n11_settings || {};
    if (typeof settings === "string") {
      try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
    }
    let branding = storeRow.branding || {};
    if (typeof branding === "string") {
      try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
    }
    if (!settings.appKey && branding?.n11_settings?.appKey) {
      settings = { ...branding.n11_settings, ...settings };
    }

    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    if (prodRes.rows.length === 0) return res.status(404).json({ error: "Ürün bulunamadı" });
    const product = prodRes.rows[0];

    if (String(product.product_type || "").toLowerCase() === "service" || /^servis$|^hizmet$/i.test(String(product.category || "").trim())) {
      return res.status(400).json({ error: `"${product.name}" bir Hizmet/Servis kalemi olduğu için e-Mağaza (N11) listelerine eklenemez.` });
    }

    const rawPrice = Number(product.price || product.sale_price || 0);
    const stock = computeSellableStock(product.stock_quantity, product.reserved_stock);

    if (rawPrice <= 0 || stock <= 0) {
      const reasons = [];
      if (rawPrice <= 0) reasons.push("fiyatı 0₺");
      if (stock <= 0) reasons.push(Number(product.reserved_stock || 0) > 0 ? "tüm stok rezerveli (satılabilir 0)" : "stoğu yetersiz (0/negatif)");
      return res.status(400).json({ error: `"${product.name}" ürününün ${reasons.join(" ve ")} olduğu için N11'de satışa açılamaz. Lütfen fiyat ve stoğu güncelleyin.` });
    }

    let mpData: any = product.marketplace_data;
    if (typeof mpData === "string") {
      try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
    }
    mpData = mpData || {};

    // Resolve price in TL (with currency conversion + N11 commission/fixedFee markup)
    const { N11Service } = await import("../src/services/backend/n11Service");
    let webPriceTry = rawPrice;
    const prodCurrency = String(product.currency || storeRow.default_currency || "TRY").toUpperCase();
    if (prodCurrency !== "TRY" && prodCurrency !== "TL") {
      const rates = { ...(branding?.currency_rates || {}), ...(storeRow.currency_rates || {}) };
      const rate = Number(rates[prodCurrency] || (prodCurrency === "USD" ? 49.5647 : prodCurrency === "EUR" ? 55.4997 : 1));
      if (rate > 1) {
        webPriceTry = rawPrice * rate;
      }
    }
    const finalN11Price = N11Service.calculateMarketplacePrice(
      webPriceTry,
      product.category,
      product.sub_category,
      settings
    );

    const sellerCode = String(
      mpData?.n11?.sellerStockCode ||
      mpData?.n11?.productSellerCode ||
      mpData?.n11?.stockCode ||
      product.sku ||
      product.barcode ||
      `PRD-${product.id}`
    ).trim();
    const productImages = extractProductMarketplaceImages(product, req, {
      maxCount: 8,
      mpData,
    });

    if (productImages.length === 0) {
      productImages.push("https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80");
    }

    const shipmentTemplate = settings.shipmentTemplate || "alici";

    if (!settings.appKey || !settings.appSecret) {
      return res.status(400).json({ error: "N11 API anahtarları (App Key / App Secret) tanımlı değil." });
    }

    // Resolve N11 Category ID from request, product marketplace_data, store categoryMappings, or smart leaf category resolver
    const catMappings = settings.categoryMappings || {};
    const catKey = product.category ? String(product.category).trim() : "";
    const subKey = product.sub_category ? String(product.sub_category).trim() : "";
    const compKey = catKey && subKey ? `${catKey} > ${subKey}` : "";
    const explicitCatId =
      categoryId ||
      mpData?.n11?.categoryId ||
      (compKey && catMappings[compKey]) ||
      (subKey && catMappings[subKey]) ||
      (catKey && catMappings[catKey]);
    const mappedCatId = N11Service.resolveCategoryIdForProduct(
      product.name,
      catKey,
      subKey,
      explicitCatId
    );

    const resolvedBrand =
      String(
        product.brand ||
        mpData?.n11?.attributes?.Marka ||
        mpData?.attributes?.Marka ||
        mpData?.hepsiburada?.attributes?.Marka ||
        ""
      ).trim() || undefined;

    let n11Id = "";
    let apiMessage = "";
    let groupId: any = undefined;
    let catalogId: any = undefined;
    let sellerNickname: any = undefined;
    let resolvedSellerStockCode = sellerCode;
    let resolvedTitle = product.name;
    let isLive = false;

    try {
      const saveRes = await N11Service.saveProduct(settings, {
        productSellerCode: sellerCode,
        productMainId: mpData?.n11?.attributes?.VaryantGroupID || `GRP-${sellerCode}`,
        barcode: product.barcode || sellerCode,
        brand: resolvedBrand,
        categoryName: catKey,
        subCategoryName: subKey,
        title: product.name,
        subtitle: (product.name || "").substring(0, 45),
        description: product.description || product.name,
        category: { id: Number(mappedCatId || 1000212) },
        price: finalN11Price,
        currencyType: "TL",
        vatRate: Number(product.vat_rate ?? 20),
        images: productImages,
        shipmentTemplate: shipmentTemplate,
        preparingDay: settings.preparingDay ? Number(settings.preparingDay) : 1,
        attributes: Array.isArray(attributes) ? attributes : undefined,
        stockItems: [
          {
            sellerStockCode: sellerCode,
            quantity: stock,
            gtin: product.barcode || undefined
          }
        ]
      });
      if (!saveRes.success || !saveRes.n11Id) {
        const errMsg = saveRes.message || "N11 ürün kaydı başarısız oldu.";
        await pool.query("UPDATE products SET n11_last_error = $1 WHERE id = $2 AND store_id = $3", [errMsg, productId, storeId]);
        return res.status(400).json({ error: errMsg });
      }
      n11Id = String(saveRes.n11Id);
      groupId = saveRes.groupId;
      catalogId = saveRes.catalogId;
      sellerNickname = String(saveRes.sellerNickname || settings?.sellerNickname || "").trim();
      resolvedSellerStockCode = saveRes.sellerStockCode || sellerCode;
      resolvedTitle = saveRes.title || product.name;
      isLive = Boolean(saveRes.isLive);
      apiMessage = saveRes.message || (isLive ? "Ürün N11 kataloğunda onaylandı ve satışa açıldı." : "Ürün N11 katalog onay kuyruğuna (InApproval) alındı.");
    } catch (apiErr: any) {
      const errMsg = apiErr.message || "N11 API bağlantı hatası";
      await pool.query("UPDATE products SET n11_last_error = $1 WHERE id = $2 AND store_id = $3", [errMsg, productId, storeId]);
      return res.status(400).json({ error: errMsg });
    }

    const publicCatalogId = String(groupId || catalogId || mpData?.n11?.n11CatalogGroupId || mpData?.n11?.n11CatalogId || "").trim();
    const n11Slug = String(resolvedTitle || "")
      .replace(/Ğ/g, "g").replace(/ğ/g, "g")
      .replace(/Ü/g, "u").replace(/ü/g, "u")
      .replace(/Ş/g, "s").replace(/ş/g, "s")
      .replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i")
      .replace(/Ö/g, "o").replace(/ö/g, "o")
      .replace(/Ç/g, "c").replace(/ç/g, "c")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    const n11SellerSuffix = sellerNickname ? `?magaza=${encodeURIComponent(sellerNickname)}` : "";
    const computedProductUrl = isLive && publicCatalogId
      ? `https://www.n11.com/urun/${n11Slug}-${publicCatalogId}${n11SellerSuffix}`
      : null;

    mpData.n11 = {
      ...(mpData.n11 || {}),
      status: isLive ? "ACTIVE" : "PENDING",
      approvalStatus: isLive ? "1" : "5",
      n11Id,
      productId: n11Id,
      sellerStockCode: resolvedSellerStockCode,
      productSellerCode: resolvedSellerStockCode,
      stockCode: resolvedSellerStockCode,
      title: resolvedTitle,
      ...(groupId ? { n11CatalogGroupId: String(groupId) } : {}),
      ...(catalogId ? { n11CatalogId: String(catalogId) } : {}),
      ...(sellerNickname ? { sellerNickname } : {}),
      productUrl: computedProductUrl,
      price: finalN11Price,
      lastSync: new Date().toISOString(),
      lastError: null
    };

    await pool.query(
      "UPDATE products SET n11_id = $1, is_n11_active = $2, n11_last_error = NULL, marketplace_data = $3 WHERE id = $4 AND store_id = $5",
      [n11Id, isLive, JSON.stringify(mpData), productId, storeId]
    );

    res.json({
      success: true,
      isLive,
      status: isLive ? "ACTIVE" : "PENDING",
      n11Id,
      productUrl: computedProductUrl,
      marketplace_data: mpData,
      message: isLive
        ? `"${product.name}" N11'de canlı satışta! (${apiMessage})`
        : `"${product.name}" N11'e iletildi ve katalog onay kuyruğuna alındı (Onay Bekliyor).`
    });
  } catch (error: any) {
    console.error("N11 Publish Error:", error);
    res.status(500).json({ error: error.message || "N11'de ürün yayınlanamadı" });
  }
});

// N11 Listing Match Endpoint for Gap Bilişim / Enrakipsiz
router.post("/n11/match-listings", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.user?.store_id;
  const storeId = req.user.role === "superadmin" 
    ? Number(rawStoreId || req.user.store_id || 1) 
    : Number(req.user.store_id || rawStoreId);

  try {
    const storeRes = await pool.query("SELECT n11_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Mağaza bulunamadı" });
    }

    const row = storeRes.rows[0];
    let settings = row?.n11_settings;
    if (typeof settings === 'string') { try { settings = JSON.parse(settings); } catch(e) { settings = {}; } }
    let branding = row?.branding;
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch(e) { branding = {}; } }
    if (!settings || !settings.appKey) {
      settings = branding?.n11_settings || settings || {};
    }

    const appKey = String(settings?.appKey || req.body?.appKey || "").trim();
    const appSecret = String(settings?.appSecret || req.body?.appSecret || "").trim();

    const cleanSettings = {
      ...settings,
      appKey,
      appSecret
    };

    const importMissing = Boolean(req.body?.importMissing);
    const { N11Service } = await import("../src/services/backend/n11Service");

    if (!cleanSettings.appKey || !cleanSettings.appSecret) {
      return res.status(400).json({
        success: false,
        error: "N11 API anahtarları (App Key ve App Secret) tanımlı değil. Lütfen önce N11 ayarlarını kaydedin."
      });
    }

    const result = await N11Service.matchListingsWithStoreProducts(cleanSettings, pool, storeId, { importMissing });
    res.json(result);
  } catch (error: any) {
    console.error("[N11 Match Listings Error]:", error?.message || error);
    res.status(400).json({ error: error.message || "N11 ürünleri eşleştirilemedi." });
  }
});

// 4. Disconnect N11
router.post("/n11/disconnect", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch (e) { br = {}; } }
    delete br.n11_settings;
    await pool.query("UPDATE stores SET n11_settings = '{}', branding = $1 WHERE id = $2", [br, storeId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Hepsiburada Integration ---

// 1. Save Hepsiburada Settings
router.post("/hepsiburada/settings", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId);
  const { 
    apiKey, 
    apiSecret, 
    merchantId, 
    isTestMode, 
    userAgent, 
    defaultDispatchTime, 
    defaultCargoCompany, 
    autoSyncOrders, 
    autoStockSync,
    webhookSecret,
    categoryMappings,
    categoryMappingLabels,
    categoryAttributes,
    categoryMarkups,
    defaultCommissionRate,
    defaultFixedFee
  } = req.body;

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });

    let prev = storeRes.rows[0]?.hepsiburada_settings || {};
    if (typeof prev === 'string') { try { prev = JSON.parse(prev); } catch { prev = {}; } }
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch { br = {}; } }
    const prevMerged = { ...(br.hepsiburada_settings || {}), ...prev };

    const finalApiKey = (apiKey !== undefined ? String(apiKey).trim() : String(prevMerged.apiKey || "").trim()) || "lookprice_dev";
    const finalApiSecret = apiSecret !== undefined ? String(apiSecret).trim() : String(prevMerged.apiSecret || "").trim();
    const finalMerchantId = merchantId !== undefined ? String(merchantId).trim() : String(prevMerged.merchantId || "").trim();
    const finalIsTestMode = isTestMode !== undefined ? Boolean(isTestMode) : Boolean(prevMerged.isTestMode);

    const credsChanged =
      finalApiKey !== String(prevMerged.apiKey || "").trim() ||
      finalApiSecret !== String(prevMerged.apiSecret || "").trim() ||
      finalMerchantId !== String(prevMerged.merchantId || "").trim() ||
      finalIsTestMode !== Boolean(prevMerged.isTestMode);

    const rawReqUa = userAgent !== undefined ? String(userAgent).trim() : "";
    const cleanReqUa = /lookprice marketplace manager/i.test(rawReqUa) ? "" : rawReqUa;
    const rawPrevUa = String(prevMerged.userAgent || "").trim();
    const cleanPrevUa = /lookprice marketplace manager/i.test(rawPrevUa) ? "" : rawPrevUa;
    const finalUserAgent = cleanReqUa || (credsChanged ? finalApiKey : (cleanPrevUa || finalApiKey));

    const rawCargo = String(defaultCargoCompany !== undefined ? defaultCargoCompany : (prevMerged.defaultCargoCompany || "Hepsijet")).trim();
    const normalizedCargo = rawCargo.toLowerCase() === "hepsijet" ? "Hepsijet" : (rawCargo || "Hepsijet");
    const parsedDispatch = Math.max(1, Math.floor(Number(defaultDispatchTime ?? prevMerged.defaultDispatchTime ?? 1) || 1));

    const rawCatMappings = categoryMappings !== undefined ? categoryMappings : (prevMerged.categoryMappings || {});
    const { sanitizeCategoryMappings, deepScrubPoisonedCategoryIds } = await import("../src/services/backend/systemGuardService");
    const cleanCatMappings = sanitizeCategoryMappings(rawCatMappings);
    const rawCatLabels = categoryMappingLabels !== undefined ? categoryMappingLabels : (prevMerged.categoryMappingLabels || {});
    const rawCatAttrs = categoryAttributes !== undefined ? categoryAttributes : (prevMerged.categoryAttributes || {});
    const rawCatMarkups = categoryMarkups !== undefined ? categoryMarkups : (prevMerged.categoryMarkups || {});

    const settings: any = deepScrubPoisonedCategoryIds({
      ...prevMerged,
      connected: !!(finalApiKey && finalApiSecret && finalMerchantId),
      apiKey: finalApiKey,
      apiSecret: finalApiSecret,
      merchantId: finalMerchantId,
      isTestMode: finalIsTestMode,
      userAgent: finalUserAgent,
      defaultDispatchTime: parsedDispatch,
      defaultCargoCompany: normalizedCargo,
      defaultCommissionRate: defaultCommissionRate !== undefined ? Number(defaultCommissionRate) : (prevMerged.defaultCommissionRate ?? 18),
      defaultFixedFee: defaultFixedFee !== undefined ? Number(defaultFixedFee) : (prevMerged.defaultFixedFee ?? 20),
      autoSyncOrders: autoSyncOrders !== undefined ? Boolean(autoSyncOrders) : (prevMerged.autoSyncOrders ?? true),
      autoStockSync: autoStockSync !== undefined ? Boolean(autoStockSync) : (prevMerged.autoStockSync ?? true),
      webhookSecret: webhookSecret || prevMerged.webhookSecret || `hb_wh_${Math.random().toString(36).substring(2, 12)}`,
      categoryMappings: cleanCatMappings,
      categoryMappingLabels: rawCatLabels,
      categoryAttributes: rawCatAttrs,
      categoryMarkups: rawCatMarkups
    });

    if (credsChanged) {
      delete settings.authUsername;
      delete settings.authUserAgent;
      delete settings.listingAuthUsername;
      delete settings.listingAuthUserAgent;
    } else {
      if (settings.authUserAgent && /lookprice marketplace manager/i.test(String(settings.authUserAgent))) {
        delete settings.authUsername;
        delete settings.authUserAgent;
      }
      if (settings.listingAuthUserAgent && /lookprice marketplace manager/i.test(String(settings.listingAuthUserAgent))) {
        delete settings.listingAuthUsername;
        delete settings.listingAuthUserAgent;
      }
    }

    br.hepsiburada_settings = settings;
    await pool.query("UPDATE stores SET hepsiburada_settings = $1, branding = $2 WHERE id = $3", [settings, br, storeId]);
    import("../src/services/cronJobs").then(({ syncMarketplacePricesOnRateChange }) => {
      syncMarketplacePricesOnRateChange(Number(storeId)).catch(() => {});
    }).catch(() => {});
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Hepsiburada Settings
router.get("/hepsiburada/settings", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query?.storeId);
  try {
    const result = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = result.rows[0];
    let hb = row?.hepsiburada_settings || {};
    if (typeof hb === 'string') { try { hb = JSON.parse(hb); } catch { hb = {}; } }
    let br = row?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch { br = {}; } }
    const hbBr = br.hepsiburada_settings || {};
    const merged: any = { ...hbBr, ...hb };
    if (merged.userAgent && /lookprice marketplace manager/i.test(String(merged.userAgent))) {
      merged.userAgent = merged.apiKey || "lookprice_dev";
    }
    res.json(merged);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Test Hepsiburada Connection
router.post("/hepsiburada/test", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId);
  try {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, message: "Demo mağaza simülasyonu: Hepsiburada bağlantısı başarılı." });
    }

    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    let hbDb = storeRes.rows[0]?.hepsiburada_settings || {};
    if (typeof hbDb === 'string') { try { hbDb = JSON.parse(hbDb); } catch { hbDb = {}; } }
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch { br = {}; } }
    let settings: any = { ...(br.hepsiburada_settings || {}), ...hbDb };

    // Allow testing with unsaved/fresh parameters passed in request body
    if (req.body && (req.body.merchantId || req.body.apiSecret || req.body.apiKey || req.body.isTestMode !== undefined)) {
      const nextApiKey = String(req.body.apiKey || settings.apiKey || "lookprice_dev").trim() || "lookprice_dev";
      const nextApiSecret = String(req.body.apiSecret || settings.apiSecret || "").trim();
      const nextMerchantId = String(req.body.merchantId || settings.merchantId || "").trim();
      const nextIsTestMode = req.body.isTestMode !== undefined ? Boolean(req.body.isTestMode) : Boolean(settings.isTestMode);
      const overrideChanged =
        nextApiKey !== String(settings.apiKey || "").trim() ||
        nextApiSecret !== String(settings.apiSecret || "").trim() ||
        nextMerchantId !== String(settings.merchantId || "").trim() ||
        nextIsTestMode !== Boolean(settings.isTestMode);

      settings = {
        ...settings,
        apiKey: nextApiKey,
        apiSecret: nextApiSecret,
        merchantId: nextMerchantId,
        isTestMode: nextIsTestMode,
      };
      if (overrideChanged) {
        delete settings.authUsername;
        delete settings.authUserAgent;
        delete settings.listingAuthUsername;
        delete settings.listingAuthUserAgent;
        delete settings.userAgent;
      }
    }

    if (!settings || !settings.merchantId || !settings.apiSecret) {
      return res.status(400).json({ 
        success: false, 
        error: "Hepsiburada API bilgileri eksik (Merchant ID veya API Secret şifresi girilmemiş)." 
      });
    }

    const hbService = new HepsiburadaService(settings, storeId);
    const testResult = await hbService.testConnection();
    res.json({
      ...testResult,
      environment: testResult?.details?.environment || (settings.isTestMode ? "Sandbox (Test)" : "Production"),
      merchantName: testResult.success ? "Onaylandı" : undefined,
      error: testResult.success ? undefined : (testResult.error || testResult.details?.error || testResult.message)
    });
  } catch (error: any) {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, message: "Demo mağaza simülasyonu: Hepsiburada bağlantısı başarılı." });
    }
    res.status(500).json({ success: false, error: error.message || "Hepsiburada test sunucu hatası" });
  }
});

// 4. Sync Hepsiburada Orders
router.post("/hepsiburada/sync", authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId) || req.user?.store_id || 1);

  try {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, count: 0, message: "Demo mağaza simülasyonu: Hepsiburada siparişleri senkronize edildi." });
    }

    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Mağaza bulunamadı" });
    }

    const row = storeRes.rows[0];
    let hbDb = row?.hepsiburada_settings || {};
    if (typeof hbDb === 'string') { try { hbDb = JSON.parse(hbDb); } catch { hbDb = {}; } }
    let branding = row?.branding || {};
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch { branding = {}; } }
    const settings = { ...(branding?.hepsiburada_settings || {}), ...hbDb };

    const merchantId = String(settings?.merchantId || req.body?.merchantId || "").trim();
    const apiKey = String(settings?.apiKey || req.body?.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const apiSecret = String(settings?.apiSecret || req.body?.apiSecret || "").trim();

    if (!merchantId || !apiSecret) {
      return res.status(400).json({ 
        error: "Hepsiburada API bilgileri eksik (Lütfen Ayarlar > E-Mağazalar sekmesinden Satıcı ID / Merchant ID ve API Secret şifre bilgilerinizi eksiksiz kaydedin)" 
      });
    }

    const cleanSettings = {
      ...settings,
      merchantId,
      apiKey,
      apiSecret,
      isTestMode: Boolean(settings?.isTestMode)
    };

    const hbService = new HepsiburadaService(cleanSettings, storeId);
    const beginDate = req.body?.beginDate || req.query?.beginDate;
    const timespan = req.body?.timespan !== undefined ? Number(req.body.timespan) : (req.query?.timespan !== undefined ? Number(req.query.timespan) : 30);
    const { syncedCount, errors } = await hbService.syncOrdersToDatabase({ beginDate, timespan });

    res.json({ success: true, count: syncedCount, errors });
  } catch (error: any) {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, count: 0, message: "Demo mağaza simülasyonu: Hepsiburada siparişleri senkronize edildi." });
    }
    console.error("[Hepsiburada Sync Error]:", error?.message || error);
    await IntegrationService.logIntegrationError(storeId, 'Hepsiburada', 'Sync All Orders', error);
    
    // Provide user-friendly diagnostic guidance
    let errorDetail = error.response?.data?.message || error.response?.data?.error || error.message || "Hepsiburada siparişleri senkronize edilemedi.";
    if (error.response?.status === 401 || error.response?.status === 403 || errorDetail.includes("401") || errorDetail.includes("403") || errorDetail.includes("Kimlik Doğrulama")) {
      errorDetail = "Hepsiburada API Kimlik Doğrulama Reddedildi (401/403). Lütfen Satıcı Paneli (Satıcı Bilgileri > Entegratör) ayarlarından Merchant ID, API Key ve Secret Key değerlerinizin doğru girildiğinden ve onaylandığından emin olun.";
    } else if (error.response?.status === 404 || errorDetail.includes("404")) {
      errorDetail = "Hepsiburada Sipariş API uç noktası bulunamadı (404). Lütfen Merchant ID bilginizi kontrol edin.";
    }

    res.status(400).json({ error: errorDetail });
  }
});

// 4.1 Match Live Hepsiburada Listings with Local Store Products
router.post("/hepsiburada/match-listings", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.user?.store_id;
  const storeId = req.user.role === "superadmin" 
    ? Number(rawStoreId || req.user.store_id || 1) 
    : Number(req.user.store_id || rawStoreId);

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Mağaza bulunamadı" });
    }

    const row = storeRes.rows[0];
    let settings = row?.hepsiburada_settings;
    if (typeof settings === 'string') { try { settings = JSON.parse(settings); } catch(e) { settings = {}; } }
    let branding = row?.branding;
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch(e) { branding = {}; } }
    if (!settings || !settings.merchantId) {
      settings = branding?.hepsiburada_settings || settings || {};
    }

    const merchantId = String(settings?.merchantId || req.body?.merchantId || "").trim();
    const apiKey = String(settings?.apiKey || req.body?.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const apiSecret = String(settings?.apiSecret || req.body?.apiSecret || "").trim();

    if (!merchantId || !apiSecret) {
      return res.status(400).json({ 
        error: "Hepsiburada API bilgileri eksik (Lütfen Satıcı ID / Merchant ID ve API Secret bilgilerinizi kaydedin)." 
      });
    }

    const cleanSettings = {
      ...settings,
      merchantId,
      apiKey,
      apiSecret,
      isTestMode: Boolean(settings?.isTestMode)
    };

    const importMissing = Boolean(req.body?.importMissing);
    const hbService = new HepsiburadaService(cleanSettings, storeId);
    const result = await hbService.matchListingsWithStoreProducts({ importMissing });

    res.json(result);
  } catch (error: any) {
    console.error("[Hepsiburada Match Listings Error]:", error?.message || error);
    await IntegrationService.logIntegrationError(storeId, 'Hepsiburada', 'Match Listings', error);
    res.status(400).json({ error: error.message || "Hepsiburada ürünleri eşleştirilemedi." });
  }
});

// 4.2 Get Live Hepsiburada Listings
router.get("/hepsiburada/listings", authenticate, async (req: any, res) => {
  const rawStoreId = req.query?.storeId || req.user?.store_id;
  const storeId = req.user.role === "superadmin" 
    ? Number(rawStoreId || req.user.store_id || 1) 
    : Number(req.user.store_id || rawStoreId);

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Mağaza bulunamadı" });
    }

    const row = storeRes.rows[0];
    let settings = row?.hepsiburada_settings;
    if (typeof settings === 'string') { try { settings = JSON.parse(settings); } catch(e) { settings = {}; } }
    let branding = row?.branding;
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch(e) { branding = {}; } }
    if (!settings || !settings.merchantId) {
      settings = branding?.hepsiburada_settings || settings || {};
    }

    const cleanSettings = {
      ...settings,
      merchantId: String(settings?.merchantId || "").trim(),
      apiKey: String(settings?.apiKey || "lookprice_dev").trim(),
      apiSecret: String(settings?.apiSecret || "").trim(),
      isTestMode: Boolean(settings?.isTestMode)
    };

    if (!cleanSettings.merchantId || !cleanSettings.apiSecret) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik." });
    }

    const hbService = new HepsiburadaService(cleanSettings, storeId);
    const listings = await hbService.fetchMerchantListings();
    res.json({ success: true, count: listings.length, listings });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "İlanlar listelenemedi." });
  }
});

// 5. Bulk Sync Active Products Inventory (Price & Stock)
router.post("/hepsiburada/sync-inventory", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = storeRes.rows[0];
    let settings = row?.hepsiburada_settings || row?.branding?.hepsiburada_settings || {};
    if (typeof settings === "string") {
      try { settings = JSON.parse(settings); } catch { settings = {}; }
    }
    const merchantId = String(settings?.merchantId || "").trim();
    const apiKey = String(settings?.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const apiSecret = String(settings?.apiSecret || "").trim();
    if (!merchantId || !apiSecret) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik" });
    }

    const hbService = new HepsiburadaService({ ...settings, merchantId, apiKey, apiSecret }, storeId);
    const result = await hbService.syncAllActiveProducts();
    res.json({ success: true, ...result });
  } catch (error: any) {
    await IntegrationService.logIntegrationError(storeId, 'Hepsiburada', 'Bulk Inventory Sync', error);
    res.status(400).json({ error: error.message || "Hepsiburada ürün envanteri güncellenemedi." });
  }
});

const VIRTUAL_TO_LIVE_HB_CATEGORY_MAP: Record<string, number> = {
  "1000101": 970,      // Usb Bellek
  "1000102": 698,      // Kart Okuyucular
  "1000103": 1100011,  // Sd Kartlar
  "1000104": 80081047, // Taşınabilir SSD
  "1000105": 100225,   // Taşınabilir Disk (External HDD)
  "1000106": 114814,   // SSD Solid State Drive (Dahili SSD)
  "1000107": 100221,   // Hard Diskler (Dahili HDD)
  "1000108": 47,       // Bellek (Ram)
  "1000109": 152,      // Anakartlar
  "1000110": 46,       // İşlemciler
  "1000111": 204,      // Ekran Kartları
  "1000113": 1125,     // Soğutucular / Overclock
  "1000114": 98,       // Dizüstü Bilgisayar Laptop
  "1000115": 111001,   // Mini Masaüstü
  "1000116": 80561022, // Hazır Oyuncu Sistemleri
  "1000117": 3002879,  // Led Monitörler
  "1000121": 1065,     // Webcam
  "1000122": 189,      // Switch Box Ve Çoklayıcılar
  "1000123": 676,      // Notebook Çantaları
  "1000127": 103939,   // Wireless Adaptör
  "1000128": 121,      // Switch (Ethernet Ağ Anahtarları)
  "1000130": 80857383, // Toner & Kartuş
  "1000132": 813,      // Dvd/Hdd Kasaları
  "1000134": 13006537, // Uzatma Kablosu & Grup Priz
  "1000135": 676,
  "1000136": 676,
  "1000137": 676,
  "1000138": 52,
  "1000140": 60001183, // Tablet Kalemleri
  "1000181": 189,
  "1000182": 105307,
  "1000183": 84120,
  "1000184": 505,
  "1000185": 1250,
  "1000187": 84120,
  "1000188": 114325,
  "1000189": 114325,
  "1000190": 106858,
  "1000191": 106858,
  "1000192": 106858,
  "1000193": 106858,
  "1000194": 106858,
  "1000195": 106858,
  "1000196": 106858,
  "1000197": 106858,
  "1000198": 106854,
  "2000105": 256,
  "371960": 371965,
  "371966": 16113,
  "371969": 29010123,
  // Synthetic home/storage/organizer virtual IDs -> Verified live Hepsiburada leaf category IDs
  "8000130": 60004981,
  "8000131": 60004981,
  "8000132": 9010271,
  "8000133": 60003720,
  "8000134": 60004987,
  "8000135": 18021928,
  "8000140": 9010269,
  "8000141": 9010269,
  "8000142": 9010269,
  "8000143": 80485001,
  "8000144": 60004980,
  "8000145": 278747,
  "8000146": 80667015,
  "8000147": 60004982,
  "8000148": 9010269
};

function normalizeSyntheticHbCategoryId(rawCategoryId: any, catSearchStr: string): number | "" {
  const s = String(rawCategoryId || "").trim();
  if (!s || s === "0" || s === "null" || s === "undefined" || s === "2147483647") return "";

  if (s === "1000112") return catSearchStr.includes("psu") || catSearchStr.includes("güç kaynağı") ? 1012 : 1013;
  if (s === "1000118") return catSearchStr.includes("set") ? 3007055 : (catSearchStr.includes("mouse pad") || catSearchStr.includes("mousepad") ? 29 : (catSearchStr.includes("mouse") || catSearchStr.includes("fare") ? 52 : 51));
  if (s === "1000119") return catSearchStr.includes("kulaklık") ? 60004548 : (catSearchStr.includes("mouse") || catSearchStr.includes("fare") ? 52 : 51);
  if (s === "1000120") return catSearchStr.includes("mikrofon") ? 60001543 : 60004548;
  if (s === "1000124") return catSearchStr.includes("soğutucu") ? 106859 : 106861;
  if (s === "1000125") return catSearchStr.includes("modem") ? 45 : 60001272;
  if (s === "1000126") return catSearchStr.includes("router") ? 60001272 : (catSearchStr.includes("menzil") || catSearchStr.includes("extender") || catSearchStr.includes("access point") ? 410 : 103939);
  if (s === "1000129") return catSearchStr.includes("tarayıcı") || catSearchStr.includes("scanner") ? 39 : 6;
  if (s === "1000131") return catSearchStr.includes("yazıcı") ? 106502 : (catSearchStr.includes("terminal") ? 95088 : 106503);
  if (s === "1000133") return catSearchStr.includes("macun") ? 1125 : 60005734;
  if (s === "1000139") return catSearchStr.includes("projeksiyon") ? 15530 : 52;
  if (s === "1000186") return catSearchStr.includes("sata") ? 105306 : 105325;
  if (s === "8000132") {
    if (catSearchStr.includes("vakum")) return 9010267;
    if (catSearchStr.includes("sandık") || catSearchStr.includes("baza")) return 9010270;
    if (catSearchStr.includes("halı")) return 9010268;
    return 9010271;
  }
  if (s === "8000135" && (catSearchStr.includes("file") || catSearchStr.includes("torba") || catSearchStr.includes("yıkama"))) {
    return 80383030;
  }

  if (VIRTUAL_TO_LIVE_HB_CATEGORY_MAP[s]) {
    return VIRTUAL_TO_LIVE_HB_CATEGORY_MAP[s];
  }

  const num = Number(s);
  return Number.isFinite(num) && num > 0 ? num : "";
}

async function resolveHepsiburadaCategoryIdForProduct(
  p: any,
  mpData: any,
  hbData: any,
  settings: any,
  storeId: number,
  cachedLiveCategories?: any[]
): Promise<{ categoryId: number | ""; liveCategories?: any[] }> {
  const catSearchStr = `${p.name || ""} ${p.category || ""} ${p.sub_category || ""}`
    .replace(/İ/g, "i")
    .replace(/I/g, "ı")
    .toLowerCase();

  // 1. Product manual category override
  let rawCategoryId: any = hbData?.categoryId || mpData?.categoryId || "";

  // 2. Store category mappings (hierarchical, sub_category, category)
  if (!rawCategoryId || rawCategoryId === "2147483647") {
    const catKey = p.category ? String(p.category).trim() : "";
    const subCatKey = p.sub_category ? String(p.sub_category).trim() : "";
    const hierarchicalKey = catKey && subCatKey ? `${catKey} > ${subCatKey}` : "";
    const mappings = settings?.categoryMappings || {};
    rawCategoryId =
      (hierarchicalKey && (mappings[hierarchicalKey]?.hepsiburada || mappings[hierarchicalKey])) ||
      (subCatKey && (mappings[subCatKey]?.hepsiburada || mappings[subCatKey])) ||
      (catKey && (mappings[catKey]?.hepsiburada || mappings[catKey])) ||
      "";
  }

  let normalized = normalizeSyntheticHbCategoryId(rawCategoryId, catSearchStr);
  if (normalized) {
    return { categoryId: normalized, liveCategories: cachedLiveCategories };
  }

  // 3. Deterministic electronics & home/organizer keyword heuristics (real live HB leaf IDs)
  if (catSearchStr.includes("priz") || catSearchStr.includes("akım korumalı") || catSearchStr.includes("uzatma kablo")) {
    return { categoryId: 13006537, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("usb flash") || catSearchStr.includes("flash bellek") || (catSearchStr.includes("usb") && catSearchStr.includes("bellek"))) {
    return { categoryId: 970, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("kart okuyucu")) {
    return { categoryId: 698, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("sd kart")) {
    return { categoryId: 1100011, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("ssd") || catSearchStr.includes("nvme") || catSearchStr.includes("m.2")) {
    return { categoryId: catSearchStr.includes("taşınabilir") || catSearchStr.includes("harici") ? 80081047 : 114814, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("wi-fi") || catSearchStr.includes("wifi") || catSearchStr.includes("kablosuz adaptör") || catSearchStr.includes("ağ kart")) {
    return { categoryId: 103939, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("switch") && (catSearchStr.includes("port") || catSearchStr.includes("gigabit") || catSearchStr.includes("ethernet"))) {
    return { categoryId: 121, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("hdmi") || catSearchStr.includes("displayport") || catSearchStr.includes("vga")) {
    return { categoryId: 84120, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("cat6") || catSearchStr.includes("cat7") || catSearchStr.includes("patch") || catSearchStr.includes("ethernet kablo")) {
    return { categoryId: 505, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("notebook stand") || catSearchStr.includes("laptop stand")) {
    return { categoryId: 106861, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("klavye") && catSearchStr.includes("mouse")) {
    return { categoryId: 3007055, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("mouse") || catSearchStr.includes("fare") || catSearchStr.includes("sunum kumanda")) {
    return { categoryId: 52, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("klavye")) {
    return { categoryId: 51, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("ram") || catSearchStr.includes("ddr4") || catSearchStr.includes("ddr5")) {
    return { categoryId: 47, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("vakumlu") && (catSearchStr.includes("hurç") || catSearchStr.includes("hurc") || catSearchStr.includes("poşet"))) {
    return { categoryId: 9010267, liveCategories: cachedLiveCategories };
  } else if ((catSearchStr.includes("sandık") || catSearchStr.includes("baza")) && (catSearchStr.includes("hurç") || catSearchStr.includes("hurc"))) {
    return { categoryId: 9010270, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("halı") && (catSearchStr.includes("hurç") || catSearchStr.includes("hurc"))) {
    return { categoryId: 9010268, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("hurç") || catSearchStr.includes("hurc") || catSearchStr.includes("hurcu")) {
    return { categoryId: 9010271, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("çamaşır yıkama") && (catSearchStr.includes("file") || catSearchStr.includes("torba"))) {
    return { categoryId: 80383030, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("çamaşır sepet")) {
    return { categoryId: 18021928, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("makyaj") && (catSearchStr.includes("organizer") || catSearchStr.includes("düzenleyici"))) {
    return { categoryId: 80485001, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("banyo") && (catSearchStr.includes("organizer") || catSearchStr.includes("düzenleyici"))) {
    return { categoryId: 60003486, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("ayakkabı") && (catSearchStr.includes("kutu") || catSearchStr.includes("organizer") || catSearchStr.includes("düzenleyici"))) {
    return { categoryId: 60004980, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("valiz kılıf") || (catSearchStr.includes("valiz") && catSearchStr.includes("düzenleyici"))) {
    return { categoryId: 60003938, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("valiz") || catSearchStr.includes("bavul")) {
    return { categoryId: 1300939, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("elbise askı") || catSearchStr.includes("giysi kılıf") || catSearchStr.includes("elbise kılıf")) {
    return { categoryId: 60004987, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("saklama kutu") || catSearchStr.includes("kapaklı saklama")) {
    return { categoryId: 60004981, liveCategories: cachedLiveCategories };
  } else if (catSearchStr.includes("çekmece") || catSearchStr.includes("dolap içi") || catSearchStr.includes("düzenleyici") || catSearchStr.includes("organizer")) {
    return { categoryId: 9010269, liveCategories: cachedLiveCategories };
  }

  // 4. Smart Auto-Match against live merged Hepsiburada leaf categories (4785+ live categories)
  try {
    const liveCats = cachedLiveCategories || (await getMergedHepsiburadaCategories(storeId));
    const { suggestMarketplaceCategory } = await import("../src/data/marketplaceCategoriesData");
    const catKey = p.category ? String(p.category).trim() : "";
    const subCatKey = p.sub_category ? String(p.sub_category).trim() : "";
    const queryStr = [catKey, subCatKey].filter(Boolean).join(" > ") || String(p.name || "");
    const suggestion = suggestMarketplaceCategory(queryStr, liveCats);
    if (suggestion?.bestMatch && suggestion.score >= 50) {
      normalized = normalizeSyntheticHbCategoryId(suggestion.bestMatch.id, catSearchStr);
      if (normalized) {
        return { categoryId: normalized, liveCategories: liveCats };
      }
    }
    return { categoryId: "", liveCategories: liveCats };
  } catch {
    return { categoryId: "", liveCategories: cachedLiveCategories };
  }
}

function resolveCategoryAttributeValue(rawVal: any, p: any): string {
  if (rawVal === undefined || rawVal === null) return "";
  let valStr = "";
  if (typeof rawVal === "object") {
    if (Array.isArray(rawVal)) return rawVal.filter(Boolean).join(", ");
    valStr = rawVal.value !== undefined ? String(rawVal.value) : "";
  } else {
    valStr = String(rawVal);
  }
  valStr = valStr.trim();
  if (!valStr) return "";
  if (valStr.startsWith("$product.")) {
    const firstVar = Array.isArray(p?.variants) && p.variants.length > 0 ? p.variants[0] : null;
    switch (valStr) {
      case "$product.brand": return String(p?.brand || p?.brand_name || "").trim();
      case "$product.name": return String(p?.name || "").trim();
      case "$product.barcode": return String(p?.barcode || "").trim();
      case "$product.model": return String(p?.model || "").trim();
      case "$product.tax_rate":
      case "$product.kdv": return String(p?.tax_rate ?? p?.vat_rate ?? 20);
      case "$product.sku":
      case "$product.product_code": return String(p?.sku || p?.product_code || p?.barcode || "").trim();
      case "$product.description": return String(p?.description || p?.name || "").trim();
      case "$product.category": return String(p?.category || "").trim();
      case "$product.sub_category": return String(p?.sub_category || "").trim();
      case "$product.price": return p?.price !== undefined && p?.price !== null ? String(p.price) : "";
      case "$product.variant_color": return String(p?.color || p?.sector_data?.color || firstVar?.color || "").trim();
      case "$product.variant_size": return String(p?.size || p?.sector_data?.size || firstVar?.size || "").trim();
      default: return "";
    }
  }
  return valStr;
}

function normalizeMarketplaceImageUrl(
  raw: any,
  req: any,
  options?: { stripQueryForExtension?: boolean }
): string | null {
  if (!raw) return null;
  let candidate = "";
  if (typeof raw === "string") {
    candidate = raw.trim();
  } else if (typeof raw === "object") {
    candidate = String(raw.url || raw.imageUrl || raw.src || "").trim();
  }
  if (!candidate || candidate.startsWith("data:") || candidate.startsWith("blob:")) {
    return null;
  }

  if (candidate.startsWith("/")) {
    const envBase = process.env.PUBLIC_APP_URL || process.env.APP_URL;
    const host = req?.get?.("host") || "lookprice.net";
    if (envBase && /^https?:\/\//i.test(envBase) && host.includes("localhost")) {
      candidate = `${envBase.replace(/\/$/, "")}${candidate}`;
    } else {
      const protocol =
        req?.protocol === "http" && !host.includes("localhost")
          ? "https"
          : req?.protocol || "https";
      candidate = `${protocol}://${host}${candidate}`;
    }
  } else if (!/^https?:\/\//i.test(candidate)) {
    const baseOrigin = (process.env.PUBLIC_APP_URL || process.env.APP_URL || "https://lookprice.net").replace(/\/$/, "");
    candidate = `${baseOrigin}/${candidate.replace(/^\/+/, "")}`;
  }

  const isOwnStoragePath = /\/(?:api\/storage|uploads)\//i.test(candidate);
  if (!isOwnStoragePath && /\.webp($|\?)/i.test(candidate)) {
    candidate = candidate.replace(/\.webp($|\?)/i, ".jpg$1");
  }

  if (
    options?.stripQueryForExtension &&
    candidate.includes("?") &&
    /\.(jpe?g|png|webp)$/i.test(candidate.split("?")[0])
  ) {
    candidate = candidate.split("?")[0];
  }

  if (!/^https?:\/\//i.test(candidate)) {
    return null;
  }
  return candidate;
}

function extractProductMarketplaceImages(
  p: any,
  req: any,
  options?: {
    maxCount?: number;
    userAttrs?: Record<string, any>;
    mpData?: any;
    stripQueryForExtension?: boolean;
  }
): string[] {
  const maxCount = Math.max(1, options?.maxCount ?? 8);
  const rawList: any[] = [];
  const userAttrs = options?.userAttrs || {};
  const mpAttrs = options?.mpData?.attributes || {};

  // 1. Primary cover image always comes first (explicit Image1 override -> product.image_url)
  if (userAttrs?.Image1) rawList.push(userAttrs.Image1);
  if (mpAttrs?.Image1) rawList.push(mpAttrs.Image1);
  if (p?.image_url) rawList.push(p.image_url);

  // 2. Product multi-image gallery (`products.images` JSONB array, stringified JSON, or delimited list)
  let galleryImages: any[] = [];
  if (Array.isArray(p?.images)) {
    galleryImages = p.images;
  } else if (typeof p?.images === "string" && p.images.trim()) {
    const trimmed = p.images.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) galleryImages = parsed;
      } catch {
        galleryImages = [];
      }
    } else {
      galleryImages = trimmed.split(/[\n\r;|,]+/).map((s: string) => s.trim()).filter(Boolean);
    }
  }
  for (const img of galleryImages) {
    rawList.push(img);
  }

  // 3. Explicit Image2..Image10 attribute overrides if present
  for (let i = 2; i <= 10; i++) {
    const key = `Image${i}`;
    if (userAttrs?.[key]) rawList.push(userAttrs[key]);
    if (mpAttrs?.[key]) rawList.push(mpAttrs[key]);
  }

  const seen = new Set<string>();
  const resolved: string[] = [];
  for (const item of rawList) {
    const normalized = normalizeMarketplaceImageUrl(item, req, {
      stripQueryForExtension: options?.stripQueryForExtension,
    });
    if (!normalized) continue;
    const dedupeKey = /\/api\/storage\//i.test(normalized)
      ? normalized.split("?")[0].toLowerCase()
      : normalized.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    resolved.push(normalized);
    if (resolved.length >= maxCount) break;
  }

  return resolved;
}

function buildHepsiburadaCatalogAttributes(
  p: any,
  mpData: any,
  hbData: any,
  categoryId: number | "",
  numericEffectivePrice: number,
  req: any,
  settings?: any
): Record<string, any> {
  const catDefaultsRaw = categoryId ? (settings?.categoryAttributes?.[String(categoryId)] || {}) : {};
  const resolvedDefaults: Record<string, any> = {};
  Object.entries(catDefaultsRaw).forEach(([k, v]) => {
    const resolved = resolveCategoryAttributeValue(v, p);
    if (resolved !== "") resolvedDefaults[k] = resolved;
  });

  const mergedProductAttrs: Record<string, any> = {};
  Object.entries({ ...(mpData?.attributes || {}), ...(hbData?.attributes || {}) }).forEach(([k, v]) => {
    if (v === "") return; // deliberate clear
    const resolved = resolveCategoryAttributeValue(v, p);
    if (resolved !== "") mergedProductAttrs[k] = resolved;
  });

  const userAttrs = { ...resolvedDefaults, ...mergedProductAttrs };

  // Hepsiburada MPOP officially supports up to 5 images: Image1 through Image5
  const hbImages = extractProductMarketplaceImages(p, req, {
    maxCount: 5,
    userAttrs,
    mpData,
  });

  // Remove any raw/unnormalized Image1..Image10 from userAttrs before setting clean Image1..Image5
  for (let i = 1; i <= 10; i++) {
    delete userAttrs[`Image${i}`];
  }

  const inferredHbBrand = String(
    p.brand ||
    userAttrs.Marka ||
    mpData?.n11?.attributes?.Marka ||
    (p.name ? String(p.name).trim().split(/\s+/)[0] : "") ||
    "Diğer"
  ).trim();

  const barcodeStr = String(p.barcode || p.sku || "").trim();
  const attributes: Record<string, any> = {
    merchantSku: barcodeStr,
    VaryantGroupID: `GRP-${barcodeStr}`,
    Barcode: barcodeStr,
    UrunAdi: p.name,
    UrunAciklamasi: `<p>${p.description || p.name}</p>`,
    Marka: inferredHbBrand,
    GarantiSuresi: userAttrs.GarantiSuresi ? parseInt(userAttrs.GarantiSuresi, 10) : 24,
    tax_vat_rate: String(p.tax_rate || userAttrs.tax_vat_rate || 20),
    price: numericEffectivePrice,
    stock: computeSellableStock(p.stock_quantity, p.reserved_stock),
    kg: String(p.desi || 1),
    ...userAttrs
  };

  hbImages.forEach((imgUrl, idx) => {
    attributes[`Image${idx + 1}`] = imgUrl;
  });

  if (Number(categoryId) === 970) {
    if (!attributes.kapasite_) {
      const capMatch = String(p.name || "").match(/(\d+)\s*(gb|tb|mb)/i);
      attributes.kapasite_ = capMatch ? `${capMatch[1]} ${capMatch[2].toUpperCase()}` : "64 GB";
    }
    if (!attributes.usb_3_0) {
      attributes.usb_3_0 = /3\.2/i.test(p.name) ? "Var (USB 3.2)" : (/3\.1/i.test(p.name) ? "Var (USB 3.1)" : "Var");
    }
    if (!attributes["00000PGR"]) attributes["00000PGR"] = ["Type A", "USB 3.0"];
    if (!attributes.okuma_hizi_) attributes.okuma_hizi_ = "100 MB/s";
    if (!attributes.yazma_hizi) attributes.yazma_hizi = "10 MB/s";
    if (!attributes.sifre_koruma) attributes.sifre_koruma = "Yok";
    if (!attributes["000017ZC"]) attributes["000017ZC"] = ["Windows"];
  }

  return attributes;
}

function extractHbCatalogImportError(detail: any): string | null {
  if (!detail) return null;
  if (detail.success === false && detail.message) {
    return String(detail.message);
  }
  const itemInfo = Array.isArray(detail) ? detail[0] : (Array.isArray(detail?.data) ? detail.data[0] : detail);
  if (!itemInfo || typeof itemInfo !== "object") return null;

  const importStatus = String(itemInfo.importStatus || itemInfo.status || itemInfo.state || "").toUpperCase();
  const importMessages = itemInfo.importMessages || itemInfo.errors || itemInfo.failureReasons || [];
  const hasErrMsg = Array.isArray(importMessages) && importMessages.some((m: any) => typeof m === "string" || m?.severity === "ERROR" || m?.message || m?.description);

  if (importStatus === "FAILED" || importStatus === "REJECTED" || hasErrMsg) {
    const errList = Array.isArray(importMessages)
      ? importMessages.map((e: any) => typeof e === "string" ? e : (e.message || e.description || JSON.stringify(e))).filter(Boolean).join("; ")
      : String(importMessages);
    return errList || `Hepsiburada katalog aktarımı reddedildi (${importStatus || "FAILED"})`;
  }
  return null;
}

function extractHbInventoryTaskError(taskDetail: any): string | null {
  if (!taskDetail || typeof taskDetail !== "object") return null;
  const priceVals = Array.isArray(taskDetail.priceValidations) ? taskDetail.priceValidations : [];
  if (priceVals.length > 0) {
    return "Yüksek Fiyat";
  }
  const errs = Array.isArray(taskDetail.errors) ? taskDetail.errors : [];
  if (errs.length > 0) {
    const messages = errs.flatMap((e: any) => {
      if (typeof e === "string") return [e];
      if (Array.isArray(e?.errors)) return e.errors.map(String);
      return [e?.message || e?.error || JSON.stringify(e)];
    }).filter(Boolean);
    return messages.join("; ") || "Envanter yükleme hatası";
  }
  return null;
}

// 5.1 Check Single Product Live Status on Hepsiburada
router.post("/hepsiburada/check-product-status", authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId) || req.user?.store_id || 1);
  const productId = req.body?.productId;
  if (!productId) {
    return res.status(400).json({ error: "Ürün ID gereklidir." });
  }

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Mağaza bulunamadı" });
    }

    const row = storeRes.rows[0];
    let hbDb = row?.hepsiburada_settings || {};
    if (typeof hbDb === 'string') { try { hbDb = JSON.parse(hbDb); } catch { hbDb = {}; } }
    let branding = row?.branding || {};
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch { branding = {}; } }
    const settings = { ...(branding?.hepsiburada_settings || {}), ...hbDb };

    const merchantId = String(settings?.merchantId || "").trim();
    const apiKey = String(settings?.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const apiSecret = String(settings?.apiSecret || "").trim();

    if (!merchantId || !apiSecret) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik." });
    }

    const cleanSettings = { ...settings, merchantId, apiKey, apiSecret, isTestMode: Boolean(settings?.isTestMode) };
    const hbService = new HepsiburadaService(cleanSettings, storeId);

    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: "Ürün bulunamadı" });
    }
    const product = prodRes.rows[0];

    const barcode = (product.barcode || "").trim().toLowerCase();
    const sku = (product.sku || "").trim().toLowerCase();
    const name = (product.name || "").trim().toLowerCase();
    const currentHbSku = (product.hepsiburada_sku || "").trim().toLowerCase();

    // Fetch live merchant listings from Hepsiburada
    const listings = await hbService.fetchMerchantListings({ limit: 500 });
    const norm = (s: string) => s ? s.toLowerCase().replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9]/g, "") : "";
    const pBcDigits = barcode.replace(/\D/g, "");
    const pCode = (product.product_code || "").trim();

    let sec = product.sector_data;
    if (typeof sec === "string") { try { sec = JSON.parse(sec); } catch { sec = {}; } }
    const altBc = Array.isArray(sec?.alternate_barcodes) ? sec.alternate_barcodes.map(String) : [];

    let mpDataPre: any = product.marketplace_data;
    if (typeof mpDataPre === "string") { try { mpDataPre = JSON.parse(mpDataPre); } catch { mpDataPre = {}; } }
    const preHbPid = String(mpDataPre?.hepsiburada?.productId || "").trim().toLowerCase();

    const matched = listings.find((l: any) => {
      const lHbSku = (l.hepsiburadaSku || "").trim();
      const lPid = (l.productId || "").trim();
      const lMSku = (l.merchantSku || "").trim();
      const lBarcode = (l.barcode || "").trim();
      const lName = (l.productName || "").trim();
      const lCleanMSku = lMSku.replace(/_\d+$/, "").replace(/-s$/i, "").trim();
      const lMSkuDigits = lMSku.replace(/\D/g, "");

      if (currentHbSku && lHbSku && norm(currentHbSku) === norm(lHbSku)) return true;
      if (currentHbSku && lPid && norm(currentHbSku) === norm(lPid)) return true;
      if (preHbPid && lPid && norm(preHbPid) === norm(lPid)) return true;
      if (preHbPid && lHbSku && norm(preHbPid) === norm(lHbSku)) return true;
      if (barcode && lBarcode && norm(barcode) === norm(lBarcode)) return true;
      if (barcode && lMSku && norm(barcode) === norm(lMSku)) return true;
      if (sku && lMSku && norm(sku) === norm(lMSku)) return true;
      if (pCode && lMSku && norm(pCode) === norm(lMSku)) return true;
      if (altBc.some((b: string) => norm(b) === norm(lMSku) || norm(b) === norm(lBarcode))) return true;

      if (pBcDigits && lMSkuDigits && lMSkuDigits.length >= 8) {
        if (pBcDigits === lMSkuDigits || pBcDigits.endsWith(lMSkuDigits) || lMSkuDigits.endsWith(pBcDigits)) return true;
      }

      if (lCleanMSku && lCleanMSku.length >= 3 && !lCleanMSku.startsWith("HBCV") && !lCleanMSku.startsWith("HBV")) {
        const normClean = norm(lCleanMSku);
        if (normClean && norm(name).includes(normClean)) return true;
        if (normClean && pCode && (norm(pCode) === normClean || normClean.includes(norm(pCode)) || norm(pCode).includes(normClean))) return true;
        if (normClean && sku && (norm(sku) === normClean || normClean.includes(norm(sku)) || norm(sku).includes(normClean))) return true;
      }

      if (name && lName && norm(name) === norm(lName)) return true;
      return false;
    });

    let mpData: any = product.marketplace_data;
    if (typeof mpData === "string") { try { mpData = JSON.parse(mpData); } catch(e) { mpData = {}; } }
    mpData = mpData || {};
    const hbData = mpData.hepsiburada || {};

    if (matched) {
      const hbSku = matched.hepsiburadaSku || hbData.hepsiburadaSku || null;
      const pid = matched.productId || hbData.productId || null;
      const isSalable = matched.isSalable !== false && matched.status === 'ACTIVE';

      const ownHbSeller = String(settings?.merchantName || settings?.storeName || "").trim();
      const canonicalHbUrl = buildHepsiburadaProductUrl({
        name: name || "urun",
        hepsiburadaSku: hbSku,
        productId: pid,
        barcode,
        sellerName: ownHbSeller || null,
        fallbackToSearch: true,
      });

      mpData.hepsiburada = {
        ...hbData,
        hepsiburadaSku: hbSku,
        productId: pid,
        merchantSku: matched.merchantSku || barcode,
        status: matched.status || 'ACTIVE',
        isSalable,
        error: null,
        productUrl: canonicalHbUrl,
        lastChecked: new Date().toISOString()
      };

      await pool.query(
        `UPDATE products 
         SET is_hepsiburada_active = $1,
             hepsiburada_sku = COALESCE(NULLIF($2, ''), hepsiburada_sku),
             hepsiburada_url = COALESCE(NULLIF($3, ''), hepsiburada_url),
             hepsiburada_last_sync = NOW(),
             hepsiburada_last_error = NULL,
             marketplace_data = $4
         WHERE id = $5 AND store_id = $6`,
        [isSalable, hbSku, canonicalHbUrl || null, JSON.stringify(mpData), productId, storeId]
      );

      return res.json({
        success: true,
        isLive: isSalable,
        status: matched.status || 'ACTIVE',
        hepsiburadaSku: hbSku,
        productId: pid,
        productUrl: mpData.hepsiburada.productUrl,
        message: isSalable 
          ? `Hepsiburada eşleşmesi doğrulandı! Ürün canlı satışta (${hbSku || pid}).`
          : `Ürün Hepsiburada'da bulundu ancak şu an pasif durumda (Durum: ${matched.status}).`
      });
    }

    // Not matched in live listings: inspect MPOP catalog portal directly AND tracking IDs
    const catalogTrackingId = hbData.catalogTrackingId || (hbData.trackingId && hbData.trackingId !== hbData.listingTrackingId ? hbData.trackingId : null);
    const listingTrackingId = hbData.listingTrackingId || (!catalogTrackingId ? hbData.trackingId : null);

    let catalogCheck: { found: boolean; totalCatalogProducts: number; items: any[]; matched?: any } = {
      found: false,
      totalCatalogProducts: 0,
      items: []
    };
    try {
      catalogCheck = await hbService.checkCatalogProductsByStatus(hbData.merchantSku || product.barcode || product.sku);
    } catch {
      // non-blocking
    }

    let trackingDetail: any = null;
    if (catalogTrackingId) {
      try {
        trackingDetail = await hbService.checkCatalogStatus(catalogTrackingId);
      } catch (tErr: any) {
        console.warn("[HB-Status] Catalog tracking check failed:", tErr.message);
      }
    } else if (listingTrackingId) {
      try {
        trackingDetail = await hbService.checkTaskStatus(listingTrackingId);
      } catch (tErr: any) {
        console.warn("[HB-Status] Listing tracking check failed:", tErr.message);
      }
    }

    let statusMsg = "";
    let isFailed = false;
    let failureReason = "";

    if (catalogCheck.found && catalogCheck.matched) {
      const catItem = catalogCheck.matched;
      const pStatus = String(catItem.productStatus || catItem.status || "WAITING").toUpperCase();
      if (pStatus === "REJECTED" || pStatus === "MISSING_INFO") {
        isFailed = true;
        const rejectReason = catItem.rejectReason || catItem.reason || catItem.message || "";
        failureReason = rejectReason
          ? `Hepsiburada Katalog ${pStatus === "REJECTED" ? "Reddi" : "Eksik Bilgi"}: ${rejectReason}`
          : `Hepsiburada katalog incelemesinde aksiyon gerekiyor (Durum: ${pStatus}).`;
        statusMsg = failureReason;
      } else {
        statusMsg = `Ürün Hepsiburada katalog onay kuyruğunda doğrulandı (Durum: ${pStatus}).`;
      }
    } else if (catalogTrackingId) {
      const catErr = extractHbCatalogImportError(trackingDetail);
      const isTrackingMissing = Boolean(trackingDetail && trackingDetail.success === false && (Number(trackingDetail.code) === 4000 || /not found/i.test(String(trackingDetail.message || ""))));
      const itemInfo = Array.isArray(trackingDetail) ? trackingDetail[0] : (Array.isArray(trackingDetail?.data) ? trackingDetail.data[0] : trackingDetail);
      const importStatus = String(itemInfo?.importStatus || itemInfo?.status || itemInfo?.state || "").toUpperCase();

      if (catErr) {
        isFailed = true;
        failureReason = `Hepsiburada Katalog Reddi: ${catErr}`;
        statusMsg = failureReason;
      } else if (isTrackingMissing) {
        isFailed = true;
        failureReason = `Hepsiburada katalog kaydı bulunamadı (Takip No: ${catalogTrackingId} - Tracking id not found). Ürün HB satıcı paneline işlenemedi; kategoriyi kontrol edip yeniden ilana açın.`;
        statusMsg = failureReason;
      } else if (importStatus === "COMPLETED" && itemInfo?.hbSku) {
        statusMsg = `Hepsiburada katalog incelemesi tamamlandı! (HB SKU: ${itemInfo.hbSku})`;
      } else if (importStatus) {
        statusMsg = `Hepsiburada katalog inceleme aşaması: ${importStatus} (Takip No: ${catalogTrackingId})`;
      } else {
        statusMsg = `Hepsiburada katalog incelemesi sürüyor (Takip No: ${catalogTrackingId}).`;
      }
    } else {
      // No catalogTrackingId AND not present in HB MPOP catalog portal!
      isFailed = true;
      const invErr = extractHbInventoryTaskError(trackingDetail);
      if (invErr && /ListingNotFound/i.test(invErr)) {
        failureReason = "Hepsiburada katalog aktarımı hiç başlatılmamış (Kategori ID eksikti). Yalnızca fiyat/stok kuyruğuna gönderildiği için HB 'ListingNotFound' hatası döndürdü — ürün HB Panelde 'Aksiyon bekleyen ürünler' listesine bu nedenle hiç düşmedi. Kategoriyi kontrol edip yeniden ilana açın.";
      } else if (invErr) {
        failureReason = `Hepsiburada İlan Hatası: ${invErr}. Katalog oluşturma kaydı bulunmadığından yeniden ilana açılmalıdır.`;
      } else {
        failureReason = "Bu ürün için Hepsiburada katalog aktarımı hiç başlatılmamış (Katalog Takip No yok ve HB satıcı panelinde kayıt bulunamadı). Lütfen kategoriyi doğrulayıp yeniden ilana açın.";
      }
      statusMsg = failureReason;
    }

    mpData.hepsiburada = {
      ...hbData,
      status: isFailed ? 'FAILED' : 'PENDING_APPROVAL',
      trackingId: catalogTrackingId || listingTrackingId || null,
      trackingDetail: trackingDetail || hbData.trackingDetail || null,
      error: isFailed ? failureReason : null,
      lastChecked: new Date().toISOString()
    };

    await pool.query(
      `UPDATE products 
       SET is_hepsiburada_active = false,
           hepsiburada_last_error = $1,
           marketplace_data = $2
       WHERE id = $3`,
      [isFailed ? failureReason : null, JSON.stringify(mpData), productId]
    );

    return res.json({
      success: true,
      isLive: false,
      isFailed,
      status: isFailed ? 'FAILED' : 'PENDING_APPROVAL',
      error: isFailed ? failureReason : null,
      trackingId: catalogTrackingId || listingTrackingId || null,
      trackingDetail,
      message: statusMsg
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Durum sorgulanamadı." });
  }
});

// 5.2 Bulk Check & Auto-Resolve Pending Approval Products on Hepsiburada
router.post("/hepsiburada/check-bulk-pending-status", authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId) || req.user?.store_id || 1);

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Mağaza bulunamadı" });
    }

    const row = storeRes.rows[0];
    let hbDb = row?.hepsiburada_settings || {};
    if (typeof hbDb === 'string') { try { hbDb = JSON.parse(hbDb); } catch { hbDb = {}; } }
    let branding = row?.branding || {};
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch { branding = {}; } }
    const settings = { ...(branding?.hepsiburada_settings || {}), ...hbDb };

    const merchantId = String(settings?.merchantId || "").trim();
    const apiKey = String(settings?.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const apiSecret = String(settings?.apiSecret || "").trim();

    if (!merchantId || !apiSecret) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik." });
    }

    const cleanSettings = { ...settings, merchantId, apiKey, apiSecret, isTestMode: Boolean(settings?.isTestMode) };
    const hbService = new HepsiburadaService(cleanSettings, storeId);

    // 1. Reconcile and auto-match store products with live Hepsiburada merchant listings
    const matchResult = await hbService.matchListingsWithStoreProducts({ importMissing: false });

    // 2. Inspect remaining unmatched pending records against MPOP catalog + tracking status
    const pendingRowsRes = await pool.query(
      `SELECT id, name, barcode, sku, marketplace_data, hepsiburada_last_error
       FROM products
       WHERE store_id = $1
         AND is_hepsiburada_active = false
         AND (hepsiburada_sku IS NULL OR hepsiburada_sku = '')
         AND (
           marketplace_data->'hepsiburada'->>'status' = 'PENDING_APPROVAL'
           OR marketplace_data->'hepsiburada'->>'catalogTrackingId' IS NOT NULL
           OR marketplace_data->'hepsiburada'->>'listingTrackingId' IS NOT NULL
         )`,
      [storeId]
    );

    let failedCount = 0;
    let remainingPending = 0;

    if (pendingRowsRes.rows.length > 0) {
      const catalogCheck = await hbService.checkCatalogProductsByStatus().catch(() => ({
        found: false,
        totalCatalogProducts: 0,
        items: [] as any[]
      }));
      const norm = (s: any) => String(s || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

      for (const prod of pendingRowsRes.rows) {
        let mpData: any = prod.marketplace_data;
        if (typeof mpData === "string") { try { mpData = JSON.parse(mpData); } catch { mpData = {}; } }
        mpData = mpData || {};
        const hbData = mpData.hepsiburada || {};
        const catTid = hbData.catalogTrackingId || (hbData.trackingId && hbData.trackingId !== hbData.listingTrackingId ? hbData.trackingId : null);
        const listTid = hbData.listingTrackingId || (!catTid ? hbData.trackingId : null);
        const bcNorm = norm(hbData.merchantSku || prod.barcode || prod.sku);

        const catalogItem = catalogCheck.items.find((it: any) =>
          [it.merchantSku, it.MerchantSku, it.barcode, it.Barcode].some((c) => c && norm(c) === bcNorm)
        );

        let failureReason: string | null = null;
        if (catalogItem) {
          const st = String(catalogItem.productStatus || catalogItem.status || "WAITING").toUpperCase();
          if (st === "REJECTED" || st === "MISSING_INFO") {
            failureReason = catalogItem.rejectReason || catalogItem.reason || `Hepsiburada katalog incelemesi reddedildi (${st}).`;
          } else {
            remainingPending++;
            continue;
          }
        } else if (catTid) {
          try {
            const detail = await hbService.checkCatalogStatus(catTid);
            const catErr = extractHbCatalogImportError(detail);
            const isMissing = Boolean(detail && detail.success === false && (Number(detail.code) === 4000 || /not found/i.test(String(detail.message || ""))));
            if (catErr) {
              failureReason = `Hepsiburada Katalog Reddi: ${catErr}`;
            } else if (isMissing) {
              failureReason = `Hepsiburada katalog kaydı bulunamadı (Takip No: ${catTid} - Tracking id not found).`;
            } else {
              remainingPending++;
              continue;
            }
          } catch {
            remainingPending++;
            continue;
          }
        } else {
          // No catalogTrackingId and not in HB MPOP catalog portal
          let taskDetail: any = null;
          if (listTid) {
            taskDetail = await hbService.checkTaskStatus(listTid).catch(() => null);
          }
          const invErr = extractHbInventoryTaskError(taskDetail);
          if (invErr && /ListingNotFound/i.test(invErr)) {
            failureReason = "Katalog aktarımı hiç başlatılmamış (Kategori ID eksikti); HB 'ListingNotFound' hatası döndürdü. Kategoriyi doğrulayıp yeniden ilana açın.";
          } else {
            failureReason = invErr
              ? `Hepsiburada İlan Hatası: ${invErr}`
              : "Katalog aktarımı hiç başlatılmamış (Katalog Takip No yok ve HB panelde kayıt bulunamadı). Yeniden ilana açın.";
          }
        }

        if (failureReason) {
          failedCount++;
          mpData.hepsiburada = {
            ...hbData,
            status: 'FAILED',
            error: failureReason,
            lastChecked: new Date().toISOString()
          };
          await pool.query(
            `UPDATE products
             SET is_hepsiburada_active = false,
                 hepsiburada_last_error = $1,
                 marketplace_data = $2
             WHERE id = $3 AND store_id = $4`,
            [failureReason, JSON.stringify(mpData), prod.id, storeId]
          );
        }
      }
    }

    let summaryMsg = "";
    if (matchResult.matchedCount > 0) {
      summaryMsg = `${matchResult.matchedCount} ürün Hepsiburada'da onaylanmış bulundu ve 'Satışta' durumuna geçirildi!`;
      if (failedCount > 0) summaryMsg += ` (${failedCount} ürün katalog hatası tespit edildi.)`;
      else if (remainingPending > 0) summaryMsg += ` (${remainingPending} ürün incelemede.)`;
    } else if (failedCount > 0) {
      summaryMsg = `${failedCount} ürünün Hepsiburada katalog/ilan aktarımında hata tespit edildi (Hatalı sekmesinden detayları görebilirsiniz).${remainingPending > 0 ? ` ${remainingPending} ürün katalog onayında bekliyor.` : ""}`;
    } else {
      summaryMsg = remainingPending > 0
        ? `Hepsiburada canlı liste ve katalog tarandı. ${remainingPending} ürün gerçekten Hepsiburada katalog onay kuyruğunda bekliyor.`
        : "Hepsiburada canlı liste ve katalog tarandı. Onay bekleyen ürün bulunmuyor.";
    }

    return res.json({
      success: true,
      totalListings: matchResult.totalListings,
      matchedCount: matchResult.matchedCount,
      updatedCount: matchResult.updatedCount + failedCount,
      failedCount,
      remainingPending,
      message: summaryMsg
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Toplu onay sorgulaması gerçekleştirilemedi." });
  }
});

// 6. Publish / Update Single Product to Hepsiburada
router.post("/hepsiburada/publish", authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId) || req.user?.store_id || 1);
  const productId = req.body.productId;

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });
    
    let hbDb = storeRes.rows[0]?.hepsiburada_settings || {};
    if (typeof hbDb === 'string') { try { hbDb = JSON.parse(hbDb); } catch { hbDb = {}; } }
    let branding = storeRes.rows[0]?.branding || {};
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch { branding = {}; } }
    const settings = { ...(branding?.hepsiburada_settings || {}), ...hbDb };

    const merchantId = String(settings?.merchantId || "").trim();
    const apiKey = String(settings?.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const apiSecret = String(settings?.apiSecret || "").trim();

    if (!merchantId || !apiSecret) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik (Ayarlar > E-Mağazalar sekmesinden API anahtarlarınızı kaydedin)" });
    }

    const cleanSettings = {
      ...settings,
      merchantId,
      apiKey,
      apiSecret,
      isTestMode: Boolean(settings?.isTestMode)
    };

    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    const p = prodRes.rows[0];
    if (!p) return res.status(404).json({ error: "Ürün bulunamadı" });

    if (String(p.product_type || "").toLowerCase() === "service" || /^servis$|^hizmet$/i.test(String(p.category || "").trim())) {
      return res.status(400).json({ error: `"${p.name}" bir Hizmet/Servis kalemi olduğu için e-Mağaza (Hepsiburada) listelerine eklenemez.` });
    }

    const sellableHbStock = computeSellableStock(p.stock_quantity, p.reserved_stock);
    if (Number(p.price || 0) <= 0 || sellableHbStock <= 0) {
      const reasons = [];
      if (Number(p.price || 0) <= 0) reasons.push("fiyatı 0₺");
      if (sellableHbStock <= 0) reasons.push(Number(p.reserved_stock || 0) > 0 ? "tüm stok rezerveli (satılabilir 0)" : "stoğu yetersiz (0/negatif)");
      return res.status(400).json({ error: `"${p.name}" ürününün ${reasons.join(" ve ")} olduğu için Hepsiburada'da satışa açılamaz. Lütfen fiyat ve stoğu güncelleyin.` });
    }

    if (!p.barcode || !p.barcode.trim()) {
      return res.status(400).json({ error: `"${p.name}" ürününün barkodu eksik. Hepsiburada'da satışa açmak için geçerli bir barkod gereklidir.` });
    }

    let mpData: any = p.marketplace_data;
    if (typeof mpData === "string") {
      try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
    }
    mpData = mpData || {};
    const hbData = mpData.hepsiburada || (mpData.categoryId !== undefined ? mpData : {});

    const hbService = new HepsiburadaService(cleanSettings, storeId);
    const storeInfoRes = await pool.query("SELECT currency_rates, branding FROM stores WHERE id = $1", [storeId]);
    const storeInfo = storeInfoRes.rows[0];
    const rates = storeInfo?.currency_rates || storeInfo?.branding?.currency_rates || {};

    let rawPrice = parseFloat(p.price || "0");
    const curr = (p.currency || "TRY").toUpperCase();
    if (curr === "USD" && rates.USD) {
      rawPrice = rawPrice * Number(rates.USD);
    } else if (curr === "EUR" && rates.EUR) {
      rawPrice = rawPrice * Number(rates.EUR);
    } else if (curr === "GBP" && rates.GBP) {
      rawPrice = rawPrice * Number(rates.GBP);
    }

    const effectivePrice = hbService.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);
    const numericEffectivePrice = Number(effectivePrice.toFixed(2));

    // Check if user passed a Hepsiburada SKU or direct URL in request body
    let inputHbUrl = req.body.hepsiburadaUrl || req.body.hepsiburada_url;
    let inputHbSku = req.body.hepsiburadaSku || req.body.hepsiburada_sku;

    if (inputHbUrl && String(inputHbUrl).startsWith('http')) {
      const match = String(inputHbUrl).match(/(?:pm-|p-|\/|\bq=)(HBC[V0-9A-Z]+|HBV[0-9A-Z]+|HB[0-9A-Z]+|BS[0-9A-Z]+)/i);
      if (match && !inputHbSku) {
        inputHbSku = match[1].toUpperCase();
      }
    }

    let resolvedHbSku = inputHbSku || p.hepsiburada_sku || hbData.hepsiburadaSku || hbData.hbSku || "";
    let resolvedHbProductId = hbData.productId || "";
    let resolvedHbMerchantSku = hbData.merchantSku || p.barcode.trim();

    // Always reconcile with live Hepsiburada listings first if resolvedHbSku is empty OR is a parent Catalog ID
    const upperInitialSku = String(resolvedHbSku || "").trim().toUpperCase();
    const isParentCatalogIdOnly =
      upperInitialSku &&
      (upperInitialSku.startsWith("HBC0") || upperInitialSku.startsWith("HB0")) &&
      !upperInitialSku.startsWith("HBCV") &&
      !upperInitialSku.startsWith("HBV");

    if (!resolvedHbSku || isParentCatalogIdOnly || !hbData.merchantSku) {
      try {
        const listings = await hbService.fetchMerchantListings({ limit: 500 });
        const norm = (s: any) => String(s || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        const matched = listings.find((l: any) =>
          (resolvedHbSku && l.hepsiburadaSku && norm(l.hepsiburadaSku) === norm(resolvedHbSku)) ||
          (resolvedHbSku && l.productId && norm(l.productId) === norm(resolvedHbSku)) ||
          (resolvedHbProductId && l.productId && norm(l.productId) === norm(resolvedHbProductId)) ||
          (l.merchantSku && norm(l.merchantSku) === norm(p.barcode)) ||
          (l.barcode && norm(l.barcode) === norm(p.barcode)) ||
          (p.sku && l.merchantSku && norm(l.merchantSku) === norm(p.sku))
        );
        if (matched) {
          if (matched.hepsiburadaSku) resolvedHbSku = matched.hepsiburadaSku;
          if (matched.productId) resolvedHbProductId = matched.productId;
          if (matched.merchantSku) resolvedHbMerchantSku = matched.merchantSku;
        }
      } catch {
        // non-blocking
      }
    }

    const { categoryId } = await resolveHepsiburadaCategoryIdForProduct(p, mpData, hbData, cleanSettings, storeId);
    const attributes = buildHepsiburadaCatalogAttributes(p, mpData, hbData, categoryId, numericEffectivePrice, req, cleanSettings);

    // 1. If product does NOT yet exist in HB listings, we MUST submit a real Catalog Import with a valid leaf categoryId!
    let catalogTrackingId: string | undefined;
    let listingTrackingId: string | null = null;
    if (!resolvedHbSku || isParentCatalogIdOnly) {
      if (!categoryId) {
        const missingCatErr = `"${p.name}" için Hepsiburada kategori eşleşmesi bulunamadı (Ürün kategorisi: ${p.category || "Yok"}${p.sub_category ? " > " + p.sub_category : ""}). Katalog oluşturulabilmesi için lütfen önce kategori seçin.`;
        mpData.hepsiburada = {
          ...hbData,
          status: 'FAILED',
          error: missingCatErr,
          lastSync: new Date().toISOString()
        };
        await pool.query(
          `UPDATE products SET is_hepsiburada_active = false, hepsiburada_last_error = $1, marketplace_data = $2 WHERE id = $3 AND store_id = $4`,
          [missingCatErr, JSON.stringify(mpData), productId, storeId]
        );
        return res.status(400).json({ error: missingCatErr });
      }

      if (!attributes.Image1) {
        const missingImgErr = `"${p.name}" ürününde geçerli bir ürün görseli (Image1) bulunamadı. Hepsiburada yeni katalog açılışı için HTTP/HTTPS görsel URL'i zorunludur.`;
        mpData.hepsiburada = {
          ...hbData,
          categoryId: Number(categoryId),
          status: 'FAILED',
          error: missingImgErr,
          lastSync: new Date().toISOString()
        };
        await pool.query(
          `UPDATE products SET is_hepsiburada_active = false, hepsiburada_last_error = $1, marketplace_data = $2 WHERE id = $3 AND store_id = $4`,
          [missingImgErr, JSON.stringify(mpData), productId, storeId]
        );
        return res.status(400).json({ error: missingImgErr });
      }

      // Do NOT swallow catalog import errors — surface exact HB rejections cleanly
      const catRes = await hbService.importCatalogProducts([
        {
          categoryId: Number(categoryId),
          attributes
        }
      ]);
      catalogTrackingId = catRes.trackingId;
      if (!catRes.success || !catalogTrackingId) {
        throw new Error(catRes.message || "Hepsiburada katalog aktarımı başlatılamadı (trackingId dönmedi).");
      }

      // Briefly poll catalog status (~1.5s) to catch immediate schema/attribute/brand rejections
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const immediateStatus = await hbService.checkCatalogStatus(catalogTrackingId);
        const immediateErr = extractHbCatalogImportError(immediateStatus);
        if (immediateErr) {
          throw new Error(`Hepsiburada Katalog Reddi: ${immediateErr}`);
        }
      } catch (pollErr: any) {
        if (String(pollErr?.message || "").startsWith("Hepsiburada Katalog Reddi:")) {
          throw pollErr;
        }
      }
    } else {
      // 2. Product already exists in HB catalog/listings -> update price, stock, dispatchTime via Listing API
      const result = await hbService.updatePriceAndStock([
        {
          HepsiburadaSku: resolvedHbSku,
          MerchantSku: resolvedHbMerchantSku,
          Price: effectivePrice,
          AvailableStock: computeSellableStock(p.stock_quantity, p.reserved_stock),
          DispatchTime: Math.max(1, Math.floor(Number(hbData.dispatchTime || cleanSettings.defaultDispatchTime || 1) || 1)),
        }
      ]);
      listingTrackingId = result.trackingId || null;
    }

    const isLive = Boolean(resolvedHbSku) && !isParentCatalogIdOnly;
    const upperHbSku = String(resolvedHbSku || '').toUpperCase();
    const isMasterHbSku = Boolean(
      resolvedHbSku && 
      (upperHbSku.startsWith('HBC') || upperHbSku.startsWith('HB0') || upperHbSku.startsWith('HB') || upperHbSku.startsWith('BS')) && 
      !upperHbSku.startsWith('HBCV') && 
      !upperHbSku.startsWith('HBV')
    );
    const isVariantHbSku = Boolean(
      resolvedHbSku && 
      (upperHbSku.startsWith('HBCV') || upperHbSku.startsWith('HBV'))
    );

    const ownHbSeller = String(settings?.merchantName || settings?.storeName || "").trim();
    let resolvedHbProductUrl: string | undefined = undefined;
    if (isLive) {
      resolvedHbProductUrl =
        buildHepsiburadaProductUrl({
          name: p.name || "urun",
          hepsiburadaSku: resolvedHbSku || null,
          productId: resolvedHbProductId || null,
          directUrl: inputHbUrl && !String(inputHbUrl).includes("/ara?") ? String(inputHbUrl) : null,
          fallbackSku: p.sku || p.product_code || null,
          barcode: p.barcode || null,
          sellerName: ownHbSeller || null,
          fallbackToSearch: true,
        }) || undefined;
    }

    // Update product marketplace metadata
    mpData.hepsiburada = {
      ...hbData,
      categoryId: categoryId ? Number(categoryId) : undefined,
      attributes,
      price: numericEffectivePrice,
      stock: computeSellableStock(p.stock_quantity, p.reserved_stock),
      hepsiburadaSku: resolvedHbSku || hbData.hepsiburadaSku || null,
      merchantSku: resolvedHbMerchantSku,
      productId: resolvedHbProductId || hbData.productId || (isMasterHbSku ? resolvedHbSku : null),
      status: isLive ? 'ACTIVE' : 'PENDING_APPROVAL',
      productUrl: resolvedHbProductUrl,
      catalogTrackingId: catalogTrackingId || hbData.catalogTrackingId || null,
      listingTrackingId: listingTrackingId || null,
      error: null,
      lastSync: new Date().toISOString()
    };

    await pool.query(
      `UPDATE products 
       SET is_hepsiburada_active = $1,
           hepsiburada_sku = COALESCE(NULLIF($2, ''), hepsiburada_sku),
           hepsiburada_url = COALESCE(NULLIF($3, ''), hepsiburada_url),
           hepsiburada_last_sync = NOW(), 
           hepsiburada_last_error = NULL, 
           marketplace_data = $4 
       WHERE id = $5 AND store_id = $6`,
      [isLive, resolvedHbSku || null, resolvedHbProductUrl || null, JSON.stringify(mpData), productId, storeId]
    );

    const message = isLive
      ? `"${p.name}" Hepsiburada kataloğunda eşleşti ve canlı satışa açıldı! (HB SKU: ${resolvedHbSku})`
      : `"${p.name}" Hepsiburada kataloğuna başarıyla iletildi ve içerik/barkod incelemesi başlatıldı (Takip No: ${catalogTrackingId}). HB Satıcı Panelinde 'Aksiyon bekleyen ürünler > Kontrol aşamasında' sekmesine kısa süre içinde yansıyacaktır.`;

    res.json({
      success: true,
      isLive,
      status: isLive ? 'ACTIVE' : 'PENDING_APPROVAL',
      message,
      effectivePrice,
      trackingId: catalogTrackingId || listingTrackingId,
      catalogTrackingId,
      listingTrackingId,
      hepsiburadaSku: resolvedHbSku || null,
      marketplace_data: mpData
    });
  } catch (e: any) {
    const errMsg = e.message || "Hepsiburada ürün aktarımı başarısız.";
    if (productId) {
      await pool.query(
        `UPDATE products
         SET is_hepsiburada_active = false,
             hepsiburada_last_error = $1,
             marketplace_data = jsonb_set(
               jsonb_set(COALESCE(marketplace_data, '{}'::jsonb), '{hepsiburada,status}', '"FAILED"'::jsonb, true),
               '{hepsiburada,error}',
               to_jsonb($1::text),
               true
             )
         WHERE id = $2 AND store_id = $3`,
        [errMsg, productId, storeId]
      ).catch(() => {});
    }
    res.status(400).json({ error: errMsg });
  }
});

// 6b. Bulk Publish / Update Selected Products to Hepsiburada
router.post("/hepsiburada/bulk-publish", authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId) || req.user?.store_id || 1);
  const productIds = req.body.productIds;

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });

    let hbDb = storeRes.rows[0]?.hepsiburada_settings || {};
    if (typeof hbDb === 'string') { try { hbDb = JSON.parse(hbDb); } catch { hbDb = {}; } }
    let branding = storeRes.rows[0]?.branding || {};
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch { branding = {}; } }
    const settings = { ...(branding?.hepsiburada_settings || {}), ...hbDb };

    const merchantId = String(settings?.merchantId || "").trim();
    const apiKey = String(settings?.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const apiSecret = String(settings?.apiSecret || "").trim();

    if (!merchantId || !apiSecret) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik (Ayarlar > E-Mağazalar sekmesinden API anahtarlarınızı kaydedin)" });
    }

    const cleanSettings = {
      ...settings,
      merchantId,
      apiKey,
      apiSecret,
      isTestMode: Boolean(settings?.isTestMode)
    };

    let query = "SELECT * FROM products WHERE store_id = $1";
    const params: any[] = [storeId];
    if (Array.isArray(productIds) && productIds.length > 0) {
      query += " AND id = ANY($2)";
      params.push(productIds);
    } else {
      query += " AND barcode IS NOT NULL AND barcode != ''";
    }

    const prodRes = await pool.query(query, params);
    const products = prodRes.rows;

    if (products.length === 0) {
      return res.status(400).json({ error: "İlana açılacak uygun barkodlu ürün bulunamadı." });
    }

    const hbService = new HepsiburadaService(cleanSettings, storeId);
    const storeInfoRes = await pool.query("SELECT currency_rates, branding FROM stores WHERE id = $1", [storeId]);
    const storeInfo = storeInfoRes.rows[0];
    const rates = storeInfo?.currency_rates || storeInfo?.branding?.currency_rates || {};

    // Fetch live listings once so already-matched barcodes update inventory instead of creating duplicate catalog items
    let liveListings: any[] = [];
    try {
      liveListings = await hbService.fetchMerchantListings({ limit: 500 });
    } catch {
      liveListings = [];
    }
    const norm = (s: any) => String(s || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    let liveCategoriesCache: any[] | undefined = undefined;
    const inventoryItems: any[] = [];
    const catalogImportItems: any[] = [];
    const skippedItems: any[] = [];

    for (const p of products) {
      if (!p.barcode || !p.barcode.trim()) {
        skippedItems.push({ id: p.id, name: p.name, reason: "Barkod eksik" });
        continue;
      }
      if (String(p.product_type || "").toLowerCase() === "service" || /^servis$|^hizmet$/i.test(String(p.category || "").trim())) {
        skippedItems.push({ id: p.id, name: p.name, reason: "Hizmet kalemi" });
        continue;
      }

      const sellableStock = computeSellableStock(p.stock_quantity, p.reserved_stock);
      let rawPrice = parseFloat(p.price || "0");
      const curr = (p.currency || "TRY").toUpperCase();
      if (curr === "USD" && rates.USD) rawPrice *= Number(rates.USD);
      else if (curr === "EUR" && rates.EUR) rawPrice *= Number(rates.EUR);
      else if (curr === "GBP" && rates.GBP) rawPrice *= Number(rates.GBP);

      if (rawPrice <= 0 || sellableStock <= 0) {
        skippedItems.push({ id: p.id, name: p.name, reason: rawPrice <= 0 ? "Fiyat 0" : "Stok 0" });
        continue;
      }

      const effectivePrice = hbService.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);
      const numericEffectivePrice = Number(effectivePrice.toFixed(2));

      let mpData: any = p.marketplace_data;
      if (typeof mpData === "string") {
        try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
      }
      mpData = mpData || {};
      const hbData = mpData.hepsiburada || {};

      let resolvedHbSku = p.hepsiburada_sku || hbData.hepsiburadaSku || "";
      let resolvedMerchantSku = hbData.merchantSku || p.barcode.trim();
      let resolvedPid = hbData.productId || "";

      const upperSku = String(resolvedHbSku || "").trim().toUpperCase();
      const isParentOnly = upperSku && (upperSku.startsWith("HBC0") || upperSku.startsWith("HB0")) && !upperSku.startsWith("HBCV") && !upperSku.startsWith("HBV");

      if ((!resolvedHbSku || isParentOnly) && liveListings.length > 0) {
        const matched = liveListings.find((l: any) =>
          (resolvedHbSku && l.hepsiburadaSku && norm(l.hepsiburadaSku) === norm(resolvedHbSku)) ||
          (l.merchantSku && norm(l.merchantSku) === norm(p.barcode)) ||
          (l.barcode && norm(l.barcode) === norm(p.barcode)) ||
          (p.sku && l.merchantSku && norm(l.merchantSku) === norm(p.sku))
        );
        if (matched) {
          if (matched.hepsiburadaSku) resolvedHbSku = matched.hepsiburadaSku;
          if (matched.merchantSku) resolvedMerchantSku = matched.merchantSku;
          if (matched.productId) resolvedPid = matched.productId;
        }
      }

      const finalUpperSku = String(resolvedHbSku || "").trim().toUpperCase();
      const hasLiveSku = Boolean(resolvedHbSku) && !((finalUpperSku.startsWith("HBC0") || finalUpperSku.startsWith("HB0")) && !finalUpperSku.startsWith("HBCV") && !finalUpperSku.startsWith("HBV"));

      if (hasLiveSku) {
        mpData.hepsiburada = {
          ...hbData,
          hepsiburadaSku: resolvedHbSku,
          merchantSku: resolvedMerchantSku,
          productId: resolvedPid || hbData.productId || null,
          price: numericEffectivePrice,
          stock: sellableStock,
          status: 'ACTIVE',
          error: null,
          lastSync: new Date().toISOString()
        };
        inventoryItems.push({
          productId: p.id,
          mpData,
          resolvedHbSku,
          MerchantSku: resolvedMerchantSku,
          HepsiburadaSku: resolvedHbSku,
          Price: effectivePrice,
          AvailableStock: sellableStock,
          DispatchTime: cleanSettings.defaultDispatchTime || 1,
        });
      } else {
        const catResolution = await resolveHepsiburadaCategoryIdForProduct(p, mpData, hbData, cleanSettings, storeId, liveCategoriesCache);
        if (catResolution.liveCategories) liveCategoriesCache = catResolution.liveCategories;
        const categoryId = catResolution.categoryId;

        if (!categoryId) {
          const reason = `Kategori eşleşmesi eksik (${p.category || "Genel"})`;
          skippedItems.push({ id: p.id, name: p.name, reason });
          mpData.hepsiburada = { ...hbData, status: 'FAILED', error: reason, lastSync: new Date().toISOString() };
          await pool.query(
            `UPDATE products SET is_hepsiburada_active = false, hepsiburada_last_error = $1, marketplace_data = $2 WHERE store_id = $3 AND id = $4`,
            [reason, JSON.stringify(mpData), storeId, p.id]
          );
          continue;
        }

        const attributes = buildHepsiburadaCatalogAttributes(p, mpData, hbData, categoryId, numericEffectivePrice, req, cleanSettings);
        if (!attributes.Image1) {
          const reason = "Ürün görseli (Image1) eksik";
          skippedItems.push({ id: p.id, name: p.name, reason });
          mpData.hepsiburada = { ...hbData, categoryId: Number(categoryId), status: 'FAILED', error: reason, lastSync: new Date().toISOString() };
          await pool.query(
            `UPDATE products SET is_hepsiburada_active = false, hepsiburada_last_error = $1, marketplace_data = $2 WHERE store_id = $3 AND id = $4`,
            [reason, JSON.stringify(mpData), storeId, p.id]
          );
          continue;
        }

        mpData.hepsiburada = {
          ...hbData,
          categoryId: Number(categoryId),
          attributes,
          merchantSku: resolvedMerchantSku,
          price: numericEffectivePrice,
          stock: sellableStock,
          status: 'PENDING_APPROVAL',
          error: null,
          lastSync: new Date().toISOString()
        };
        catalogImportItems.push({
          productId: p.id,
          mpData,
          payload: {
            categoryId: Number(categoryId),
            attributes
          }
        });
      }
    }

    if (inventoryItems.length === 0 && catalogImportItems.length === 0) {
      return res.status(400).json({
        error: skippedItems.length > 0
          ? `Hiçbir ürün gönderilemedi: ${skippedItems.slice(0, 3).map((s) => `${s.name} (${s.reason})`).join(", ")}`
          : "İlana açılacak uygun ürün bulunamadı.",
        skipped: skippedItems
      });
    }

    let invTrackingId: string | undefined;
    let catTrackingId: string | undefined;

    if (inventoryItems.length > 0) {
      const invRes = await hbService.updatePriceAndStock(
        inventoryItems.map(({ MerchantSku, HepsiburadaSku, Price, AvailableStock, DispatchTime }) => ({
          MerchantSku,
          HepsiburadaSku,
          Price,
          AvailableStock,
          DispatchTime,
        }))
      );
      invTrackingId = invRes.trackingId;
      for (const item of inventoryItems) {
        item.mpData.hepsiburada.listingTrackingId = invTrackingId || null;
        await pool.query(
          `UPDATE products 
           SET is_hepsiburada_active = true,
               hepsiburada_sku = COALESCE(NULLIF($1, ''), hepsiburada_sku),
               hepsiburada_last_sync = NOW(), 
               hepsiburada_last_error = NULL,
               marketplace_data = $2
           WHERE store_id = $3 AND id = $4`,
          [item.resolvedHbSku || null, JSON.stringify(item.mpData), storeId, item.productId]
        );
      }
    }

    if (catalogImportItems.length > 0) {
      const CHUNK_SIZE = 50;
      for (let i = 0; i < catalogImportItems.length; i += CHUNK_SIZE) {
        const chunk = catalogImportItems.slice(i, i + CHUNK_SIZE);
        const catRes = await hbService.importCatalogProducts(chunk.map((c) => c.payload));
        if (!catRes.success || !catRes.trackingId) {
          throw new Error(catRes.message || "Toplu Hepsiburada katalog aktarımı takip numarası döndürmedi.");
        }
        catTrackingId = catRes.trackingId;
        for (const item of chunk) {
          item.mpData.hepsiburada.catalogTrackingId = catTrackingId;
          item.mpData.hepsiburada.listingTrackingId = null;
          await pool.query(
            `UPDATE products
             SET is_hepsiburada_active = false,
                 hepsiburada_last_sync = NOW(),
                 hepsiburada_last_error = NULL,
                 marketplace_data = $1
             WHERE store_id = $2 AND id = $3`,
            [JSON.stringify(item.mpData), storeId, item.productId]
          );
        }
      }
    }

    const totalSynced = inventoryItems.length + catalogImportItems.length;
    res.json({ 
      success: true, 
      syncedCount: totalSynced,
      inventoryUpdatedCount: inventoryItems.length,
      catalogSubmittedCount: catalogImportItems.length,
      skippedCount: skippedItems.length, 
      skipped: skippedItems, 
      trackingId: catTrackingId || invTrackingId,
      catalogTrackingId: catTrackingId || null,
      listingTrackingId: invTrackingId || null,
      message: `${totalSynced} ürün Hepsiburada'ya iletildi (${inventoryItems.length} mevcut ilan güncellendi, ${catalogImportItems.length} yeni ürün katalog onayına gönderildi${skippedItems.length > 0 ? `, ${skippedItems.length} ürün atlandı` : ""}).` 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Toplu Hepsiburada ilana açma başarısız." });
  }
});

// 6b-2. Revise Catalog Images (Image1..Image5) & Attributes on Existing / Live Hepsiburada Products
router.post("/hepsiburada/revise-catalog", authenticate, async (req: any, res) => {
  const storeId = Number(getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId) || req.user?.store_id || 1);
  const rawIds = Array.isArray(req.body?.productIds)
    ? req.body.productIds
    : (req.body?.productId ? [req.body.productId] : []);
  const productIds: number[] = Array.from(
    new Set(rawIds.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id) && id > 0))
  );

  if (productIds.length === 0) {
    return res.status(400).json({ error: "Revize edilecek en az bir ürün seçilmelidir." });
  }

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings, currency_rates, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });

    let hbDb = storeRes.rows[0]?.hepsiburada_settings || {};
    if (typeof hbDb === "string") { try { hbDb = JSON.parse(hbDb); } catch { hbDb = {}; } }
    let branding = storeRes.rows[0]?.branding || {};
    if (typeof branding === "string") { try { branding = JSON.parse(branding); } catch { branding = {}; } }
    const settings = { ...(branding?.hepsiburada_settings || {}), ...(hbDb || {}) };
    const rates = storeRes.rows[0]?.currency_rates || branding?.currency_rates || {};

    const merchantId = String(settings?.merchantId || "").trim();
    const apiKey = String(settings?.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const apiSecret = String(settings?.apiSecret || "").trim();

    if (!merchantId || !apiSecret) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik (Ayarlar > E-Mağazalar sekmesinden API anahtarlarınızı kaydedin)." });
    }

    const cleanSettings = {
      ...settings,
      merchantId,
      apiKey,
      apiSecret,
      isTestMode: Boolean(settings?.isTestMode),
    };
    const hbService = new HepsiburadaService(cleanSettings, storeId);

    const prodsRes = await pool.query(
      `SELECT * FROM products WHERE store_id = $1 AND id = ANY($2::int[])`,
      [storeId, productIds]
    );
    if (prodsRes.rows.length === 0) {
      return res.status(404).json({ error: "Seçilen ürünler mağazada bulunamadı." });
    }

    let liveCategoriesCache: any[] | undefined;
    const revisionItems: Array<{
      productId: number;
      name: string;
      mpData: any;
      imagesCount: number;
      merchantSku: string;
      payload: { categoryId: number; attributes: Record<string, any> };
    }> = [];
    const skippedItems: Array<{ id: number; name: string; reason: string }> = [];

    for (const p of prodsRes.rows) {
      if (String(p.product_type || "").toLowerCase() === "service" || /^servis$|^hizmet$/i.test(String(p.category || "").trim())) {
        skippedItems.push({ id: p.id, name: p.name, reason: "Hizmet/Servis kalemi" });
        continue;
      }

      let mpData = p.marketplace_data || {};
      if (typeof mpData === "string") {
        try { mpData = JSON.parse(mpData); } catch { mpData = {}; }
      }
      const hbData = mpData.hepsiburada || {};
      const resolvedMerchantSku = String(hbData.merchantSku || p.barcode || p.sku || "").trim();
      if (!resolvedMerchantSku) {
        skippedItems.push({ id: p.id, name: p.name, reason: "Barkod / MerchantSku eksik" });
        continue;
      }

      let rawPrice = parseFloat(p.price || "0");
      const curr = String(p.currency || "TRY").toUpperCase().trim();
      if ((curr === "USD" || curr === "$") && Number(rates.USD) > 0) rawPrice *= Number(rates.USD);
      else if ((curr === "EUR" || curr === "€") && Number(rates.EUR) > 0) rawPrice *= Number(rates.EUR);
      else if ((curr === "GBP" || curr === "£") && Number(rates.GBP) > 0) rawPrice *= Number(rates.GBP);
      const effectivePrice = hbService.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);
      const numericEffectivePrice = Math.max(1, Number((Number.isFinite(effectivePrice) ? effectivePrice : (rawPrice || 1)).toFixed(2)));

      // Resolve leaf categoryId (store mappings -> product override -> live HB catalog lookup fallback)
      const catResolution = await resolveHepsiburadaCategoryIdForProduct(p, mpData, hbData, cleanSettings, storeId, liveCategoriesCache);
      if (catResolution.liveCategories) liveCategoriesCache = catResolution.liveCategories;
      let categoryId: number | "" = catResolution.categoryId;

      if (!categoryId) {
        try {
          const catStatus = await hbService.checkCatalogProductsByStatus(resolvedMerchantSku);
          const matchedCatId = Number(catStatus?.matched?.categoryId || 0);
          if (matchedCatId > 0) {
            categoryId = matchedCatId;
          }
        } catch {
          // non-blocking fallback
        }
      }

      if (!categoryId) {
        skippedItems.push({
          id: p.id,
          name: p.name,
          reason: `Hepsiburada alt kategori eşleşmesi bulunamadı (${p.category || "Genel"})`
        });
        continue;
      }

      const attributes = buildHepsiburadaCatalogAttributes(p, mpData, hbData, categoryId, numericEffectivePrice, req, cleanSettings);
      // Lock merchantSku to the product's actual live HB merchantSku so HB targets the existing listing card
      attributes.merchantSku = resolvedMerchantSku;
      if (p.barcode && String(p.barcode).trim()) {
        attributes.Barcode = String(p.barcode).trim();
      }

      const sentImagesCount = [attributes.Image1, attributes.Image2, attributes.Image3, attributes.Image4, attributes.Image5].filter(Boolean).length;
      if (sentImagesCount === 0) {
        skippedItems.push({
          id: p.id,
          name: p.name,
          reason: "Geçerli HTTP/HTTPS ürün görseli bulunamadı"
        });
        continue;
      }

      mpData.hepsiburada = {
        ...hbData,
        categoryId: Number(categoryId),
        merchantSku: resolvedMerchantSku,
        attributes,
        sentImagesCount,
        lastImageRevisionSync: new Date().toISOString(),
      };

      revisionItems.push({
        productId: p.id,
        name: p.name,
        mpData,
        imagesCount: sentImagesCount,
        merchantSku: resolvedMerchantSku,
        payload: {
          categoryId: Number(categoryId),
          attributes,
        },
      });
    }

    if (revisionItems.length === 0) {
      return res.status(400).json({
        error: skippedItems.length > 0
          ? `Görsel revizyonu gönderilemedi: ${skippedItems.slice(0, 3).map((s) => `${s.name} (${s.reason})`).join(", ")}`
          : "Revize edilecek uygun ürün bulunamadı.",
        skipped: skippedItems,
      });
    }

    let lastTrackingId: string | null = null;
    const immediateWarnings: Array<{ id?: number; name?: string; reason: string; isMatchedCatalogLock?: boolean }> = [];
    const CHUNK_SIZE = 50;

    for (let i = 0; i < revisionItems.length; i += CHUNK_SIZE) {
      const chunk = revisionItems.slice(i, i + CHUNK_SIZE);
      const catRes = await hbService.importCatalogProducts(chunk.map((c) => c.payload));
      if (!catRes.success || !catRes.trackingId) {
        throw new Error(catRes.message || "Hepsiburada katalog görsel revizyonu takip numarası döndürmedi.");
      }
      lastTrackingId = catRes.trackingId;

      // Briefly poll status (~1.5s) to detect matched/locked catalog rejections immediately
      await new Promise((r) => setTimeout(r, 1500));
      let chunkImmediateError: string | null = null;
      try {
        const immediateStatus = await hbService.checkCatalogStatus(lastTrackingId);
        chunkImmediateError = extractHbCatalogImportError(immediateStatus);
      } catch {
        // non-blocking; HB often takes >1.5s to process larger batches
      }

      const isMatchedCatalogLock = Boolean(
        chunkImmediateError &&
        /matched|in catalog progress|can not update|cannot update|already exist|kilitli|byhbadmin|onaylı katalog/i.test(chunkImmediateError)
      );

      if (chunkImmediateError) {
        immediateWarnings.push({
          reason: chunkImmediateError,
          isMatchedCatalogLock,
        });
      }

      // Persist updated attributes & revision tracking WITHOUT altering live status, hepsiburada_sku, or hepsiburada_url
      for (const item of chunk) {
        item.mpData.hepsiburada.catalogRevisionTrackingId = lastTrackingId;
        if (chunkImmediateError) {
          item.mpData.hepsiburada.lastImageRevisionNote = chunkImmediateError;
        } else {
          delete item.mpData.hepsiburada.lastImageRevisionNote;
        }
        await pool.query(
          `UPDATE products
           SET marketplace_data = $1,
               hepsiburada_last_sync = NOW()
           WHERE store_id = $2 AND id = $3`,
          [JSON.stringify(item.mpData), storeId, item.productId]
        );
      }
    }

    const totalImagesSent = revisionItems.reduce((sum, item) => sum + item.imagesCount, 0);
    const hasMatchedLockWarning = immediateWarnings.some((w) => w.isMatchedCatalogLock);

    let message = "";
    if (hasMatchedLockWarning) {
      message = `Hepsiburada yanıtı: Seçilen ürün(ler) başka bir satıcının veya onaylı ortak kataloğun kartına eşleştiği için API üzerinden doğrudan görsel değişikliği kısıtlandı (${immediateWarnings[0].reason}). Ortak katalog ürünlerine ek görsel eklemek için HB Satıcı Paneli > Ürünlerim > İçerik Düzenle / Talep Aç bölümünü kullanabilirsiniz.`;
    } else if (immediateWarnings.length > 0) {
      message = `Hepsiburada görsel revizyonu iletildi ancak HB uyarısı döndü: ${immediateWarnings[0].reason}`;
    } else {
      message = `${revisionItems.length} ürün için toplam ${totalImagesSent} görsel (Image1–Image5) Hepsiburada katalog güncelleme kuyruğuna iletildi (Takip No: ${lastTrackingId}). HB içerik onayının ardından ilanlara yansıyacaktır${skippedItems.length > 0 ? ` (${skippedItems.length} ürün atlandı)` : ""}.`;
    }

    res.json({
      success: !hasMatchedLockWarning,
      warning: hasMatchedLockWarning || immediateWarnings.length > 0,
      isMatchedCatalogLock: hasMatchedLockWarning,
      revisedCount: revisionItems.length,
      totalImagesSent,
      skippedCount: skippedItems.length,
      skipped: skippedItems,
      warnings: immediateWarnings,
      trackingId: lastTrackingId,
      results: revisionItems.map((it) => ({
        id: it.productId,
        name: it.name,
        imagesCount: it.imagesCount,
      })),
      message,
    });
  } catch (error: any) {
    console.error("[HB Revise Catalog] Error:", error?.message || error);
    res.status(400).json({ error: error.message || "Hepsiburada katalog görsel revizyonu başarısız." });
  }
});

// 6c. Unpublish / Remove Single Product from Hepsiburada (Stop Selling by Setting Stock to 0)
router.post("/hepsiburada/unpublish", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.user?.store_id;
  const storeId = req.user.role === "superadmin" ? Number(rawStoreId || req.user.store_id || 1) : Number(req.user.store_id || rawStoreId);
  const productId = req.body.productId;

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });

    let settings = storeRes.rows[0]?.hepsiburada_settings;
    if (typeof settings === 'string') { try { settings = JSON.parse(settings); } catch(e) { settings = {}; } }
    let branding = storeRes.rows[0]?.branding;
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch(e) { branding = {}; } }
    if (!settings || !settings.merchantId || !settings.apiSecret) {
      settings = branding?.hepsiburada_settings || settings || {};
    }

    const merchantId = String(settings?.merchantId || "").trim();
    const apiKey = String(settings?.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const apiSecret = String(settings?.apiSecret || "").trim();

    if (!merchantId || !apiSecret) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik (Ayarlar > E-Mağazalar sekmesinden API anahtarlarınızı kaydedin)" });
    }

    const cleanSettings = {
      ...settings,
      merchantId,
      apiKey,
      apiSecret,
      isTestMode: Boolean(settings?.isTestMode)
    };

    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    const p = prodRes.rows[0];
    if (!p) return res.status(404).json({ error: "Ürün bulunamadı" });

    if (!p.barcode || !p.barcode.trim()) {
      return res.status(400).json({ error: "Ürün barkodu eksik." });
    }

    const hbService = new HepsiburadaService(cleanSettings, storeId);
    let mpData: any = p.marketplace_data;
    if (typeof mpData === "string") {
      try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
    }
    const hbMerchantSku = mpData?.hepsiburada?.merchantSku || p.barcode.trim();

    let trackingId: string | undefined;
    try {
      const result = await hbService.updatePriceAndStock([
        {
          HepsiburadaSku: p.hepsiburada_sku || "",
          MerchantSku: hbMerchantSku,
          Price: parseFloat(p.price || "0"),
          AvailableStock: 0,
          DispatchTime: cleanSettings.defaultDispatchTime || 1,
        }
      ]);
      trackingId = result?.trackingId;
    } catch (unpubErr: any) {
      console.warn("[HB Unpublish API warning]:", unpubErr.message || unpubErr);
    }

    await pool.query(
      `UPDATE products 
       SET is_hepsiburada_active = false, 
           hepsiburada_last_sync = NOW(),
           marketplace_data = jsonb_set(
             COALESCE(marketplace_data, '{}'::jsonb), 
             '{hepsiburada}', 
             COALESCE(marketplace_data->'hepsiburada', '{}'::jsonb) || '{"status": "INACTIVE", "manuallyUnpublished": true}'::jsonb
           )
       WHERE id = $1 AND store_id = $2`,
      [productId, storeId]
    );

    res.json({
      success: true,
      message: `"${p.name}" Hepsiburada'da yayından kaldırıldı (satışa kapatıldı).`,
      trackingId
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Hepsiburada yayından kaldırma başarısız." });
  }
});

// 6d. Bulk Unpublish Products from Hepsiburada
router.post("/hepsiburada/bulk-unpublish", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.user?.store_id;
  const storeId = req.user.role === "superadmin" ? Number(rawStoreId || req.user.store_id || 1) : Number(req.user.store_id || rawStoreId);
  const productIds = req.body?.productIds;

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });

    let settings = storeRes.rows[0]?.hepsiburada_settings;
    if (typeof settings === 'string') { try { settings = JSON.parse(settings); } catch(e) { settings = {}; } }
    let branding = storeRes.rows[0]?.branding;
    if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch(e) { branding = {}; } }
    if (!settings || !settings.merchantId || !settings.apiSecret) {
      settings = branding?.hepsiburada_settings || settings || {};
    }

    const merchantId = String(settings?.merchantId || "").trim();
    const apiKey = String(settings?.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const apiSecret = String(settings?.apiSecret || "").trim();

    if (!merchantId || !apiSecret) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik (Ayarlar > E-Mağazalar sekmesinden API anahtarlarınızı kaydedin)" });
    }

    const cleanSettings = {
      ...settings,
      merchantId,
      apiKey,
      apiSecret,
      isTestMode: Boolean(settings?.isTestMode)
    };

    let query = "SELECT * FROM products WHERE store_id = $1";
    const params: any[] = [storeId];
    if (Array.isArray(productIds) && productIds.length > 0) {
      query += " AND id = ANY($2)";
      params.push(productIds);
    } else {
      query += " AND is_hepsiburada_active = true AND barcode IS NOT NULL AND barcode != ''";
    }

    const prodRes = await pool.query(query, params);
    const products = prodRes.rows;

    if (products.length === 0) {
      return res.status(400).json({ error: "Yayından kaldırılacak aktif ürün bulunamadı." });
    }

    const hbService = new HepsiburadaService(cleanSettings, storeId);
    const items: any[] = [];
    for (const p of products) {
      if (p.barcode && p.barcode.trim()) {
        let mpData: any = p.marketplace_data;
        if (typeof mpData === "string") {
          try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
        }
        const hbMerchantSku = mpData?.hepsiburada?.merchantSku || p.barcode.trim();
        items.push({
          MerchantSku: hbMerchantSku,
          HepsiburadaSku: p.hepsiburada_sku || "",
          Price: parseFloat(p.price || "0"),
          AvailableStock: 0,
          DispatchTime: cleanSettings.defaultDispatchTime || 1,
        });
      }
    }

    let trackingId: string | undefined;
    if (items.length > 0) {
      try {
        const result = await hbService.updatePriceAndStock(items);
        trackingId = result?.trackingId;
      } catch (bulkUnpubErr: any) {
        console.warn("[HB Bulk Unpublish API warning]:", bulkUnpubErr.message || bulkUnpubErr);
      }
    }

    const unpublishProductIds = products.map((p: any) => p.id);
    await pool.query(
      `UPDATE products 
       SET is_hepsiburada_active = false, 
           hepsiburada_last_sync = NOW(),
           marketplace_data = jsonb_set(
             COALESCE(marketplace_data, '{}'::jsonb), 
             '{hepsiburada}', 
             COALESCE(marketplace_data->'hepsiburada', '{}'::jsonb) || '{"status": "INACTIVE", "manuallyUnpublished": true}'::jsonb
           )
       WHERE store_id = $1 AND id = ANY($2)`,
      [storeId, unpublishProductIds]
    );

    res.json({
      success: true,
      unpublishedCount: products.length,
      trackingId,
      message: `${products.length} ürün Hepsiburada'da yayından kaldırıldı (satışa kapatıldı).`
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Toplu yayından kaldırma başarısız." });
  }
});

// Amazon Unpublish & Bulk Unpublish
router.post("/amazon/unpublish", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const productId = req.body.productId;
  try {
    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    const p = prodRes.rows[0];
    if (!p) return res.status(404).json({ error: "Ürün bulunamadı" });

    // 1. Update product in DB with explicit INACTIVE & manuallyUnpublished flag
    let mpData: any = p.marketplace_data;
    if (typeof mpData === "string") {
      try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
    }
    mpData = mpData || {};
    mpData.amazon = {
      ...(mpData.amazon || {}),
      status: 'INACTIVE',
      manuallyUnpublished: true,
      unpublishedAt: new Date().toISOString()
    };

    await pool.query(
      `UPDATE products 
       SET is_amazon_active = false, 
           amazon_last_sync = NOW(), 
           marketplace_data = $1
       WHERE id = $2 AND store_id = $3`,
      [JSON.stringify(mpData), productId, storeId]
    );

    // 2. If Amazon credentials exist, push 0 quantity to Amazon to close offer
    try {
      const storeRes = await pool.query("SELECT amazon_settings, branding FROM stores WHERE id = $1", [storeId]);
      const amzSettings = storeRes.rows[0]?.amazon_settings || storeRes.rows[0]?.branding?.amazon_settings;
      if (amzSettings?.sellerId && (amzSettings?.refresh_token || amzSettings?.refreshToken)) {
        const sku = p.amazon_sku || p.sku || p.barcode;
        if (sku) {
          const { AmazonService } = await import("../src/services/backend/amazonService");
          const amzService = new AmazonService(amzSettings, storeId);
          await amzService.updateListingsItem(String(sku).trim(), parseFloat(p.price || "0"), 0);
        }
      }
    } catch (amzErr: any) {
      console.warn("[Amazon Unpublish API Warning]:", amzErr.message || amzErr);
    }

    res.json({ success: true, message: `"${p.name}" Amazon TR'de satışa kapatıldı.` });
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Amazon yayından kaldırma başarısız." });
  }
});

router.post("/amazon/bulk-unpublish", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const productIds = req.body.productIds || [];
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ error: "Lütfen yayından kaldırılacak ürünleri seçin." });
  }
  try {
    await pool.query(
      `UPDATE products 
       SET is_amazon_active = false, 
           amazon_last_sync = NOW(),
           marketplace_data = jsonb_set(
             COALESCE(marketplace_data, '{}'::jsonb), 
             '{amazon}', 
             COALESCE(marketplace_data->'amazon', '{}'::jsonb) || '{"status": "INACTIVE", "manuallyUnpublished": true}'::jsonb
           )
       WHERE store_id = $1 AND id = ANY($2)`,
      [storeId, productIds]
    );
    res.json({ success: true, count: productIds.length, message: `${productIds.length} ürün Amazon TR'de satışa kapatıldı.` });
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Toplu Amazon yayından kaldırma başarısız." });
  }
});

// Trendyol, N11, Pazarama Unpublish helpers
router.post("/trendyol/unpublish", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const productId = req.body.productId;
  try {
    const storeRes = await pool.query("SELECT trendyol_settings, branding FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.trendyol_settings || storeRes.rows[0]?.branding?.trendyol_settings;
    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    const p = prodRes.rows[0];

    if (p && settings?.merchantId && settings?.apiKey && settings?.apiSecret) {
      const cleanBarcode = String(p.barcode || p.sku || "").trim();
      if (cleanBarcode) {
        try {
          await axios.post(
            `https://apigw.trendyol.com/integration/inventory/sellers/${settings.merchantId.trim()}/products/price-and-inventory`,
            { items: [{ barcode: cleanBarcode, quantity: 0, salePrice: Math.max(1, Number(p.price || 1)), listPrice: Math.max(1, Number(p.price || 1)) }] },
            {
              auth: { username: settings.apiKey.trim(), password: settings.apiSecret.trim() },
              headers: {
                "User-Agent": `${settings.merchantId.trim()} - SelfIntegration`,
                "Accept": "application/json",
                "Content-Type": "application/json",
                "storeFrontCode": (settings.storeFrontCode && String(settings.storeFrontCode).trim() !== "1" ? String(settings.storeFrontCode).trim() : "TR").toUpperCase()
              },
              timeout: 8000
            }
          );
        } catch (apiErr: any) {
          console.warn("[Trendyol Unpublish Warning]:", apiErr?.message);
        }
      }
    }

    let mpData: any = p?.marketplace_data;
    if (typeof mpData === "string") { try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; } }
    mpData = mpData || {};
    if (mpData.trendyol) {
      mpData.trendyol.status = "INACTIVE";
      mpData.trendyol.onSale = false;
      mpData.trendyol.manuallyUnpublished = true;
      mpData.trendyol.lastSync = new Date().toISOString();
    }

    await pool.query(
      "UPDATE products SET is_trendyol_active = false, marketplace_data = $1 WHERE id = $2 AND store_id = $3",
      [JSON.stringify(mpData), productId, storeId]
    );
    res.json({ success: true, message: "Ürün Trendyol'da yayından kaldırıldı (stok sıfırlandı)." });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/n11/unpublish", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const productId = req.body.productId;
  try {
    const storeRes = await pool.query("SELECT n11_settings, branding FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings || storeRes.rows[0]?.branding?.n11_settings;
    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    const p = prodRes.rows[0];

    let mpData: any = p?.marketplace_data;
    if (typeof mpData === "string") { try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; } }
    mpData = mpData || {};

    if (p && settings?.appKey && settings?.appSecret) {
      const sellerCode = String(
        mpData?.n11?.sellerStockCode ||
        mpData?.n11?.productSellerCode ||
        mpData?.n11?.stockCode ||
        p.sku ||
        p.barcode ||
        ""
      ).trim();
      if (sellerCode) {
        try {
          const { N11Service } = await import("../src/services/backend/n11Service");
          await N11Service.updatePriceAndStock(
            { appKey: String(settings.appKey).trim(), appSecret: String(settings.appSecret).trim() },
            sellerCode,
            Math.max(1, Number(mpData?.n11?.price || p.price || 100)),
            0
          );
        } catch (n11Err: any) {
          console.warn("[N11 Unpublish Warning]:", n11Err?.message);
        }
      }
    }

    if (mpData.n11) {
      mpData.n11.status = "INACTIVE";
      mpData.n11.manuallyUnpublished = true;
      mpData.n11.lastSync = new Date().toISOString();
    }

    await pool.query(
      "UPDATE products SET is_n11_active = false, marketplace_data = $1 WHERE id = $2 AND store_id = $3",
      [JSON.stringify(mpData), productId, storeId]
    );
    res.json({ success: true, message: "Ürün N11'de yayından kaldırıldı (stok 0 olarak güncellendi)." });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/pazarama/unpublish", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const productId = req.body.productId;
  try {
    await pool.query("UPDATE products SET is_pazarama_active = false WHERE id = $1 AND store_id = $2", [productId, storeId]);
    res.json({ success: true, message: "Ürün Pazarama'da yayından kaldırıldı." });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Global cache & pre-normalized search index for merged live Hepsiburada categories
type IndexedMarketplaceCategory = {
  id: string | number;
  name: string;
  displayName: string;
  paths: string[];
  leaf: boolean;
  available: boolean;
  status: string;
  sector: string;
  _normName: string;
  _normFull: string;
  _idStr: string;
};

let hbLiveCategoryCache: { categories: IndexedMarketplaceCategory[]; byId: Map<string, IndexedMarketplaceCategory>; timestamp: number } | null = null;
let hbCategoryFetchPromise: Promise<IndexedMarketplaceCategory[]> | null = null;

function stripCategoryIndexFields(c: IndexedMarketplaceCategory) {
  return {
    id: c.id,
    name: c.name,
    displayName: c.displayName,
    paths: c.paths,
    leaf: c.leaf,
    available: c.available,
    status: c.status,
    sector: c.sector
  };
}

async function getMergedHepsiburadaCategories(storeId?: number): Promise<IndexedMarketplaceCategory[]> {
  const { HEPSIBURADA_DEFAULT_CATEGORIES, detectCategorySector, normalizeCategoryText } = await import("../src/data/marketplaceCategoriesData");

  const indexCategory = (c: any): IndexedMarketplaceCategory => {
    const id = c.categoryId ?? c.id;
    const paths = Array.isArray(c.paths) ? c.paths : (c.parentName ? [c.parentName, c.name] : []);
    const name = String(c.name || c.displayName || "");
    const displayName = String(c.displayName || (paths.length > 0 ? `${paths.join(" > ")} > ${name}` : name));
    const idStr = String(id ?? "");
    return {
      id,
      name,
      displayName,
      paths,
      leaf: c.leaf !== false,
      available: c.available !== false,
      status: c.status || "ACTIVE",
      sector: c.sector || detectCategorySector(name || displayName, paths),
      _normName: normalizeCategoryText(name),
      _normFull: normalizeCategoryText(`${name} ${displayName} ${paths.join(" ")}`),
      _idStr: idStr
    };
  };

  // Use cache ONLY if it holds live categories (> 500 items) and is fresh (< 2 hours)
  if (hbLiveCategoryCache && (Date.now() - hbLiveCategoryCache.timestamp) < 7200000 && hbLiveCategoryCache.categories.length > 500) {
    return hbLiveCategoryCache.categories;
  }

  // Coalesce concurrent requests so opening modal + typing never fires duplicate multi-page API calls
  if (hbCategoryFetchPromise) {
    return hbCategoryFetchPromise;
  }

  hbCategoryFetchPromise = (async () => {
    let categories: IndexedMarketplaceCategory[] = HEPSIBURADA_DEFAULT_CATEGORIES.map(indexCategory);

    // Try live API if storeId provided (supporting both hepsiburada_settings column & branding.hepsiburada_settings)
    if (storeId) {
      try {
        const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
        let hbDb = storeRes.rows[0]?.hepsiburada_settings || {};
        if (typeof hbDb === 'string') { try { hbDb = JSON.parse(hbDb); } catch { hbDb = {}; } }
        let branding = storeRes.rows[0]?.branding || {};
        if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch { branding = {}; } }
        const settings = { ...(branding?.hepsiburada_settings || {}), ...hbDb };
        if (settings?.apiSecret && settings?.merchantId) {
          const hbService = new HepsiburadaService(settings, storeId);
          const rawLive = await hbService.getAllCategories();
          if (Array.isArray(rawLive) && rawLive.length > 0) {
            const liveNormalized = rawLive
              .filter((c: any) => c.leaf !== false && c.available !== false && c.status !== "INACTIVE")
              .map(indexCategory);

            if (liveNormalized.length > 0) {
              const existingIds = new Set(liveNormalized.map((c) => c._idStr));
              // Merge defaults if not in live
              for (const def of HEPSIBURADA_DEFAULT_CATEGORIES) {
                const defId = String(def.id);
                if (!existingIds.has(defId)) {
                  liveNormalized.push(indexCategory(def));
                  existingIds.add(defId);
                }
              }
              liveNormalized.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name, 'tr'));
              const byId = new Map<string, IndexedMarketplaceCategory>();
              for (const item of liveNormalized) byId.set(item._idStr, item);
              categories = liveNormalized;
              hbLiveCategoryCache = { categories: liveNormalized, byId, timestamp: Date.now() };
            }
          }
        }
      } catch (err: any) {
        console.warn("[HB Categories] Live API fetch warning:", err.message);
      }
    }

    return categories;
  })().finally(() => {
    hbCategoryFetchPromise = null;
  });

  return hbCategoryFetchPromise;
}

// 7. Get Catalog Categories (Sector-Organized & Filtered)
router.get("/hepsiburada/categories", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const sector = req.query.sector;

  try {
    let result = await getMergedHepsiburadaCategories(storeId);

    if (sector && sector !== "all") {
      result = result.filter((c) => c.sector === sector);
    }

    res.json({
      success: true,
      categories: result.map(stripCategoryIndexFields),
      total: result.length,
      source: hbLiveCategoryCache ? "live_api_cache" : "verified_catalog"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7b. Live Category Search Endpoint (Pre-indexed, Instant Multi-Word Token Search + Batch ID Lookup)
router.get("/hepsiburada/categories/search", authenticate, async (req: any, res) => {
  const q = String(req.query.q || "").trim();
  const idsParam = String(req.query.ids || "").trim();
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;

  try {
    const { normalizeCategoryText, scoreCategorySearchMatch } = await import("../src/data/marketplaceCategoriesData");
    const allCategories = await getMergedHepsiburadaCategories(storeId);

    // Fast batch ID resolution (used to resolve labels for previously saved mapped category IDs)
    if (idsParam) {
      const requestedIds = new Set(idsParam.split(",").map((id) => id.trim()).filter(Boolean));
      const found: any[] = [];
      if (hbLiveCategoryCache?.byId) {
        for (const id of requestedIds) {
          const hit = hbLiveCategoryCache.byId.get(id);
          if (hit) found.push(stripCategoryIndexFields(hit));
        }
      } else {
        for (const c of allCategories) {
          if (requestedIds.has(c._idStr)) found.push(stripCategoryIndexFields(c));
        }
      }
      return res.json({ success: true, categories: found, total: found.length });
    }

    if (!q) {
      return res.json({ success: true, categories: allCategories.slice(0, 100).map(stripCategoryIndexFields), total: allCategories.length });
    }

    const normQ = normalizeCategoryText(q);
    const tokens = normQ.split(" ").filter((t: string) => t.length > 0);

    const scored: { cat: IndexedMarketplaceCategory; score: number }[] = [];
    for (let i = 0; i < allCategories.length; i++) {
      const c = allCategories[i];
      const score = scoreCategorySearchMatch(c._normName, c._normFull, c._idStr, q, normQ, tokens);
      if (score > 0) {
        scored.push({ cat: c, score });
      }
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.cat.displayName || a.cat.name).localeCompare(b.cat.displayName || b.cat.name, 'tr');
    });

    res.json({
      success: true,
      categories: scored.slice(0, 120).map((s) => stripCategoryIndexFields(s.cat)),
      total: scored.length,
      query: q
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Get Category Attributes (Live API + Verified Fallback)
router.get("/hepsiburada/categories/:categoryId/attributes", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const rawCategoryId = String(req.params.categoryId || "").trim();
  const querySubCategory = String(req.query.subCategoryName || "").trim();
  const queryCategory = String(req.query.categoryName || "").trim();

  // Only normalize legacy virtual IDs for USB Bellek, Kart Okuyucu, and SD Kart to their live Hepsiburada leaf IDs
  let categoryId = rawCategoryId;
  if (categoryId === "1000101" || categoryId === "1000101.0") categoryId = "970";
  else if (categoryId === "1000102") categoryId = "698";
  else if (categoryId === "1000103") categoryId = "1100011";

  const isBogusId = categoryId === "2147483647" || categoryId === "0" || categoryId === "null" || categoryId === "undefined";

  try {
    const { getAttributesForCategory, HEPSIBURADA_DEFAULT_CATEGORIES } = await import("../src/data/marketplaceCategoriesData");
    const matchedCat = !isBogusId
      ? HEPSIBURADA_DEFAULT_CATEGORIES.find((c: any) => String(c.id) === String(categoryId) || String(c.id) === String(rawCategoryId))
      : undefined;
    const isGenericLaptopParent = ["98", "3000500", "103165"].includes(String(categoryId));
    const catName = (matchedCat && !isGenericLaptopParent)
      ? matchedCat.name
      : (querySubCategory || matchedCat?.name || queryCategory || (categoryId === "970" ? "USB Flash Bellekler" : ""));
    const catPaths = (matchedCat && !isGenericLaptopParent)
      ? (matchedCat.paths || [])
      : ((queryCategory || querySubCategory) ? [queryCategory, querySubCategory].filter(Boolean) : (matchedCat?.paths || []));
    const safeCatId = isBogusId ? undefined : (rawCategoryId || categoryId);
    const verifiedAttrs = getAttributesForCategory(catName, catPaths, safeCatId);

    // Only if safeCatId is a generic parent laptop category (98, 3000500, 103165) and querySubCategory is a child accessory
    // (e.g. Notebook Çantası with old categoryId 98 Laptop), override with the child category's attributes!
    if (querySubCategory && safeCatId && isGenericLaptopParent) {
      const childOnlyAttrs = getAttributesForCategory(querySubCategory, [queryCategory, querySubCategory].filter(Boolean));
      const catIdOnlyAttrs = getAttributesForCategory(matchedCat?.name || "", matchedCat?.paths || [], safeCatId);
      if (childOnlyAttrs !== catIdOnlyAttrs) {
        return res.json({ success: true, attributes: childOnlyAttrs, source: "verified_child_catalog", categoryId: safeCatId });
      }
    }

    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.hepsiburada_settings;

    // Only query Hepsiburada Live API for real Hepsiburada category IDs (not synthetic 10001xx/20001xx IDs)
    const isSyntheticLocalId = /^(10001\d\d|20001\d\d|20002\d\d)$/.test(categoryId);

    if (settings?.apiSecret && settings?.merchantId && !isBogusId && !isSyntheticLocalId) {
      try {
        const hbService = new HepsiburadaService(settings, storeId);
        const liveAttrs = await hbService.getCategoryAttributes(categoryId);
        const dataObj = liveAttrs?.data || liveAttrs;

        let rawList: any[] = [];
        if (Array.isArray(liveAttrs)) {
          rawList = liveAttrs;
        } else if (dataObj && typeof dataObj === "object") {
          const base = Array.isArray(dataObj.baseAttributes) ? dataObj.baseAttributes : [];
          const attrs = Array.isArray(dataObj.attributes) ? dataObj.attributes : [];
          const variant = Array.isArray(dataObj.variantAttributes) ? dataObj.variantAttributes : [];

          // Retain user-customizable fields (exclude system internal fields)
          const filteredBase = base.filter((b: any) => 
            !["merchantSku", "Barcode", "UrunAdi", "UrunAciklamasi", "price", "stock", "VaryantGroupID", "Image1", "Image2", "Image3", "Image4", "Image5", "Image6", "Image7", "Image8", "Image9", "Image10", "Video1"].includes(b.id)
          );

          rawList = [...filteredBase, ...attrs, ...variant];
        }

        if (Array.isArray(rawList) && rawList.length > 0) {
          // Prioritize mandatory attributes + key child category variant attributes so 80+ optional fields don't overwhelm the form
          const seenIds = new Set<string>();
          const uniqueRaw = rawList.filter((attr: any) => {
            const id = String(attr.id || attr.attributeId || attr.name || "").trim();
            if (!id || seenIds.has(id)) return false;
            seenIds.add(id);
            return true;
          });

          const mandatoryRaw = uniqueRaw.filter((a: any) => !!(a.mandatory || a.required || a.isMandatory));
          const optionalRaw = uniqueRaw.filter((a: any) => !(a.mandatory || a.required || a.isMandatory)).slice(0, Math.max(0, 8 - mandatoryRaw.length));
          const conciseRaw = mandatoryRaw.length > 0 ? [...mandatoryRaw, ...optionalRaw] : uniqueRaw.slice(0, 10);

          // Fetch enum values for top mandatory select attributes if missing
          const normalized = await Promise.all(
            conciseRaw.map(async (attr: any) => {
              let vals = Array.isArray(attr.values) ? attr.values.map((v: any) => (typeof v === "object" ? v.value || v.name : v)) : [];
              if (vals.length === 0 && (attr.type === "enum" || attr.type === "select")) {
                try {
                  const fetchedVals = await hbService.getCategoryAttributeValues(categoryId, attr.id);
                  if (Array.isArray(fetchedVals) && fetchedVals.length > 0) {
                    vals = fetchedVals.map((v: any) => (typeof v === "object" ? v.value || v.name : v));
                  }
                } catch (e) {
                  // ignore
                }
              }

              const isMandatory = !!(attr.mandatory || attr.required || attr.isMandatory);
              return {
                id: String(attr.id || attr.attributeId || attr.name || ""),
                name: attr.name || attr.attributeName || attr.id,
                mandatory: isMandatory,
                required: isMandatory,
                type: (attr.type || attr.attributeType || "text").toLowerCase().includes("select") || attr.type === "enum" || vals.length > 0 ? "select" : (attr.type === "integer" || attr.type === "number" ? "number" : "text"),
                values: vals,
                description: attr.description || attr.tooltip || "",
                defaultValue: attr.defaultValue || ""
              };
            })
          );

          return res.json({ success: true, attributes: normalized, source: "live_api", categoryId });
        }
      } catch (hbErr: any) {
        console.warn("[Hepsiburada Attributes] Live API fetch failed, falling back to verified attributes:", hbErr.message);
      }
    }

    // Fallback: Rich Calculated Child Category Attributes
    res.json({ success: true, attributes: verifiedAttrs, source: "verified_catalog", categoryId: safeCatId || categoryId });
  } catch (error: any) {
    try {
      const { getAttributesForCategory, HEPSIBURADA_DEFAULT_CATEGORIES } = await import("../src/data/marketplaceCategoriesData");
      const matchedCat = !isBogusId
        ? HEPSIBURADA_DEFAULT_CATEGORIES.find((c: any) => String(c.id) === String(categoryId) || String(c.id) === String(rawCategoryId))
        : undefined;
      const catName = querySubCategory || matchedCat?.name || queryCategory || (categoryId === "970" ? "USB Flash Bellekler" : "");
      const catPaths = matchedCat?.paths || (querySubCategory ? [queryCategory, querySubCategory].filter(Boolean) : []);
      const safeCatId = isBogusId ? undefined : (categoryId || rawCategoryId);
      res.json({ success: true, attributes: getAttributesForCategory(catName, catPaths, safeCatId), source: "verified_catalog", categoryId: safeCatId || categoryId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
});

// 9. Check Asynchronous Task / Import Status
router.get("/hepsiburada/task/:taskId", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const taskId = req.params.taskId;

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.hepsiburada_settings;
    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik" });
    }

    const hbService = new HepsiburadaService(settings, storeId);
    const status = await hbService.checkTaskStatus(taskId);
    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Send Invoice Info to Hepsiburada
router.post("/hepsiburada/orders/:orderId/invoice", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const orderId = req.params.orderId;
  const { invoiceNumber, invoiceDate, invoiceUrl, totalAmount, taxAmount } = req.body;

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.hepsiburada_settings;
    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik" });
    }

    const hbService = new HepsiburadaService(settings, storeId);
    const result = await hbService.sendInvoice(orderId, {
      invoiceNumber,
      invoiceDate: invoiceDate || new Date().toISOString(),
      invoiceUrl,
      totalAmount: Number(totalAmount),
      taxAmount: Number(taxAmount),
    });

    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Disconnect Hepsiburada
router.post("/hepsiburada/disconnect", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch (e) { br = {}; } }
    delete br.hepsiburada_settings;
    await pool.query("UPDATE stores SET hepsiburada_settings = '{}', branding = $1 WHERE id = $2", [br, storeId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Hepsiburada V3 / Hub Listing & OMS Routes
router.post("/hepsiburada/v3/listings/import", authenticate, async (req: any, res) => {
  const { env, products } = req.body;
  try {
    const hbService = new HepsiburadaServiceV3(env || 'production');
    const result = await hbService.importListings(products || []);
    res.json(result);
  } catch (error: any) {
    console.error("[HB V3 Route Error]:", error);
    res.status(400).json({ error: error.message || "İşlem başarısız" });
  }
});

router.get("/hepsiburada/v3/listings/import/:trackingId", authenticate, async (req: any, res) => {
  const { trackingId } = req.params;
  const { env } = req.query;
  try {
    const hbService = new HepsiburadaServiceV3((env as any) || 'production');
    const result = await hbService.checkTaskStatus(trackingId);
    res.json(result);
  } catch (error: any) {
    console.warn(`[HB V3 checkTaskStatus Route Warning]:`, error.message);
    res.status(400).json({ error: error.message || "Durum sorgulanamadı" });
  }
});

// Catalog routes
router.get("/hepsiburada/v3/categories", authenticate, async (req: any, res) => {
  const { env, page, size } = req.query;
  try {
    const hbService = new HepsiburadaServiceV3((env as any) || 'production');
    const result = await hbService.getCategories(page ? Number(page) : 0, size ? Number(size) : 50);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/hepsiburada/v3/categories/:categoryId/attributes", authenticate, async (req: any, res) => {
  const { categoryId } = req.params;
  const { env } = req.query;
  try {
    const hbService = new HepsiburadaServiceV3((env as any) || 'production');
    const result = await hbService.getCategoryAttributes(categoryId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/hepsiburada/v3/catalog/import", authenticate, async (req: any, res) => {
  const { env, products } = req.body;
  try {
    const hbService = new HepsiburadaServiceV3((env as any) || 'production');
    const result = await hbService.importCatalogProducts(products || []);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/hepsiburada/v3/catalog/status/:trackingId", authenticate, async (req: any, res) => {
  const { trackingId } = req.params;
  const { env } = req.query;
  try {
    const hbService = new HepsiburadaServiceV3((env as any) || 'production');
    const result = await hbService.checkCatalogTaskStatus(trackingId);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/hepsiburada/v3/orders", authenticate, async (req: any, res) => {
  const { env, status, limit, offset } = req.query;
  try {
    const hbService = new HepsiburadaServiceV3((env as any) || 'production');
    const result = await hbService.fetchOrders({
      status: status as string,
      limit: limit ? Number(limit) : 20,
      offset: offset ? Number(offset) : 0,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/hepsiburada/v3/orders/simulate", authenticate, async (req: any, res) => {
  const { env, storeId, customerName, customerEmail, customerPhone, sku, productName, quantity, price } = req.body;
  try {
    const hbService = new HepsiburadaServiceV3((env as any) || 'production');
    const result = await hbService.simulateTestOrder({
      storeId: storeId ? Number(storeId) : undefined,
      customerName,
      customerEmail,
      customerPhone,
      sku,
      productName,
      quantity,
      price,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Hepsiburada Webhook Receiver (Public / Authenticated by Secret)
router.post("/hepsiburada/webhook", async (req: any, res) => {
  try {
    const { storeId, event_type, payload, secret } = req.body;
    const targetStoreId = Number(storeId || req.query.storeId || 1);

    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [targetStoreId]);
    const settings = storeRes.rows[0]?.hepsiburada_settings;

    if (!settings || !settings.connected) {
      return res.status(400).json({ error: "Store Hepsiburada entegrasyonu aktif değil" });
    }

    // Verify webhook secret if configured
    if (settings.webhookSecret && secret && settings.webhookSecret !== secret) {
      return res.status(403).json({ error: "Geçersiz webhook secret" });
    }

    const hbService = new HepsiburadaService(settings, targetStoreId);
    const result = await hbService.handleWebhook({
      event_type: event_type || req.headers["x-hb-event"] || "order_created",
      payload: payload || req.body,
    });

    res.json({ success: true, result });
  } catch (error: any) {
    console.error("Hepsiburada Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/hepsiburada/webhook/:storeId", async (req: any, res) => {
  try {
    const targetStoreId = Number(req.params.storeId);
    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [targetStoreId]);
    const settings = storeRes.rows[0]?.hepsiburada_settings;

    if (!settings || !settings.connected) {
      return res.status(400).json({ error: "Store Hepsiburada entegrasyonu aktif değil" });
    }

    const hbService = new HepsiburadaService(settings, targetStoreId);
    const result = await hbService.handleWebhook({
      event_type: req.body.event_type || req.headers["x-hb-event"] || "order_created",
      payload: req.body.payload || req.body,
    });

    res.json({ success: true, result });
  } catch (error: any) {
    console.error("Hepsiburada Webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- Trendyol Integration ---

// 1. Save Trendyol Settings
router.post("/trendyol/settings", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId);
  const { apiKey, apiSecret, merchantId, categoryMappings, categoryMappingLabels, categoryAttributes, categoryMarkups, defaultCommissionRate, defaultFixedFee } = req.body;

  try {
    const storeRes = await pool.query("SELECT trendyol_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });

    let prev = storeRes.rows[0]?.trendyol_settings || {};
    if (typeof prev === 'string') { try { prev = JSON.parse(prev); } catch { prev = {}; } }
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch { br = {}; } }
    const prevMerged = { ...(br.trendyol_settings || {}), ...prev };

    const finalApiKey = apiKey !== undefined ? String(apiKey).trim() : String(prevMerged.apiKey || "").trim();
    const finalApiSecret = apiSecret !== undefined ? String(apiSecret).trim() : String(prevMerged.apiSecret || "").trim();
    const finalMerchantId = merchantId !== undefined ? String(merchantId).trim() : String(prevMerged.merchantId || "").trim();

    const settings = {
      ...prevMerged,
      connected: !!(finalApiKey && finalApiSecret && finalMerchantId),
      apiKey: finalApiKey,
      apiSecret: finalApiSecret,
      merchantId: finalMerchantId,
      defaultCommissionRate: defaultCommissionRate !== undefined ? Number(defaultCommissionRate) : (prevMerged.defaultCommissionRate ?? 18),
      defaultFixedFee: defaultFixedFee !== undefined ? Number(defaultFixedFee) : (prevMerged.defaultFixedFee ?? 20),
      categoryMappings: categoryMappings !== undefined ? categoryMappings : (prevMerged.categoryMappings || {}),
      categoryMappingLabels: categoryMappingLabels !== undefined ? categoryMappingLabels : (prevMerged.categoryMappingLabels || {}),
      categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : (prevMerged.categoryAttributes || {}),
      categoryMarkups: categoryMarkups !== undefined ? categoryMarkups : (prevMerged.categoryMarkups || {}),
      last_sync: prevMerged.last_sync || null
    };

    br.trendyol_settings = settings;
    await pool.query("UPDATE stores SET trendyol_settings = $1, branding = $2 WHERE id = $3", [settings, br, storeId]);
    import("../src/services/cronJobs").then(({ syncMarketplacePricesOnRateChange }) => {
      syncMarketplacePricesOnRateChange(Number(storeId)).catch(() => {});
    }).catch(() => {});
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// In-memory cache for Trendyol category attributes
const trendyolCategoryAttributesCache = new Map<number, { timestamp: number; attributes: any[] }>();

export async function getTrendyolCategoryAttributesCached(catId: number): Promise<any[]> {
  const cached = trendyolCategoryAttributesCache.get(catId);
  if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 60)) { // 1 hour TTL
    return cached.attributes;
  }
  try {
    const res = await axios.get(`https://apigw.trendyol.com/integration/product/product-categories/${catId}/attributes`, {
      headers: { "User-Agent": "LookPrice - SelfIntegration", "Accept": "application/json" },
      timeout: 8000
    });
    const attrs = res.data?.categoryAttributes || [];
    trendyolCategoryAttributesCache.set(catId, { timestamp: Date.now(), attributes: attrs });
    return attrs;
  } catch (err: any) {
    console.warn(`[Trendyol API] Failed to fetch attributes for category ${catId}:`, err.message);
    return cached ? cached.attributes : [];
  }
}

export const TRENDYOL_LEGACY_CATEGORY_MAP: Record<number, number> = {
  108656: 1876, // USB Flash Bellek -> live 1876
  103668: 2683, // Dahili SSD -> live 2683
  103669: 1875, // Taşınabilir SSD -> live 1875
  103670: 1874, // Sabit Disk HDD -> live 1874
  103108: 1873, // Hafıza Kartı -> live 1873
  103109: 1872, // Kart Okuyucu -> live 1872
  103671: 5506, // Harddisk Kutusu -> live 5506
  103672: 2674, // RAM Bellek -> live 2674
  103673: 2673, // Anakart -> live 2673
  103674: 2676, // CPU İşlemci -> live 2676
  103675: 2675, // Ekran Kartı -> live 2675
  103676: 2680, // Bilgisayar Kasası -> live 2680
  103677: 2681, // Kasa Soğutucu -> live 2681
  103100: 1588, // Dizüstü Bilgisayar -> live 1588
  103101: 1587, // Masaüstü Bilgisayar -> live 1587
  103102: 1592, // Tablet Bilgisayar -> live 1592
  103665: 5388, // Notebook Çantası -> live 5388
  103680: 1589, // Monitör -> live 1589
  103681: 1590, // Mouse -> live 1590
  103682: 1586, // Klavye -> live 1586
  103683: 2886, // Mousepad -> live 2886
  103684: 5476, // USB Hub Çoklayıcı -> live 5476
  103685: 1585, // Kablo & Adaptör -> live 1585
  103686: 4743, // Router & Ağ Ekipmanı -> live 4743
  103667: 4957, // Notebook Adaptörü -> live 4957
  103666: 1591, // Notebook Soğutucu -> live 1591
};

// Trendyol Category Attributes Endpoint
router.get("/trendyol/categories/:categoryId/attributes", authenticate, async (req: any, res) => {
  try {
    const rawCatId = Number(req.params.categoryId);
    const catId = TRENDYOL_LEGACY_CATEGORY_MAP[rawCatId] || rawCatId;
    const catAttrs = await getTrendyolCategoryAttributesCached(catId);
    if (Array.isArray(catAttrs) && catAttrs.length > 0) {
      const formatted = catAttrs.map((a: any) => ({
        id: String(a.attribute.id),
        name: a.attribute.name,
        mandatory: !!a.required,
        allowCustom: !!a.allowCustom,
        type: a.attributeValues?.length ? 'select' : 'text',
        values: a.attributeValues?.map((v: any) => ({ id: v.id, name: v.name })) || []
      }));
      return res.json({ success: true, attributes: formatted });
    }
    const { getAttributesForCategory } = await import("../src/data/marketplaceCategoriesData");
    const catName = String(req.query.categoryName || req.params.categoryId);
    const paths = req.query.subCategoryName ? [String(req.query.categoryName || ""), String(req.query.subCategoryName)] : [];
    res.json({ success: true, attributes: getAttributesForCategory(catName, paths, String(catId)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Trendyol Settings
router.get("/trendyol/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT trendyol_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = result.rows[0];
    let ty = row?.trendyol_settings || {};
    if (typeof ty === 'string') { try { ty = JSON.parse(ty); } catch(e) { ty = {}; } }
    let br = row?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch(e) { br = {}; } }
    const tyBr = br.trendyol_settings || {};
    res.json({ ...tyBr, ...ty });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

    // Sync Trendyol Orders
router.post("/trendyol/sync", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;

  try {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, count: 0, message: "Demo mağaza simülasyonu: Trendyol siparişleri senkronize edildi." });
    }

    const storeRes = await pool.query("SELECT trendyol_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.trendyol_settings;

    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) {
      return res.status(400).json({ error: "Trendyol API bilgileri eksik" });
    }

    const tyOrders = await syncTrendyolOrders(pool, storeId, settings);

    let syncedCount = 0;
    for (const order of tyOrders) {
      const tyRawStatus = String(order.status || order.shipmentPackageStatus || "New").trim();
      const tyStatusLower = tyRawStatus.toLowerCase();
      const isTyCancelled =
        tyStatusLower.includes("cancel") ||
        tyStatusLower.includes("iptal") ||
        tyStatusLower.includes("return") ||
        tyStatusLower.includes("iade") ||
        tyStatusLower.includes("unsupplied") ||
        tyStatusLower.includes("reject");
      const invoiceNumber = `TY-${order.id}`;
      const tyOrderDate = parseMarketplaceOrderDate(order.orderDate || order.createdDate);
      const totalAmount = parseFloat(order.total) || 0;

      const existing = await pool.query(
        "SELECT id, sale_id, sales_invoice_id, status FROM trendyol_orders WHERE store_id = $1 AND trendyol_order_id = $2",
        [storeId, order.id]
      );
      if (existing.rows.length === 0) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          let customerId = null;
          const rawCustName3 = (order.customer || '').trim();
          const nameParts3 = rawCustName3.split(' ');
          const surname3 = nameParts3.length > 1 ? nameParts3.pop()! : '';
          const firstName3 = nameParts3.join(' ') || rawCustName3;

          const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, order.email]);
          if (custRes.rows.length > 0) {
            customerId = custRes.rows[0].id;
          } else {
            const newCust = await client.query(
              `INSERT INTO customers (store_id, email, password, full_name, name, surname) 
               VALUES ($1, $2, $3, $4, $5, $6) 
               ON CONFLICT (store_id, email) DO UPDATE SET 
                 full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), customers.full_name),
                 name = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
                 surname = COALESCE(NULLIF(EXCLUDED.surname, ''), customers.surname)
               RETURNING id`,
              [storeId, order.email, 'marketplace_user', rawCustName3, firstName3, surname3]
            );
            customerId = newCust.rows[0]?.id;
          }

          const saleRes = await client.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
            [storeId, totalAmount, 'TRY', isTyCancelled ? 'cancelled' : 'completed', order.customer, customerId, 'Trendyol Satış', `Trendyol Siparişi: ${order.id}`, tyOrderDate]
          );
          const saleId = saleRes.rows[0].id;

          const grandTotal = totalAmount;
          const subtotal = grandTotal / 1.20;
          const taxAmount = grandTotal - subtotal;

          const invoiceRes = await client.query(
            "INSERT INTO sales_invoices (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id",
            [storeId, saleId, customerId, invoiceNumber, tyOrderDate, subtotal, taxAmount, grandTotal, 'TRY', 'Trendyol Satış', `Trendyol Siparişi: ${order.id}`, 'marketplace', isTyCancelled ? 'cancelled' : 'completed', tyOrderDate]
          );
          const salesInvoiceId = invoiceRes.rows[0].id;

          // Process order lines
          const lines = order.lines || [];
          const mappedLines = lines.map((l: any) => ({
            name: l.productName,
            quantity: l.quantity,
            price: l.price,
            barcode: l.barcode,
            sku: l.merchantSku,
            taxRate: 20
          }));

          if (mappedLines.length > 0 && !isTyCancelled) {
            await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'Trendyol', order.id, rawCustName3, invoiceNumber);
          } else {
             await client.query(
              "INSERT INTO sales_invoice_items (sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
              [salesInvoiceId, `Trendyol Sipariş Kalemi (${order.id})`, 1, subtotal, 20, taxAmount, grandTotal]
            );
          }

          await client.query(
            "INSERT INTO trendyol_orders (store_id, trendyol_order_id, sale_id, sales_invoice_id, status, order_data) VALUES ($1, $2, $3, $4, $5, $6)",
            [storeId, order.id, saleId, salesInvoiceId, tyRawStatus, order]
          );

          await client.query("COMMIT");
          try {
            await syncMarketplaceOrderTreasury(pool, {
              storeId,
              platform: "trendyol",
              salesInvoiceId,
              saleId,
              orderNumber: String(order.id),
              invoiceNumber,
              amount: grandTotal,
              currency: "TRY",
              customerName: rawCustName3 || "Trendyol Müşterisi",
              date: tyOrderDate,
              status: isTyCancelled ? "cancelled" : "completed",
              notes: `Trendyol Siparişi: ${order.id}`,
            });
          } catch (trErr: any) {
            console.warn(`[Trendyol Sync] Treasury sync warning for #${order.id}:`, trErr?.message || trErr);
          }
          syncedCount++;
        } catch (e) {
          await client.query("ROLLBACK");
          console.error("Trendyol Order Sync Error:", e);
        } finally {
          client.release();
        }
      } else {
        const exRow = existing.rows[0];
        await pool.query(
          "UPDATE trendyol_orders SET status = $1, order_data = $2 WHERE id = $3",
          [tyRawStatus, order, exRow.id]
        );
        if (isTyCancelled) {
          if (exRow.sales_invoice_id) {
            await pool.query("UPDATE sales_invoices SET status = 'cancelled' WHERE id = $1 AND store_id = $2", [exRow.sales_invoice_id, storeId]);
          }
          if (exRow.sale_id) {
            const saleCheck = await pool.query("SELECT status FROM sales WHERE id = $1 AND store_id = $2", [exRow.sale_id, storeId]);
            const wasSaleCancelled = ['cancelled', 'iptal', 'canceled'].includes(String(saleCheck.rows[0]?.status || '').toLowerCase().trim());
            await pool.query(
              "UPDATE sales SET status = 'cancelled', cancellation_reason = COALESCE(cancellation_reason, 'Trendyol Sipariş İptali/İadesi') WHERE id = $1 AND store_id = $2",
              [exRow.sale_id, storeId]
            );
            if (!wasSaleCancelled) {
              const items = await pool.query("SELECT product_id, quantity FROM sale_items WHERE sale_id = $1", [exRow.sale_id]);
              for (const it of items.rows) {
                if (it.product_id && it.quantity > 0) {
                  await pool.query("UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3", [it.quantity, it.product_id, storeId]);
                }
              }
            }
          }
          await pool.query(
            "DELETE FROM stock_movements WHERE store_id = $1 AND (sale_id = $2 OR (invoice_id IS NOT NULL AND invoice_id = $3) OR invoice_number = $4)",
            [storeId, exRow.sale_id || -1, exRow.sales_invoice_id || -1, invoiceNumber]
          );
        }
        try {
          await syncMarketplaceOrderTreasury(pool, {
            storeId,
            platform: "trendyol",
            salesInvoiceId: exRow.sales_invoice_id,
            saleId: exRow.sale_id,
            orderNumber: String(order.id),
            invoiceNumber,
            amount: totalAmount,
            currency: "TRY",
            customerName: String(order.customer || "Trendyol Müşterisi").trim(),
            date: tyOrderDate,
            status: isTyCancelled ? "cancelled" : "completed",
            notes: `Trendyol Siparişi: ${order.id}`,
          });
        } catch (trErr: any) {
          console.warn(`[Trendyol Sync] Treasury update sync warning for #${order.id}:`, trErr?.message || trErr);
        }
      }
    }
    
    const newSettings = { ...settings, last_sync: new Date().toISOString() };
    await pool.query("UPDATE stores SET trendyol_settings = $1 WHERE id = $2", [newSettings, storeId]);
    res.json({ success: true, count: syncedCount });
  } catch (error: any) {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, count: 0, message: "Demo mağaza simülasyonu: Trendyol siparişleri senkronize edildi." });
    }
    await IntegrationService.logIntegrationError(storeId, 'Trendyol', 'Sync All Orders', error);
    res.status(500).json({ error: "Trendyol siparişleri senkronize edilemedi." });
  }
});

router.post("/trendyol/test", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId);
  try {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, message: "Demo mağaza simülasyonu: Trendyol bağlantısı başarılı." });
    }
    const storeRes = await pool.query("SELECT trendyol_settings, branding FROM stores WHERE id = $1", [storeId]);
    let tyDb = storeRes.rows[0]?.trendyol_settings || {};
    if (typeof tyDb === 'string') { try { tyDb = JSON.parse(tyDb); } catch { tyDb = {}; } }
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch { br = {}; } }
    let settings: any = { ...(br.trendyol_settings || {}), ...tyDb };

    if (req.body && (req.body.apiKey || req.body.apiSecret || req.body.merchantId)) {
      settings = {
        ...settings,
        apiKey: String(req.body.apiKey || settings.apiKey || "").trim(),
        apiSecret: String(req.body.apiSecret || settings.apiSecret || "").trim(),
        merchantId: String(req.body.merchantId || settings.merchantId || "").trim(),
      };
    }

    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) {
      return res.status(400).json({ error: "Trendyol API bilgileri eksik" });
    }
    const success = await testTrendyolConnection(settings);
    res.json({ success });
  } catch (error: any) { 
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, message: "Demo mağaza simülasyonu: Trendyol bağlantısı başarılı." });
    }
    res.status(500).json({ error: error.message }); 
  }
});
router.post("/trendyol/disconnect", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch (e) { br = {}; } }
    delete br.trendyol_settings;
    await pool.query("UPDATE stores SET trendyol_settings = '{}', branding = $1 WHERE id = $2", [br, storeId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Publish / Update Product on Trendyol (Migrated to Official Trendyol Product v2 API)
router.post("/trendyol/publish", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.headers?.["x-store-id"] || req.user?.store_id;
  const storeId = req.user.role === "superadmin" ? Number(rawStoreId || req.user?.store_id || 1) : Number(req.user?.store_id || rawStoreId);
  const productId = Number(req.body?.productId || req.query?.productId);

  if (!productId || isNaN(productId)) {
    return res.status(400).json({ error: "Geçersiz veya eksik ürün ID." });
  }

  try {
    const storeRes = await pool.query("SELECT trendyol_settings, currency_rates, branding FROM stores WHERE id = $1", [storeId]);
    const storeRow = storeRes.rows[0] || {};
    let settings = storeRow?.trendyol_settings || storeRow?.branding?.trendyol_settings;
    if (typeof settings === "string") {
      try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
    }
    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) {
      return res.status(400).json({ error: "Trendyol API bilgileri (Satıcı ID, API Key, API Secret) eksik veya yapılandırılmamış." });
    }

    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    const p = prodRes.rows[0];
    if (!p) return res.status(404).json({ error: "Ürün bulunamadı" });

    if (String(p.product_type || "").toLowerCase() === "service" || /^servis$|^hizmet$/i.test(String(p.category || "").trim())) {
      return res.status(400).json({ error: `"${p.name}" bir Hizmet/Servis kalemi olduğu için e-Mağaza (Trendyol) listelerine eklenemez.` });
    }

    const sellableTyStock = computeSellableStock(p.stock_quantity, p.reserved_stock);
    if (Number(p.price || 0) <= 0 || sellableTyStock <= 0) {
      const reasons = [];
      if (Number(p.price || 0) <= 0) reasons.push("fiyatı 0₺");
      if (sellableTyStock <= 0) reasons.push(Number(p.reserved_stock || 0) > 0 ? "tüm stok rezerveli (satılabilir 0)" : "stoğu yetersiz (0/negatif)");
      return res.status(400).json({ error: `"${p.name}" ürününün ${reasons.join(" ve ")} olduğu için Trendyol'da satışa açılamaz. Lütfen fiyat ve stoğu güncelleyin.` });
    }

    const storeFrontCode = (settings.storeFrontCode && String(settings.storeFrontCode).trim() !== "1" ? String(settings.storeFrontCode).trim() : "TR").toUpperCase();
    const auth = { username: String(settings.apiKey).trim(), password: String(settings.apiSecret).trim() };
    const headers = {
      "User-Agent": `${String(settings.merchantId).trim()} - SelfIntegration`,
      "Accept": "application/json",
      "Content-Type": "application/json",
      "storeFrontCode": storeFrontCode,
      "Accept-Language": "tr"
    };

    // 1. Calculate TRY Sale Price using live currency_rates and Trendyol markup policy
    let mpData: any = p.marketplace_data;
    if (typeof mpData === "string") { try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; } }
    mpData = mpData || {};

    let webPriceTRY = Number(p.price || 0);
    const prodCurr = String(p.currency || "TRY").toUpperCase();
    if (prodCurr !== "TRY" && prodCurr !== "TL") {
      const rates = { ...(storeRow?.branding?.currency_rates || {}), ...(storeRow?.currency_rates || {}) };
      const rate = Number(rates[prodCurr] || 1);
      if (rate > 1) {
        webPriceTRY = webPriceTRY * rate;
      }
    }

    const { N11Service } = await import("../src/services/backend/n11Service");
    const finalPriceTRY = N11Service.calculateMarketplacePrice(webPriceTRY, p.category, p.sub_category, settings);
    const roundedPrice = Math.round(finalPriceTRY * 100) / 100;
    const stockQty = computeSellableStock(p.stock_quantity, p.reserved_stock);
    const cleanBarcode = String(p.barcode || p.sku || "").trim();

    // 2. Check if product already exists in Trendyol inventory
    let isExistingOnTrendyol = false;
    let existingItem: any = null;

    try {
      const checkRes = await axios.get(
        `https://apigw.trendyol.com/integration/product/sellers/${settings.merchantId.trim()}/products?barcode=${encodeURIComponent(cleanBarcode)}`,
        { auth, headers, timeout: 8000 }
      );
      const foundItem = checkRes.data?.content?.[0];
      if (foundItem) {
        isExistingOnTrendyol = true;
        existingItem = foundItem;
      }
    } catch (e: any) {
      // Fallback
      try {
        const checkResApproved = await axios.get(
          `https://apigw.trendyol.com/integration/product/sellers/${settings.merchantId.trim()}/products/approved?barcode=${encodeURIComponent(cleanBarcode)}`,
          { auth, headers, timeout: 8000 }
        );
        const foundAppr = checkResApproved.data?.content?.[0];
        if (foundAppr) {
          isExistingOnTrendyol = true;
          existingItem = foundAppr;
        }
      } catch (e2) {}
    }

    if (isExistingOnTrendyol && existingItem) {
      const isApproved = Boolean(existingItem.approved);
      const isRejected = Boolean(existingItem.rejected);
      const existingContentId = String(existingItem.productContentId || existingItem.productCode || existingItem.id || "");
      const merchantId = String(settings.merchantId).trim();
      let existingProductUrl = existingItem.productUrl || (isApproved && /^\d+$/.test(existingContentId) ? `https://www.trendyol.com/-p-${existingContentId}` : null);
      if (existingProductUrl && !existingProductUrl.includes("merchantId=")) {
        existingProductUrl = `${existingProductUrl}${existingProductUrl.includes("?") ? "&" : "?"}merchantId=${merchantId}&filterOverPriceListings=false`;
      }

      // If rejected by Trendyol catalog team, return exact reject reason so user can fix it
      if (isRejected) {
        let rejectErr = "Trendyol katalog standartlarına uygun olmadığı için reddedildi.";
        if (Array.isArray(existingItem.rejectReasonDetails) && existingItem.rejectReasonDetails.length > 0) {
          rejectErr = existingItem.rejectReasonDetails.map((d: any) => `${d.rejectReason || "Red Sebebi"}: ${d.rejectReasonDetail || ""}`).join(" | ");
        }
        await pool.query(
          "UPDATE products SET is_trendyol_active = false, trendyol_id = NULL, trendyol_url = NULL, trendyol_last_error = $1 WHERE id = $2",
          [rejectErr, productId]
        );
        return res.status(400).json({ success: false, error: `Trendyol Reddi: ${rejectErr}` });
      }

      // Use Fast Price & Inventory API to synchronize live price and stock
      const priceInvPayload = {
        items: [{
          barcode: cleanBarcode,
          quantity: stockQty,
          salePrice: roundedPrice,
          listPrice: Math.max(roundedPrice, Math.round(Number(p.list_price || roundedPrice) * 100) / 100)
        }]
      };

      const piRes = await axios.post(
        `https://apigw.trendyol.com/integration/inventory/sellers/${settings.merchantId.trim()}/products/price-and-inventory`,
        priceInvPayload,
        { auth, headers, timeout: 10000 }
      );

      const batchReqId = piRes.data?.batchRequestId;
      const isActuallyLive = isApproved && stockQty > 0 && roundedPrice > 0;

      mpData.trendyol = {
        ...(mpData.trendyol || {}),
        contentId: isApproved && /^\d+$/.test(existingContentId) ? existingContentId : null,
        barcode: cleanBarcode,
        approved: isApproved,
        onSale: isActuallyLive,
        status: isActuallyLive ? "ACTIVE" : (isApproved ? "INACTIVE" : "PENDING_APPROVAL"),
        productUrl: isActuallyLive ? existingProductUrl : null,
        lastSync: new Date().toISOString(),
        lastError: isActuallyLive ? null : (isApproved ? "Stok 0 veya ürün pasif." : "Trendyol katalog onay kuyruğunda inceleniyor.")
      };

      await pool.query(
        "UPDATE products SET is_trendyol_active = $1, trendyol_id = $2, trendyol_url = $3, trendyol_last_error = $4, marketplace_data = $5 WHERE id = $6",
        [
          isActuallyLive,
          isActuallyLive ? existingContentId : null,
          isActuallyLive ? existingProductUrl : null,
          isActuallyLive ? null : (isApproved ? null : "Trendyol katalog onay kuyruğunda inceleniyor."),
          JSON.stringify(mpData),
          productId
        ]
      );

      return res.json({
        success: true,
        isLive: isActuallyLive,
        inReview: !isApproved,
        message: isActuallyLive
          ? "Trendyol fiyat ve stok bilgisi başarıyla güncellendi (Satışta)."
          : (isApproved
            ? "Trendyol kataloğunda onaylı, stok/fiyat güncellendi."
            : "Ürün Trendyol sistemine iletildi. Katalog doğrulama kuyruğunda inceleniyor (TY ONAY)."),
        batchRequestId: batchReqId,
        contentId: isActuallyLive ? existingContentId : null,
        productUrl: isActuallyLive ? existingProductUrl : null
      });
    }

    // 3. Resolve Real Trendyol Category & Brand
    const { suggestMarketplaceCategory, TRENDYOL_DEFAULT_CATEGORIES } = await import("../src/data/marketplaceCategoriesData");
    const hierarchicalKey = [p.category, p.sub_category].filter(Boolean).join(" > ");
    const suggestedCat = suggestMarketplaceCategory(hierarchicalKey || p.sub_category || p.category || "", TRENDYOL_DEFAULT_CATEGORIES);
    const rawCatId = Number(settings.categoryMappings?.[p.sub_category] || settings.categoryMappings?.[p.category] || suggestedCat.bestMatch?.id || 1585);
    const resolvedCatId = TRENDYOL_LEGACY_CATEGORY_MAP[rawCatId] || rawCatId;
    if (resolvedCatId !== rawCatId) {
      console.log(`[Trendyol V2] Upgraded legacy category ${rawCatId} -> official live ${resolvedCatId}`);
    }

    // Resolve Brand ID
    let resolvedBrandId = 25198; // Default to verified general tech brand
    const brandName = String(p.brand || p.brand_name || "").trim();
    if (brandName) {
      try {
        const brandRes = await axios.get(`https://apigw.trendyol.com/integration/product/brands/by-name?name=${encodeURIComponent(brandName)}`, {
          auth,
          headers,
          timeout: 5000
        });
        if (Array.isArray(brandRes.data) && brandRes.data.length > 0) {
          resolvedBrandId = Number(brandRes.data[0].id);
        }
      } catch (bErr) {
        // use fallback
      }
    }

    // Resolve Attributes for Trendyol Product v2 API
    const tyAttributes: Array<{ attributeId: number; attributeValueId?: number; customAttributeValue?: string }> = [];
    const sourceAttrs = {
      ...(settings.categoryAttributes?.[String(resolvedCatId)] || {}),
      ...(settings.categoryAttributes?.[String(rawCatId)] || {}),
      ...(mpData?.attributes || {}),
      ...(mpData?.trendyol?.attributes || {})
    };

    const providedAttrIds = new Set<number>();

    for (const [key, rawVal] of Object.entries(sourceAttrs)) {
      if (rawVal === "") continue;
      const val = resolveCategoryAttributeValue(rawVal, p);
      if (val !== "") {
        const numId = parseInt(key, 10);
        if (!isNaN(numId) && numId > 0) {
          providedAttrIds.add(numId);
          const cleanValStr = val.includes(":") && /^\d+:\s/.test(val) ? val.split(":")[0].trim() : val;
          const numVal = parseInt(cleanValStr, 10);
          if (!isNaN(numVal) && String(numVal) === cleanValStr) {
            tyAttributes.push({ attributeId: numId, attributeValueId: numVal });
          } else {
            tyAttributes.push({ attributeId: numId, customAttributeValue: val });
          }
        }
      }
    }

    // Live Mandatory Category Attributes Auto-Detection & Smart Fill
    try {
      const catAttrs = await getTrendyolCategoryAttributesCached(resolvedCatId);
      const requiredAttrs = (catAttrs || []).filter((a: any) => a.required);

      const pTitle = String(p.name || "").toLowerCase();
      const pDesc = String(p.description || "").toLowerCase();
      const pText = `${pTitle} ${pDesc}`;

      for (const reqAttr of requiredAttrs) {
        const attrId = Number(reqAttr.attribute?.id);
        if (!attrId || providedAttrIds.has(attrId)) continue; // already provided

        const attrName = String(reqAttr.attribute?.name || "").toLowerCase();
        const values: Array<{ id: number; name: string }> = reqAttr.attributeValues || [];
        let assignedValueId: number | undefined;
        let assignedCustom: string | undefined;

        // Smart Attribute Matching based on Trendyol requirements:
        // 1. Menşei (ID 1192)
        if (attrId === 1192 || attrName.includes("menşei") || attrName.includes("mensei")) {
          const trVal = values.find(v => v.name.toUpperCase() === "TR" || v.name.toUpperCase() === "TÜRKİYE");
          const cnVal = values.find(v => v.name.toUpperCase() === "CN" || v.name.toUpperCase() === "ÇİN");
          if (trVal) assignedValueId = trVal.id;
          else if (cnVal) assignedValueId = cnVal.id;
          else if (values.length > 0) assignedValueId = values[0].id;
          else if (reqAttr.allowCustom) assignedCustom = "TR";
        }
        // 2. Garanti Tipi (ID 290)
        else if (attrId === 290 || attrName.includes("garanti tipi")) {
          const distVal = values.find(v => v.name.toLowerCase().includes("distribütör") || v.name.toLowerCase().includes("resmi"));
          const ithalatVal = values.find(v => v.name.toLowerCase().includes("ithalatçı"));
          assignedValueId = distVal?.id || ithalatVal?.id || values[0]?.id;
        }
        // 3. Garanti Süresi (ID 433)
        else if (attrId === 433 || attrName.includes("garanti süresi") || attrName.includes("garanti suresi")) {
          const y2 = values.find(v => v.name.includes("2 Yıl") || v.name.includes("24"));
          const y3 = values.find(v => v.name.includes("3 Yıl"));
          const y5 = values.find(v => v.name.includes("5 Yıl"));
          assignedValueId = y2?.id || y3?.id || y5?.id || values[0]?.id;
        }
        // 4. Cinsiyet (ID 343)
        else if (attrId === 343 || attrName.includes("cinsiyet")) {
          const unisex = values.find(v => v.name.toLowerCase().includes("unisex"));
          assignedValueId = unisex?.id || values[0]?.id;
        }
        // 5. Yaş Grubu (ID 346)
        else if (attrId === 346 || attrName.includes("yaş grubu") || attrName.includes("yas grubu")) {
          const yetiskin = values.find(v => v.name.toLowerCase().includes("yetişkin") || v.name.toLowerCase().includes("yetiskin"));
          assignedValueId = yetiskin?.id || values[0]?.id;
        }
        // 6. Ortam (ID 881)
        else if (attrId === 881 || attrName.includes("ortam")) {
          const daily = values.find(v => v.name.toLowerCase().includes("belirtilmemiş") || v.name.toLowerCase().includes("günlük") || v.name.toLowerCase().includes("gunluk") || v.name.toLowerCase().includes("casual"));
          assignedValueId = daily?.id || values[0]?.id;
        }
        // 7. Desen (ID 33)
        else if (attrId === 33 || attrName.includes("desen")) {
          const duz = values.find(v => v.name.toLowerCase().includes("düz") || v.name.toLowerCase().includes("duz") || v.name.toLowerCase().includes("belirtilmemiş"));
          assignedValueId = duz?.id || values[0]?.id;
        }
        // 8. Web Color (ID 348) & Renk (ID 47)
        else if (attrId === 348 || attrName.includes("web color") || attrId === 47 || attrName === "renk") {
          const colorKeywords = ["siyah", "beyaz", "gri", "mavi", "kırmızı", "yeşil", "sarı", "lacivert", "antrasit", "gümüş", "silver", "gold", "şeffaf"];
          let matchedColor = colorKeywords.find(c => pText.includes(c));
          if (!matchedColor) matchedColor = "siyah";

          if (values.length > 0) {
            const foundVal = values.find(v => v.name.toLowerCase().includes(matchedColor!));
            assignedValueId = foundVal?.id || values[0]?.id;
          } else if (reqAttr.allowCustom) {
            assignedCustom = matchedColor.charAt(0).toUpperCase() + matchedColor.slice(1);
          }
        }
        // 9. Kapasite (ID 184) / SSD Kapasitesi (ID 249)
        else if (attrId === 184 || attrId === 249 || attrName.includes("kapasite")) {
          const capMatch = pText.match(/(4\s*tb|2\s*tb|1\s*tb|960\s*gb|512\s*gb|500\s*gb|480\s*gb|256\s*gb|250\s*gb|240\s*gb|128\s*gb|64\s*gb|32\s*gb|16\s*gb|8\s*gb)/i);
          if (capMatch && values.length > 0) {
            const normalizedCap = capMatch[1].replace(/\s+/g, "").toUpperCase();
            const foundVal = values.find(v => v.name.replace(/\s+/g, "").toUpperCase().includes(normalizedCap));
            if (foundVal) assignedValueId = foundVal.id;
          }
          if (!assignedValueId && values.length > 0) {
            assignedValueId = values[0].id;
          } else if (!assignedValueId && reqAttr.allowCustom) {
            assignedCustom = capMatch ? capMatch[1].toUpperCase() : "Standart";
          }
        }
        // 10. Beden (ID 338 or laptop size)
        else if (attrId === 338 || attrName.includes("beden") || attrName.includes("boyut")) {
          const sizeMatch = pText.match(/(17\.3|16|15\.6|14|13\.3)/);
          if (sizeMatch && values.length > 0) {
            const foundVal = values.find(v => v.name.includes(sizeMatch[1]));
            if (foundVal) assignedValueId = foundVal.id;
          }
          if (!assignedValueId && values.length > 0) {
            assignedValueId = values[0].id;
          } else if (!assignedValueId && reqAttr.allowCustom) {
            assignedCustom = sizeMatch ? `${sizeMatch[1]} inç` : "Standart";
          }
        }
        // 11. Bağlantı Tipi (ID 82)
        else if (attrId === 82 || attrName.includes("bağlantı tipi") || attrName.includes("baglanti")) {
          if (values.length > 0) {
            const nvme = values.find(v => v.name.toLowerCase().includes("nvme") || v.name.toLowerCase().includes("m.2") || v.name.toLowerCase().includes("pcie"));
            const sata = values.find(v => v.name.toLowerCase().includes("sata"));
            const usb = values.find(v => v.name.toLowerCase().includes("usb"));
            if (pText.includes("nvme") || pText.includes("m.2")) assignedValueId = nvme?.id || values[0].id;
            else if (pText.includes("sata")) assignedValueId = sata?.id || values[0].id;
            else if (pText.includes("usb")) assignedValueId = usb?.id || values[0].id;
            else assignedValueId = values[0].id;
          } else if (reqAttr.allowCustom) {
            assignedCustom = "Standart";
          }
        }
        // 12. General fallback for any remaining required attribute
        else {
          if (values.length > 0) {
            const neutral = values.find(v => {
              const vn = v.name.toLowerCase();
              return vn.includes("belirtilmemiş") || vn.includes("standart") || vn.includes("yok") || vn.includes("universal") || vn.includes("genel");
            });
            assignedValueId = neutral?.id || values[0].id;
          } else if (reqAttr.allowCustom) {
            assignedCustom = "Standart";
          }
        }

        if (assignedValueId) {
          tyAttributes.push({ attributeId: attrId, attributeValueId: assignedValueId });
          providedAttrIds.add(attrId);
          console.log(`[Trendyol V2] Injected mandatory attribute: ${reqAttr.attribute?.name} (ID: ${attrId}) -> valueId: ${assignedValueId}`);
        } else if (assignedCustom) {
          tyAttributes.push({ attributeId: attrId, customAttributeValue: assignedCustom });
          providedAttrIds.add(attrId);
          console.log(`[Trendyol V2] Injected mandatory attribute: ${reqAttr.attribute?.name} (ID: ${attrId}) -> custom: "${assignedCustom}"`);
        }
      }
    } catch (attrErr: any) {
      console.warn("[Trendyol V2] Error while checking/injecting mandatory category attributes:", attrErr.message);
    }

    // Resolve all absolute image URLs for Trendyol V2 API (up to 8 images, public http/https)
    const trendyolImages = extractProductMarketplaceImages(p, req, {
      maxCount: 8,
      mpData,
      stripQueryForExtension: true,
    });

    // Enforce Trendyol v2 Rules: listPrice must be >= salePrice, dimensionalWeight >= 1
    const listPrice = Math.max(roundedPrice, Math.round(Number(p.list_price || roundedPrice) * 100) / 100);
    const cargoCompanyId = Number(settings.cargoCompanyId || 10);
    const dimensionalWeight = Math.max(1, Math.round(Number(p.desi || p.dimensional_weight || 1)));

    const payload = {
      items: [{
        barcode: cleanBarcode,
        title: p.name,
        productMainId: cleanBarcode,
        brandId: resolvedBrandId,
        categoryId: resolvedCatId,
        quantity: stockQty,
        stockCode: cleanBarcode,
        dimensionalWeight,
        description: p.description || p.name,
        currencyType: "TRY",
        listPrice,
        salePrice: roundedPrice,
        vatRate: parseInt(p.tax_rate) || 20,
        cargoCompanyId,
        images: trendyolImages.map((url) => ({ url })),
        attributes: tyAttributes
      }]
    };

    // Official Trendyol Product v2 API Endpoint
    const response = await axios.post(
      `https://apigw.trendyol.com/integration/product/sellers/${settings.merchantId.trim()}/v2/products`,
      payload,
      { auth, headers, timeout: 15000 }
    );

    const batchRequestId = response.data?.batchRequestId;
    let batchPassed = false;
    let batchError: string | null = null;
    let inProgress = false;

    // Progressive Batch Status Polling (Attempts: 1500ms, 2000ms, 2500ms)
    // Ensures real validation errors from Trendyol catalog queue are detected and returned immediately
    if (batchRequestId) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        await new Promise(r => setTimeout(r, attempt === 1 ? 1500 : 2000));
        try {
          const batchCheck = await axios.get(
            `https://apigw.trendyol.com/integration/product/sellers/${settings.merchantId.trim()}/products/batch-requests/${batchRequestId}`,
            { auth, headers, timeout: 6000 }
          );
          const bData = batchCheck.data;
          const items = bData?.items || [];
          const bItem = items[0];

          if (bItem?.status === "SUCCESS" || (bData?.status === "COMPLETED" && (bData?.failedItemCount === 0 || Number(bData?.itemCount) > 0 && !bItem?.failureReasons?.length))) {
            batchPassed = true;
            batchError = null;
            inProgress = false;
            break;
          } else if (bItem?.status === "FAILED" || (bData?.status === "COMPLETED" && (bItem?.failureReasons?.length > 0 || bData?.failedItemCount > 0))) {
            batchPassed = false;
            batchError = bItem?.failureReasons?.join(" | ") || bData?.failureReasons?.join(" | ") || "Trendyol katalog doğrulamasından geçemedi.";
            inProgress = false;
            break;
          } else {
            inProgress = true;
          }
        } catch (bcErr: any) {
          console.warn("[Trendyol Batch Check Attempt Warning]:", bcErr?.message);
        }
      }
    }

    if (batchError) {
      await pool.query(
        "UPDATE products SET is_trendyol_active = false, trendyol_last_error = $1 WHERE id = $2",
        [batchError, productId]
      );
      return res.status(400).json({ success: false, error: `Trendyol Hatası: ${batchError}` });
    }

    const isActuallyApproved = batchPassed && Boolean(p.trendyol_id && p.trendyol_url);
    mpData.trendyol = {
      ...(mpData.trendyol || {}),
      barcode: cleanBarcode,
      batchRequestId,
      status: isActuallyApproved ? "ACTIVE" : "PENDING_APPROVAL",
      lastSync: new Date().toISOString(),
      lastError: isActuallyApproved ? null : "Trendyol katalog onay kuyruğunda inceleniyor."
    };

    const displayMsg = isActuallyApproved
      ? "Ürün Trendyol V2 kataloğuna onaylandı ve başarıyla satışa açıldı."
      : "Ürün Trendyol V2 sistemine iletildi. Katalog doğrulama kuyruğunda inceleniyor (TY ONAY).";

    await pool.query(
      "UPDATE products SET is_trendyol_active = $1, trendyol_last_error = $2, marketplace_data = $3 WHERE id = $4",
      [isActuallyApproved, isActuallyApproved ? null : "Trendyol katalog onay kuyruğunda inceleniyor.", JSON.stringify(mpData), productId]
    );

    res.json({
      success: true,
      isLive: isActuallyApproved,
      inReview: !isActuallyApproved,
      batchRequestId,
      message: displayMsg
    });
  } catch (error: any) {
    const rawErr = 
      error.response?.data?.errors?.map((e: any) => e.message || e).join(" | ") ||
      error.response?.data?.message ||
      error.response?.data?.errorMessage ||
      (typeof error.response?.data === "string" ? error.response?.data : null) ||
      error.message ||
      "Bilinmeyen hata";
    if (productId && !isNaN(productId)) {
      try {
        await pool.query("UPDATE products SET trendyol_last_error = $1 WHERE id = $2", [rawErr, productId]);
      } catch (dbErr) {
        console.warn("[Trendyol Publish DB Error Save Failed]:", dbErr);
      }
    }
    res.status(500).json({ error: `Trendyol V2 aktarım hatası: ${rawErr}` });
  }
});

// 5a. Check Live Product Status from Trendyol V2 (Catalog & Batch Queues)
router.post("/trendyol/check-product-status", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.headers?.["x-store-id"] || req.user?.store_id;
  const storeId = req.user.role === "superadmin"
    ? Number(rawStoreId || req.user.store_id || 1)
    : Number(req.user.store_id || rawStoreId);
  const productId = Number(req.body?.productId);

  if (!productId || isNaN(productId)) return res.status(400).json({ error: "Ürün ID gereklidir." });

  try {
    const storeRes = await pool.query("SELECT trendyol_settings, branding FROM stores WHERE id = $1", [storeId]);
    let settings = storeRes.rows[0]?.trendyol_settings || storeRes.rows[0]?.branding?.trendyol_settings;
    if (typeof settings === "string") {
      try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
    }
    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) {
      return res.status(400).json({ error: "Trendyol API bilgileri eksik." });
    }

    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    const p = prodRes.rows[0];
    if (!p) return res.status(404).json({ error: "Ürün bulunamadı" });

    const storeFrontCode = (settings.storeFrontCode && String(settings.storeFrontCode).trim() !== "1" ? String(settings.storeFrontCode).trim() : "TR").toUpperCase();
    const auth = { username: String(settings.apiKey).trim(), password: String(settings.apiSecret).trim() };
    const headers = {
      "User-Agent": `${String(settings.merchantId).trim()} - SelfIntegration`,
      "Accept": "application/json",
      "storeFrontCode": storeFrontCode
    };

    let mpData: any = p.marketplace_data;
    if (typeof mpData === "string") { try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; } }
    mpData = mpData || {};

    const cleanBarcode = String(p.barcode || p.sku || "").trim();
    let isLive = false;
    let message = "";
    let contentId = p.trendyol_id || mpData?.trendyol?.contentId || null;
    let productUrl = p.trendyol_url || mpData?.trendyol?.productUrl || null;
    let rejectError: string | null = null;

    // 1. Check seller product inventory by barcode
    try {
      const checkRes = await axios.get(
        `https://apigw.trendyol.com/integration/product/sellers/${settings.merchantId.trim()}/products?barcode=${encodeURIComponent(cleanBarcode)}`,
        { auth, headers, timeout: 8000 }
      );
      const found = checkRes.data?.content?.[0];
      if (found) {
        const isApproved = Boolean(found.approved);
        const isRejected = Boolean(found.rejected);
        const cid = String(found.productContentId || found.productCode || found.id || "");
        if (isRejected) {
          if (Array.isArray(found.rejectReasonDetails) && found.rejectReasonDetails.length > 0) {
            rejectError = found.rejectReasonDetails.map((d: any) => `${d.rejectReason || "Red Sebebi"}: ${d.rejectReasonDetail || ""}`).join(" | ");
          } else {
            rejectError = "Trendyol katalog standartlarına uygun olmadığı için reddedildi.";
          }
          isLive = false;
          message = `Trendyol Reddi: ${rejectError}`;
        } else if (isApproved) {
          contentId = /^\d+$/.test(cid) ? cid : null;
          const rawU = String(found.productUrl || "");
          productUrl = (rawU.startsWith("http") && /-p-\d+/.test(rawU)) ? rawU : (contentId ? `https://www.trendyol.com/-p-${contentId}` : null);
          const onSale = Boolean(found.onSale) && Number(found.quantity || 0) > 0;
          isLive = onSale;
          message = isLive ? "Ürün Trendyol'da onaylı ve satışta!" : "Ürün onaylı ancak Trendyol'da satış dışı (stok 0 veya pasif).";
        } else {
          isLive = false;
          message = "Trendyol katalog onay kuyruğunda inceleniyor.";
        }
      }
    } catch (e) {
      try {
        const checkRes2 = await axios.get(
          `https://apigw.trendyol.com/integration/product/sellers/${settings.merchantId.trim()}/products/approved?barcode=${encodeURIComponent(cleanBarcode)}`,
          { auth, headers, timeout: 8000 }
        );
        const found2 = checkRes2.data?.content?.[0];
        if (found2) {
          contentId = String(found2.productContentId || found2.productCode || found2.id || "");
          productUrl = found2.productUrl || (contentId ? `https://www.trendyol.com/-p-${contentId}` : null);
          const onSale = Boolean(found2.onSale) && Number(found2.quantity || 0) > 0;
          isLive = onSale;
          message = isLive ? "Ürün Trendyol'da onaylı ve satışta!" : "Ürün onaylı ancak Trendyol'da satış dışı.";
        }
      } catch (e2) {}
    }

    // 2. If not live yet, check batchRequestId queue status if exists
    const batchId = mpData?.trendyol?.batchRequestId;
    if (!isLive && !rejectError && batchId) {
      try {
        const batchCheck = await axios.get(
          `https://apigw.trendyol.com/integration/product/sellers/${settings.merchantId.trim()}/products/batch-requests/${batchId}`,
          { auth, headers, timeout: 6000 }
        );
        const bItem = batchCheck.data?.items?.[0];
        if (bItem?.status === "SUCCESS") {
          isLive = true;
          message = "Trendyol katalog incelemesi onaylandı! Ürün satışa hazır.";
        } else if (bItem?.status === "FAILED") {
          const rawErr = bItem.failureReasons?.join(" | ") || "Trendyol katalog doğrulamasından geçemedi.";
          if (!rawErr.includes("Aynı barkodlu bir ürününüz bulunduğundan")) {
            rejectError = rawErr;
            message = `Trendyol Reddi: ${rejectError}`;
          }
        }
      } catch (bErr) {}
    }

    mpData.trendyol = {
      ...(mpData.trendyol || {}),
      contentId: isLive ? contentId : null,
      productUrl: isLive ? productUrl : null,
      status: isLive ? "ACTIVE" : (rejectError ? "ERROR" : "PENDING_APPROVAL"),
      lastChecked: new Date().toISOString(),
      lastError: isLive ? null : (rejectError || (message.includes("inceleniyor") ? "Trendyol katalog doğrulaması bekleniyor." : message))
    };

    await pool.query(
      "UPDATE products SET is_trendyol_active = $1, trendyol_id = $2, trendyol_url = $3, trendyol_last_error = $4, marketplace_data = $5 WHERE id = $6",
      [
        isLive,
        isLive ? contentId : null,
        isLive ? productUrl : null,
        isLive ? null : (rejectError || (message.includes("inceleniyor") ? "Trendyol katalog doğrulaması bekleniyor." : message)),
        JSON.stringify(mpData),
        productId
      ]
    );

    res.json({
      success: true,
      isLive,
      contentId: isLive ? contentId : null,
      productUrl: isLive ? productUrl : null,
      error: rejectError,
      message: message || "Trendyol durum kontrolü tamamlandı."
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Trendyol durum sorgulanamadı." });
  }
});

// 5b. Match Trendyol Listings with Store Products
router.post("/trendyol/match-listings", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.user?.store_id;
  const storeId = req.user.role === "superadmin"
    ? Number(rawStoreId || req.user.store_id || 1)
    : Number(req.user.store_id || rawStoreId);

  try {
    const storeRes = await pool.query("SELECT trendyol_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });
    const row = storeRes.rows[0];
    let settings = row?.trendyol_settings || row?.branding?.trendyol_settings || {};
    if (typeof settings === "string") { try { settings = JSON.parse(settings); } catch (e) { settings = {}; } }

    if (!settings?.apiKey || !settings?.apiSecret || !settings?.merchantId) {
      return res.status(400).json({ error: "Trendyol API bilgileri (Satıcı ID, API Key, API Secret) eksik." });
    }

    const { TrendyolService } = await import("../src/services/backend/trendyolService.js");
    const result = await TrendyolService.matchListingsWithStoreProducts(settings, pool, storeId, { syncPrices: true });

    res.json(result);
  } catch (error: any) {
    console.error("[Trendyol Match Error]:", error?.message || error);
    res.status(400).json({ error: error.message || "Trendyol ürünleri eşleştirilemedi." });
  }
});

let trendyolLiveCategoryCache: { categories: any[]; timestamp: number } | null = null;
let trendyolCategoryFetchPromise: Promise<any[]> | null = null;

// 6. Get Trendyol Categories (Cached Live API + Verified Child Category Catalog Fallback)
router.get("/trendyol/categories", authenticate, async (req: any, res) => {
  const { TRENDYOL_DEFAULT_CATEGORIES, detectCategorySector } = await import("../src/data/marketplaceCategoriesData");
  if (trendyolLiveCategoryCache && (Date.now() - trendyolLiveCategoryCache.timestamp) < 7200000 && trendyolLiveCategoryCache.categories.length > 200) {
    return res.json(trendyolLiveCategoryCache.categories);
  }
  try {
    if (!trendyolCategoryFetchPromise) {
      trendyolCategoryFetchPromise = (async () => {
        const response = await axios.get("https://apigw.trendyol.com/integration/product/product-categories", {
          headers: { "User-Agent": "LookPrice - SelfIntegration", "Accept": "application/json" },
          timeout: 8000
        });
        const rawTree = response.data?.categories || [];
        const flattened: any[] = [];
        const walk = (nodes: any[], parentPaths: string[] = []) => {
          for (const node of nodes) {
            if (!node) continue;
            const currentPaths = [...parentPaths, node.name].filter(Boolean);
            if (Array.isArray(node.subCategories) && node.subCategories.length > 0) {
              walk(node.subCategories, currentPaths);
            } else {
              flattened.push({
                id: node.id,
                name: node.name,
                displayName: currentPaths.join(" > "),
                paths: currentPaths,
                leaf: true,
                available: true,
                status: "ACTIVE",
                sector: detectCategorySector(node.name, currentPaths)
              });
            }
          }
        };
        if (Array.isArray(rawTree) && rawTree.length > 0) {
          walk(rawTree);
        }
        const existingIds = new Set(flattened.map((c: any) => String(c.id)));
        for (const def of TRENDYOL_DEFAULT_CATEGORIES) {
          if (!existingIds.has(String(def.id))) {
            flattened.push(def);
          }
        }
        const result = flattened.length > 0 ? flattened : TRENDYOL_DEFAULT_CATEGORIES;
        if (result.length > 200) {
          trendyolLiveCategoryCache = { categories: result, timestamp: Date.now() };
        }
        return result;
      })().finally(() => {
        trendyolCategoryFetchPromise = null;
      });
    }
    const categories = await trendyolCategoryFetchPromise;
    res.json(categories);
  } catch (error: any) {
    console.warn("[Trendyol Categories] Falling back to verified TRENDYOL_DEFAULT_CATEGORIES:", error?.message);
    res.json(TRENDYOL_DEFAULT_CATEGORIES);
  }
});

// 7. Get Trendyol Brands
router.get("/trendyol/brands", authenticate, async (req: any, res) => {
  const page = req.query.page || 0;
  const size = req.query.size || 1000;
  try {
    const response = await axios.get(`https://apigw.trendyol.com/integration/product/brands?page=${page}&size=${size}`, {
      headers: { "User-Agent": "LookPrice - SelfIntegration", "Accept": "application/json" }
    });
    res.json(response.data.brands || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Pazarama Integration ---

// 1. Save Pazarama Settings
router.post("/pazarama/settings", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId);
  const { apiKey, apiSecret, merchantId, commissionRate, defaultCommissionRate, defaultFixedFee, categoryMappings, categoryMappingLabels, categoryAttributes, categoryMarkups, brandMappings } = req.body;

  try {
    const prevRes = await pool.query("SELECT pazarama_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (prevRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });

    let prevSettings = prevRes.rows[0]?.pazarama_settings || {};
    if (typeof prevSettings === 'string') { try { prevSettings = JSON.parse(prevSettings); } catch { prevSettings = {}; } }
    let br = prevRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch { br = {}; } }
    const prevMerged = { ...(br.pazarama_settings || {}), ...prevSettings };

    const finalApiKey = apiKey !== undefined ? String(apiKey).trim() : String(prevMerged.apiKey || "").trim();
    const finalApiSecret = apiSecret !== undefined ? String(apiSecret).trim() : String(prevMerged.apiSecret || "").trim();
    const finalMerchantId = merchantId !== undefined ? String(merchantId).trim() : String(prevMerged.merchantId || "").trim();

    const effectiveComm = defaultCommissionRate !== undefined
      ? Number(defaultCommissionRate)
      : (commissionRate !== undefined ? Number(commissionRate) : (prevMerged.defaultCommissionRate ?? prevMerged.commissionRate ?? 15));

    const settings = {
      ...prevMerged,
      connected: !!(finalApiKey && finalApiSecret),
      apiKey: finalApiKey,
      apiSecret: finalApiSecret,
      merchantId: finalMerchantId,
      commissionRate: effectiveComm,
      defaultCommissionRate: effectiveComm,
      defaultFixedFee: defaultFixedFee !== undefined ? Number(defaultFixedFee) : (prevMerged.defaultFixedFee ?? 20),
      categoryMappings: categoryMappings !== undefined ? categoryMappings : (prevMerged.categoryMappings || {}),
      categoryMappingLabels: categoryMappingLabels !== undefined ? categoryMappingLabels : (prevMerged.categoryMappingLabels || {}),
      categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : (prevMerged.categoryAttributes || {}),
      categoryMarkups: categoryMarkups !== undefined ? categoryMarkups : (prevMerged.categoryMarkups || {}),
      brandMappings: brandMappings !== undefined ? brandMappings : (prevMerged.brandMappings || {})
    };

    br.pazarama_settings = settings;
    await pool.query("UPDATE stores SET pazarama_settings = $1, branding = $2 WHERE id = $3", [settings, br, storeId]);
    import("../src/services/cronJobs").then(({ syncMarketplacePricesOnRateChange }) => {
      syncMarketplacePricesOnRateChange(Number(storeId)).catch(() => {});
    }).catch(() => {});
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Pazarama Settings
router.get("/pazarama/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT pazarama_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = result.rows[0];
    let pz = row?.pazarama_settings || {};
    if (typeof pz === 'string') { try { pz = JSON.parse(pz); } catch(e) { pz = {}; } }
    let br = row?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch(e) { br = {}; } }
    const pzBr = br.pazarama_settings || {};
    res.json({ ...pzBr, ...pz });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

    // Sync Pazarama Orders
router.post("/pazarama/sync", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;

  try {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, count: 0, message: "Demo mağaza simülasyonu: Pazarama siparişleri senkronize edildi." });
    }

    const storeRes = await pool.query("SELECT pazarama_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.pazarama_settings;

    if (!settings || !settings.apiKey || !settings.apiSecret) {
      return res.status(400).json({ error: "Pazarama API bilgileri eksik" });
    }

    const pzOrders = await syncPazaramaOrders(pool, storeId, settings);

    let syncedCount = 0;
    for (const order of pzOrders) {
      const orderId = order.orderNumber || order.id;
      const pzRawStatus = String(order.orderStatus || order.statusName || order.status || "New").trim();
      const pzStatusLower = pzRawStatus.toLowerCase();
      const isPzCancelled =
        pzStatusLower.includes("cancel") ||
        pzStatusLower.includes("iptal") ||
        pzStatusLower.includes("return") ||
        pzStatusLower.includes("iade") ||
        pzStatusLower.includes("reject") ||
        pzStatusLower.includes("refund");
      const pzOrderDate = parseMarketplaceOrderDate(order.orderDate || order.createdDate);
      const totalAmount = parseFloat(order.totalAmount || order.grandTotal || 0) || 0;
      const invoiceNumber = `PZ-${orderId}`;
      const customerName = order.customerName || order.recipientName || "Pazarama Müşterisi";

      const existing = await pool.query(
        "SELECT id, sale_id, sales_invoice_id, status FROM pazarama_orders WHERE store_id = $1 AND pazarama_order_id = $2",
        [storeId, orderId]
      );
      if (existing.rows.length === 0) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          let customerId = null;
          const customerEmail = order.customerEmail || `${orderId}@pazarama.com`;

          const rawCustName4 = (customerName || '').trim();
          const nameParts4 = rawCustName4.split(' ');
          const surname4 = nameParts4.length > 1 ? nameParts4.pop()! : '';
          const firstName4 = nameParts4.join(' ') || rawCustName4;

          const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, customerEmail]);
          if (custRes.rows.length > 0) {
            customerId = custRes.rows[0].id;
          } else {
            const newCust = await client.query(
              `INSERT INTO customers (store_id, email, password, full_name, name, surname, phone, address) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
               ON CONFLICT (store_id, email) DO UPDATE SET 
                 full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), customers.full_name),
                 name = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
                 surname = COALESCE(NULLIF(EXCLUDED.surname, ''), customers.surname),
                 phone = COALESCE(NULLIF(EXCLUDED.phone, ''), customers.phone),
                 address = COALESCE(NULLIF(EXCLUDED.address, ''), customers.address)
               RETURNING id`,
              [storeId, customerEmail, 'marketplace_user', rawCustName4, firstName4, surname4, order.customerPhone || '', order.deliveryAddress || '']
            );
            customerId = newCust.rows[0]?.id;
          }

          const saleRes = await client.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
            [storeId, totalAmount, 'TRY', isPzCancelled ? 'cancelled' : 'completed', customerName, customerId, 'Pazarama Satış', `Pazarama Siparişi: ${orderId}`, pzOrderDate]
          );
          const saleId = saleRes.rows[0].id;

          const grandTotal = totalAmount;
          const subtotal = grandTotal / 1.20;
          const taxAmount = grandTotal - subtotal;

          const invoiceRes = await client.query(
            "INSERT INTO sales_invoices (store_id, customer_id, sale_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id",
            [storeId, customerId, saleId, invoiceNumber, pzOrderDate, subtotal, taxAmount, grandTotal, 'TRY', 'Pazarama Satış', `Pazarama Siparişi: ${orderId}`, 'marketplace', isPzCancelled ? 'cancelled' : 'completed', pzOrderDate]
          );
          const salesInvoiceId = invoiceRes.rows[0].id;

          const orderItems = order.orderItems || order.items || [];
          const mappedLines = orderItems.map((l: any) => ({
            name: l.productName,
            quantity: l.quantity,
            price: l.unitPrice || l.price,
            barcode: l.barcode,
            sku: l.merchantSku || l.sku,
            taxRate: l.taxRate || 20
          }));

          if (mappedLines.length > 0 && !isPzCancelled) {
            await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'Pazarama', orderId, customerName, invoiceNumber);
          } else {
            await client.query(
              "INSERT INTO sales_invoice_items (sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
              [salesInvoiceId, `Pazarama Sipariş Kalemi (${orderId})`, 1, subtotal, 20, taxAmount, grandTotal]
            );
          }

          await client.query(
            "INSERT INTO pazarama_orders (store_id, pazarama_order_id, sale_id, sales_invoice_id, status, order_data) VALUES ($1, $2, $3, $4, $5, $6)",
            [storeId, orderId, saleId, salesInvoiceId, pzRawStatus, order]
          );

          await client.query("COMMIT");
          try {
            await syncMarketplaceOrderTreasury(pool, {
              storeId,
              platform: "pazarama",
              salesInvoiceId,
              saleId,
              orderNumber: String(orderId),
              invoiceNumber,
              amount: grandTotal,
              currency: "TRY",
              customerName,
              date: pzOrderDate,
              status: isPzCancelled ? "cancelled" : "completed",
              notes: `Pazarama Siparişi: ${orderId}`,
            });
          } catch (trErr: any) {
            console.warn(`[Pazarama Sync] Treasury sync warning for #${orderId}:`, trErr?.message || trErr);
          }
          syncedCount++;
        } catch (e) {
          await client.query("ROLLBACK");
          console.error("Pazarama Order Sync Error:", e);
        } finally {
          client.release();
        }
      } else {
        const exRow = existing.rows[0];
        await pool.query(
          "UPDATE pazarama_orders SET status = $1, order_data = $2 WHERE id = $3",
          [pzRawStatus, order, exRow.id]
        );
        if (isPzCancelled) {
          if (exRow.sales_invoice_id) {
            await pool.query("UPDATE sales_invoices SET status = 'cancelled' WHERE id = $1 AND store_id = $2", [exRow.sales_invoice_id, storeId]);
          }
          if (exRow.sale_id) {
            const saleCheck = await pool.query("SELECT status FROM sales WHERE id = $1 AND store_id = $2", [exRow.sale_id, storeId]);
            const wasSaleCancelled = ['cancelled', 'iptal', 'canceled'].includes(String(saleCheck.rows[0]?.status || '').toLowerCase().trim());
            await pool.query(
              "UPDATE sales SET status = 'cancelled', cancellation_reason = COALESCE(cancellation_reason, 'Pazarama Sipariş İptali/İadesi') WHERE id = $1 AND store_id = $2",
              [exRow.sale_id, storeId]
            );
            if (!wasSaleCancelled) {
              const items = await pool.query("SELECT product_id, quantity FROM sale_items WHERE sale_id = $1", [exRow.sale_id]);
              for (const it of items.rows) {
                if (it.product_id && it.quantity > 0) {
                  await pool.query("UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3", [it.quantity, it.product_id, storeId]);
                }
              }
            }
          }
          await pool.query(
            "DELETE FROM stock_movements WHERE store_id = $1 AND (sale_id = $2 OR (invoice_id IS NOT NULL AND invoice_id = $3) OR invoice_number = $4)",
            [storeId, exRow.sale_id || -1, exRow.sales_invoice_id || -1, invoiceNumber]
          );
        }
        try {
          await syncMarketplaceOrderTreasury(pool, {
            storeId,
            platform: "pazarama",
            salesInvoiceId: exRow.sales_invoice_id,
            saleId: exRow.sale_id,
            orderNumber: String(orderId),
            invoiceNumber,
            amount: totalAmount,
            currency: "TRY",
            customerName,
            date: pzOrderDate,
            status: isPzCancelled ? "cancelled" : "completed",
            notes: `Pazarama Siparişi: ${orderId}`,
          });
        } catch (trErr: any) {
          console.warn(`[Pazarama Sync] Treasury update sync warning for #${orderId}:`, trErr?.message || trErr);
        }
      }
    }
      
    const newSettings = { ...settings, last_sync: new Date().toISOString() };
    await pool.query("UPDATE stores SET pazarama_settings = $1 WHERE id = $2", [newSettings, storeId]);
    
    if (syncedCount > 0) {
      return res.json({ success: true, count: syncedCount });
    }

    res.json({ success: true, count: 0, message: "Gerçek API bağlantısı için geçerli anahtarlar gereklidir." });
  } catch (error: any) {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, count: 0, message: "Demo mağaza simülasyonu: Pazarama siparişleri senkronize edildi." });
    }
    await IntegrationService.logIntegrationError(storeId, 'Pazarama', 'Sync All Orders', error);
    res.status(500).json({ error: "Pazarama siparişleri senkronize edilemedi." });
  }
});

router.post("/pazarama/test", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body?.storeId || req.query?.storeId);
  try {
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, message: "Demo mağaza simülasyonu: Pazarama bağlantısı başarılı." });
    }
    const storeRes = await pool.query("SELECT pazarama_settings, branding FROM stores WHERE id = $1", [storeId]);
    let pzDb = storeRes.rows[0]?.pazarama_settings || {};
    if (typeof pzDb === 'string') { try { pzDb = JSON.parse(pzDb); } catch { pzDb = {}; } }
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch { br = {}; } }
    let settings: any = { ...(br.pazarama_settings || {}), ...pzDb };

    if (req.body && (req.body.apiKey || req.body.apiSecret || req.body.merchantId)) {
      settings = {
        ...settings,
        apiKey: String(req.body.apiKey || settings.apiKey || "").trim(),
        apiSecret: String(req.body.apiSecret || settings.apiSecret || "").trim(),
        merchantId: String(req.body.merchantId || settings.merchantId || "").trim(),
      };
    }

    if (!settings || !settings.apiKey || !settings.apiSecret) {
      return res.status(400).json({ error: "Pazarama API bilgileri eksik" });
    }
    const success = await testPazaramaConnection(settings);
    res.json({ success });
  } catch (error: any) { 
    if (await checkIsDemoStore(storeId)) {
      return res.json({ success: true, simulated: true, message: "Demo mağaza simülasyonu: Pazarama bağlantısı başarılı." });
    }
    res.status(500).json({ error: error.message }); 
  }
});
router.post("/pazarama/disconnect", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch (e) { br = {}; } }
    delete br.pazarama_settings;
    await pool.query("UPDATE stores SET pazarama_settings = '{}', branding = $1 WHERE id = $2", [br, storeId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Publish Product to Pazarama
router.post("/pazarama/publish", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.headers?.["x-store-id"] || req.user?.store_id;
  const storeId = req.user.role === "superadmin" ? Number(rawStoreId || req.user?.store_id || 1) : Number(req.user?.store_id || rawStoreId);
  const productId = Number(req.body?.productId || req.query?.productId);

  if (!productId || isNaN(productId)) {
    return res.status(400).json({ error: "Geçersiz veya eksik ürün ID." });
  }

  try {
    // 1. Get Integration Settings and Store Branding
    const storeRes = await pool.query("SELECT pazarama_settings, currency_rates, branding FROM stores WHERE id = $1", [storeId]);
    const storeRow = storeRes.rows[0] || {};
    const settings = storeRow?.pazarama_settings || storeRow?.branding?.pazarama_settings;
    const branding = storeRow?.branding || {};

    if (!settings || !settings.apiKey || !settings.apiSecret) {
      return res.status(400).json({ error: "Pazarama API bilgileri yapılandırılmamış. Lütfen Ayarlar > Entegrasyonlar sekmesinden ayarlayınız." });
    }

    // 2. Fetch Local Product Data
    const productRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: "Ürün bulunamadı veya bu mağazaya ait değil." });
    }
    
    const product = productRes.rows[0];

    if (String(product.product_type || "").toLowerCase() === "service" || /^servis$|^hizmet$/i.test(String(product.category || "").trim())) {
      return res.status(400).json({ error: `"${product.name}" bir Hizmet/Servis kalemi olduğu için e-Mağaza (Pazarama) listelerine eklenemez.` });
    }

    const sellablePzStock = computeSellableStock(product.stock_quantity, product.reserved_stock);
    if (Number(product.price || 0) <= 0 || sellablePzStock <= 0) {
      const reasons = [];
      if (Number(product.price || 0) <= 0) reasons.push("fiyatı 0₺");
      if (sellablePzStock <= 0) reasons.push(Number(product.reserved_stock || 0) > 0 ? "tüm stok rezerveli (satılabilir 0)" : "stoğu yetersiz (0/negatif)");
      return res.status(400).json({ error: `"${product.name}" ürününün ${reasons.join(" ve ")} olduğu için Pazarama'da satışa açılamaz. Lütfen fiyat ve stoğu güncelleyin.` });
    }

    // --- Price Calculation Logic (Currency Conversion + Pazarama Commission & Fixed Fee Markup) ---
    let webPriceTRY = parseFloat(product.price || "0");
    const currency = String(product.currency || 'TRY').toUpperCase();
    if (currency !== 'TRY' && currency !== 'TL') {
      const rates = { ...(branding.currency_rates || {}), ...(storeRow.currency_rates || {}) };
      const rate = Number(rates[currency] || 1);
      if (rate > 1) {
        webPriceTRY = webPriceTRY * rate;
      }
    }

    const { N11Service } = await import("../src/services/backend/n11Service");
    const finalPriceTRY = N11Service.calculateMarketplacePrice(webPriceTRY, product.category, product.sub_category, settings);

    // Round to 2 decimal places
    const listPrice = Math.round(finalPriceTRY * 100) / 100;
    const salePrice = listPrice;

    // 3. Prepare standard Pazarama POST structure
    const mappings = settings.categoryMappings || {};
    const pzCategoryId = (product.category && mappings[product.category]) 
      ? Number(mappings[product.category]) 
      : 1; // Default to 1 if no mapping exists

    const payload = {
      productCode: `PRD-${product.id}`,
      barcode: product.barcode || `PRD-BARCODE-${product.id}`,
      name: product.name,
      description: product.description || product.name,
      vatRate: product.tax_rate || 20,
      listPrice: listPrice,
      salePrice: salePrice,
      stockCount: computeSellableStock(product.stock_quantity, product.reserved_stock),
      brandId: 1, 
      categoryId: pzCategoryId, 
      images: [] as any[]
    };

    const pazaramaImages = extractProductMarketplaceImages(product, req, {
      maxCount: 8,
      mpData: typeof product.marketplace_data === "string"
        ? (() => { try { return JSON.parse(product.marketplace_data); } catch { return {}; } })()
        : (product.marketplace_data || {}),
    });
    pazaramaImages.forEach((url, idx) => {
      payload.images.push({ url, order: idx + 1 });
    });

    // --- REAL API CALL ---
    let apiSuccess = false;
    let apiMessage = "Ürün başarıyla Pazarama'ya aktarıldı.";
    let pazaramaResponseData: any = null;

    try {
      const apiKey = (settings.apiKey || "").trim();
      const apiSecret = (settings.apiSecret || "").trim();
      const merchantId = (settings.merchantId || "").trim();

      if (!merchantId) {
        throw new Error("Pazarama Satıcı ID (Merchant ID) ayarı eksik. Lütfen ayarlar bölümünden kaydedin.");
      }

      // Pazarama API integration typically uses Basic Auth with Key and Secret
      const authHeader = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
      
      const pzResponse = await axios.post(`https://isortagimapi.pazarama.com/api/v1/product/upsert`, payload, {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'SellerId': merchantId,
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://isortagim.pazarama.com',
          'Referer': 'https://isortagim.pazarama.com/'
        },
        timeout: 20000 // 20 seconds timeout for upsert
      });

      pazaramaResponseData = pzResponse.data;
      
      // Pazarama usually returns success in the body
      if (pzResponse.status === 200 && (pazaramaResponseData?.success === true || pazaramaResponseData?.isSuccess === true)) {
        apiSuccess = true;
      } else {
        apiSuccess = false;
        apiMessage = pazaramaResponseData?.message || pazaramaResponseData?.error || "Pazarama API bir hata döndürdü.";
      }
    } catch (apiErr: any) {
      console.error("Pazarama API Connection Error:", apiErr.response?.data || apiErr.message);
      apiSuccess = false;
      apiMessage = apiErr.response?.data?.message || apiErr.response?.data?.error || "Pazarama API bağlantı hatası: " + apiErr.message;
    }

    // 4. Update local product status if successful
    if (apiSuccess) {
      try {
        await pool.query(`
          ALTER TABLE products ADD COLUMN IF NOT EXISTS pazarama_id VARCHAR(50);
          ALTER TABLE products ADD COLUMN IF NOT EXISTS is_pazarama_active BOOLEAN DEFAULT FALSE;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS pazarama_last_error TEXT;
        `);
        await pool.query("UPDATE products SET pazarama_id = $1, is_pazarama_active = TRUE, pazarama_last_error = NULL WHERE id = $2", [payload.productCode, productId]);
      } catch (dbErr) {
        console.warn("DB Update Error (non-fatal):", dbErr);
      }
      
      res.json({ 
        success: true, 
        message: apiMessage, 
        pazaramaCode: payload.productCode
      });
    } else {
      // Even if API failed, we might want to log the error in the product
      try {
        await pool.query("UPDATE products SET pazarama_last_error = $1 WHERE id = $2", [apiMessage, productId]);
      } catch (e) {}

      res.status(400).json({ 
        success: false, 
        error: apiMessage,
        details: pazaramaResponseData 
      });
    }

  } catch (error: any) {
    console.error("Pazarama Publish Error:", error.message);
    res.status(500).json({ error: "Pazarama'ya ürün aktarılırken bir hata oluştu: " + error.message });
  }
});

// 4. Get Pazarama Categories
router.get("/pazarama/categories", authenticate, async (req: any, res) => {
  console.log("HIT: /api/integrations/pazarama/categories", { storeId: req.query.storeId, user: req.user.id });
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT pazarama_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.pazarama_settings || {};
    
    const apiKey = (settings.apiKey || "").trim();
    const apiSecret = (settings.apiSecret || "").trim();
    const merchantId = (settings.merchantId || "").trim();

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: "Pazarama API ayarları eksik." });
    }

    const authHeader = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    // Attempt with fallbacks for endpoints
    let pzRes;
    let lastError;

    const endpoints = [
      "https://api.pazarama.com/isortagim/api/v1/Category/all",
      "https://isortagimapi.pazarama.com/api/v1/product/category/all",
      "https://isortagimapi.pazarama.com/api/v1.0/Category/all",
      "https://isortagimapi.pazarama.com/api/v1/Category/all",
      "https://api.pazarama.com/v1/Marketplace/Category/all",
      "https://isortagimapi.pazarama.com/api/v2/product/category/all"
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying Pazarama Categories Endpoint: ${endpoint}`);
        pzRes = await axios.get(endpoint, {
          headers: { 
            'Authorization': `Basic ${authHeader}`,
            'SellerId': merchantId,
            'MerchantId': merchantId,
            'Version': '1',
            'X-Version': '1',
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://isortagim.pazarama.com',
            'Referer': 'https://isortagim.pazarama.com/'
          },
          timeout: 15000
        });
        if (pzRes.status === 200) {
          if (pzRes.data && pzRes.data.isSuccess === false) {
             lastError = new Error(pzRes.data.message || pzRes.data.error || "Pazarama API error (isSuccess: false)");
             continue;
          }
          break;
        }
      } catch (e: any) {
        console.error(`Pazarama Category Endpoint Fail: ${endpoint}`, {
          status: e.response?.status,
          message: e.message,
          data: e.response?.data && typeof e.response.data === 'string' ? "HTML content received" : e.response?.data
        });
        lastError = e;
      }
    }

    if (!pzRes || (pzRes.data && pzRes.data.isSuccess === false)) {
       throw lastError || new Error("Endpoint connection failed or API returned error");
    }

    // Pazarama usually returns { isSuccess: true, data: [...], message: "..." }
    const data = pzRes.data.data || (Array.isArray(pzRes.data) ? pzRes.data : []);
    res.json(data);
  } catch (error: any) {
    console.error("Pazarama Categories Fetch Error Body:", error.response?.data);
    console.error("Pazarama Categories Fetch Error Message:", error.message);
    let status = error.response?.status || 500;
    // Map 403 to 400 to avoid Nginx intercepting our custom error response
    if (status === 403) status = 400;
    
    const rawMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    const msg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
    res.status(status).json({ error: "Pazarama Kategorileri çekilemedi: " + msg.substring(0, 200) });
  }
});

// 5. Get Pazarama Brands
router.get("/pazarama/brands", authenticate, async (req: any, res) => {
  console.log("HIT: /api/integrations/pazarama/brands", { storeId: req.query.storeId, user: req.user.id });
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT pazarama_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.pazarama_settings || {};
    
    const apiKey = (settings.apiKey || "").trim();
    const apiSecret = (settings.apiSecret || "").trim();
    const merchantId = (settings.merchantId || "").trim();

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: "Pazarama API ayarları eksik." });
    }

    const authHeader = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    let pzRes;
    let lastError;

    const endpoints = [
      "https://api.pazarama.com/isortagim/api/v1/Brand/all",
      "https://isortagimapi.pazarama.com/api/v1/product/brand/all",
      "https://isortagimapi.pazarama.com/api/v1/brand/all",
      "https://isortagimapi.pazarama.com/api/v1.0/Brand/all",
      "https://isortagimapi.pazarama.com/api/v1/brand/brands",
      "https://api.pazarama.com/v1/brand/all"
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying Pazarama Brands Endpoint: ${endpoint}`);
        pzRes = await axios.get(endpoint, {
          headers: { 
            'Authorization': `Basic ${authHeader}`,
            'SellerId': merchantId,
            'MerchantId': merchantId,
            'Version': '1',
            'X-Version': '1',
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://isortagim.pazarama.com',
            'Referer': 'https://isortagim.pazarama.com/'
          },
          timeout: 15000
        });
        if (pzRes.status === 200) {
          if (pzRes.data && pzRes.data.isSuccess === false) {
             lastError = new Error(pzRes.data.message || pzRes.data.error || "Pazarama API error (isSuccess: false)");
             continue;
          }
          break;
        }
      } catch (e: any) {
        console.error(`Pazarama Brand Endpoint Fail: ${endpoint}`, {
          status: e.response?.status,
          message: e.message,
          data: e.response?.data && typeof e.response.data === 'string' ? "HTML content received" : e.response?.data
        });
        lastError = e;
      }
    }

    if (!pzRes || (pzRes.data && pzRes.data.isSuccess === false)) {
       throw lastError || new Error("Endpoint connection failed or API returned error");
    }

    const data = pzRes.data.data || (Array.isArray(pzRes.data) ? pzRes.data : []);
    res.json(data);
  } catch (error: any) {
    console.error("Pazarama Brands Fetch Error Body:", error.response?.data);
    console.error("Pazarama Brands Fetch Error Message:", error.message);
    let status = error.response?.status || 500;
    // Map 403 to 400 to avoid Nginx intercepting our custom error response
    if (status === 403) status = 400;

    const rawMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    const msg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
    res.status(status).json({ error: "Pazarama Markaları çekilemedi: " + msg.substring(0, 200) });
  }
});

// Helper to resolve target storeId across SuperAdmin, StoreAdmin, and slug header
async function resolveIntegrationStoreId(req: any): Promise<number | null> {
  const rawStoreId = req.query?.storeId || req.body?.storeId;
  const parsedStoreId = rawStoreId ? parseInt(String(rawStoreId), 10) : undefined;
  const authorizedId = await getAuthorizedStoreId(req, !isNaN(parsedStoreId as number) ? parsedStoreId : undefined);
  if (authorizedId) return authorizedId;

  // Fallback to x-store-slug header for SuperAdmin when storeId query param was omitted
  const slugHeader = req.headers?.["x-store-slug"];
  if (slugHeader && req.user?.role === "superadmin") {
    const slugRes = await pool.query("SELECT id FROM stores WHERE LOWER(slug) = LOWER($1) LIMIT 1", [String(slugHeader)]);
    if (slugRes.rows[0]?.id) return slugRes.rows[0].id;
  }
  return req.user?.store_id || null;
}

// --- Meta (Facebook/Instagram) & SEO Meta Integration ---

// 1. Save Meta Settings (Defensively merges with existing meta_settings & branding.meta_settings)
router.post("/meta/settings", authenticate, async (req: any, res) => {
  try {
    const storeId = await resolveIntegrationStoreId(req);
    if (!storeId) return res.status(400).json({ error: "Store ID bulunamadı" });

    const { enabled, pixel_id, catalog_id, catalog_currency, ga_measurement_id, gtm_id, gsc_id } = req.body;

    const existingRes = await pool.query("SELECT meta_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = existingRes.rows[0] || {};
    const colMeta = (row.meta_settings && typeof row.meta_settings === "object") ? row.meta_settings : {};
    const brObj = (row.branding && typeof row.branding === "object") ? row.branding : {};
    const brMeta = (brObj.meta_settings && typeof brObj.meta_settings === "object") ? brObj.meta_settings : {};

    const mergedMeta: any = {
      ...brMeta,
      ...colMeta,
      enabled: enabled !== undefined ? !!enabled : Boolean(colMeta.enabled ?? brMeta.enabled),
      pixel_id: pixel_id !== undefined ? String(pixel_id).trim() : (colMeta.pixel_id || brMeta.pixel_id || ""),
      catalog_id: catalog_id !== undefined ? String(catalog_id).trim() : (colMeta.catalog_id || brMeta.catalog_id || ""),
      catalog_currency: catalog_currency || colMeta.catalog_currency || brMeta.catalog_currency || "TRY",
      ga_measurement_id: ga_measurement_id !== undefined ? String(ga_measurement_id).trim() : (colMeta.ga_measurement_id || brMeta.ga_measurement_id || ""),
      gtm_id: gtm_id !== undefined ? String(gtm_id).trim() : (colMeta.gtm_id || brMeta.gtm_id || ""),
      gsc_id: gsc_id !== undefined ? String(gsc_id).trim() : (colMeta.gsc_id || brMeta.gsc_id || ""),
    };

    const updatedBranding = { ...brObj, meta_settings: mergedMeta };
    await pool.query(
      "UPDATE stores SET meta_settings = $1, branding = $2 WHERE id = $3",
      [JSON.stringify(mergedMeta), JSON.stringify(updatedBranding), storeId]
    );
    res.json({ success: true, settings: mergedMeta });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Meta Settings
router.get("/meta/settings", authenticate, async (req: any, res) => {
  try {
    const storeId = await resolveIntegrationStoreId(req);
    if (!storeId) return res.json({ enabled: false, pixel_id: "", catalog_id: "" });

    const result = await pool.query("SELECT meta_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = result.rows[0] || {};
    const colMeta = (row.meta_settings && typeof row.meta_settings === "object") ? row.meta_settings : {};
    const brMeta = (row.branding?.meta_settings && typeof row.branding.meta_settings === "object") ? row.branding.meta_settings : {};

    const merged: any = {
      enabled: false,
      pixel_id: "",
      catalog_id: "",
      catalog_currency: "TRY",
      ...brMeta,
      ...colMeta,
    };
    for (const k of ["pixel_id", "catalog_id", "ga_measurement_id", "gtm_id", "gsc_id"]) {
      if (!merged[k] && (colMeta[k] || brMeta[k])) {
        merged[k] = colMeta[k] || brMeta[k];
      }
    }
    if (colMeta.enabled === true || brMeta.enabled === true || Boolean(merged.pixel_id || merged.catalog_id)) {
      if (colMeta.enabled !== false) {
        merged.enabled = Boolean(colMeta.enabled ?? brMeta.enabled ?? (merged.pixel_id || merged.catalog_id));
      }
    }

    res.json(merged);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Google Merchant Center Integration ---

// 1. Save Google Merchant Settings
router.post("/google-merchant/settings", authenticate, async (req: any, res) => {
  try {
    const storeId = await resolveIntegrationStoreId(req);
    if (!storeId) return res.status(400).json({ error: "Store ID bulunamadı" });

    const { enabled, merchant_id, catalog_currency } = req.body;

    const existingRes = await pool.query("SELECT google_merchant_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = existingRes.rows[0] || {};
    const colGm = (row.google_merchant_settings && typeof row.google_merchant_settings === "object") ? row.google_merchant_settings : {};
    const brObj = (row.branding && typeof row.branding === "object") ? row.branding : {};
    const brGm = (brObj.google_merchant_settings && typeof brObj.google_merchant_settings === "object") ? brObj.google_merchant_settings : {};

    const settings = {
      ...brGm,
      ...colGm,
      enabled: enabled !== undefined ? !!enabled : Boolean(colGm.enabled ?? brGm.enabled),
      merchant_id: merchant_id !== undefined ? String(merchant_id).trim() : (colGm.merchant_id || brGm.merchant_id || ""),
      catalog_currency: catalog_currency || colGm.catalog_currency || brGm.catalog_currency || "TRY"
    };

    const updatedBranding = { ...brObj, google_merchant_settings: settings };
    await pool.query(
      "UPDATE stores SET google_merchant_settings = $1, branding = $2 WHERE id = $3",
      [JSON.stringify(settings), JSON.stringify(updatedBranding), storeId]
    );
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Google Merchant Settings
router.get("/google-merchant/settings", authenticate, async (req: any, res) => {
  try {
    const storeId = await resolveIntegrationStoreId(req);
    if (!storeId) return res.json({ enabled: false, merchant_id: "" });

    const result = await pool.query("SELECT google_merchant_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = result.rows[0] || {};
    const colGm = (row.google_merchant_settings && typeof row.google_merchant_settings === "object") ? row.google_merchant_settings : {};
    const brGm = (row.branding?.google_merchant_settings && typeof row.branding.google_merchant_settings === "object") ? row.branding.google_merchant_settings : {};

    const merged: any = {
      enabled: false,
      merchant_id: "",
      catalog_currency: "TRY",
      ...brGm,
      ...colGm,
    };
    if (!merged.merchant_id && (colGm.merchant_id || brGm.merchant_id)) {
      merged.merchant_id = colGm.merchant_id || brGm.merchant_id;
    }
    if (colGm.enabled === true || brGm.enabled === true) {
      merged.enabled = true;
    }

    res.json(merged);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Instagram Integration ---

// 1. Save Instagram Settings
router.post("/instagram/settings", authenticate, async (req: any, res) => {
  try {
    const storeId = await resolveIntegrationStoreId(req);
    if (!storeId) return res.status(400).json({ error: "Store ID bulunamadı" });

    const { enabled, auto_post, account_id, access_token } = req.body;

    const existingRes = await pool.query("SELECT instagram_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = existingRes.rows[0] || {};
    const colIg = (row.instagram_settings && typeof row.instagram_settings === "object") ? row.instagram_settings : {};
    const brObj = (row.branding && typeof row.branding === "object") ? row.branding : {};
    const brIg = (brObj.instagram_settings && typeof brObj.instagram_settings === "object") ? brObj.instagram_settings : {};

    const settings = {
      ...brIg,
      ...colIg,
      enabled: !!enabled,
      auto_post: !!auto_post,
      account_id: account_id !== undefined ? String(account_id).trim() : (colIg.account_id || brIg.account_id || ""),
      access_token: access_token !== undefined ? String(access_token).trim() : (colIg.access_token || brIg.access_token || "")
    };

    const updatedBranding = { ...brObj, instagram_settings: settings };
    await pool.query(
      `UPDATE stores SET 
        instagram_settings = $1,
        instagram_access_token = $2,
        instagram_business_account_id = $3,
        branding = $4
      WHERE id = $5`,
      [JSON.stringify(settings), settings.access_token, settings.account_id, JSON.stringify(updatedBranding), storeId]
    );
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Instagram Settings
router.get("/instagram/settings", authenticate, async (req: any, res) => {
  try {
    const storeId = await resolveIntegrationStoreId(req);
    if (!storeId) return res.json({ enabled: false, auto_post: false, account_id: "", access_token: "" });

    const result = await pool.query(
      "SELECT instagram_settings, instagram_access_token, instagram_business_account_id, branding FROM stores WHERE id = $1", 
      [storeId]
    );
    const row = result.rows[0] || {};
    const colIg = (row.instagram_settings && typeof row.instagram_settings === "object") ? row.instagram_settings : {};
    const brIg = (row.branding?.instagram_settings && typeof row.branding.instagram_settings === "object") ? row.branding.instagram_settings : {};
    const settings: any = {
      enabled: false,
      auto_post: false,
      account_id: "",
      access_token: "",
      ...brIg,
      ...colIg
    };
    
    // Merge database columns if they exist
    if (row.instagram_access_token && !settings.access_token) {
      settings.access_token = row.instagram_access_token;
    }
    if (row.instagram_business_account_id && !settings.account_id) {
      settings.account_id = row.instagram_business_account_id;
    }
    if (settings.access_token && settings.account_id) {
      if (settings.enabled === undefined) settings.enabled = true;
    }

    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
