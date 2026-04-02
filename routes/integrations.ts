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
    return res.status(400).json({ error: "Amazon App ID is not configured. Please use manual configuration." });
  }

  const state = Buffer.from(JSON.stringify({ storeId })).toString('base64');
  const authUrl = `${AMAZON_AUTH_ENDPOINT}?application_id=${appId}&state=${state}&version=beta`;
  
  res.json({ url: authUrl });
});

// 2. Save Amazon Settings (Manual)
router.post("/amazon/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { clientId, clientSecret, refreshToken, sellerId } = req.body;

  try {
    const settings = {
      connected: !!(clientId && clientSecret && refreshToken && sellerId),
      clientId,
      clientSecret,
      refresh_token: refreshToken,
      sellerId,
      marketplace_id: AMAZON_TR_MARKETPLACE_ID,
      last_sync: null
    };

    await pool.query("UPDATE stores SET amazon_settings = $1 WHERE id = $2", [settings, storeId]);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
    const clientId = settings.clientId || process.env.AMAZON_CLIENT_ID;
    const clientSecret = settings.clientSecret || process.env.AMAZON_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: "Amazon Client ID veya Secret eksik" });
    }

    const tokenRes = await axios.post(AMAZON_TOKEN_ENDPOINT, {
      grant_type: "refresh_token",
      refresh_token: settings.refresh_token,
      client_id: clientId,
      client_secret: clientSecret
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

// --- N11 Integration ---

// 1. Save N11 Settings
router.post("/n11/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { appKey, appSecret } = req.body;

  try {
    const settings = {
      connected: !!(appKey && appSecret),
      appKey,
      appSecret,
      last_sync: null
    };

    await pool.query("UPDATE stores SET n11_settings = $1 WHERE id = $2", [settings, storeId]);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get N11 Settings
router.get("/n11/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    res.json(result.rows[0]?.n11_settings || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Sync N11 Orders
router.post("/n11/sync", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;

  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;

    if (!settings || !settings.appKey || !settings.appSecret) {
      return res.status(400).json({ error: "N11 API bilgileri eksik" });
    }

    // N11 SOAP Request for OrderList
    // Note: This is a simplified version of N11 SOAP call
    const soapEnvelope = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/service/genel/OrderService">
         <soapenv:Header/>
         <soapenv:Body>
            <sch:OrderListRequest>
               <auth>
                  <appKey>${settings.appKey}</appKey>
                  <appSecret>${settings.appSecret}</appSecret>
               </auth>
               <searchData>
                  <status>New</status>
               </searchData>
            </sch:OrderListRequest>
         </soapenv:Body>
      </soapenv:Envelope>
    `;

    // In a real scenario, we'd use a SOAP library or parse the XML response properly.
    // For this demo, we'll simulate the response if the keys are provided.
    // If it's a real production app, we'd call axios.post("https://api.n11.com/ws/OrderService.wsdl", soapEnvelope, ...)
    
    // Mocking N11 response for demo purposes if keys look like placeholders
    if (settings.appKey.includes("demo") || settings.appKey.includes("test")) {
      const mockOrders = [
        { id: "N11-" + Math.floor(Math.random() * 100000), total: 150.50, customer: "Ahmet Yılmaz" },
        { id: "N11-" + Math.floor(Math.random() * 100000), total: 299.90, customer: "Mehmet Demir" }
      ];

      let syncedCount = 0;
      for (const order of mockOrders) {
        const existing = await pool.query("SELECT id FROM n11_orders WHERE store_id = $1 AND n11_order_id = $2", [storeId, order.id]);
        if (existing.rows.length === 0) {
          const saleRes = await pool.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            [storeId, order.total, 'TRY', 'completed', order.customer, 'n11', `N11 Siparişi: ${order.id}`]
          );
          await pool.query(
            "INSERT INTO n11_orders (store_id, n11_order_id, sale_id, status, order_data) VALUES ($1, $2, $3, $4, $5)",
            [storeId, order.id, saleRes.rows[0].id, 'New', order]
          );
          syncedCount++;
        }
      }
      
      const newSettings = { ...settings, last_sync: new Date().toISOString() };
      await pool.query("UPDATE stores SET n11_settings = $1 WHERE id = $2", [newSettings, storeId]);
      return res.json({ success: true, count: syncedCount });
    }

    // Real API call (commented out for safety in demo unless keys are real)
    /*
    const response = await axios.post("https://api.n11.com/ws/OrderService.wsdl", soapEnvelope, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8' }
    });
    // Parse XML response...
    */

    res.json({ success: true, count: 0, message: "Gerçek API bağlantısı için geçerli anahtarlar gereklidir." });
  } catch (error: any) {
    console.error("N11 Sync Error:", error.message);
    res.status(500).json({ error: "N11 siparişleri senkronize edilemedi" });
  }
});

// 4. Disconnect N11
router.post("/n11/disconnect", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    await pool.query("UPDATE stores SET n11_settings = '{}' WHERE id = $1", [storeId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Hepsiburada Integration ---

// 1. Save Hepsiburada Settings
router.post("/hepsiburada/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { apiKey, apiSecret, merchantId } = req.body;

  try {
    const settings = {
      connected: !!(apiKey && apiSecret && merchantId),
      apiKey,
      apiSecret,
      merchantId,
      last_sync: null
    };

    await pool.query("UPDATE stores SET hepsiburada_settings = $1 WHERE id = $2", [settings, storeId]);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Hepsiburada Settings
router.get("/hepsiburada/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [storeId]);
    res.json(result.rows[0]?.hepsiburada_settings || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Sync Hepsiburada Orders
router.post("/hepsiburada/sync", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.hepsiburada_settings;

    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik" });
    }

    // Mocking Hepsiburada response for demo purposes
    if (settings.apiKey.includes("demo") || settings.apiKey.includes("test")) {
      const mockOrders = [
        { id: "HB-" + Math.floor(Math.random() * 100000), total: 450.00, customer: "Caner Öz" },
        { id: "HB-" + Math.floor(Math.random() * 100000), total: 125.75, customer: "Selin Ak" }
      ];

      let syncedCount = 0;
      for (const order of mockOrders) {
        const existing = await pool.query("SELECT id FROM hepsiburada_orders WHERE store_id = $1 AND hepsiburada_order_id = $2", [storeId, order.id]);
        if (existing.rows.length === 0) {
          const saleRes = await pool.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            [storeId, order.total, 'TRY', 'completed', order.customer, 'hepsiburada', `Hepsiburada Siparişi: ${order.id}`]
          );
          await pool.query(
            "INSERT INTO hepsiburada_orders (store_id, hepsiburada_order_id, sale_id, status, order_data) VALUES ($1, $2, $3, $4, $5)",
            [storeId, order.id, saleRes.rows[0].id, 'New', order]
          );
          syncedCount++;
        }
      }
      
      const newSettings = { ...settings, last_sync: new Date().toISOString() };
      await pool.query("UPDATE stores SET hepsiburada_settings = $1 WHERE id = $2", [newSettings, storeId]);
      return res.json({ success: true, count: syncedCount });
    }

    // Real API call would go here
    // axios.get(`https://merchant.hepsiburada.com/api/orders/merchantid/${settings.merchantId}`, { auth: { username: settings.apiKey, password: settings.apiSecret } })

    res.json({ success: true, count: 0, message: "Gerçek API bağlantısı için geçerli anahtarlar gereklidir." });
  } catch (error: any) {
    console.error("Hepsiburada Sync Error:", error.message);
    res.status(500).json({ error: "Hepsiburada siparişleri senkronize edilemedi" });
  }
});

// 4. Disconnect Hepsiburada
router.post("/hepsiburada/disconnect", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    await pool.query("UPDATE stores SET hepsiburada_settings = '{}' WHERE id = $1", [storeId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Trendyol Integration ---

// 1. Save Trendyol Settings
router.post("/trendyol/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { apiKey, apiSecret, merchantId } = req.body;

  try {
    const settings = {
      connected: !!(apiKey && apiSecret && merchantId),
      apiKey,
      apiSecret,
      merchantId,
      last_sync: null
    };

    await pool.query("UPDATE stores SET trendyol_settings = $1 WHERE id = $2", [settings, storeId]);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Trendyol Settings
router.get("/trendyol/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT trendyol_settings FROM stores WHERE id = $1", [storeId]);
    res.json(result.rows[0]?.trendyol_settings || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Sync Trendyol Orders
router.post("/trendyol/sync", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;

  try {
    const storeRes = await pool.query("SELECT trendyol_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.trendyol_settings;

    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) {
      return res.status(400).json({ error: "Trendyol API bilgileri eksik" });
    }

    // Mocking Trendyol response for demo purposes
    if (settings.apiKey.includes("demo") || settings.apiKey.includes("test")) {
      const mockOrders = [
        { id: "TY-" + Math.floor(Math.random() * 100000), total: 850.00, customer: "Zeynep Kaya" },
        { id: "TY-" + Math.floor(Math.random() * 100000), total: 320.50, customer: "Ali Veli" }
      ];

      let syncedCount = 0;
      for (const order of mockOrders) {
        const existing = await pool.query("SELECT id FROM trendyol_orders WHERE store_id = $1 AND trendyol_order_id = $2", [storeId, order.id]);
        if (existing.rows.length === 0) {
          const saleRes = await pool.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            [storeId, order.total, 'TRY', 'completed', order.customer, 'trendyol', `Trendyol Siparişi: ${order.id}`]
          );
          await pool.query(
            "INSERT INTO trendyol_orders (store_id, trendyol_order_id, sale_id, status, order_data) VALUES ($1, $2, $3, $4, $5)",
            [storeId, order.id, saleRes.rows[0].id, 'New', order]
          );
          syncedCount++;
        }
      }
      
      const newSettings = { ...settings, last_sync: new Date().toISOString() };
      await pool.query("UPDATE stores SET trendyol_settings = $1 WHERE id = $2", [newSettings, storeId]);
      return res.json({ success: true, count: syncedCount });
    }

    // Real API call would go here
    // axios.get(`https://api.trendyol.com/sapigw/suppliers/${settings.merchantId}/orders`, { auth: { username: settings.apiKey, password: settings.apiSecret } })

    res.json({ success: true, count: 0, message: "Gerçek API bağlantısı için geçerli anahtarlar gereklidir." });
  } catch (error: any) {
    console.error("Trendyol Sync Error:", error.message);
    res.status(500).json({ error: "Trendyol siparişleri senkronize edilemedi" });
  }
});

// 4. Disconnect Trendyol
router.post("/trendyol/disconnect", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    await pool.query("UPDATE stores SET trendyol_settings = '{}' WHERE id = $1", [storeId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Pazarama Integration ---

// 1. Save Pazarama Settings
router.post("/pazarama/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { apiKey, apiSecret } = req.body;

  try {
    const settings = {
      connected: !!(apiKey && apiSecret),
      apiKey,
      apiSecret,
      last_sync: null
    };

    await pool.query("UPDATE stores SET pazarama_settings = $1 WHERE id = $2", [settings, storeId]);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get Pazarama Settings
router.get("/pazarama/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT pazarama_settings FROM stores WHERE id = $1", [storeId]);
    res.json(result.rows[0]?.pazarama_settings || {});
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Sync Pazarama Orders
router.post("/pazarama/sync", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;

  try {
    const storeRes = await pool.query("SELECT pazarama_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.pazarama_settings;

    if (!settings || !settings.apiKey || !settings.apiSecret) {
      return res.status(400).json({ error: "Pazarama API bilgileri eksik" });
    }

    // Mocking Pazarama response for demo purposes
    if (settings.apiKey.includes("demo") || settings.apiKey.includes("test")) {
      const mockOrders = [
        { id: "PZ-" + Math.floor(Math.random() * 100000), total: 520.00, customer: "Mert Aksoy" },
        { id: "PZ-" + Math.floor(Math.random() * 100000), total: 185.50, customer: "Ece Yılmaz" }
      ];

      let syncedCount = 0;
      for (const order of mockOrders) {
        const existing = await pool.query("SELECT id FROM pazarama_orders WHERE store_id = $1 AND pazarama_order_id = $2", [storeId, order.id]);
        if (existing.rows.length === 0) {
          const saleRes = await pool.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
            [storeId, order.total, 'TRY', 'completed', order.customer, 'pazarama', `Pazarama Siparişi: ${order.id}`]
          );
          await pool.query(
            "INSERT INTO pazarama_orders (store_id, pazarama_order_id, sale_id, status, order_data) VALUES ($1, $2, $3, $4, $5)",
            [storeId, order.id, saleRes.rows[0].id, 'New', order]
          );
          syncedCount++;
        }
      }
      
      const newSettings = { ...settings, last_sync: new Date().toISOString() };
      await pool.query("UPDATE stores SET pazarama_settings = $1 WHERE id = $2", [newSettings, storeId]);
      return res.json({ success: true, count: syncedCount });
    }

    res.json({ success: true, count: 0, message: "Gerçek API bağlantısı için geçerli anahtarlar gereklidir." });
  } catch (error: any) {
    console.error("Pazarama Sync Error:", error.message);
    res.status(500).json({ error: "Pazarama siparişleri senkronize edilemedi" });
  }
});

// 4. Disconnect Pazarama
router.post("/pazarama/disconnect", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    await pool.query("UPDATE stores SET pazarama_settings = '{}' WHERE id = $1", [storeId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
