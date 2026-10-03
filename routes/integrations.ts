import express from "express";
import { pool } from "../models/db";
import axios from "axios";
import { authenticate, getAuthorizedStoreId } from "../middleware/auth";
import { IntegrationService } from "../src/services/IntegrationService";
import { HepsiburadaService } from "../src/services/backend/hepsiburadaService";
import { HepsiburadaServiceV3 } from "../src/services/backend/HepsiburadaServiceV3";
import { AmazonService } from "../src/services/backend/amazonService";
import { isHepsiburadaMasterCatalogId, slugifyText } from "../src/utils/marketplaceUrls";
import { 
  processMarketplaceOrderLines, 
  syncN11Orders, 
  syncHepsiburadaOrders, 
  syncTrendyolOrders, 
  syncPazaramaOrders,
  testN11Connection,
  testHepsiburadaConnection,
  testTrendyolConnection,
  testPazaramaConnection
} from "../src/services/marketplaceSync";

const router = express.Router();


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
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { appId, clientId, clientSecret, refreshToken, sellerId, categoryMappings, categoryAttributes, categoryMarkups, defaultCommissionRate, defaultFixedFee, isSandbox } = req.body;

  try {
    const storeRes = await pool.query("SELECT amazon_settings, branding FROM stores WHERE id = $1", [storeId]);
    const prev = storeRes.rows[0]?.amazon_settings || {};
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') {
      try { br = JSON.parse(br); } catch (e) { br = {}; }
    }

    const central = await getCentralAmazonCredentials();
    const finalAppId = appId ? String(appId).trim() : (prev.appId || central.appId || DEFAULT_LOOKPRICE_AMAZON_APP_ID);
    const finalClientId = clientId ? String(clientId).trim() : (prev.clientId || central.clientId || "");
    const finalClientSecret = clientSecret ? String(clientSecret).trim() : (prev.clientSecret || central.clientSecret || "");
    const finalRefreshToken = refreshToken ? String(refreshToken).trim() : (prev.refresh_token || "");
    const finalSellerId = sellerId ? String(sellerId).trim() : (prev.sellerId || "");

    const settings = {
      ...prev,
      connected: !!((finalClientId && finalClientSecret && finalRefreshToken) || (finalRefreshToken && finalSellerId)),
      appId: finalAppId,
      clientId: finalClientId,
      clientSecret: finalClientSecret,
      refresh_token: finalRefreshToken,
      sellerId: finalSellerId,
      isSandbox: typeof isSandbox === 'boolean' ? isSandbox : (prev.isSandbox || false),
      marketplace_id: AMAZON_TR_MARKETPLACE_ID,
      defaultCommissionRate: defaultCommissionRate !== undefined ? Number(defaultCommissionRate) : (prev.defaultCommissionRate ?? 15),
      defaultFixedFee: defaultFixedFee !== undefined ? Number(defaultFixedFee) : (prev.defaultFixedFee ?? 20),
      categoryMappings: categoryMappings !== undefined ? categoryMappings : (prev.categoryMappings || {}),
      categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : (prev.categoryAttributes || {}),
      categoryMarkups: categoryMarkups !== undefined ? categoryMarkups : (prev.categoryMarkups || {}),
      last_sync: prev.last_sync || null
    };

    br.amazon_settings = settings;
    await pool.query("UPDATE stores SET amazon_settings = $1, branding = $2 WHERE id = $3", [settings, br, storeId]);
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
      `SELECT id, name, sku, barcode, price, stock_quantity, currency, category, sub_category, amazon_asin, amazon_sku, is_amazon_active, marketplace_data 
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
    res.json({ success: true, attributes: getAttributesForCategory(String(req.params.categoryId)) });
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

// 6. Publish Product to Amazon TR
router.post("/amazon/publish", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const productId = req.body.productId;

  try {
    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    const p = prodRes.rows[0];
    if (!p) return res.status(404).json({ error: "Ürün bulunamadı" });

    if (Number(p.price || 0) <= 0 || Number(p.stock_quantity || 0) <= 0) {
      const reasons = [];
      if (Number(p.price || 0) <= 0) reasons.push("fiyatı 0₺");
      if (Number(p.stock_quantity || 0) <= 0) reasons.push("stoğu yetersiz (0/negatif)");
      return res.status(400).json({ error: `"${p.name}" ürününün ${reasons.join(" ve ")} olduğu için Amazon'da satışa açılamaz. Lütfen fiyat ve stoğu güncelleyin.` });
    }

    // Strict ASIN Guard: An Amazon listing CANNOT exist without a valid 10-char ASIN (e.g. B0...)
    const cleanAsin = p.amazon_asin && String(p.amazon_asin).trim().toLowerCase() !== 'null' && !String(p.amazon_asin).startsWith('http') 
      ? String(p.amazon_asin).trim().toUpperCase() 
      : null;

    if (!cleanAsin || cleanAsin.length < 9) {
      return res.status(400).json({ 
        error: `"${p.name}" ürününün Amazon ASIN kodu tanımlı değildir. Amazon'da bir ürünün ASIN olmadan satışta olması teknik olarak imkansızdır. Lütfen önce ürün kartından geçerli bir ASIN (örn: B0...) giriniz.` 
      });
    }

    let mpData: any = p.marketplace_data;
    if (typeof mpData === "string") {
      try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
    }
    mpData = mpData || {};
    mpData.amazon = {
      ...(mpData.amazon || {}),
      status: 'ACTIVE',
      asin: cleanAsin,
      lastSync: new Date().toISOString()
    };
    delete mpData.amazon.manuallyUnpublished;

    await pool.query(
      "UPDATE products SET is_amazon_active = true, amazon_asin = $1, amazon_last_sync = NOW(), amazon_last_error = NULL, marketplace_data = $2 WHERE id = $3 AND store_id = $4",
      [cleanAsin, JSON.stringify(mpData), productId, storeId]
    );

    res.json({ success: true, message: `"${p.name}" Amazon TR ilanına aktarıldı ve satışa açıldı.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- N11 Integration ---

// 1. Save N11 Settings
router.post("/n11/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { appKey, appSecret, categoryMappings, categoryAttributes, categoryMarkups, defaultCommissionRate, defaultFixedFee } = req.body;

  try {
    const storeRes = await pool.query("SELECT n11_settings, branding FROM stores WHERE id = $1", [storeId]);
    const prev = storeRes.rows[0]?.n11_settings || {};
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch (e) { br = {}; } }

    const finalKey = appKey ? String(appKey).trim() : (prev.appKey || "");
    const finalSecret = appSecret ? String(appSecret).trim() : (prev.appSecret || "");

    const settings = {
      ...prev,
      connected: !!(finalKey && finalSecret),
      appKey: finalKey,
      appSecret: finalSecret,
      defaultCommissionRate: defaultCommissionRate !== undefined ? Number(defaultCommissionRate) : (prev.defaultCommissionRate ?? 15),
      defaultFixedFee: defaultFixedFee !== undefined ? Number(defaultFixedFee) : (prev.defaultFixedFee ?? 20),
      categoryMappings: categoryMappings !== undefined ? categoryMappings : (prev.categoryMappings || {}),
      categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : (prev.categoryAttributes || {}),
      categoryMarkups: categoryMarkups !== undefined ? categoryMarkups : (prev.categoryMarkups || {}),
      last_sync: prev.last_sync || null
    };

    br.n11_settings = settings;
    await pool.query("UPDATE stores SET n11_settings = $1, branding = $2 WHERE id = $3", [settings, br, storeId]);
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

    const n11Orders = await syncN11Orders(pool, storeId, settings, days);

    let syncedCount = 0;
    for (const order of n11Orders) {
      const orderId = order.id;
      const existing = await pool.query("SELECT id, sale_id, sales_invoice_id FROM n11_orders WHERE store_id = $1 AND n11_order_id = $2", [storeId, orderId]);
      if (existing.rows.length > 0) {
        // Auto Backfill / Repair existing N11 order records
        const existingRow = existing.rows[0];
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const buyer = order.buyer || {};
          const billing = order.billingAddress || order.billing || {};
          const shipping = order.shippingAddress || order.shipping || {};

          const isCorporateOrder = (buyer.taxId && String(buyer.taxId).trim().length === 10) || (billing.taxId && String(billing.taxId).trim().length === 10) || order.invoiceType === "2" || order.invoiceType === 2 || /(a\.?ş|ltd|şti|tic|san|aş)/i.test(buyer.fullName || "") || /(a\.?ş|ltd|şti|tic|san|aş)/i.test(billing.companyTitle || "");

          const companyTitle = (
            billing.companyTitle || 
            buyer.companyTitle || 
            (isCorporateOrder ? (buyer.fullName || billing.fullName) : "")
          ).trim();

          const fullCustomerName = (
            companyTitle || 
            buyer.fullName || 
            billing.fullName || 
            shipping.fullName || 
            "N11 Müşterisi"
          ).trim();
          const customerEmail = buyer.email || `${orderId}@n11.com`;

          const taxNumber = (billing.taxId || buyer.taxId || billing.tcId || buyer.tcId || order.citizenshipId || "").trim();
          const taxOffice = (billing.taxHouse || billing.taxOffice || buyer.taxOffice || buyer.taxHouse || "").trim();
          const tcId = (billing.tcId || buyer.tcId || order.citizenshipId || "").trim();

          const billingParts = [
            billing.address || "",
            billing.neighborhood || "",
            billing.district || "",
            billing.city || "",
            billing.postalCode || ""
          ].map(s => String(s).trim()).filter(Boolean);
          const fullBillingAddressStr = billingParts.join(" / ") || "Fatura Adresi";

          const shippingParts = [
            shipping.address || billing.address || "",
            shipping.neighborhood || billing.neighborhood || "",
            shipping.district || billing.district || "",
            shipping.city || billing.city || "",
            shipping.postalCode || billing.postalCode || ""
          ].map(s => String(s).trim()).filter(Boolean);
          const fullShippingAddressStr = shippingParts.join(" / ") || fullBillingAddressStr;

          const shippingName = (shipping.fullName || shipping.recipient || fullCustomerName).trim();
          const customerPhone = (shipping.gsm || billing.gsm || shipping.phone || billing.phone || buyer.mobilePhone || buyer.phone || "").trim();

          const nameParts = fullCustomerName.split(' ');
          const surname = nameParts.length > 1 ? nameParts.pop()! : '';
          const firstName = nameParts.join(' ') || fullCustomerName;
          const isCorporate = taxNumber.length === 10 || !!companyTitle;

          const rawN11Date = order.createDate || order.orderDate || order.orderDetail?.createDate || order.createDateString;
          const n11OrderDate = parseMarketplaceOrderDate(rawN11Date);

          // Update or insert customer record
          const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, customerEmail]);
          let customerId = custRes.rows[0]?.id || null;

          if (customerId) {
            await client.query(
              `UPDATE customers SET 
                 full_name = COALESCE(NULLIF($1, ''), full_name),
                 company_title = COALESCE(NULLIF($1, ''), company_title),
                 name = COALESCE(NULLIF($2, ''), name),
                 surname = COALESCE(NULLIF($3, ''), surname),
                 address = COALESCE(NULLIF($4, ''), address),
                 city = COALESCE(NULLIF($5, ''), city),
                 tax_number = COALESCE(NULLIF($6, ''), tax_number),
                 tax_office = COALESCE(NULLIF($7, ''), tax_office),
                 tc_id = COALESCE(NULLIF($8, ''), tc_id),
                 phone = COALESCE(NULLIF($9, ''), phone),
                 is_corporate = $10
               WHERE id = $11`,
              [fullCustomerName, firstName, surname, fullBillingAddressStr, billing.city || shipping.city || "", taxNumber, taxOffice, tcId, customerPhone, isCorporate, customerId]
            );
          } else {
            const newCust = await client.query(
              `INSERT INTO customers (store_id, email, password, full_name, company_title, name, surname, phone, address, city, tax_number, tax_office, tc_id, is_corporate) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
               ON CONFLICT (store_id, email) DO UPDATE SET 
                 full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), customers.full_name),
                 company_title = COALESCE(NULLIF(EXCLUDED.company_title, ''), customers.company_title),
                 name = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
                 surname = COALESCE(NULLIF(EXCLUDED.surname, ''), customers.surname),
                 phone = COALESCE(NULLIF(EXCLUDED.phone, ''), customers.phone),
                 address = COALESCE(NULLIF(EXCLUDED.address, ''), customers.address),
                 city = COALESCE(NULLIF(EXCLUDED.city, ''), customers.city),
                 tax_number = COALESCE(NULLIF(EXCLUDED.tax_number, ''), customers.tax_number),
                 tax_office = COALESCE(NULLIF(EXCLUDED.tax_office, ''), customers.tax_office),
                 tc_id = COALESCE(NULLIF(EXCLUDED.tc_id, ''), customers.tc_id),
                 is_corporate = EXCLUDED.is_corporate
               RETURNING id`,
              [storeId, customerEmail, 'marketplace_user', fullCustomerName, fullCustomerName, firstName, surname, customerPhone, fullBillingAddressStr, billing.city || shipping.city || "", taxNumber, taxOffice, tcId, isCorporate]
            );
            customerId = newCust.rows[0]?.id;
          }

          // Robust extraction of order lines
          let rawItems: any[] = [];
          if (order.orderItemList?.orderItem) {
            rawItems = Array.isArray(order.orderItemList.orderItem) ? order.orderItemList.orderItem : [order.orderItemList.orderItem];
          } else if (order.itemList?.item) {
            rawItems = Array.isArray(order.itemList.item) ? order.itemList.item : [order.itemList.item];
          } else if (order.itemList?.orderItem) {
            rawItems = Array.isArray(order.itemList.orderItem) ? order.itemList.orderItem : [order.itemList.orderItem];
          } else if (order.orderDetail?.orderItemList?.orderItem) {
            const detailItems = order.orderDetail.orderItemList.orderItem;
            rawItems = Array.isArray(detailItems) ? detailItems : [detailItems];
          } else if (Array.isArray(order.items)) {
            rawItems = order.items;
          } else if (order.orderItemList && typeof order.orderItemList === 'object') {
            rawItems = Array.isArray(order.orderItemList) ? order.orderItemList : [order.orderItemList];
          }

          const shipmentInfo = (rawItems[0] && rawItems[0].shipmentInfo) || order.shipmentInfo || {};
          const shippingCarrier = shipmentInfo.shipmentCompany?.name || shipmentInfo.shipmentCompany?.shortName || "Aras Kargo";
          const shippingTrackingNumber = shipmentInfo.trackingNumber || "";
          const campaignNumber = shipmentInfo.campaignNumber || shipmentInfo.shipmenCompanyCampaignNumber || "";

          const mappedLines = rawItems.map((l: any) => {
            const qty = parseInt(l.quantity || l.itemCount || 1, 10) || 1;
            const sellerInvoiceAmount = parseFloat(l.sellerInvoiceAmount || 0);
            let unitPrice = 0;
            if (sellerInvoiceAmount > 0) {
              unitPrice = sellerInvoiceAmount / qty;
            } else {
              const rawPrice = parseFloat(l.price || l.dueAmount || l.unitPrice || 0) || 0;
              const sellerDiscount = parseFloat(l.sellerDiscount || 0) || 0;
              unitPrice = Math.max(0, (rawPrice - (sellerDiscount / qty)) || rawPrice);
            }
            const taxRate = parseFloat(l.vatRate || l.kdv || l.taxRate || 20) || 20;
            const prodName = (l.productName || l.productTitle || l.title || l.productSellerCode || l.sellerStockCode || `N11 Sipariş Kalemi (${orderId})`).trim();
            const code = (l.sellerStockCode || l.productSellerCode || l.productId || '').trim();

            return {
              name: prodName,
              quantity: qty,
              price: Math.round(unitPrice * 100) / 100,
              barcode: code,
              sku: code,
              taxRate: taxRate
            };
          });

          let grandTotal = parseFloat(order.totalAmount || order.dueAmount || order.sellerInvoiceAmount || 0);
          if (grandTotal <= 0 && mappedLines.length > 0) {
            grandTotal = mappedLines.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
          }
          grandTotal = Math.round(grandTotal * 100) / 100;

          let subtotal = 0;
          let taxAmount = 0;
          if (mappedLines.length > 0) {
            for (const item of mappedLines) {
              const lineTotal = item.price * item.quantity;
              const lineSubtotal = lineTotal / (1 + item.taxRate / 100);
              const lineTax = lineTotal - lineSubtotal;
              subtotal += lineSubtotal;
              taxAmount += lineTax;
            }
            subtotal = Math.round(subtotal * 100) / 100;
            taxAmount = Math.round(taxAmount * 100) / 100;
          } else {
            subtotal = Math.round((grandTotal / 1.20) * 100) / 100;
            taxAmount = Math.round((grandTotal - subtotal) * 100) / 100;
          }

          const invoiceNumber = `N11-${orderId}`;
          const orderNotes = [
            `N11 Sipariş No: ${order.orderNumber || orderId} (Paket No: ${orderId})`,
            `Fatura Ünvanı: ${fullCustomerName} ${taxNumber ? `(VKN/TCKN: ${taxNumber}${taxOffice ? ` - VD: ${taxOffice}` : ''})` : ''}`,
            `Fatura Adresi: ${fullBillingAddressStr}`,
            `Teslimat Alıcısı: ${shippingName} ${customerPhone ? `(Tel: ${customerPhone})` : ''}`,
            `Teslimat / Sevkiyat Adresi: ${fullShippingAddressStr}`,
            shippingTrackingNumber ? `Kargo / Sevkiyat: ${shippingCarrier} - Takip No: ${shippingTrackingNumber} ${campaignNumber ? `(Kampanya No: ${campaignNumber})` : ''}` : ''
          ].filter(Boolean).join('\n');

          const saleId = existingRow.sale_id;
          const salesInvoiceId = existingRow.sales_invoice_id;

          if (saleId) {
            await client.query(
              `UPDATE sales SET 
                 total_amount = $1, 
                 customer_name = $2, 
                 customer_id = COALESCE($3, customer_id), 
                 customer_phone = $4,
                 customer_address = $5,
                 shipping_carrier = $6,
                 tracking_number = $7,
                 notes = $8, 
                 created_at = $9 
               WHERE id = $10`,
              [grandTotal, fullCustomerName, customerId, customerPhone, fullShippingAddressStr, shippingCarrier, shippingTrackingNumber, orderNotes, n11OrderDate, saleId]
            );
          }

          if (salesInvoiceId) {
            await client.query(
              `UPDATE sales_invoices SET 
                 customer_id = COALESCE($1, customer_id), 
                 customer_name = $2,
                 company_title = $2,
                 tax_number = $3,
                 tax_office = $4,
                 address = $5,
                 customer_email = $6,
                 invoice_date = $7, 
                 total_amount = $8, 
                 tax_amount = $9, 
                 grand_total = $10, 
                 notes = $11, 
                 waybill_carrier_name = $12,
                 waybill_tracking_number = $13,
                 created_at = $7 
               WHERE id = $14`,
              [customerId, fullCustomerName, taxNumber, taxOffice, fullBillingAddressStr, customerEmail, n11OrderDate, subtotal, taxAmount, grandTotal, orderNotes, shippingCarrier, shippingTrackingNumber, salesInvoiceId]
            );

            // Re-create items with exact matched lines
            await client.query("DELETE FROM sales_invoice_items WHERE sales_invoice_id = $1", [salesInvoiceId]);
            if (saleId) {
              await client.query("DELETE FROM sale_items WHERE sale_id = $1", [saleId]);
            }
            if (mappedLines.length > 0 && saleId) {
              await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'N11', orderId, fullCustomerName, invoiceNumber);
            }
          }

          await client.query(
            "UPDATE n11_orders SET created_at = $1, order_data = $2 WHERE id = $3",
            [n11OrderDate, order, existingRow.id]
          );

          await client.query("COMMIT");
          syncedCount++;
        } catch (e) {
          await client.query("ROLLBACK");
          console.error("N11 Order Backfill Error:", e);
        } finally {
          client.release();
        }
      } else {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          const buyer = order.buyer || {};
          const billing = order.billingAddress || order.billing || {};
          const shipping = order.shippingAddress || order.shipping || {};

          const isCorporateOrder = (buyer.taxId && String(buyer.taxId).trim().length === 10) || (billing.taxId && String(billing.taxId).trim().length === 10) || order.invoiceType === "2" || order.invoiceType === 2 || /(a\.?ş|ltd|şti|tic|san|aş)/i.test(buyer.fullName || "") || /(a\.?ş|ltd|şti|tic|san|aş)/i.test(billing.companyTitle || "");

          const companyTitle = (
            billing.companyTitle || 
            buyer.companyTitle || 
            (isCorporateOrder ? (buyer.fullName || billing.fullName) : "")
          ).trim();

          const fullCustomerName = (
            companyTitle || 
            buyer.fullName || 
            billing.fullName || 
            shipping.fullName || 
            "N11 Müşterisi"
          ).trim();
          const customerEmail = buyer.email || `${orderId}@n11.com`;

          const taxNumber = (billing.taxId || buyer.taxId || billing.tcId || buyer.tcId || order.citizenshipId || "").trim();
          const taxOffice = (billing.taxHouse || billing.taxOffice || buyer.taxOffice || buyer.taxHouse || "").trim();
          const tcId = (billing.tcId || buyer.tcId || order.citizenshipId || "").trim();

          const billingParts = [
            billing.address || "",
            billing.neighborhood || "",
            billing.district || "",
            billing.city || "",
            billing.postalCode || ""
          ].map(s => String(s).trim()).filter(Boolean);
          const fullBillingAddressStr = billingParts.join(" / ") || "Fatura Adresi";

          const shippingParts = [
            shipping.address || billing.address || "",
            shipping.neighborhood || billing.neighborhood || "",
            shipping.district || billing.district || "",
            shipping.city || billing.city || "",
            shipping.postalCode || billing.postalCode || ""
          ].map(s => String(s).trim()).filter(Boolean);
          const fullShippingAddressStr = shippingParts.join(" / ") || fullBillingAddressStr;

          const shippingName = (shipping.fullName || shipping.recipient || fullCustomerName).trim();
          const customerPhone = (shipping.gsm || billing.gsm || shipping.phone || billing.phone || buyer.mobilePhone || buyer.phone || "").trim();

          const nameParts2 = fullCustomerName.split(' ');
          const surname2 = nameParts2.length > 1 ? nameParts2.pop()! : '';
          const firstName2 = nameParts2.join(' ') || fullCustomerName;
          const isCorporate = taxNumber.length === 10 || !!companyTitle;

          let customerId = null;
          const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, customerEmail]);
          if (custRes.rows.length > 0) {
            customerId = custRes.rows[0].id;
            await client.query(
              `UPDATE customers SET 
                 full_name = COALESCE(NULLIF($1, ''), full_name),
                 company_title = COALESCE(NULLIF($1, ''), company_title),
                 name = COALESCE(NULLIF($2, ''), name),
                 surname = COALESCE(NULLIF($3, ''), surname),
                 address = COALESCE(NULLIF($4, ''), address),
                 city = COALESCE(NULLIF($5, ''), city),
                 tax_number = COALESCE(NULLIF($6, ''), tax_number),
                 tax_office = COALESCE(NULLIF($7, ''), tax_office),
                 tc_id = COALESCE(NULLIF($8, ''), tc_id),
                 phone = COALESCE(NULLIF($9, ''), phone),
                 is_corporate = $10
               WHERE id = $11`,
              [fullCustomerName, firstName2, surname2, fullBillingAddressStr, billing.city || shipping.city || "", taxNumber, taxOffice, tcId, customerPhone, isCorporate, customerId]
            );
          } else {
            const newCust = await client.query(
              `INSERT INTO customers (store_id, email, password, full_name, company_title, name, surname, phone, address, city, tax_number, tax_office, tc_id, is_corporate) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
               ON CONFLICT (store_id, email) DO UPDATE SET 
                 full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), customers.full_name),
                 company_title = COALESCE(NULLIF(EXCLUDED.company_title, ''), customers.company_title),
                 name = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
                 surname = COALESCE(NULLIF(EXCLUDED.surname, ''), customers.surname),
                 phone = COALESCE(NULLIF(EXCLUDED.phone, ''), customers.phone),
                 address = COALESCE(NULLIF(EXCLUDED.address, ''), customers.address),
                 city = COALESCE(NULLIF(EXCLUDED.city, ''), customers.city),
                 tax_number = COALESCE(NULLIF(EXCLUDED.tax_number, ''), customers.tax_number),
                 tax_office = COALESCE(NULLIF(EXCLUDED.tax_office, ''), customers.tax_office),
                 tc_id = COALESCE(NULLIF(EXCLUDED.tc_id, ''), customers.tc_id),
                 is_corporate = EXCLUDED.is_corporate
               RETURNING id`,
              [storeId, customerEmail, 'marketplace_user', fullCustomerName, fullCustomerName, firstName2, surname2, customerPhone, fullBillingAddressStr, billing.city || shipping.city || "", taxNumber, taxOffice, tcId, isCorporate]
            );
            customerId = newCust.rows[0]?.id;
          }

          // Process order lines with robust fallback parsing across N11 XML schemas
          let rawItems: any[] = [];
          if (order.orderItemList?.orderItem) {
            rawItems = Array.isArray(order.orderItemList.orderItem) ? order.orderItemList.orderItem : [order.orderItemList.orderItem];
          } else if (order.itemList?.item) {
            rawItems = Array.isArray(order.itemList.item) ? order.itemList.item : [order.itemList.item];
          } else if (order.itemList?.orderItem) {
            rawItems = Array.isArray(order.itemList.orderItem) ? order.itemList.orderItem : [order.itemList.orderItem];
          } else if (order.orderDetail?.orderItemList?.orderItem) {
            const detailItems = order.orderDetail.orderItemList.orderItem;
            rawItems = Array.isArray(detailItems) ? detailItems : [detailItems];
          } else if (Array.isArray(order.items)) {
            rawItems = order.items;
          } else if (order.orderItemList && typeof order.orderItemList === 'object') {
            rawItems = Array.isArray(order.orderItemList) ? order.orderItemList : [order.orderItemList];
          }

          const shipmentInfo = (rawItems[0] && rawItems[0].shipmentInfo) || order.shipmentInfo || {};
          const shippingCarrier = shipmentInfo.shipmentCompany?.name || shipmentInfo.shipmentCompany?.shortName || "Aras Kargo";
          const shippingTrackingNumber = shipmentInfo.trackingNumber || "";
          const campaignNumber = shipmentInfo.campaignNumber || shipmentInfo.shipmenCompanyCampaignNumber || "";

          const mappedLines = rawItems.map((l: any) => {
            const qty = parseInt(l.quantity || l.itemCount || 1, 10) || 1;
            const sellerInvoiceAmount = parseFloat(l.sellerInvoiceAmount || 0);
            let unitPrice = 0;
            if (sellerInvoiceAmount > 0) {
              unitPrice = sellerInvoiceAmount / qty;
            } else {
              const rawPrice = parseFloat(l.price || l.dueAmount || l.unitPrice || 0) || 0;
              const sellerDiscount = parseFloat(l.sellerDiscount || 0) || 0;
              unitPrice = Math.max(0, (rawPrice - (sellerDiscount / qty)) || rawPrice);
            }
            const taxRate = parseFloat(l.vatRate || l.kdv || l.taxRate || 20) || 20;
            const prodName = (l.productName || l.productTitle || l.title || l.productSellerCode || l.sellerStockCode || `N11 Sipariş Kalemi (${orderId})`).trim();
            const code = (l.sellerStockCode || l.productSellerCode || l.productId || '').trim();

            return {
              name: prodName,
              quantity: qty,
              price: Math.round(unitPrice * 100) / 100,
              barcode: code,
              sku: code,
              taxRate: taxRate
            };
          });

          let grandTotal = parseFloat(order.totalAmount || order.dueAmount || order.sellerInvoiceAmount || 0);
          if (grandTotal <= 0 && mappedLines.length > 0) {
            grandTotal = mappedLines.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
          }
          grandTotal = Math.round(grandTotal * 100) / 100;

          let subtotal = 0;
          let taxAmount = 0;
          if (mappedLines.length > 0) {
            for (const item of mappedLines) {
              const lineTotal = item.price * item.quantity;
              const lineSubtotal = lineTotal / (1 + item.taxRate / 100);
              const lineTax = lineTotal - lineSubtotal;
              subtotal += lineSubtotal;
              taxAmount += lineTax;
            }
            subtotal = Math.round(subtotal * 100) / 100;
            taxAmount = Math.round(taxAmount * 100) / 100;
          } else {
            subtotal = Math.round((grandTotal / 1.20) * 100) / 100;
            taxAmount = Math.round((grandTotal - subtotal) * 100) / 100;
          }

          // Parse actual N11 order creation date
          const rawN11Date = order.createDate || order.orderDate || order.orderDetail?.createDate || order.createDateString;
          const n11OrderDate = parseMarketplaceOrderDate(rawN11Date);

          const invoiceNumber = `N11-${orderId}`;
          const orderNotes = [
            `N11 Sipariş No: ${order.orderNumber || orderId} (Paket No: ${orderId})`,
            `Fatura Ünvanı: ${fullCustomerName} ${taxNumber ? `(VKN/TCKN: ${taxNumber}${taxOffice ? ` - VD: ${taxOffice}` : ''})` : ''}`,
            `Fatura Adresi: ${fullBillingAddressStr}`,
            `Teslimat Alıcısı: ${shippingName} ${customerPhone ? `(Tel: ${customerPhone})` : ''}`,
            `Teslimat / Sevkiyat Adresi: ${fullShippingAddressStr}`,
            shippingTrackingNumber ? `Kargo / Sevkiyat: ${shippingCarrier} - Takip No: ${shippingTrackingNumber} ${campaignNumber ? `(Kampanya No: ${campaignNumber})` : ''}` : ''
          ].filter(Boolean).join('\n');

          const saleRes = await client.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, customer_phone, customer_address, shipping_carrier, tracking_number, payment_method, notes, created_at, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id",
            [storeId, grandTotal, 'TRY', 'completed', fullCustomerName, customerId, customerPhone, fullShippingAddressStr, shippingCarrier, shippingTrackingNumber, 'N11 Satış', orderNotes, n11OrderDate, 'n11']
          );
          const saleId = saleRes.rows[0].id;

          const invoiceRes = await client.query(
            "INSERT INTO sales_invoices (store_id, sale_id, customer_id, customer_name, company_title, tax_number, tax_office, address, customer_email, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status, waybill_carrier_name, waybill_tracking_number, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING id",
            [storeId, saleId, customerId, fullCustomerName, fullCustomerName, taxNumber, taxOffice, fullBillingAddressStr, customerEmail, invoiceNumber, n11OrderDate, subtotal, taxAmount, grandTotal, 'TRY', 'N11 Satış', orderNotes, 'marketplace', 'completed', shippingCarrier, shippingTrackingNumber, n11OrderDate]
          );
          const salesInvoiceId = invoiceRes.rows[0].id;

          if (mappedLines.length > 0) {
            await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'N11', orderId, fullCustomerName, invoiceNumber);
          }

          const orderStatus = order.status || order.statusName || 'New';
          await client.query(
            "INSERT INTO n11_orders (store_id, n11_order_id, sale_id, sales_invoice_id, status, order_data, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [storeId, orderId, saleId, salesInvoiceId, orderStatus, order, n11OrderDate]
          );

          await client.query("COMMIT");
          syncedCount++;
        } catch (e) {
          await client.query("ROLLBACK");
          console.error("N11 Order Sync Error:", e);
        } finally {
          client.release();
        }
      }
    }
    
    const newSettings = { ...settings, last_sync: new Date().toISOString() };
    await pool.query("UPDATE stores SET n11_settings = $1 WHERE id = $2", [newSettings, storeId]);
    res.json({ success: true, count: syncedCount });
  } catch (error: any) {
    await IntegrationService.logIntegrationError(storeId, 'N11', 'Sync All Orders', error);
    res.status(400).json({ error: error?.message || "N11 siparişleri senkronize edilemedi." });
  }
});

router.post("/n11/test", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
  try {
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
    res.status(500).json({ success: false, error: error.message || "N11 API Bağlantı testi başarısız." }); 
  }
});

router.post("/n11/settings", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
  try {
    const { appKey, appSecret, categoryMappings, categoryAttributes, categoryMarkups, defaultCommissionRate, defaultFixedFee, connected } = req.body;
    const storeRes = await pool.query("SELECT n11_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Store not found" });

    const prevSettings = storeRes.rows[0].n11_settings || {};
    const isConn = connected !== undefined ? connected : (!!((appKey || prevSettings.appKey)?.trim()) && !!((appSecret || prevSettings.appSecret)?.trim()));
    const updatedSettings = {
      ...prevSettings,
      appKey: appKey !== undefined ? String(appKey).trim() : prevSettings.appKey,
      appSecret: appSecret !== undefined ? String(appSecret).trim() : prevSettings.appSecret,
      categoryMappings: categoryMappings !== undefined ? categoryMappings : (prevSettings.categoryMappings || {}),
      categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : (prevSettings.categoryAttributes || {}),
      categoryMarkups: categoryMarkups !== undefined ? categoryMarkups : (prevSettings.categoryMarkups || {}),
      defaultCommissionRate: defaultCommissionRate !== undefined ? Number(defaultCommissionRate) : (prevSettings.defaultCommissionRate ?? 18),
      defaultFixedFee: defaultFixedFee !== undefined ? Number(defaultFixedFee) : (prevSettings.defaultFixedFee ?? 20),
      connected: isConn
    };

    const branding = storeRes.rows[0].branding || {};
    branding.n11_settings = updatedSettings;

    await pool.query("UPDATE stores SET n11_settings = $1, branding = $2 WHERE id = $3", [
      JSON.stringify(updatedSettings),
      JSON.stringify(branding),
      storeId
    ]);

    res.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId, categoryId, attributes } = req.body;

  try {
    const storeRes = await pool.query("SELECT n11_settings, branding, default_currency FROM stores WHERE id = $1", [storeId]);
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

    const rawPrice = Number(product.price || product.sale_price || 0);
    const stock = Number(product.stock_quantity || 0);

    if (rawPrice <= 0 || stock <= 0) {
      const reasons = [];
      if (rawPrice <= 0) reasons.push("fiyatı 0₺");
      if (stock <= 0) reasons.push("stoğu yetersiz (0/negatif)");
      return res.status(400).json({ error: `"${product.name}" ürününün ${reasons.join(" ve ")} olduğu için N11'de satışa açılamaz. Lütfen fiyat ve stoğu güncelleyin.` });
    }

    let mpData: any = product.marketplace_data;
    if (typeof mpData === "string") {
      try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
    }
    mpData = mpData || {};

    // Resolve price in TL (with currency conversion + N11 commission/fixedFee markup or custom N11 price)
    const { N11Service } = await import("../src/services/backend/n11Service");
    const customN11Price = Number(mpData?.n11?.attributes?.price || mpData?.n11?.price || 0);
    let finalN11Price = customN11Price;

    if (finalN11Price <= 0) {
      let webPriceTry = rawPrice;
      const prodCurrency = String(product.currency || storeRow.default_currency || "TRY").toUpperCase();
      if (prodCurrency !== "TRY" && prodCurrency !== "TL") {
        const rates = branding?.currency_rates || {};
        const rate = Number(rates[prodCurrency] || (prodCurrency === "USD" ? 38.5 : prodCurrency === "EUR" ? 41.5 : 1));
        if (rate > 1) {
          webPriceTry = rawPrice * rate;
        }
      }
      finalN11Price = N11Service.calculateMarketplacePrice(
        webPriceTry,
        product.category,
        product.sub_category,
        settings
      );
    }

    const sellerCode = String(product.sku || product.barcode || `PRD-${product.id}`).trim();
    const baseOrigin = process.env.APP_URL || "https://lookprice.net";
    const rawImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : (product.image_url ? [product.image_url] : []);

    const productImages = rawImages
      .filter((img: any) => typeof img === "string" && img.trim().length > 0)
      .map((img: string) => {
        const clean = img.trim();
        if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
        if (clean.startsWith("/")) return `${baseOrigin}${clean}`;
        return `${baseOrigin}/${clean}`;
      });

    if (productImages.length === 0) {
      productImages.push("https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&q=80");
    }

    const shipmentTemplate = settings.shipmentTemplate || "alici";

    if (!settings.appKey || !settings.appSecret) {
      return res.status(400).json({ error: "N11 API anahtarları (App Key / App Secret) tanımlı değil." });
    }

    // Resolve N11 Category ID from request, product marketplace_data, or store categoryMappings
    const catMappings = settings.categoryMappings || {};
    const catKey = product.category ? String(product.category).trim() : "";
    const subKey = product.sub_category ? String(product.sub_category).trim() : "";
    const compKey = catKey && subKey ? `${catKey} > ${subKey}` : "";
    const mappedCatId =
      categoryId ||
      mpData?.n11?.categoryId ||
      (compKey && catMappings[compKey]) ||
      (subKey && catMappings[subKey]) ||
      (catKey && catMappings[catKey]) ||
      1000280;

    let n11Id = "";
    let apiMessage = "";
    let groupId: any = undefined;
    let sellerNickname: any = undefined;

    try {
      const saveRes = await N11Service.saveProduct(settings, {
        productSellerCode: sellerCode,
        productMainId: mpData?.n11?.attributes?.VaryantGroupID || `GRP-${sellerCode}`,
        barcode: product.barcode || sellerCode,
        title: product.name,
        subtitle: (product.name || "").substring(0, 45),
        description: product.description || product.name,
        category: { id: Number(mappedCatId || 1000280) },
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
      sellerNickname = saveRes.sellerNickname;
      apiMessage = saveRes.message || "Ürün N11 kataloğuna başarıyla eklendi.";
    } catch (apiErr: any) {
      const errMsg = apiErr.message || "N11 API bağlantı hatası";
      await pool.query("UPDATE products SET n11_last_error = $1 WHERE id = $2 AND store_id = $3", [errMsg, productId, storeId]);
      return res.status(400).json({ error: errMsg });
    }

    mpData.n11 = {
      ...(mpData.n11 || {}),
      status: 'ACTIVE',
      n11Id,
      productId: n11Id,
      ...(groupId ? { n11CatalogGroupId: String(groupId) } : {}),
      ...(sellerNickname ? { sellerNickname } : {}),
      price: finalN11Price,
      lastSync: new Date().toISOString(),
      lastError: null
    };

    await pool.query(
      "UPDATE products SET n11_id = $1, is_n11_active = true, n11_last_error = NULL, marketplace_data = $2 WHERE id = $3 AND store_id = $4",
      [n11Id, JSON.stringify(mpData), productId, storeId]
    );

    res.json({ success: true, n11Id, message: `"${product.name}" N11 ilanına aktarıldı. (${apiMessage})` });
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
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
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
    categoryAttributes,
    categoryMarkups,
    defaultCommissionRate,
    defaultFixedFee
  } = req.body;

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    const prev = storeRes.rows[0]?.hepsiburada_settings || {};
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch (e) { br = {}; } }

    const finalApiKey = (apiKey !== undefined ? apiKey?.trim() : prev.apiKey) || "lookprice_dev";
    const finalApiSecret = apiSecret !== undefined ? apiSecret?.trim() : (prev.apiSecret || "");
    const finalMerchantId = merchantId !== undefined ? merchantId?.trim() : (prev.merchantId || "");

    const settings = {
      ...prev,
      connected: !!(finalApiKey && finalApiSecret && finalMerchantId),
      apiKey: finalApiKey,
      apiSecret: finalApiSecret,
      merchantId: finalMerchantId,
      isTestMode: isTestMode !== undefined ? !!isTestMode : !!prev.isTestMode,
      userAgent: userAgent || prev.userAgent || `${finalMerchantId || 'lookprice'} - LookPrice Marketplace Manager`,
      defaultDispatchTime: Number(defaultDispatchTime) || prev.defaultDispatchTime || 1,
      defaultCargoCompany: defaultCargoCompany || prev.defaultCargoCompany || "Hepsijet",
      defaultCommissionRate: defaultCommissionRate !== undefined ? Number(defaultCommissionRate) : (prev.defaultCommissionRate ?? 18),
      defaultFixedFee: defaultFixedFee !== undefined ? Number(defaultFixedFee) : (prev.defaultFixedFee ?? 20),
      autoSyncOrders: autoSyncOrders !== undefined ? autoSyncOrders : (prev.autoSyncOrders ?? true),
      autoStockSync: autoStockSync !== undefined ? autoStockSync : (prev.autoStockSync ?? true),
      webhookSecret: webhookSecret || prev.webhookSecret || `hb_wh_${Math.random().toString(36).substring(2, 12)}`,
      categoryMappings: categoryMappings !== undefined ? categoryMappings : (prev.categoryMappings || {}),
      categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : (prev.categoryAttributes || {}),
      categoryMarkups: categoryMarkups !== undefined ? categoryMarkups : (prev.categoryMarkups || {})
    };

    br.hepsiburada_settings = settings;
    await pool.query("UPDATE stores SET hepsiburada_settings = $1, branding = $2 WHERE id = $3", [settings, br, storeId]);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Hepsiburada Settings
router.get("/hepsiburada/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = result.rows[0];
    let hb = row?.hepsiburada_settings || {};
    if (typeof hb === 'string') { try { hb = JSON.parse(hb); } catch(e) { hb = {}; } }
    let br = row?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch(e) { br = {}; } }
    const hbBr = br.hepsiburada_settings || {};
    res.json({ ...hbBr, ...hb });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Test Hepsiburada Connection
router.post("/hepsiburada/test", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [storeId]);
    let settings = storeRes.rows[0]?.hepsiburada_settings || {};

    // Allow testing with unsaved/fresh parameters passed in request body
    if (req.body && (req.body.merchantId || req.body.apiSecret)) {
      settings = {
        ...settings,
        apiKey: req.body.apiKey || settings.apiKey || "lookprice_dev",
        apiSecret: req.body.apiSecret || settings.apiSecret,
        merchantId: req.body.merchantId || settings.merchantId,
      };
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
      error: testResult.success ? undefined : (testResult.error || testResult.details?.error || testResult.message)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Hepsiburada test sunucu hatası" });
  }
});

// 4. Sync Hepsiburada Orders
router.post("/hepsiburada/sync", authenticate, async (req: any, res) => {
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
    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.hepsiburada_settings;
    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik" });
    }

    const hbService = new HepsiburadaService(settings, storeId);
    const result = await hbService.syncAllActiveProducts();
    res.json({ success: true, ...result });
  } catch (error: any) {
    await IntegrationService.logIntegrationError(storeId, 'Hepsiburada', 'Bulk Inventory Sync', error);
    res.status(400).json({ error: error.message || "Hepsiburada ürün envanteri güncellenemedi." });
  }
});

// 5.1 Check Single Product Live Status on Hepsiburada
router.post("/hepsiburada/check-product-status", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.user?.store_id;
  const storeId = req.user.role === "superadmin" 
    ? Number(rawStoreId || req.user.store_id || 1) 
    : Number(req.user.store_id || rawStoreId);

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
    let settings = row?.hepsiburada_settings || row?.branding?.hepsiburada_settings || {};
    if (typeof settings === 'string') { try { settings = JSON.parse(settings); } catch(e) { settings = {}; } }

    const merchantId = String(settings?.merchantId || "").trim();
    const apiKey = String(settings?.apiKey || "lookprice_dev").trim();
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
    const listings = await hbService.fetchMerchantListings({ limit: 200 });
    const matched = listings.find((l: any) => {
      const lHbSku = (l.hepsiburadaSku || "").trim().toLowerCase();
      const lMSku = (l.merchantSku || "").trim().toLowerCase();
      const lBarcode = (l.barcode || "").trim().toLowerCase();
      const lName = (l.productName || "").trim().toLowerCase();

      if (currentHbSku && lHbSku && currentHbSku === lHbSku) return true;
      if (barcode && lBarcode && barcode === lBarcode) return true;
      if (barcode && lMSku && barcode === lMSku) return true;
      if (sku && lMSku && sku === lMSku) return true;
      if (barcode && lMSku.startsWith(barcode)) return true;
      if (name && lName && name === lName) return true;
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

      mpData.hepsiburada = {
        ...hbData,
        hepsiburadaSku: hbSku,
        productId: pid,
        merchantSku: matched.merchantSku || barcode,
        status: matched.status || 'ACTIVE',
        isSalable,
        productUrl: pid 
          ? `https://www.hepsiburada.com/${slugifyText(name || 'urun')}-pm-${String(pid).trim().toLowerCase()}` 
          : (hbSku && isHepsiburadaMasterCatalogId(hbSku) 
            ? `https://www.hepsiburada.com/${slugifyText(name || 'urun')}-pm-${String(hbSku).trim().toLowerCase()}` 
            : (barcode 
              ? `https://www.hepsiburada.com/ara?q=${encodeURIComponent(barcode)}` 
              : (name ? `https://www.hepsiburada.com/ara?q=${encodeURIComponent(name)}` : null))),
        lastChecked: new Date().toISOString()
      };

      await pool.query(
        `UPDATE products 
         SET is_hepsiburada_active = $1,
             hepsiburada_sku = COALESCE(NULLIF($2, ''), hepsiburada_sku),
             hepsiburada_last_sync = NOW(),
             hepsiburada_last_error = NULL,
             marketplace_data = $3
         WHERE id = $4`,
        [isSalable, hbSku, JSON.stringify(mpData), productId]
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
    } else {
      // Not matched yet in live listings: check if there is a catalog tracking ID to diagnose status
      let trackingDetail: any = null;
      const trackingId = hbData.catalogTrackingId || hbData.listingTrackingId || hbData.trackingId;
      if (trackingId) {
        try {
          trackingDetail = await hbService.checkCatalogStatus(trackingId);
        } catch (tErr: any) {
          console.warn("[HB-Status] Tracking check failed:", tErr.message);
        }
      }

      let statusMsg = "Hepsiburada katalog ve barkod incelemesi sürüyor. Henüz onaylanıp mağaza envanterinize eklenmemiş.";
      let isFailed = false;
      let failureReason = "";

      if (trackingDetail) {
        const itemInfo = Array.isArray(trackingDetail) ? trackingDetail[0] : trackingDetail;
        const importStatus = itemInfo?.importStatus || itemInfo?.status || itemInfo?.state || "";
        const importMessages = itemInfo?.importMessages || itemInfo?.errors || itemInfo?.failureReasons || [];

        if (importStatus === "FAILED" || (Array.isArray(importMessages) && importMessages.some((m: any) => m.severity === "ERROR" || m.message))) {
          isFailed = true;
          const errList = Array.isArray(importMessages) 
            ? importMessages.map((e: any) => typeof e === "string" ? e : (e.message || e.description || JSON.stringify(e))).join("; ")
            : String(importMessages);
          failureReason = errList ? `Hepsiburada Katalog Reddi: ${errList}` : "Hepsiburada katalog aktarımı başarısız oldu.";
          statusMsg = failureReason;
        } else if (importStatus === "COMPLETED" && itemInfo?.hbSku) {
          statusMsg = `Hepsiburada katalog incelemesi tamamlandı! (HB SKU: ${itemInfo.hbSku})`;
        } else if (importStatus) {
          statusMsg = `Hepsiburada katalog inceleme aşaması: ${importStatus} (Takip No: ${trackingId})`;
        }
      }

      mpData.hepsiburada = {
        ...hbData,
        status: isFailed ? 'FAILED' : 'PENDING_APPROVAL',
        trackingId: trackingId || null,
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
        status: isFailed ? 'FAILED' : 'PENDING_APPROVAL',
        trackingId: trackingId || null,
        trackingDetail,
        message: statusMsg
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Durum sorgulanamadı." });
  }
});

// 5.2 Bulk Check & Auto-Resolve Pending Approval Products on Hepsiburada
router.post("/hepsiburada/check-bulk-pending-status", authenticate, async (req: any, res) => {
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
    let settings = row?.hepsiburada_settings || row?.branding?.hepsiburada_settings || {};
    if (typeof settings === 'string') { try { settings = JSON.parse(settings); } catch(e) { settings = {}; } }

    const merchantId = String(settings?.merchantId || "").trim();
    const apiKey = String(settings?.apiKey || "lookprice_dev").trim();
    const apiSecret = String(settings?.apiSecret || "").trim();

    if (!merchantId || !apiSecret) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik." });
    }

    const cleanSettings = { ...settings, merchantId, apiKey, apiSecret, isTestMode: Boolean(settings?.isTestMode) };
    const hbService = new HepsiburadaService(cleanSettings, storeId);

    // Reconcile and auto-match store products with live Hepsiburada merchant listings
    const matchResult = await hbService.matchListingsWithStoreProducts({ importMissing: false });

    // Query current pending products count
    const pendingRes = await pool.query(
      `SELECT COUNT(*) as count 
       FROM products 
       WHERE store_id = $1 
         AND is_hepsiburada_active = false 
         AND (
           marketplace_data->'hepsiburada'->>'status' = 'PENDING_APPROVAL' 
           OR (marketplace_data->'hepsiburada' IS NOT NULL AND (hepsiburada_sku IS NULL OR hepsiburada_sku = ''))
         )`,
      [storeId]
    );
    const remainingPending = parseInt(pendingRes.rows[0]?.count || 0, 10);

    return res.json({
      success: true,
      totalListings: matchResult.totalListings,
      matchedCount: matchResult.matchedCount,
      updatedCount: matchResult.updatedCount,
      remainingPending,
      message: matchResult.matchedCount > 0 
        ? `${matchResult.matchedCount} onay bekleyen ürün Hepsiburada'da onaylanmış bulundu ve anında 'Satışta' durumuna geçirildi! (${remainingPending} ürün incelemede)`
        : `Hepsiburada canlı ilan listesi tarandı. ${remainingPending > 0 ? `${remainingPending} ürün halen Hepsiburada içerik ve katalog onay kuyruğunda bekliyor.` : "Onay bekleyen ürün bulunmuyor."}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Toplu onay sorgulaması gerçekleştirilemedi." });
  }
});

// 6. Publish / Update Single Product to Hepsiburada
router.post("/hepsiburada/publish", authenticate, async (req: any, res) => {
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

    if (Number(p.price || 0) <= 0 || Number(p.stock_quantity || 0) <= 0) {
      const reasons = [];
      if (Number(p.price || 0) <= 0) reasons.push("fiyatı 0₺");
      if (Number(p.stock_quantity || 0) <= 0) reasons.push("stoğu yetersiz (0/negatif)");
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

    // Determine category ID with live Hepsiburada catalog mappings
    // 1. User manual category override on product takes absolute precedence
    let categoryId = hbData.categoryId || mpData.categoryId;
    
    // 2. If not manually set, check store category mappings
    if (!categoryId) {
      const catKey = p.category ? String(p.category).trim() : "";
      const subCatKey = p.sub_category ? String(p.sub_category).trim() : "";
      const hierarchicalKey = catKey && subCatKey ? `${catKey} > ${subCatKey}` : "";
      
      categoryId = 
        (hierarchicalKey && (settings.categoryMappings?.[hierarchicalKey]?.hepsiburada || settings.categoryMappings?.[hierarchicalKey])) ||
        (subCatKey && (settings.categoryMappings?.[subCatKey]?.hepsiburada || settings.categoryMappings?.[subCatKey])) ||
        (catKey && (settings.categoryMappings?.[catKey]?.hepsiburada || settings.categoryMappings?.[catKey])) ||
        "";
    }
    
    // 3. Normalize deprecated/virtual category IDs or infer fallback ONLY if categoryId is completely absent
    const catSearchStr = `${p.name} ${p.category || ""} ${p.sub_category || ""}`.toLowerCase();
    const catIdStr = String(categoryId || "");
    if (catIdStr === "1000101") {
      categoryId = 970; // Usb Bellek
    } else if (catIdStr === "1000102") {
      categoryId = 698; // Kart Okuyucular
    } else if (catIdStr === "1000103") {
      categoryId = 1100011; // Sd Kartlar
    } else if (catIdStr === "1000124") {
      categoryId = 106861; // Notebook Standları
    } else if (catIdStr === "1000108") {
      categoryId = 47; // Bellek (Ram)
    } else if (catIdStr === "1000118") {
      if (catSearchStr.includes("set")) categoryId = 3007055; // Klavye & Mouse Setler
      else if (catSearchStr.includes("mouse pad") || catSearchStr.includes("mousepad")) categoryId = 29; // Mouse Pad
      else if (catSearchStr.includes("mouse") || catSearchStr.includes("fare")) categoryId = 52; // Mouse
      else categoryId = 51; // Klavye
    } else if (catIdStr === "1000126") {
      categoryId = catSearchStr.includes("router") ? 60001272 : 103939; // Wireless Adaptör / Router
    } else if (catIdStr === "1000139") {
      categoryId = 52; // Mouse / Sunum Kumandası
    } else if (catIdStr === "1000115") {
      categoryId = 111001; // Mini Masaüstü
    } else if (catIdStr === "1000123" || catIdStr === "1000136") {
      categoryId = 676; // Notebook Çantaları
    } else if (catIdStr === "371966") {
      categoryId = 16113; // Şarj Cihazları (Leaf)
    } else if (catIdStr === "371969") {
      categoryId = 29010123; // Şarj Kabloları (Leaf)
    } else if (!categoryId) {
      if (catSearchStr.includes("usb flash") || catSearchStr.includes("flash bellek") || (catSearchStr.includes("usb") && catSearchStr.includes("bellek"))) {
        categoryId = 970; // Active HB Leaf: Usb Bellek
      } else if (catSearchStr.includes("kart okuyucu")) {
        categoryId = 698; // Active HB Leaf: Kart Okuyucular
      } else if (catSearchStr.includes("sd kart")) {
        categoryId = 1100011; // Active HB Leaf: Sd Kartlar
      } else if (catSearchStr.includes("notebook stand") || catSearchStr.includes("laptop stand")) {
        categoryId = 106861; // Active HB Leaf: Notebook Standları
      } else if (catSearchStr.includes("klavye") && catSearchStr.includes("mouse")) {
        categoryId = 3007055; // Active HB Leaf: Klavye & Mouse Setler
      } else if (catSearchStr.includes("mouse") || catSearchStr.includes("fare") || catSearchStr.includes("sunum kumanda")) {
        categoryId = 52; // Active HB Leaf: Mouse
      } else if (catSearchStr.includes("klavye")) {
        categoryId = 51; // Active HB Leaf: Klavye
      } else if (catSearchStr.includes("ram") || catSearchStr.includes("ddr4") || catSearchStr.includes("ddr5")) {
        categoryId = 47; // Active HB Leaf: Bellek (Ram)
      }
    }

    const hbService = new HepsiburadaService(settings, storeId);
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

    // Prepare catalog attributes
    const userAttrs = hbData.attributes || mpData.attributes || {};
    const attributes: Record<string, any> = {
      merchantSku: p.barcode.trim(),
      VaryantGroupID: `GRP-${p.barcode.trim()}`,
      Barcode: p.barcode.trim(),
      UrunAdi: p.name,
      UrunAciklamasi: `<p>${p.description || p.name}</p>`,
      Marka: p.brand || userAttrs.Marka || "Kingston",
      GarantiSuresi: userAttrs.GarantiSuresi ? parseInt(userAttrs.GarantiSuresi, 10) : 24,
      tax_vat_rate: String(p.tax_rate || userAttrs.tax_vat_rate || 20),
      price: effectivePrice.toFixed(2),
      stock: String(p.stock_quantity || 0),
      kg: String(p.desi || 1),
      ...userAttrs
    };

    if (p.image_url) {
      attributes.Image1 = p.image_url;
    }

    // Category 970 (Usb Bellek) specific defaults
    if (Number(categoryId) === 970) {
      if (!attributes.kapasite_) {
        const capMatch = p.name.match(/(\d+)\s*(gb|tb|mb)/i);
        attributes.kapasite_ = capMatch ? `${capMatch[1]} ${capMatch[2].toUpperCase()}` : "64 GB";
      }
      if (!attributes.usb_3_0) {
        attributes.usb_3_0 = /3\.2/i.test(p.name) ? "Var (USB 3.2)" : (/3\.1/i.test(p.name) ? "Var (USB 3.1)" : "Var");
      }
      if (!attributes["00000PGR"]) {
        attributes["00000PGR"] = ["Type A", "USB 3.0"];
      }
      if (!attributes.okuma_hizi_) attributes.okuma_hizi_ = "100 MB/s";
      if (!attributes.yazma_hizi) attributes.yazma_hizi = "10 MB/s";
      if (!attributes.sifre_koruma) attributes.sifre_koruma = "Yok";
      if (!attributes["000017ZC"]) attributes["000017ZC"] = ["Windows"];
    }

    // 1. Send to Hepsiburada Catalog Import (Multipart Form-Data) if categoryId exists
    let catalogTrackingId: string | undefined;
    let catalogMsg: string | undefined;
    if (categoryId) {
      try {
        const catRes = await hbService.importCatalogProducts([
          {
            categoryId: Number(categoryId),
            attributes
          }
        ]);
        catalogTrackingId = catRes.trackingId;
        catalogMsg = catRes.message;
      } catch (catErr: any) {
        console.warn("[HB Publish] Catalog import warning:", catErr.message);
      }
    }

    // 2. Send to Listing Price & Stock Inventory Update
    const result = await hbService.updatePriceAndStock([
      {
        HepsiburadaSku: p.hepsiburada_sku || hbData.hepsiburadaSku || "",
        MerchantSku: p.barcode.trim(),
        Price: effectivePrice,
        AvailableStock: parseInt(p.stock_quantity || "0", 10),
        DispatchTime: settings.defaultDispatchTime || 1,
      }
    ]);

    // Check if user passed a Hepsiburada SKU or direct URL in request body
    let inputHbUrl = req.body.hepsiburadaUrl || req.body.hepsiburada_url;
    let inputHbSku = req.body.hepsiburadaSku || req.body.hepsiburada_sku;

    if (inputHbUrl && String(inputHbUrl).startsWith('http')) {
      const match = String(inputHbUrl).match(/(?:pm-|p-|\/|\bq=)(HBC[V0-9A-Z]+|HBV[0-9A-Z]+)/i);
      if (match && !inputHbSku) {
        inputHbSku = match[1].toUpperCase();
      }
    }

    let resolvedHbSku = inputHbSku || p.hepsiburada_sku || hbData.hepsiburadaSku || hbData.hbSku || "";
    if (!resolvedHbSku) {
      try {
        const listings = await hbService.fetchMerchantListings({ limit: 100 });
        const matched = listings.find((l: any) => 
          (l.merchantSku && l.merchantSku.toLowerCase() === p.barcode.trim().toLowerCase()) ||
          (l.barcode && l.barcode.toLowerCase() === p.barcode.trim().toLowerCase())
        );
        if (matched && matched.hepsiburadaSku) {
          resolvedHbSku = matched.hepsiburadaSku;
        }
      } catch (lErr) {
        // non-blocking
      }
    }

    const isLive = Boolean(resolvedHbSku);

    const isMasterHbSku = Boolean(resolvedHbSku && resolvedHbSku.toUpperCase().startsWith('HBC') && !resolvedHbSku.toUpperCase().startsWith('HBCV') && !resolvedHbSku.toUpperCase().startsWith('HBV'));

    // Update product marketplace metadata
    mpData.hepsiburada = {
      ...hbData,
      categoryId: categoryId ? Number(categoryId) : undefined,
      attributes,
      hepsiburadaSku: resolvedHbSku || hbData.hepsiburadaSku || null,
      productId: hbData.productId || (isMasterHbSku ? resolvedHbSku : null),
      status: isLive ? 'ACTIVE' : 'PENDING_APPROVAL',
      productUrl: isLive ? (inputHbUrl && !inputHbUrl.includes('HBCV') ? inputHbUrl : (isMasterHbSku ? `https://www.hepsiburada.com/${slugifyText(p.name || 'urun')}-pm-${String(resolvedHbSku).trim().toLowerCase()}` : (p.barcode ? `https://www.hepsiburada.com/ara?q=${encodeURIComponent(p.barcode)}` : `https://www.hepsiburada.com/ara?q=${encodeURIComponent(p.name)}`))) : undefined,
      catalogTrackingId: catalogTrackingId || hbData.catalogTrackingId,
      listingTrackingId: result.trackingId || hbData.listingTrackingId,
      lastSync: new Date().toISOString()
    };

    await pool.query(
      `UPDATE products 
       SET is_hepsiburada_active = $1,
           hepsiburada_sku = COALESCE(NULLIF($2, ''), hepsiburada_sku),
           hepsiburada_last_sync = NOW(), 
           hepsiburada_last_error = NULL, 
           marketplace_data = $3 
       WHERE id = $4`,
      [isLive, resolvedHbSku || null, JSON.stringify(mpData), productId]
    );

    const message = isLive
      ? `"${p.name}" Hepsiburada kataloğunda eşleşti ve canlı satışa açıldı! (HB SKU: ${resolvedHbSku})`
      : catalogTrackingId
        ? `"${p.name}" Hepsiburada'ya iletildi. Katalog ve barkod incelemesi başlatıldı (Takip No: ${catalogTrackingId}). HB onaylayıp ürün kodunu oluşturduğunda satış linki otomatik olarak aktifleşecektir.`
        : `"${p.name}" Hepsiburada envanter kuyruğuna iletildi. İnceleme sürüyor (Takip No: ${result.trackingId}).`;

    res.json({
      success: true,
      isLive,
      status: isLive ? 'ACTIVE' : 'PENDING_APPROVAL',
      message,
      effectivePrice,
      trackingId: catalogTrackingId || result.trackingId,
      catalogTrackingId,
      listingTrackingId: result.trackingId,
      hepsiburadaSku: resolvedHbSku || null,
      marketplace_data: mpData
    });
  } catch (e: any) {
    const errMsg = e.message || "Hepsiburada ürün aktarımı başarısız.";
    if (productId) {
      await pool.query("UPDATE products SET hepsiburada_last_error = $1 WHERE id = $2", [errMsg, productId]);
    }
    res.status(400).json({ error: errMsg });
  }
});

// 6b. Bulk Publish / Update Selected Products to Hepsiburada
router.post("/hepsiburada/bulk-publish", authenticate, async (req: any, res) => {
  const rawStoreId = req.body?.storeId || req.query?.storeId || req.user?.store_id;
  const storeId = req.user.role === "superadmin" ? Number(rawStoreId || req.user.store_id || 1) : Number(req.user.store_id || rawStoreId);
  const productIds = req.body.productIds;

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

    const validItems: any[] = [];
    const skippedItems: any[] = [];

    for (const p of products) {
      if (!p.barcode || !p.barcode.trim()) {
        skippedItems.push({ id: p.id, name: p.name, reason: "Barkod eksik" });
        continue;
      }
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
      let mpData: any = p.marketplace_data;
      if (typeof mpData === "string") {
        try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
      }
      const hbMerchantSku = mpData?.hepsiburada?.merchantSku || p.barcode.trim();

      validItems.push({
        MerchantSku: hbMerchantSku,
        HepsiburadaSku: p.hepsiburada_sku || "",
        Price: effectivePrice,
        AvailableStock: parseInt(p.stock_quantity || "0", 10),
        DispatchTime: cleanSettings.defaultDispatchTime || 1,
      });
    }

    if (validItems.length === 0) {
      return res.status(400).json({ error: "Seçilen ürünlerin hiçbirinde geçerli barkod bulunamadı.", skipped: skippedItems });
    }

    const result = await hbService.updatePriceAndStock(validItems);

    // Only mark as active if the product already has a confirmed Hepsiburada SKU
    await pool.query(
      `UPDATE products 
       SET is_hepsiburada_active = (CASE WHEN (hepsiburada_sku IS NOT NULL AND hepsiburada_sku != '') THEN true ELSE false END), 
           hepsiburada_last_sync = NOW(), 
           hepsiburada_last_error = NULL 
       WHERE store_id = $1 AND barcode = ANY($2)`,
      [storeId, validItems.map(i => i.MerchantSku)]
    );

    res.json({ 
      success: true, 
      syncedCount: validItems.length, 
      skippedCount: skippedItems.length, 
      skipped: skippedItems, 
      trackingId: result.trackingId, 
      message: `${validItems.length} ürün Hepsiburada'ya iletildi. Onaylı SKU'su olanlar satışta, diğerleri katalog incelemesinde tutuluyor.` 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Toplu Hepsiburada ilana açma başarısız." });
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
    await pool.query("UPDATE products SET is_trendyol_active = false WHERE id = $1 AND store_id = $2", [productId, storeId]);
    res.json({ success: true, message: "Ürün Trendyol'da yayından kaldırıldı." });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/n11/unpublish", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const productId = req.body.productId;
  try {
    await pool.query("UPDATE products SET is_n11_active = false WHERE id = $1 AND store_id = $2", [productId, storeId]);
    res.json({ success: true, message: "Ürün N11'de yayından kaldırıldı." });
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

// Global cache for merged live Hepsiburada categories
let hbLiveCategoryCache: { categories: any[]; timestamp: number } | null = null;

async function getMergedHepsiburadaCategories(storeId?: number) {
  const { HEPSIBURADA_DEFAULT_CATEGORIES, detectCategorySector } = await import("../src/data/marketplaceCategoriesData");
  let categories: any[] = [...HEPSIBURADA_DEFAULT_CATEGORIES];

  // Use cache if available and fresh (< 2 hours)
  if (hbLiveCategoryCache && (Date.now() - hbLiveCategoryCache.timestamp) < 7200000 && hbLiveCategoryCache.categories.length > 0) {
    return hbLiveCategoryCache.categories;
  }

  // Try live API if storeId provided
  if (storeId) {
    try {
      const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [storeId]);
      const settings = storeRes.rows[0]?.hepsiburada_settings;
      if (settings?.apiSecret && settings?.merchantId) {
        const hbService = new HepsiburadaService(settings, storeId);
        const rawLive = await hbService.getAllCategories();
        if (Array.isArray(rawLive) && rawLive.length > 0) {
          const liveNormalized = rawLive
            .filter((c: any) => c.leaf !== false && c.available !== false && c.status !== "INACTIVE")
            .map((c: any) => {
              const paths = Array.isArray(c.paths) ? c.paths : (c.parentName ? [c.parentName, c.name] : []);
              const displayName = c.displayName || (paths.length > 0 ? `${paths.join(" > ")} > ${c.name}` : c.name);
              return {
                id: c.categoryId || c.id,
                name: c.name || c.displayName,
                displayName: displayName,
                paths: paths,
                leaf: true,
                available: true,
                status: "ACTIVE",
                sector: c.sector || detectCategorySector(c.name || displayName, paths)
              };
            });

          if (liveNormalized.length > 0) {
            const existingIds = new Set(liveNormalized.map((c: any) => String(c.id)));
            // Merge defaults if not in live
            for (const def of HEPSIBURADA_DEFAULT_CATEGORIES) {
              if (!existingIds.has(String(def.id))) {
                liveNormalized.push({
                  ...def,
                  displayName: def.displayName || def.name,
                  paths: def.paths || [],
                  leaf: def.leaf ?? true,
                  available: def.available ?? true,
                  status: def.status || "ACTIVE",
                  sector: def.sector || "general"
                });
                existingIds.add(String(def.id));
              }
            }
            categories = liveNormalized;
            hbLiveCategoryCache = { categories: liveNormalized, timestamp: Date.now() };
          }
        }
      }
    } catch (err: any) {
      console.warn("[HB Categories] Live API fetch warning:", err.message);
    }
  }

  return categories;
}

// 7. Get Catalog Categories (Sector-Organized & Filtered)
router.get("/hepsiburada/categories", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const sector = req.query.sector;

  try {
    let result = await getMergedHepsiburadaCategories(storeId);

    if (sector && sector !== "all") {
      result = result.filter((c: any) => c.sector === sector);
    }

    // Sort active retail leaf categories neatly
    result.sort((a: any, b: any) => (a.displayName || a.name).localeCompare(b.displayName || b.name, 'tr'));

    res.json({ success: true, categories: result, total: result.length, source: hbLiveCategoryCache ? "live_api_cache" : "verified_catalog" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7b. Live Category Search Endpoint
router.get("/hepsiburada/categories/search", authenticate, async (req: any, res) => {
  const q = String(req.query.q || "").trim();
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;

  try {
    const { normalizeCategoryText, matchCategorySearchToken } = await import("../src/data/marketplaceCategoriesData");
    const allCategories = await getMergedHepsiburadaCategories(storeId);
    
    if (!q) {
      return res.json({ success: true, categories: allCategories.slice(0, 100), total: allCategories.length });
    }

    const normQ = normalizeCategoryText(q);
    const tokens = normQ.split(" ").filter((t: string) => t.length > 0);

    const matches = allCategories.filter((c: any) => {
      const catIdStr = String(c.id || c.categoryId || "");
      if (catIdStr === q) return true;

      const catText = normalizeCategoryText(`${c.name || ''} ${c.displayName || ''} ${(c.paths || []).join(' ')}`);
      return tokens.every(token => matchCategorySearchToken(catText, token));
    });

    matches.sort((a: any, b: any) => {
      const aName = normalizeCategoryText(a.name || a.displayName || '');
      const bName = normalizeCategoryText(b.name || b.displayName || '');
      if (aName.startsWith(normQ) && !bName.startsWith(normQ)) return -1;
      if (!aName.startsWith(normQ) && bName.startsWith(normQ)) return 1;
      return (a.displayName || a.name).localeCompare(b.displayName || b.name, 'tr');
    });

    res.json({ success: true, categories: matches.slice(0, 150), total: matches.length, query: q });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Get Category Attributes (Live API + Verified Fallback)
router.get("/hepsiburada/categories/:categoryId/attributes", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const rawCategoryId = String(req.params.categoryId || "").trim();

  // Normalize virtual category IDs to live Hepsiburada IDs
  let categoryId = rawCategoryId;
  if (categoryId === "1000101" || categoryId === "1000101.0") categoryId = "970";
  else if (categoryId === "1000102") categoryId = "698";
  else if (categoryId === "1000103") categoryId = "1100011";

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.hepsiburada_settings;

    if (settings?.apiSecret && settings?.merchantId) {
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
          // Fetch enum values for top mandatory select attributes if missing
          const normalized = await Promise.all(
            rawList.map(async (attr: any) => {
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

              return {
                id: String(attr.id || attr.attributeId || attr.name || ""),
                name: attr.name || attr.attributeName || attr.id,
                mandatory: !!(attr.mandatory || attr.required || attr.isMandatory),
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

    // Fallback: Rich Calculated Category Attributes
    const { getAttributesForCategory, HEPSIBURADA_DEFAULT_CATEGORIES } = await import("../src/data/marketplaceCategoriesData");
    const matchedCat = HEPSIBURADA_DEFAULT_CATEGORIES.find((c: any) => String(c.id) === String(categoryId) || String(c.id) === String(rawCategoryId));
    const catName = matchedCat?.name || (categoryId === "970" ? "USB Flash Bellekler" : String(categoryId));
    const catPaths = matchedCat?.paths || (categoryId === "970" ? ["Bilgisayar", "Veri Depolama", "Usb Bellek"] : []);
    const verifiedAttrs = getAttributesForCategory(catName, catPaths, categoryId || rawCategoryId);

    res.json({ success: true, attributes: verifiedAttrs, source: "verified_catalog", categoryId });
  } catch (error: any) {
    try {
      const { getAttributesForCategory, HEPSIBURADA_DEFAULT_CATEGORIES } = await import("../src/data/marketplaceCategoriesData");
      const matchedCat = HEPSIBURADA_DEFAULT_CATEGORIES.find((c: any) => String(c.id) === String(categoryId) || String(c.id) === String(rawCategoryId));
      const catName = matchedCat?.name || (categoryId === "970" ? "USB Flash Bellekler" : String(categoryId));
      const catPaths = matchedCat?.paths || (categoryId === "970" ? ["Bilgisayar", "Veri Depolama", "Usb Bellek"] : []);
      res.json({ success: true, attributes: getAttributesForCategory(catName, catPaths, categoryId || rawCategoryId), source: "verified_catalog", categoryId });
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
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { apiKey, apiSecret, merchantId, categoryMappings, categoryAttributes, categoryMarkups, defaultCommissionRate, defaultFixedFee } = req.body;

  try {
    const storeRes = await pool.query("SELECT trendyol_settings, branding FROM stores WHERE id = $1", [storeId]);
    const prev = storeRes.rows[0]?.trendyol_settings || {};
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch (e) { br = {}; } }

    const settings = {
      ...prev,
      connected: !!(apiKey && apiSecret && merchantId),
      apiKey: apiKey !== undefined ? apiKey?.trim() : prev.apiKey,
      apiSecret: apiSecret !== undefined ? apiSecret?.trim() : prev.apiSecret,
      merchantId: merchantId !== undefined ? merchantId?.trim() : prev.merchantId,
      defaultCommissionRate: defaultCommissionRate !== undefined ? Number(defaultCommissionRate) : (prev.defaultCommissionRate ?? 18),
      defaultFixedFee: defaultFixedFee !== undefined ? Number(defaultFixedFee) : (prev.defaultFixedFee ?? 20),
      categoryMappings: categoryMappings !== undefined ? categoryMappings : (prev.categoryMappings || {}),
      categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : (prev.categoryAttributes || {}),
      categoryMarkups: categoryMarkups !== undefined ? categoryMarkups : (prev.categoryMarkups || {}),
      last_sync: prev.last_sync || null
    };

    br.trendyol_settings = settings;
    await pool.query("UPDATE stores SET trendyol_settings = $1, branding = $2 WHERE id = $3", [settings, br, storeId]);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Trendyol Category Attributes Endpoint
router.get("/trendyol/categories/:categoryId/attributes", authenticate, async (req: any, res) => {
  try {
    const { getAttributesForCategory } = await import("../src/data/marketplaceCategoriesData");
    res.json({ success: true, attributes: getAttributesForCategory(String(req.params.categoryId)) });
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
    const storeRes = await pool.query("SELECT trendyol_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.trendyol_settings;

    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) {
      return res.status(400).json({ error: "Trendyol API bilgileri eksik" });
    }

    const tyOrders = await syncTrendyolOrders(pool, storeId, settings);

    let syncedCount = 0;
    for (const order of tyOrders) {
      const existing = await pool.query("SELECT id FROM trendyol_orders WHERE store_id = $1 AND trendyol_order_id = $2", [storeId, order.id]);
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

          const tyOrderDate = parseMarketplaceOrderDate(order.orderDate || order.createdDate);
          const saleRes = await client.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
            [storeId, order.total, 'TRY', 'completed', order.customer, customerId, 'Trendyol Satış', `Trendyol Siparişi: ${order.id}`, tyOrderDate]
          );
          const saleId = saleRes.rows[0].id;

          const invoiceNumber = `TY-${order.id}`;
          const totalAmount = parseFloat(order.total);
          const grandTotal = totalAmount;
          const subtotal = grandTotal / 1.20;
          const taxAmount = grandTotal - subtotal;

          const invoiceRes = await client.query(
            "INSERT INTO sales_invoices (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id",
            [storeId, saleId, customerId, invoiceNumber, tyOrderDate, subtotal, taxAmount, grandTotal, 'TRY', 'Trendyol Satış', `Trendyol Siparişi: ${order.id}`, 'marketplace', 'completed', tyOrderDate]
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
            taxRate: 20 // Default or extract from line if available
          }));

          if (mappedLines.length > 0) {
            await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'Trendyol', order.id, rawCustName3, invoiceNumber);
          } else {
             // Fallback if no lines
             await client.query(
              "INSERT INTO sales_invoice_items (sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
              [salesInvoiceId, `Trendyol Sipariş Kalemi (${order.id})`, 1, subtotal, 20, taxAmount, grandTotal]
            );
          }

          await client.query(
            "INSERT INTO trendyol_orders (store_id, trendyol_order_id, sale_id, sales_invoice_id, status, order_data) VALUES ($1, $2, $3, $4, $5, $6)",
            [storeId, order.id, saleId, salesInvoiceId, 'New', order]
          );

          await client.query("COMMIT");
          syncedCount++;
        } catch (e) {
          await client.query("ROLLBACK");
          console.error("Trendyol Order Sync Error:", e);
        } finally {
          client.release();
        }
      }
    }
    
    const newSettings = { ...settings, last_sync: new Date().toISOString() };
    await pool.query("UPDATE stores SET trendyol_settings = $1 WHERE id = $2", [newSettings, storeId]);
    res.json({ success: true, count: syncedCount });
  } catch (error: any) {
    await IntegrationService.logIntegrationError(storeId, 'Trendyol', 'Sync All Orders', error);
    res.status(500).json({ error: "Trendyol siparişleri senkronize edilemedi." });
  }
});

router.post("/trendyol/test", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT trendyol_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.trendyol_settings;
    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) return res.status(400).json({ error: "Trendyol API bilgileri eksik" });
    const success = await testTrendyolConnection(settings);
    res.json({ success });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
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

// 5. Publish Product to Trendyol
router.post("/trendyol/publish", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const productId = req.body.productId;

  try {
    const storeRes = await pool.query("SELECT trendyol_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.trendyol_settings;
    if (!settings || !settings.apiKey) return res.status(400).json({ error: "Trendyol API bilgileri eksik" });

    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    const p = prodRes.rows[0];
    if (!p) return res.status(404).json({ error: "Ürün bulunamadı" });

    if (Number(p.price || 0) <= 0 || Number(p.stock_quantity || 0) <= 0) {
      const reasons = [];
      if (Number(p.price || 0) <= 0) reasons.push("fiyatı 0₺");
      if (Number(p.stock_quantity || 0) <= 0) reasons.push("stoğu yetersiz (0/negatif)");
      return res.status(400).json({ error: `"${p.name}" ürününün ${reasons.join(" ve ")} olduğu için Trendyol'da satışa açılamaz. Lütfen fiyat ve stoğu güncelleyin.` });
    }

    const payload = {
      items: [{
        barcode: p.barcode,
        title: p.name,
        productMainId: p.barcode,
        brandId: 1, 
        categoryId: 1, 
        quantity: parseInt(p.stock_quantity) || 0,
        stockCode: p.barcode,
        dimensionalWeight: 1,
        description: p.description || p.name,
        currencyType: "TRY",
        listPrice: parseFloat(p.price) || 0,
        salePrice: parseFloat(p.price) || 0,
        vatRate: parseInt(p.tax_rate) || 20,
        cargoCompanyId: 1,
        images: p.image_url ? [{ url: p.image_url }] : [],
        attributes: []
      }]
    };

    try {
      const response = await axios.post(`https://apigw.trendyol.com/integration/product/sellers/${settings.merchantId}/products`, payload, {
        auth: { username: settings.apiKey, password: settings.apiSecret },
        headers: {
          "User-Agent": `${settings.merchantId} - SelfIntegration`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      await pool.query("UPDATE products SET is_trendyol_active = true, trendyol_id = $1, trendyol_last_error = NULL WHERE id = $2", [response.data.batchRequestId, productId]);
      res.json({ success: true, batchRequestId: response.data.batchRequestId });
    } catch (e: any) {
      const rawErr = e.response?.data?.errors?.[0]?.message || e.message;
      const errMsg = (typeof e.response?.data === "string" && e.response.data.includes("Cloudflare"))
        ? "Trendyol API güvenlik duvarı (Cloudflare 403) engeli."
        : rawErr;
      await pool.query("UPDATE products SET trendyol_last_error = $1 WHERE id = $2", [errMsg, productId]);
      res.status(400).json({ error: errMsg });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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

    const tyRes = await axios.get(`https://apigw.trendyol.com/integration/product/sellers/${settings.merchantId}/products?size=500`, {
      auth: { username: settings.apiKey.trim(), password: settings.apiSecret.trim() },
      headers: {
        "User-Agent": `${settings.merchantId.trim()} - SelfIntegration`,
        "Accept": "application/json"
      }
    });

    const remoteProducts = tyRes.data?.content || [];
    const localProdRes = await pool.query("SELECT * FROM products WHERE store_id = $1", [storeId]);
    const localProducts = localProdRes.rows || [];

    let matchedCount = 0;
    const matchedLocalIds = new Set<number>();

    for (const rp of remoteProducts) {
      const rpBarcode = String(rp.barcode || "").trim().toLowerCase();
      const rpCleanBarcode = rpBarcode.replace(/^0+/, "");
      const rpStockCode = String(rp.stockCode || rp.productMainId || "").trim().toLowerCase();
      const rpTitle = String(rp.title || "").trim().toLowerCase();
      const rpContentId = String(rp.productContentId || rp.productCode || rp.id || "");
      const isSaleActive = Boolean(rp.onSale) && Number(rp.quantity || 0) > 0 && Number(rp.salePrice || 0) > 0;

      const matchedLocal = localProducts.find((lp: any) => {
        if (matchedLocalIds.has(lp.id)) return false;
        const lpBarcode = String(lp.barcode || "").trim().toLowerCase();
        const lpCleanBarcode = lpBarcode.replace(/^0+/, "");
        const lpSku = String(lp.sku || lp.product_code || "").trim().toLowerCase();
        const lpName = String(lp.name || "").trim().toLowerCase();

        if (rpBarcode && (rpBarcode === lpBarcode || (rpCleanBarcode && rpCleanBarcode === lpCleanBarcode) || rpBarcode === lpSku)) return true;
        if (rpStockCode && (rpStockCode === lpBarcode || rpStockCode === lpSku)) return true;
        if (rpTitle && lpName && rpTitle === lpName) return true;
        return false;
      });

      if (matchedLocal) {
        matchedLocalIds.add(matchedLocal.id);
        let mpData: any = matchedLocal.marketplace_data;
        if (typeof mpData === "string") { try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; } }
        mpData = mpData || {};

        const pPrice = Number(matchedLocal.price || 0);
        const pStock = Number(matchedLocal.stock_quantity || 0);
        const finalActive = isSaleActive && pPrice > 0 && pStock > 0;

        mpData.trendyol = {
          ...(mpData.trendyol || {}),
          contentId: rpContentId,
          productCode: rp.productCode,
          barcode: rp.barcode,
          title: rp.title,
          onSale: Boolean(rp.onSale),
          status: finalActive ? "ACTIVE" : "INACTIVE",
          productUrl: rp.productUrl || undefined,
          lastSync: new Date().toISOString(),
          lastError: null
        };

        await pool.query(
          "UPDATE products SET trendyol_id = $1, is_trendyol_active = $2, trendyol_last_error = NULL, marketplace_data = $3 WHERE id = $4 AND store_id = $5",
          [rpContentId, finalActive, JSON.stringify(mpData), matchedLocal.id, storeId]
        );
        matchedCount++;
      }
    }

    const matchedIdsArray = Array.from(matchedLocalIds);
    if (matchedIdsArray.length > 0) {
      await pool.query(
        "UPDATE products SET is_trendyol_active = false WHERE store_id = $1 AND is_trendyol_active = true AND NOT (id = ANY($2::int[]))",
        [storeId, matchedIdsArray]
      );
    }

    // Clear stale Cloudflare 403 errors
    await pool.query(
      "UPDATE products SET trendyol_last_error = NULL WHERE store_id = $1 AND trendyol_last_error ILIKE '%403%'",
      [storeId]
    );

    res.json({
      success: true,
      matchedCount,
      totalRemote: remoteProducts.length,
      message: `Trendyol mağazası tarandı: ${matchedCount} ürün yerel kataloğunuzla eşleştirildi.`
    });
  } catch (error: any) {
    console.error("[Trendyol Match Error]:", error?.message || error);
    res.status(400).json({ error: error.message || "Trendyol ürünleri eşleştirilemedi." });
  }
});

// 6. Get Trendyol Categories
router.get("/trendyol/categories", authenticate, async (req: any, res) => {
  try {
    const response = await axios.get("https://apigw.trendyol.com/integration/product/product-categories", {
      headers: { "User-Agent": "LookPrice - SelfIntegration", "Accept": "application/json" }
    });
    res.json(response.data.categories || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { apiKey, apiSecret, merchantId, commissionRate, defaultCommissionRate, defaultFixedFee, categoryMappings, categoryAttributes, categoryMarkups, brandMappings } = req.body;

  try {
    const prevRes = await pool.query("SELECT pazarama_settings, branding FROM stores WHERE id = $1", [storeId]);
    const prevSettings = prevRes.rows[0]?.pazarama_settings || {};
    let br = prevRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch (e) { br = {}; } }

    const effectiveComm = defaultCommissionRate !== undefined ? Number(defaultCommissionRate) : (commissionRate !== undefined ? Number(commissionRate) : (prevSettings.defaultCommissionRate ?? prevSettings.commissionRate ?? 15));

    const settings = {
      ...prevSettings,
      connected: !!(apiKey && apiSecret),
      apiKey,
      apiSecret,
      merchantId: merchantId || prevSettings.merchantId || "",
      commissionRate: effectiveComm,
      defaultCommissionRate: effectiveComm,
      defaultFixedFee: defaultFixedFee !== undefined ? Number(defaultFixedFee) : (prevSettings.defaultFixedFee ?? 20),
      categoryMappings: categoryMappings || prevSettings.categoryMappings || {},
      categoryAttributes: categoryAttributes || prevSettings.categoryAttributes || {},
      categoryMarkups: categoryMarkups || prevSettings.categoryMarkups || {},
      brandMappings: brandMappings || prevSettings.brandMappings || {}
    };

    br.pazarama_settings = settings;
    await pool.query("UPDATE stores SET pazarama_settings = $1, branding = $2 WHERE id = $3", [settings, br, storeId]);
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
    const storeRes = await pool.query("SELECT pazarama_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.pazarama_settings;

    if (!settings || !settings.apiKey || !settings.apiSecret) {
      return res.status(400).json({ error: "Pazarama API bilgileri eksik" });
    }

    const pzOrders = await syncPazaramaOrders(pool, storeId, settings);

    let syncedCount = 0;
    for (const order of pzOrders) {
      const orderId = order.orderNumber || order.id;
      const existing = await pool.query("SELECT id FROM pazarama_orders WHERE store_id = $1 AND pazarama_order_id = $2", [storeId, orderId]);
      if (existing.rows.length === 0) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          // Find or create customer
          let customerId = null;
          const customerEmail = order.customerEmail || `${orderId}@pazarama.com`;
          const customerName = order.customerName || order.recipientName || "Pazarama Müşterisi";

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

          const pzOrderDate = parseMarketplaceOrderDate(order.orderDate || order.createdDate);
          const totalAmount = parseFloat(order.totalAmount || order.grandTotal || 0);
          const saleRes = await client.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
            [storeId, totalAmount, 'TRY', 'completed', customerName, customerId, 'Pazarama Satış', `Pazarama Siparişi: ${orderId}`, pzOrderDate]
          );
          const saleId = saleRes.rows[0].id;

          // Create Sales Invoice
          const invoiceNumber = `PZ-${orderId}`;
          const grandTotal = totalAmount;
          const subtotal = grandTotal / 1.20;
          const taxAmount = grandTotal - subtotal;

          const invoiceRes = await client.query(
            "INSERT INTO sales_invoices (store_id, customer_id, sale_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id",
            [storeId, customerId, saleId, invoiceNumber, pzOrderDate, subtotal, taxAmount, grandTotal, 'TRY', 'Pazarama Satış', `Pazarama Siparişi: ${orderId}`, 'marketplace', 'completed', pzOrderDate]
          );
          const salesInvoiceId = invoiceRes.rows[0].id;

          // Process order lines
          const orderItems = order.orderItems || order.items || [];
          const mappedLines = orderItems.map((l: any) => ({
            name: l.productName,
            quantity: l.quantity,
            price: l.unitPrice || l.price,
            barcode: l.barcode,
            sku: l.merchantSku || l.sku,
            taxRate: l.taxRate || 20
          }));

          if (mappedLines.length > 0) {
            await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'Pazarama', orderId, customerName, invoiceNumber);
          } else {
            await client.query(
              "INSERT INTO sales_invoice_items (sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
              [salesInvoiceId, `Pazarama Sipariş Kalemi (${orderId})`, 1, subtotal, 20, taxAmount, grandTotal]
            );
          }

          await client.query(
            "INSERT INTO pazarama_orders (store_id, pazarama_order_id, sale_id, sales_invoice_id, status, order_data) VALUES ($1, $2, $3, $4, $5, $6)",
            [storeId, orderId, saleId, salesInvoiceId, 'New', order]
          );

          await client.query("COMMIT");
          syncedCount++;
        } catch (e) {
          await client.query("ROLLBACK");
          console.error("Pazarama Order Sync Error:", e);
        } finally {
          client.release();
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
    await IntegrationService.logIntegrationError(storeId, 'Pazarama', 'Sync All Orders', error);
    res.status(500).json({ error: "Pazarama siparişleri senkronize edilemedi." });
  }
});

router.post("/pazarama/test", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT pazarama_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.pazarama_settings;
    if (!settings || !settings.apiKey || !settings.apiSecret) return res.status(400).json({ error: "Pazarama API bilgileri eksik" });
    const success = await testPazaramaConnection(settings);
    res.json({ success });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
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
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ error: "Ürün ID eksik." });
  }

  try {
    // 1. Get Integration Settings and Store Branding
    const storeRes = await pool.query("SELECT pazarama_settings, branding FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.pazarama_settings;
    const branding = storeRes.rows[0]?.branding || {};

    if (!settings || !settings.apiKey || !settings.apiSecret) {
      return res.status(400).json({ error: "Pazarama API bilgileri yapılandırılmamış. Lütfen Ayarlar > Entegrasyonlar sekmesinden ayarlayınız." });
    }

    // 2. Fetch Local Product Data
    const productRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: "Ürün bulunamadı veya bu mağazaya ait değil." });
    }
    
    const product = productRes.rows[0];

    if (Number(product.price || 0) <= 0 || Number(product.stock_quantity || 0) <= 0) {
      const reasons = [];
      if (Number(product.price || 0) <= 0) reasons.push("fiyatı 0₺");
      if (Number(product.stock_quantity || 0) <= 0) reasons.push("stoğu yetersiz (0/negatif)");
      return res.status(400).json({ error: `"${product.name}" ürününün ${reasons.join(" ve ")} olduğu için Pazarama'da satışa açılamaz. Lütfen fiyat ve stoğu güncelleyin.` });
    }

    // --- Price Calculation Logic ---
    // 1. Base Price
    let basePrice = parseFloat(product.price);
    const currency = product.currency || 'TRY';
    const commissionRate = settings.commissionRate || 0;

    // 2. Add Commission
    // Formula: (Price * (1 + Commission/100))
    const priceWithCommission = basePrice * (1 + commissionRate / 100);

    // 3. Convert to TRY
    let finalPriceTRY = priceWithCommission;
    if (currency !== 'TRY') {
      const rates = branding.currency_rates || {};
      const rate = rates[currency] || 1;
      finalPriceTRY = priceWithCommission * rate;
    }

    // Round to 2 decimal places
    const listPrice = Math.round(finalPriceTRY * 100) / 100;
    const salePrice = listPrice; // In this demo, list and sale are same

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
      stockCount: product.stock_quantity || 0,
      brandId: 1, 
      categoryId: pzCategoryId, 
      images: [] as any[]
    };

    if (product.image_url) {
      payload.images.push({ url: product.image_url, order: 1 });
    }

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

// --- Meta (Facebook/Instagram) Integration ---

// 1. Save Meta Settings
router.post("/meta/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { enabled, pixel_id, catalog_id, catalog_currency } = req.body;

  try {
    const settings = {
      enabled: !!enabled,
      pixel_id: pixel_id || "",
      catalog_id: catalog_id || "",
      catalog_currency: catalog_currency || "TRY"
    };

    await pool.query("UPDATE stores SET meta_settings = $1 WHERE id = $2", [settings, storeId]);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Meta Settings
router.get("/meta/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT meta_settings FROM stores WHERE id = $1", [storeId]);
    res.json(result.rows[0]?.meta_settings || { enabled: false, pixel_id: "", catalog_id: "" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Google Merchant Center Integration ---

// 1. Save Google Merchant Settings
router.post("/google-merchant/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { enabled, merchant_id, catalog_currency } = req.body;

  try {
    const settings = {
      enabled: !!enabled,
      merchant_id: merchant_id || "",
      catalog_currency: catalog_currency || "TRY"
    };

    await pool.query("UPDATE stores SET google_merchant_settings = $1 WHERE id = $2", [settings, storeId]);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Google Merchant Settings
router.get("/google-merchant/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT google_merchant_settings FROM stores WHERE id = $1", [storeId]);
    res.json(result.rows[0]?.google_merchant_settings || { enabled: false, merchant_id: "" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Instagram Integration ---

// 1. Save Instagram Settings
router.post("/instagram/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { enabled, auto_post, account_id, access_token } = req.body;

  try {
    const settings = {
      enabled: !!enabled,
      auto_post: !!auto_post,
      account_id: account_id || "",
      access_token: access_token || ""
    };

    await pool.query(
      `UPDATE stores SET 
        instagram_settings = $1,
        instagram_access_token = $2,
        instagram_business_account_id = $3
      WHERE id = $4`,
      [settings, settings.access_token, settings.account_id, storeId]
    );
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Instagram Settings
router.get("/instagram/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query(
      "SELECT instagram_settings, instagram_access_token, instagram_business_account_id FROM stores WHERE id = $1", 
      [storeId]
    );
    const row = result.rows[0] || {};
    const settings = row.instagram_settings || { enabled: false, auto_post: false, account_id: "", access_token: "" };
    
    // Merge database columns if they exist
    if (row.instagram_access_token) {
      settings.access_token = row.instagram_access_token;
    }
    if (row.instagram_business_account_id) {
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
