import express from "express";
import { pool } from "../models/db.ts";
import axios from "axios";
import { authenticate } from "../middleware/auth.ts";

const router = express.Router();

// Amazon SP-API Constants for Turkey
const AMAZON_TR_MARKETPLACE_ID = "A33AVAJ2PDY3WV";
const AMAZON_AUTH_ENDPOINT = "https://sellercentral.amazon.com.tr/apps/authorize/consent";
const AMAZON_TOKEN_ENDPOINT = "https://api.amazon.com.tr/auth/o2/token";
const AMAZON_API_ENDPOINT = "https://sellingpartnerapi-eu.amazon.com";

// 1. Get Amazon Auth URL
router.get("/amazon/auth-url", authenticate, async (req: any, res) => {
  const appId = process.env.AMAZON_APP_ID;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  
  if (!appId) {
    return res.status(400).json({ error: "Amazon App ID is not configured in environment" });
  }

  const state = Buffer.from(JSON.stringify({ storeId })).toString('base64');
  const authUrl = `${AMAZON_AUTH_ENDPOINT}?application_id=${appId}&state=${state}&version=beta`;
  
  res.json({ url: authUrl });
});

// 2. Amazon OAuth Callback
router.get("/amazon/callback", async (req: any, res) => {
  const { spapi_oauth_code, state } = req.query;
  
  if (!spapi_oauth_code || !state) {
    return res.status(400).send("Missing required parameters");
  }

  try {
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const storeId = decodedState.storeId;

    // Exchange code for refresh token
    const tokenRes = await axios.post(AMAZON_TOKEN_ENDPOINT, {
      grant_type: "authorization_code",
      code: spapi_oauth_code,
      client_id: process.env.AMAZON_CLIENT_ID,
      client_secret: process.env.AMAZON_CLIENT_SECRET
    });

    const { refresh_token } = tokenRes.data;

    // Save refresh token to store settings
    const storeRes = await pool.query("SELECT amazon_settings FROM stores WHERE id = $1", [storeId]);
    const currentSettings = storeRes.rows[0]?.amazon_settings || {};
    
    const newSettings = {
      ...currentSettings,
      connected: true,
      refresh_token: refresh_token, // Use snake_case for consistency with SP-API
      last_sync: null,
      marketplace_id: AMAZON_TR_MARKETPLACE_ID
    };

    await pool.query("UPDATE stores SET amazon_settings = $1 WHERE id = $2", [newSettings, storeId]);

    res.send("<html><body><h1>Amazon Bağlantısı Başarılı!</h1><p>Bu pencereyi kapatıp uygulamaya dönebilirsiniz.</p><script>setTimeout(() => window.close(), 3000);</script></body></html>");
  } catch (error: any) {
    console.error("Amazon Callback Error:", error.response?.data || error.message);
    res.status(500).send("Amazon bağlantısı sırasında bir hata oluştu.");
  }
});

// 3. Sync Amazon Orders
router.post("/amazon/sync", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;

  try {
    const storeRes = await pool.query("SELECT amazon_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.amazon_settings;

    if (!settings || !settings.refresh_token) {
      return res.status(400).json({ error: "Amazon hesabı bağlı değil" });
    }

    // 1. Get Access Token
    const tokenRes = await axios.post(AMAZON_TOKEN_ENDPOINT, {
      grant_type: "refresh_token",
      refresh_token: settings.refresh_token,
      client_id: process.env.AMAZON_CLIENT_ID,
      client_secret: process.env.AMAZON_CLIENT_SECRET
    });

    const accessToken = tokenRes.data.access_token;

    // 2. Fetch Orders (Last 24 hours)
    const createdAfter = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const ordersRes = await axios.get(`${AMAZON_API_ENDPOINT}/orders/v0/orders`, {
      params: {
        MarketplaceIds: AMAZON_TR_MARKETPLACE_ID,
        CreatedAfter: createdAfter
      },
      headers: {
        'x-amz-access-token': accessToken
      }
    });

    const amazonOrders = ordersRes.data.payload.Orders || [];
    let syncedCount = 0;

    // 3. Process Orders
    for (const order of amazonOrders) {
      // Check if already synced
      const existing = await pool.query("SELECT id FROM amazon_orders WHERE store_id = $1 AND amazon_order_id = $2", [storeId, order.AmazonOrderId]);
      
      if (existing.rows.length === 0) {
        // Create a sale record
        const saleRes = await pool.query(
          "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
          [storeId, order.OrderTotal?.Amount || 0, order.OrderTotal?.CurrencyCode || 'TRY', 'completed', order.BuyerInfo?.BuyerName || 'Amazon Müşterisi', 'amazon', `Amazon Siparişi: ${order.AmazonOrderId}`]
        );

        const saleId = saleRes.rows[0].id;

        // Save to amazon_orders tracking
        await pool.query(
          "INSERT INTO amazon_orders (store_id, amazon_order_id, sale_id, status, order_data) VALUES ($1, $2, $3, $4, $5)",
          [storeId, order.AmazonOrderId, saleId, order.OrderStatus, order]
        );

        syncedCount++;
      }
    }

    // Update last sync time
    const newSettings = { ...settings, last_sync: new Date().toISOString() };
    await pool.query("UPDATE stores SET amazon_settings = $1 WHERE id = $2", [newSettings, storeId]);

    res.json({ success: true, count: syncedCount });
  } catch (error: any) {
    console.error("Amazon Sync Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Amazon siparişleri senkronize edilemedi" });
  }
});

// 4. Get Amazon Settings
router.get("/amazon/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT amazon_settings FROM stores WHERE id = $1", [storeId]);
    res.json(result.rows[0]?.amazon_settings || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Disconnect Amazon
router.post("/amazon/disconnect", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    await pool.query("UPDATE stores SET amazon_settings = '{}' WHERE id = $1", [storeId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
