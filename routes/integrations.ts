import express from "express";
import { pool } from "../models/db";
import axios from "axios";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Helper function to process marketplace order lines
async function processMarketplaceOrderLines(client: any, storeId: number, saleId: number, salesInvoiceId: number, lines: any[], marketplaceName: string, orderId: string) {
  for (const line of lines) {
    let productId = null;
    let currentStock = 0;
    
    if (line.barcode) {
      const prodRes = await client.query("SELECT id, stock_quantity FROM products WHERE store_id = $1 AND barcode = $2", [storeId, line.barcode]);
      if (prodRes.rows.length > 0) {
        productId = prodRes.rows[0].id;
        currentStock = prodRes.rows[0].stock_quantity;
      }
    }
    
    if (!productId && line.sku) {
      const prodRes = await client.query("SELECT id, stock_quantity FROM products WHERE store_id = $1 AND sku = $2", [storeId, line.sku]);
      if (prodRes.rows.length > 0) {
        productId = prodRes.rows[0].id;
        currentStock = prodRes.rows[0].stock_quantity;
      }
    }

    const quantity = line.quantity || 1;
    const price = line.price || 0;
    const taxRate = line.taxRate || 20;
    const total = price * quantity;
    const taxAmount = total * (taxRate / 100);
    const name = line.name || `${marketplaceName} Ürünü`;
    
    await client.query(
      "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [saleId, productId, name, line.barcode || '', quantity, price, total]
    );

    await client.query(
      "INSERT INTO sales_invoice_items (sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [salesInvoiceId, name, quantity, price, taxRate, taxAmount, total]
    );

    if (productId) {
      await client.query(
        "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
        [quantity, productId]
      );

      await client.query(
        "INSERT INTO stock_movements (store_id, product_id, type, quantity, notes, previous_stock, new_stock) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [storeId, productId, 'out', quantity, `${marketplaceName} Satışı: ${orderId}`, currentStock, currentStock - quantity]
      );
    }
  }
}

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
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          // Find or create customer
          let customerId = null;
          const buyerName = order.BuyerInfo?.BuyerName || 'Amazon Müşterisi';
          const buyerEmail = order.BuyerInfo?.BuyerEmail || `amazon_${order.AmazonOrderId}@amazon.com`;
          
          const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, buyerEmail]);
          if (custRes.rows.length > 0) {
            customerId = custRes.rows[0].id;
          } else {
            const newCust = await client.query(
              "INSERT INTO customers (store_id, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id",
              [storeId, buyerEmail, 'marketplace_user', buyerName]
            );
            customerId = newCust.rows[0].id;
          }

          // Create a sale record (legacy compatibility)
          const saleRes = await client.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
            [storeId, order.OrderTotal?.Amount || 0, order.OrderTotal?.CurrencyCode || 'TRY', 'completed', buyerName, customerId, 'Amazon Satış', `Amazon Siparişi: ${order.AmazonOrderId}`]
          );
          const saleId = saleRes.rows[0].id;

          // Create Sales Invoice
          const invoiceNumber = `AMZ-${order.AmazonOrderId}`;
          const totalAmount = parseFloat(order.OrderTotal?.Amount || 0);
          const taxAmount = totalAmount * 0.20; // Default 20% tax
          const grandTotal = totalAmount;
          const subtotal = grandTotal - taxAmount;

          const invoiceRes = await client.query(
            "INSERT INTO sales_invoices (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id",
            [storeId, saleId, customerId, invoiceNumber, new Date(order.PurchaseDate || Date.now()), subtotal, taxAmount, grandTotal, order.OrderTotal?.CurrencyCode || 'TRY', 'Amazon Satış', `Amazon Siparişi: ${order.AmazonOrderId}`, 'marketplace', 'completed']
          );
          const salesInvoiceId = invoiceRes.rows[0].id;

          // Note: Amazon SP-API requires a separate call to get order items. 
          // For now, we'll use a generic item unless order.items is populated.
          const lines = order.items || [];
          const mappedLines = lines.map((l: any) => ({
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

    // Gerçek N11 API Çağrısı
    const response = await axios.post("https://api.n11.com/ws/OrderService.wsdl", soapEnvelope, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8' }
    });

    // XML Yanıtını ayrıştırma (Burada gerçek bir XML parser kullanılmalıdır)
    // Örnek olarak gelen veriyi işlediğimizi varsayıyoruz
    const n11Orders = []; // response.data'dan parse edilecek

    let syncedCount = 0;
    for (const order of n11Orders) {
      const existing = await pool.query("SELECT id FROM n11_orders WHERE store_id = $1 AND n11_order_id = $2", [storeId, order.id]);
      if (existing.rows.length === 0) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          // Find or create customer
          let customerId = null;
          const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, order.email]);
          if (custRes.rows.length > 0) {
            customerId = custRes.rows[0].id;
          } else {
            const newCust = await client.query(
              "INSERT INTO customers (store_id, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id",
              [storeId, order.email, 'marketplace_user', order.customer]
            );
            customerId = newCust.rows[0].id;
          }

          const saleRes = await client.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
            [storeId, order.total, 'TRY', 'completed', order.customer, customerId, 'N11 Satış', `N11 Siparişi: ${order.id}`]
          );
          const saleId = saleRes.rows[0].id;

          // Create Sales Invoice
          const invoiceNumber = `N11-${order.id}`;
          const totalAmount = parseFloat(order.total);
          const taxAmount = totalAmount * 0.20;
          const grandTotal = totalAmount;
          const subtotal = grandTotal - taxAmount;

          const invoiceRes = await client.query(
            "INSERT INTO sales_invoices (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id",
            [storeId, saleId, customerId, invoiceNumber, new Date(), subtotal, taxAmount, grandTotal, 'TRY', 'N11 Satış', `N11 Siparişi: ${order.id}`, 'marketplace', 'completed']
          );
          const salesInvoiceId = invoiceRes.rows[0].id;

          // Process order lines
          const lines = order.itemList?.item || [];
          const mappedLines = (Array.isArray(lines) ? lines : [lines]).map((l: any) => ({
            name: l.productName || `N11 Sipariş Kalemi (${order.id})`,
            quantity: l.quantity || 1,
            price: l.price || subtotal,
            barcode: l.sellerStockCode, // Using sellerStockCode as barcode fallback
            sku: l.sellerStockCode,
            taxRate: 20
          }));

          if (mappedLines.length > 0) {
            await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'N11', order.id);
          } else {
            await client.query(
              "INSERT INTO sales_invoice_items (sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
              [salesInvoiceId, `N11 Sipariş Kalemi (${order.id})`, 1, subtotal, 20, taxAmount, grandTotal]
            );
          }

          await client.query(
            "INSERT INTO n11_orders (store_id, n11_order_id, sale_id, sales_invoice_id, status, order_data) VALUES ($1, $2, $3, $4, $5, $6)",
            [storeId, order.id, saleId, salesInvoiceId, 'New', order]
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

    // Gerçek Hepsiburada API Çağrısı
    const response = await axios.get(`https://merchant.hepsiburada.com/api/orders/merchantid/${settings.merchantId}`, {
      auth: { username: settings.apiKey, password: settings.apiSecret }
    });

    const hbOrders = response.data.orders || []; // response.data'dan parse edilecek

    let syncedCount = 0;
    for (const order of hbOrders) {
      const existing = await pool.query("SELECT id FROM hepsiburada_orders WHERE store_id = $1 AND hepsiburada_order_id = $2", [storeId, order.id]);
      if (existing.rows.length === 0) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          // Find or create customer
          let customerId = null;
          const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, order.email]);
          if (custRes.rows.length > 0) {
            customerId = custRes.rows[0].id;
          } else {
            const newCust = await client.query(
              "INSERT INTO customers (store_id, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id",
              [storeId, order.email, 'marketplace_user', order.customer]
            );
            customerId = newCust.rows[0].id;
          }

          const saleRes = await client.query(
            "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
            [storeId, order.total, 'TRY', 'completed', order.customer, customerId, 'Hepsiburada Satış', `Hepsiburada Siparişi: ${order.id}`]
          );
          const saleId = saleRes.rows[0].id;

          // Create Sales Invoice
          const invoiceNumber = `HB-${order.id}`;
          const totalAmount = parseFloat(order.total);
          const taxAmount = totalAmount * 0.20;
          const grandTotal = totalAmount;
          const subtotal = grandTotal - taxAmount;

          const invoiceRes = await client.query(
            "INSERT INTO sales_invoices (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id",
            [storeId, saleId, customerId, invoiceNumber, new Date(), subtotal, taxAmount, grandTotal, 'TRY', 'Hepsiburada Satış', `Hepsiburada Siparişi: ${order.id}`, 'marketplace', 'completed']
          );
          const salesInvoiceId = invoiceRes.rows[0].id;

          // Process order lines
          const lines = order.items || [];
          const mappedLines = lines.map((l: any) => ({
            name: l.productName || `Hepsiburada Sipariş Kalemi (${order.id})`,
            quantity: l.quantity || 1,
            price: l.price || subtotal,
            barcode: l.merchantSku, // Using merchantSku as barcode fallback
            sku: l.merchantSku,
            taxRate: 20
          }));

          if (mappedLines.length > 0) {
            await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'Hepsiburada', order.id);
          } else {
            await client.query(
              "INSERT INTO sales_invoice_items (sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
              [salesInvoiceId, `Hepsiburada Sipariş Kalemi (${order.id})`, 1, subtotal, 20, taxAmount, grandTotal]
            );
          }

          await client.query(
            "INSERT INTO hepsiburada_orders (store_id, hepsiburada_order_id, sale_id, sales_invoice_id, status, order_data) VALUES ($1, $2, $3, $4, $5, $6)",
            [storeId, order.id, saleId, salesInvoiceId, 'New', order]
          );

          await client.query("COMMIT");
          syncedCount++;
        } catch (e) {
          await client.query("ROLLBACK");
          console.error("Hepsiburada Order Sync Error:", e);
        } finally {
          client.release();
        }
      }
    }
    
    const newSettings = { ...settings, last_sync: new Date().toISOString() };
    await pool.query("UPDATE stores SET hepsiburada_settings = $1 WHERE id = $2", [newSettings, storeId]);
    res.json({ success: true, count: syncedCount });
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

    // Gerçek Trendyol API Çağrısı
    const response = await axios.get(`https://api.trendyol.com/sapigw/suppliers/${settings.merchantId}/orders`, {
      auth: { username: settings.apiKey, password: settings.apiSecret }
    });

    const tyOrders = response.data.content || []; 

    let syncedCount = 0;
    for (const order of tyOrders) {
      const existing = await pool.query("SELECT id FROM trendyol_orders WHERE store_id = $1 AND trendyol_order_id = $2", [storeId, order.id]);
      if (existing.rows.length === 0) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          let customerId = null;
          const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, order.email]);
          if (custRes.rows.length > 0) {
            customerId = custRes.rows[0].id;
          } else {
            const newCust = await client.query(
              "INSERT INTO customers (store_id, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id",
              [storeId, order.email, 'marketplace_user', order.customer]
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
  const { apiKey, apiSecret, merchantId, commissionRate, categoryMappings, brandMappings } = req.body;

  try {
    const prevRes = await pool.query("SELECT pazarama_settings FROM stores WHERE id = $1", [storeId]);
    const prevSettings = prevRes.rows[0]?.pazarama_settings || {};

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
        { id: "PZ-" + Math.floor(Math.random() * 100000), total: 520.00, customer: "Mert Aksoy", email: "mert@example.com" },
        { id: "PZ-" + Math.floor(Math.random() * 100000), total: 185.50, customer: "Ece Yılmaz", email: "ece@example.com" }
      ];

      let syncedCount = 0;
      for (const order of mockOrders) {
        const existing = await pool.query("SELECT id FROM pazarama_orders WHERE store_id = $1 AND pazarama_order_id = $2", [storeId, order.id]);
        if (existing.rows.length === 0) {
          const client = await pool.connect();
          try {
            await client.query("BEGIN");

            // Find or create customer
            let customerId = null;
            const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, order.email]);
            if (custRes.rows.length > 0) {
              customerId = custRes.rows[0].id;
            } else {
              const newCust = await client.query(
                "INSERT INTO customers (store_id, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id",
                [storeId, order.email, 'marketplace_user', order.customer]
              );
              customerId = newCust.rows[0].id;
            }

            const saleRes = await client.query(
              "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
              [storeId, order.total, 'TRY', 'completed', order.customer, customerId, 'pazarama', `Pazarama Siparişi: ${order.id}`]
            );
            const saleId = saleRes.rows[0].id;

            // Create Sales Invoice
            const invoiceNumber = `PZ-${order.id}`;
            const totalAmount = order.total;
            const taxAmount = totalAmount * 0.20;
            const grandTotal = totalAmount;
            const subtotal = grandTotal - taxAmount;

            const invoiceRes = await client.query(
              "INSERT INTO sales_invoices (store_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
              [storeId, customerId, invoiceNumber, new Date(), subtotal, taxAmount, grandTotal, 'TRY', 'pazarama', `Pazarama Siparişi: ${order.id}`]
            );
            const salesInvoiceId = invoiceRes.rows[0].id;

            await client.query(
              "INSERT INTO sales_invoice_items (sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
              [salesInvoiceId, `Pazarama Sipariş Kalemi (${order.id})`, 1, subtotal, 20, taxAmount, grandTotal]
            );

            await client.query(
              "INSERT INTO pazarama_orders (store_id, pazarama_order_id, sale_id, sales_invoice_id, status, order_data) VALUES ($1, $2, $3, $4, $5, $6)",
              [storeId, order.id, saleId, salesInvoiceId, 'New', order]
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
            'Version': '1.0',
            'X-Version': '1.0',
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
            'Version': '1.0',
            'X-Version': '1.0',
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
  const { enabled, pixel_id, catalog_id } = req.body;

  try {
    const settings = {
      enabled: !!enabled,
      pixel_id: pixel_id || "",
      catalog_id: catalog_id || ""
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

export default router;
