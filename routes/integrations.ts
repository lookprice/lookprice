import express from "express";
import { pool } from "../models/db";
import axios from "axios";
import { authenticate } from "../middleware/auth";
import { IntegrationService } from "../src/services/IntegrationService";
import { HepsiburadaService } from "../src/services/backend/hepsiburadaService";
import { HepsiburadaServiceV3 } from "../src/services/backend/HepsiburadaServiceV3";
import { AmazonService } from "../src/services/backend/amazonService";
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
// Amazon Settings Endpoint
router.post("/amazon/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { clientId, clientSecret, refreshToken, sellerId, categoryMappings, categoryAttributes, isSandbox } = req.body;

  try {
    const storeRes = await pool.query("SELECT amazon_settings, branding FROM stores WHERE id = $1", [storeId]);
    const prev = storeRes.rows[0]?.amazon_settings || {};
    let br = storeRes.rows[0]?.branding || {};
    if (typeof br === 'string') {
      try { br = JSON.parse(br); } catch (e) { br = {}; }
    }

    const finalClientId = clientId ? String(clientId).trim() : (prev.clientId || "");
    const finalClientSecret = clientSecret ? String(clientSecret).trim() : (prev.clientSecret || "");
    const finalRefreshToken = refreshToken ? String(refreshToken).trim() : (prev.refresh_token || "");
    const finalSellerId = sellerId ? String(sellerId).trim() : (prev.sellerId || "");

    const settings = {
      ...prev,
      connected: !!((finalClientId && finalClientSecret && finalRefreshToken) || (finalClientId && finalSellerId)),
      clientId: finalClientId,
      clientSecret: finalClientSecret,
      refresh_token: finalRefreshToken,
      sellerId: finalSellerId,
      isSandbox: typeof isSandbox === 'boolean' ? isSandbox : (prev.isSandbox || false),
      marketplace_id: AMAZON_TR_MARKETPLACE_ID,
      categoryMappings: categoryMappings !== undefined ? categoryMappings : (prev.categoryMappings || {}),
      categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : (prev.categoryAttributes || {}),
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

    const settings = {
      clientId: clientId ? String(clientId).trim() : (prev.clientId || process.env.AMAZON_CLIENT_ID || ""),
      clientSecret: clientSecret ? String(clientSecret).trim() : (prev.clientSecret || process.env.AMAZON_CLIENT_SECRET || ""),
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
    const storeRes = await pool.query("SELECT amazon_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.amazon_settings;

    if (!settings || (!settings.refresh_token && !settings.clientId)) {
      return res.status(400).json({ error: "Amazon hesabı bağlı veya ayarları tam değil" });
    }

    const prodRes = await pool.query(
      "SELECT id, name, sku, barcode, price, sale_price, stock_quantity FROM products WHERE store_id = $1 AND (is_active = true OR is_active IS NULL)",
      [storeId]
    );
    const products = prodRes.rows || [];

    const amazonService = new AmazonService(settings, storeId);
    const result = await amazonService.bulkSyncInventory(products);

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

router.post("/amazon/sync", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;

  try {
    const storeRes = await pool.query("SELECT amazon_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.amazon_settings;

    if (!settings || !settings.refresh_token) {
      return res.status(400).json({ error: "Amazon hesabı bağlı değil" });
    }

    const amazonService = new AmazonService(settings, storeId);
    
    // 1 & 2. Fetch Orders (Last 3 days via AmazonService which handles token & Sandbox automatically)
    const amazonOrders = await amazonService.fetchOrders(3);
    let syncedCount = 0;

    // 3. Process Orders
    for (const order of amazonOrders) {
      // Check if already synced
      const existing = await pool.query("SELECT id FROM amazon_orders WHERE store_id = $1 AND amazon_order_id = $2", [storeId, order.AmazonOrderId]);
      
      if (existing.rows.length === 0) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          // Find or create customer
          let customerId = null;
          const buyerName = order.BuyerInfo?.BuyerName || 'Amazon Müşterisi';
          const buyerEmail = order.BuyerInfo?.BuyerEmail || `amazon_${order.AmazonOrderId}@amazon.com`;
          
          const rawBuyerName = (buyerName || '').trim();
          const nameParts1 = rawBuyerName.split(' ');
          const surname1 = nameParts1.length > 1 ? nameParts1.pop()! : '';
          const firstName1 = nameParts1.join(' ') || rawBuyerName;

          const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, buyerEmail]);
          if (custRes.rows.length > 0) {
            customerId = custRes.rows[0].id;
          } else {
            const newCust = await client.query(
              "INSERT INTO customers (store_id, email, password, full_name, name, surname) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
              [storeId, buyerEmail, 'marketplace_user', rawBuyerName, firstName1, surname1]
            );
            customerId = newCust.rows[0].id;
          }

          // Create a sale record (legacy compatibility)
          const saleRes = await client.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
            [storeId, order.OrderTotal?.Amount || 0, order.OrderTotal?.CurrencyCode || 'TRY', 'completed', buyerName, customerId, 'Amazon Satış', `Amazon Siparişi: ${order.AmazonOrderId}`]
          );
          const saleId = saleRes.rows[0].id;

          // Fetch Amazon Order Items
          let orderItems = [];
          try {
            orderItems = await amazonService.fetchOrderItems(order.AmazonOrderId);
          } catch (itemErr) {
            console.error(`Failed to fetch items for Amazon order ${order.AmazonOrderId}:`, itemErr);
          }

          // Create Sales Invoice
          const invoiceNumber = `AMZ-${order.AmazonOrderId}`;
          const totalAmountFloat = parseFloat(order.OrderTotal?.Amount || 0);
          const taxAmount = totalAmountFloat * 0.20; // Default 20% tax
          const grandTotal = totalAmountFloat;
          const subtotal = grandTotal - taxAmount;

          const invoiceRes = await client.query(
            "INSERT INTO sales_invoices (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id",
            [storeId, saleId, customerId, invoiceNumber, new Date(order.PurchaseDate || Date.now()), subtotal, taxAmount, grandTotal, order.OrderTotal?.CurrencyCode || 'TRY', 'Amazon Satış', `Amazon Siparişi: ${order.AmazonOrderId}`, 'marketplace', 'completed']
          );
          const salesInvoiceId = invoiceRes.rows[0].id;

          const mappedLines = orderItems.map((l: any) => ({
            name: l.Title || `Amazon Sipariş Kalemi (${order.AmazonOrderId})`,
            quantity: l.QuantityOrdered || 1,
            price: l.ItemPrice?.Amount ? parseFloat(l.ItemPrice.Amount) / (l.QuantityOrdered || 1) : subtotal,
            barcode: l.SellerSKU, // Using SKU as barcode fallback
            sku: l.SellerSKU,
            taxRate: 20
          }));

          if (mappedLines.length > 0) {
            await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'Amazon', order.AmazonOrderId);
          } else {
            await client.query(
              "INSERT INTO sales_invoice_items (sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
              [salesInvoiceId, `Amazon Sipariş Kalemi (${order.AmazonOrderId})`, 1, subtotal, 20, taxAmount, grandTotal]
            );
            
            // Also insert a generic sale_item for consistency
            await client.query(
              "INSERT INTO sale_items (sale_id, product_name, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5)",
              [saleId, `Amazon Sipariş Kalemi (${order.AmazonOrderId})`, 1, subtotal, grandTotal]
            );
          }

          // Save to amazon_orders tracking
          await client.query(
            "INSERT INTO amazon_orders (store_id, amazon_order_id, sale_id, sales_invoice_id, status, order_data) VALUES ($1, $2, $3, $4, $5, $6)",
            [storeId, order.AmazonOrderId, saleId, salesInvoiceId, order.OrderStatus, order]
          );

          await client.query("COMMIT");
          syncedCount++;
        } catch (e) {
          await client.query("ROLLBACK");
          console.error("Amazon Order Sync Error (Individual):", e);
        } finally {
          client.release();
        }
      }
    }

    // Update last sync time
    const newSettings = { ...settings, last_sync: new Date().toISOString() };
    await pool.query("UPDATE stores SET amazon_settings = $1 WHERE id = $2", [newSettings, storeId]);

    res.json({ success: true, count: syncedCount });
  } catch (error: any) {
    await IntegrationService.logIntegrationError(storeId, 'Amazon', 'Sync All Orders', error);
    res.status(500).json({ error: "Amazon siparişleri senkronize edilemedi" });
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

// --- N11 Integration ---

// 1. Save N11 Settings
router.post("/n11/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { appKey, appSecret } = req.body;

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

    // Sync N11 Orders
router.post("/n11/sync", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;

  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;

    if (!settings || !settings.appKey || !settings.appSecret) {
      return res.status(400).json({ error: "N11 API bilgileri eksik" });
    }

    const n11Orders = await syncN11Orders(pool, storeId, settings);

    let syncedCount = 0;
    for (const order of n11Orders) {
      const orderId = order.id;
      const existing = await pool.query("SELECT id FROM n11_orders WHERE store_id = $1 AND n11_order_id = $2", [storeId, orderId]);
      if (existing.rows.length === 0) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          // Find or create customer
          let customerId = null;
          const buyer = order.buyer || {};
          const customerEmail = buyer.email || `${orderId}@n11.com`;
          const customerName = buyer.fullName || "N11 Müşterisi";

          const rawCustName2 = (customerName || '').trim();
          const nameParts2 = rawCustName2.split(' ');
          const surname2 = nameParts2.length > 1 ? nameParts2.pop()! : '';
          const firstName2 = nameParts2.join(' ') || rawCustName2;

          const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, customerEmail]);
          if (custRes.rows.length > 0) {
            customerId = custRes.rows[0].id;
          } else {
            const newCust = await client.query(
              "INSERT INTO customers (store_id, email, password, full_name, name, surname, phone) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
              [storeId, customerEmail, 'marketplace_user', rawCustName2, firstName2, surname2, buyer.mobilePhone || '']
            );
            customerId = newCust.rows[0].id;
          }

          const totalAmount = parseFloat(order.totalAmount || 0);
          const saleRes = await client.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
            [storeId, totalAmount, 'TRY', 'completed', customerName, customerId, 'N11 Satış', `N11 Siparişi: ${orderId}`]
          );
          const saleId = saleRes.rows[0].id;

          // Create Sales Invoice
          const invoiceNumber = `N11-${orderId}`;
          const taxAmount = totalAmount * 0.20;
          const grandTotal = totalAmount;
          const subtotal = grandTotal - taxAmount;

          const invoiceRes = await client.query(
            "INSERT INTO sales_invoices (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id",
            [storeId, saleId, customerId, invoiceNumber, new Date(), subtotal, taxAmount, grandTotal, 'TRY', 'N11 Satış', `N11 Siparişi: ${orderId}`, 'marketplace', 'completed']
          );
          const salesInvoiceId = invoiceRes.rows[0].id;

          // Process order lines
          const itemList = order.itemList?.item || [];
          const lines = Array.isArray(itemList) ? itemList : [itemList];
          const mappedLines = lines.map((l: any) => ({
            name: l.productName || `N11 Sipariş Kalemi (${orderId})`,
            quantity: parseInt(l.quantity) || 1,
            price: parseFloat(l.price) || 0,
            barcode: l.sellerStockCode, 
            sku: l.sellerStockCode,
            taxRate: 20
          }));

          if (mappedLines.length > 0) {
            await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'N11', orderId);
          }

          await client.query(
            "INSERT INTO n11_orders (store_id, n11_order_id, sale_id, sales_invoice_id, status, order_data) VALUES ($1, $2, $3, $4, $5, $6)",
            [storeId, orderId, saleId, salesInvoiceId, 'New', order]
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
    res.status(500).json({ error: "N11 siparişleri senkronize edilemedi." });
  }
});

router.post("/n11/test", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) return res.status(400).json({ error: "N11 API bilgileri eksik" });
    const success = await testN11Connection(settings);
    res.json({ success });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});
router.post("/n11/publish", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { productId, categoryId, attributes } = req.body;

  try {
    const storeRes = await pool.query("SELECT n11_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.n11_settings;
    if (!settings || !settings.appKey || !settings.appSecret) {
      return res.status(400).json({ error: "N11 API bilgileri eksik" });
    }

    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    if (prodRes.rows.length === 0) return res.status(404).json({ error: "Ürün bulunamadı" });
    const product = prodRes.rows[0];

    // SOAP request for SaveProduct
    // This is a simplified version, N11 requires much more detail (stock items, images etc)
    const soapEnvelope = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/service/genel/ProductService">
         <soapenv:Header/>
         <soapenv:Body>
            <sch:SaveProductRequest>
               <auth>
                  <appKey>${settings.appKey}</appKey>
                  <appSecret>${settings.appSecret}</appSecret>
               </auth>
               <product>
                  <productSellerCode>${product.sku || product.id}</productSellerCode>
                  <title>${product.name}</title>
                  <subtitle>${product.name.substring(0, 45)}</subtitle>
                  <description><![CDATA[${product.description || product.name}]]></description>
                  <category>
                     <id>${categoryId || '1000001'}</id> 
                  </category>
                  <price>${product.sale_price}</price>
                  <currencyType>1</currencyType>
                  <stockItems>
                     <stockItem>
                        <sellerStockCode>${product.sku || product.id}</sellerStockCode>
                        <quantity>${product.stock_quantity}</quantity>
                     </stockItem>
                  </stockItems>
               </product>
            </sch:SaveProductRequest>
         </soapenv:Body>
      </soapenv:Envelope>
    `;

    const response = await axios.post("https://api.n11.com/ws/ProductService.wsdl", soapEnvelope, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8' }
    });

    const parsedResult = await parseStringPromise(response.data, { explicitArray: false, ignoreAttrs: true });
    const saveRes = parsedResult['SOAP-ENV:Envelope']['SOAP-ENV:Body']['SaveProductResponse'];

    if (saveRes.result.status === 'success') {
      await pool.query("UPDATE products SET n11_id = $1 WHERE id = $2", [saveRes.product.id, productId]);
      res.json({ success: true, n11Id: saveRes.product.id });
    } else {
      res.status(400).json({ error: saveRes.result.errorMessage });
    }
  } catch (error: any) {
    console.error("N11 Publish Error:", error.response?.data || error.message);
    res.status(500).json({ error: "N11'de ürün yayınlanamadı" });
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
    categoryAttributes
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
      autoSyncOrders: autoSyncOrders !== undefined ? autoSyncOrders : (prev.autoSyncOrders ?? true),
      autoStockSync: autoStockSync !== undefined ? autoStockSync : (prev.autoStockSync ?? true),
      webhookSecret: webhookSecret || prev.webhookSecret || `hb_wh_${Math.random().toString(36).substring(2, 12)}`,
      categoryMappings: categoryMappings !== undefined ? categoryMappings : (prev.categoryMappings || {}),
      categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : (prev.categoryAttributes || {})
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
    const { syncedCount, errors } = await hbService.syncOrdersToDatabase();

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

// 6. Publish / Update Single Product to Hepsiburada
router.post("/hepsiburada/publish", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const productId = req.body.productId;

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.hepsiburada_settings;
    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik (Ayarlar > E-Mağazalar sekmesinden API anahtarlarınızı kaydedin)" });
    }

    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1 AND store_id = $2", [productId, storeId]);
    const p = prodRes.rows[0];
    if (!p) return res.status(404).json({ error: "Ürün bulunamadı" });

    if (!p.barcode || !p.barcode.trim()) {
      return res.status(400).json({ error: `"${p.name}" ürününün barkodu eksik. Hepsiburada'da satışa açmak için geçerli bir barkod gereklidir.` });
    }

    let mpData: any = p.marketplace_data;
    if (typeof mpData === "string") {
      try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
    }
    mpData = mpData || {};
    const hbData = mpData.hepsiburada || {};

    // Determine category ID with live Hepsiburada catalog mappings
    let categoryId = hbData.categoryId || settings.categoryMappings?.[p.category]?.hepsiburada || settings.categoryMappings?.[p.sub_category]?.hepsiburada;
    
    // Normalize deprecated/virtual category IDs to live active Hepsiburada categories
    const catSearchStr = `${p.name} ${p.category || ""} ${p.sub_category || ""}`.toLowerCase();
    if (
      String(categoryId) === "1000101" ||
      !categoryId ||
      catSearchStr.includes("usb flash") ||
      catSearchStr.includes("flash bellek") ||
      (catSearchStr.includes("usb") && catSearchStr.includes("bellek"))
    ) {
      categoryId = 970; // Active HB Leaf: Usb Bellek
    } else if (String(categoryId) === "1000102" || catSearchStr.includes("kart okuyucu")) {
      categoryId = 698; // Active HB Leaf: Kart Okuyucular
    } else if (String(categoryId) === "1000103" || catSearchStr.includes("sd kart")) {
      categoryId = 1100011; // Active HB Leaf: Sd Kartlar
    }

    const hbService = new HepsiburadaService(settings, storeId);
    const rawPrice = parseFloat(p.price || "0");
    const effectivePrice = hbService.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);

    // Prepare catalog attributes
    const userAttrs = hbData.attributes || {};
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

    // 1. Send to Hepsiburada Catalog Import (Multipart Form-Data)
    let catalogTrackingId: string | undefined;
    let catalogMsg: string | undefined;
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

    // 2. Send to Listing Price & Stock Inventory Update
    const result = await hbService.updatePriceAndStock([
      {
        HepsiburadaSku: p.hepsiburada_sku || "",
        MerchantSku: p.barcode.trim(),
        Price: effectivePrice,
        AvailableStock: parseInt(p.stock_quantity || "0", 10),
        DispatchTime: settings.defaultDispatchTime || 1,
      }
    ]);

    // Update product marketplace metadata
    mpData.hepsiburada = {
      ...hbData,
      categoryId: Number(categoryId),
      attributes,
      catalogTrackingId: catalogTrackingId || hbData.catalogTrackingId,
      listingTrackingId: result.trackingId,
      lastSync: new Date().toISOString()
    };

    await pool.query(
      "UPDATE products SET is_hepsiburada_active = true, hepsiburada_last_sync = NOW(), hepsiburada_last_error = NULL, marketplace_data = $1 WHERE id = $2",
      [JSON.stringify(mpData), productId]
    );

    const message = catalogTrackingId
      ? `"${p.name}" Hepsiburada kataloğuna aktarıldı ve satışa açıldı! (Katalog Takip No: ${catalogTrackingId})`
      : result.message;

    res.json({
      success: true,
      message,
      effectivePrice,
      trackingId: catalogTrackingId || result.trackingId,
      catalogTrackingId,
      listingTrackingId: result.trackingId
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
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const productIds = req.body.productIds;

  try {
    const storeRes = await pool.query("SELECT hepsiburada_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.hepsiburada_settings;
    if (!settings || !settings.apiKey || !settings.apiSecret || !settings.merchantId) {
      return res.status(400).json({ error: "Hepsiburada API bilgileri eksik (Ayarlar > E-Mağazalar sekmesinden API anahtarlarınızı kaydedin)" });
    }

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

    const hbService = new HepsiburadaService(settings, storeId);
    const validItems: any[] = [];
    const skippedItems: any[] = [];

    for (const p of products) {
      if (!p.barcode || !p.barcode.trim()) {
        skippedItems.push({ id: p.id, name: p.name, reason: "Barkod eksik" });
        continue;
      }
      const rawPrice = parseFloat(p.price || "0");
      const effectivePrice = hbService.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);
      validItems.push({
        MerchantSku: p.barcode.trim(),
        HepsiburadaSku: p.hepsiburada_sku || "",
        Price: effectivePrice,
        AvailableStock: parseInt(p.stock_quantity || "0", 10),
        DispatchTime: settings.defaultDispatchTime || 1,
      });
    }

    if (validItems.length === 0) {
      return res.status(400).json({ error: "Seçilen ürünlerin hiçbirinde geçerli barkod bulunamadı.", skipped: skippedItems });
    }

    const result = await hbService.updatePriceAndStock(validItems);

    await pool.query(
      `UPDATE products 
       SET is_hepsiburada_active = true, 
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
      message: `${validItems.length} ürün Hepsiburada'da ilana açıldı / güncellendi.` 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Toplu Hepsiburada ilana açma başarısız." });
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
    const verifiedAttrs = getAttributesForCategory(catName, catPaths);

    res.json({ success: true, attributes: verifiedAttrs, source: "verified_catalog", categoryId });
  } catch (error: any) {
    try {
      const { getAttributesForCategory, HEPSIBURADA_DEFAULT_CATEGORIES } = await import("../src/data/marketplaceCategoriesData");
      const matchedCat = HEPSIBURADA_DEFAULT_CATEGORIES.find((c: any) => String(c.id) === String(categoryId) || String(c.id) === String(rawCategoryId));
      const catName = matchedCat?.name || (categoryId === "970" ? "USB Flash Bellekler" : String(categoryId));
      const catPaths = matchedCat?.paths || (categoryId === "970" ? ["Bilgisayar", "Veri Depolama", "Usb Bellek"] : []);
      res.json({ success: true, attributes: getAttributesForCategory(catName, catPaths), source: "verified_catalog", categoryId });
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
  const { apiKey, apiSecret, merchantId, categoryMappings, categoryAttributes } = req.body;

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
      categoryMappings: categoryMappings !== undefined ? categoryMappings : (prev.categoryMappings || {}),
      categoryAttributes: categoryAttributes !== undefined ? categoryAttributes : (prev.categoryAttributes || {}),
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
              "INSERT INTO customers (store_id, email, password, full_name, name, surname) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
              [storeId, order.email, 'marketplace_user', rawCustName3, firstName3, surname3]
            );
            customerId = newCust.rows[0].id;
          }

          const saleRes = await client.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
            [storeId, order.total, 'TRY', 'completed', order.customer, customerId, 'Trendyol Satış', `Trendyol Siparişi: ${order.id}`]
          );
          const saleId = saleRes.rows[0].id;

          const invoiceNumber = `TY-${order.id}`;
          const totalAmount = parseFloat(order.total);
          const taxAmount = totalAmount * 0.20;
          const grandTotal = totalAmount;
          const subtotal = grandTotal - taxAmount;

          const invoiceRes = await client.query(
            "INSERT INTO sales_invoices (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id",
            [storeId, saleId, customerId, invoiceNumber, new Date(), subtotal, taxAmount, grandTotal, 'TRY', 'Trendyol Satış', `Trendyol Siparişi: ${order.id}`, 'marketplace', 'completed']
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
            await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'Trendyol', order.id);
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
      const response = await axios.post(`https://api.trendyol.com/sapigw/suppliers/${settings.merchantId}/v2/products`, payload, {
        auth: { username: settings.apiKey, password: settings.apiSecret }
      });
      await pool.query("UPDATE products SET is_trendyol_active = true, trendyol_id = $1 WHERE id = $2", [response.data.batchRequestId, productId]);
      res.json({ success: true, batchRequestId: response.data.batchRequestId });
    } catch (e: any) {
      const errMsg = e.response?.data?.errors?.[0]?.message || e.message;
      await pool.query("UPDATE products SET trendyol_last_error = $1 WHERE id = $2", [errMsg, productId]);
      res.status(400).json({ error: errMsg });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Get Trendyol Categories
router.get("/trendyol/categories", authenticate, async (req: any, res) => {
  try {
    const response = await axios.get("https://api.trendyol.com/sapigw/product-categories");
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
    const response = await axios.get(`https://api.trendyol.com/sapigw/brands?page=${page}&size=${size}`);
    res.json(response.data.brands || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Pazarama Integration ---

// 1. Save Pazarama Settings
router.post("/pazarama/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
  const { apiKey, apiSecret, merchantId, commissionRate, categoryMappings, brandMappings } = req.body;

  try {
    const prevRes = await pool.query("SELECT pazarama_settings, branding FROM stores WHERE id = $1", [storeId]);
    const prevSettings = prevRes.rows[0]?.pazarama_settings || {};
    let br = prevRes.rows[0]?.branding || {};
    if (typeof br === 'string') { try { br = JSON.parse(br); } catch (e) { br = {}; } }

    const settings = {
      ...prevSettings,
      connected: !!(apiKey && apiSecret),
      apiKey,
      apiSecret,
      merchantId: merchantId || prevSettings.merchantId || "",
      commissionRate: commissionRate !== undefined ? Number(commissionRate) : (prevSettings.commissionRate || 0),
      categoryMappings: categoryMappings || prevSettings.categoryMappings || {},
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
              "INSERT INTO customers (store_id, email, password, full_name, name, surname, phone, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
              [storeId, customerEmail, 'marketplace_user', rawCustName4, firstName4, surname4, order.customerPhone || '', order.deliveryAddress || '']
            );
            customerId = newCust.rows[0].id;
          }

          const totalAmount = parseFloat(order.totalAmount || order.grandTotal || 0);
          const saleRes = await client.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
            [storeId, totalAmount, 'TRY', 'completed', customerName, customerId, 'Pazarama Satış', `Pazarama Siparişi: ${orderId}`]
          );
          const saleId = saleRes.rows[0].id;

          // Create Sales Invoice
          const invoiceNumber = `PZ-${orderId}`;
          const taxAmount = totalAmount * 0.20;
          const grandTotal = totalAmount;
          const subtotal = grandTotal - taxAmount;

          const invoiceRes = await client.query(
            "INSERT INTO sales_invoices (store_id, customer_id, sale_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id",
            [storeId, customerId, saleId, invoiceNumber, new Date(), subtotal, taxAmount, grandTotal, 'TRY', 'Pazarama Satış', `Pazarama Siparişi: ${orderId}`, 'marketplace', 'completed']
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
            await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'Pazarama', orderId);
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
