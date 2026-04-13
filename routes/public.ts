import express from "express";
import { pool } from "../models/db.ts";
import crypto from "crypto";

const router = express.Router();

// Helper for Iyzico Signature
function generateIyzicoSignature(apiKey: string, secretKey: string, randomString: string, payload: any) {
  // For Checkout Form Initialize, the PKI string is a concatenation of specific fields
  let pkiString = `[apiKey=${apiKey}],[randomString=${randomString}]`;
  
  if (payload) {
    if (payload.locale) pkiString += `,[locale=${payload.locale}]`;
    if (payload.conversationId) pkiString += `,[conversationId=${payload.conversationId}]`;
    if (payload.price) pkiString += `,[price=${payload.price}]`;
    if (payload.paidPrice) pkiString += `,[paidPrice=${payload.paidPrice}]`;
    if (payload.currency) pkiString += `,[currency=${payload.currency}]`;
    if (payload.basketId) pkiString += `,[basketId=${payload.basketId}]`;
    if (payload.paymentGroup) pkiString += `,[paymentGroup=${payload.paymentGroup}]`;
    if (payload.callbackUrl) pkiString += `,[callbackUrl=${payload.callbackUrl}]`;
  }

  const hash = crypto.createHash('sha1').update(apiKey + randomString + secretKey + pkiString).digest('hex');
  return hash;
}

// Helper for PayPal Access Token
async function getPayPalAccessToken(clientId: string, secret: string, sandbox: boolean) {
  const baseUrl = sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  return data.access_token;
}

// Public: Get Product by Barcode and Store Slug
router.get("/scan/:slug/:barcode", async (req, res) => {
  const { slug, barcode } = req.params;
  const storeRes = await pool.query(`
    SELECT 
      id, name, logo_url, primary_color, default_currency, background_image_url,
      hero_title, hero_subtitle, hero_image_url, about_text,
      instagram_url, facebook_url, twitter_url, whatsapp_number,
      address, phone, parent_id, currency_rates
    FROM stores 
    WHERE slug = $1
  `, [slug]);
  let store = storeRes.rows[0];

  if (store && store.parent_id) {
    // If it's a branch, we use the parent's branding for the scan result
    const parentRes = await pool.query(`
      SELECT 
        id, name, logo_url, primary_color, default_currency, background_image_url,
        hero_title, hero_subtitle, hero_image_url, about_text,
        instagram_url, facebook_url, twitter_url, whatsapp_number,
        address, phone, slug, currency_rates
      FROM stores 
      WHERE id = $1
    `, [store.parent_id]);
    if (parentRes.rows[0]) {
      const parentStore = parentRes.rows[0];
      // Keep the branch ID for logging and stock checking if needed, but use parent branding
      store = { ...parentStore, branch_id: store.id };
    }
  }
  
  if (!store && (slug === 'demo-store' || slug === 'demo')) {
    store = {
      id: -1,
      name: "Demo Mağaza",
      logo_url: "",
      primary_color: "#4f46e5",
      default_currency: "TRY",
      background_image_url: "",
      hero_title: "Hoş Geldiniz",
      hero_subtitle: "En iyi ürünler burada",
      about_text: "Biz bir demo mağazayız."
    };
  }

  if (!store) return res.status(404).json({ error: "Store not found" });

  let product = null;
  if (store.id !== -1) {
    const productRes = await pool.query("SELECT * FROM products WHERE store_id = $1 AND barcode = $2", [store.id, barcode]);
    product = productRes.rows[0];
    
    if (product) {
      const defaultCurrency = store.default_currency || 'TRY';
      const rates = typeof store.currency_rates === 'string' ? JSON.parse(store.currency_rates) : (store.currency_rates || { "USD": 1, "EUR": 1, "GBP": 1 });
      let convertedPrice = product.price;
      const fromCurrency = product.currency || 'TRY';
      
      if (fromCurrency !== defaultCurrency) {
        if (defaultCurrency === 'TRY') {
          const rate = rates[fromCurrency] || 1;
          convertedPrice = product.price * rate;
        } else if (fromCurrency === 'TRY') {
          const rate = rates[defaultCurrency] || 1;
          convertedPrice = product.price / rate;
        } else {
          const fromRate = rates[fromCurrency] || 1;
          const toRate = rates[defaultCurrency] || 1;
          convertedPrice = (product.price * fromRate) / toRate;
        }
      }
      
      product = {
        ...product,
        price: convertedPrice,
        original_price: product.price,
        original_currency: product.currency,
        currency: defaultCurrency
      };
    }
  }
  
  if (!product) {
    // Demo product logic: Return a sample product instead of 404 for any store
    const demoProduct = {
      id: 0,
      store_id: store.id,
      barcode: barcode,
      name: "Demo Ürün (Örnek)",
      price: 129.90,
      currency: store.default_currency || 'TRY',
      description: "Bu bir demo üründür. Sistemde gerçek bir ürün bulunamadığında bu örnek gösterilir.",
      updated_at: new Date().toISOString(),
      is_demo: true
    };
    return res.json({ ...demoProduct, store });
  }

  // Log the scan
  await pool.query("INSERT INTO scan_logs (store_id, product_id) VALUES ($1, $2)", [store.branch_id || store.id, product.id]);

  res.json({ ...product, store });
});

// Public: Demo Request
router.post("/demo-request", async (req, res) => {
  const { name, storeName, phone, email, notes } = req.body;
  try {
    await pool.query(
      "INSERT INTO leads (name, store_name, phone, email, notes) VALUES ($1, $2, $3, $4, $5)",
      [name, storeName, phone, email, notes]
    );
    res.json({ success: true, message: "Talebiniz başarıyla alındı." });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/store/:slug", async (req, res) => {
  const { slug } = req.params;
  const storeRes = await pool.query(`
    SELECT 
      id, name, logo_url, primary_color, default_currency, background_image_url,
      hero_title, hero_subtitle, hero_image_url, about_text,
      instagram_url, facebook_url, twitter_url, whatsapp_number,
      address, phone, parent_id
    FROM stores 
    WHERE slug = $1
  `, [slug]);
  let store = storeRes.rows[0];

  if (store && store.parent_id) {
    // This is a branch. Redirect to parent store's website.
    const parentRes = await pool.query("SELECT slug FROM stores WHERE id = $1", [store.parent_id]);
    if (parentRes.rows[0]) {
      return res.json({ redirect: `/store/${parentRes.rows[0].slug}`, isBranch: true });
    }
  }
  
  if (!store && (slug === 'demo-store' || slug === 'demo')) {
    store = {
      id: -1,
      name: "Demo Mağaza",
      logo_url: "",
      primary_color: "#4f46e5",
      default_currency: "TRY",
      background_image_url: "",
      hero_title: "Hoş Geldiniz",
      hero_subtitle: "En iyi ürünler burada",
      about_text: "Biz bir demo mağazayız."
    };
  }
  
  if (!store) return res.status(404).json({ error: "Store not found" });
  res.json(store);
});

// Public: Get Store Products by Slug
router.get("/store/:slug/products", async (req, res) => {
  const { slug } = req.params;
  const storeRes = await pool.query("SELECT id, default_currency, currency_rates FROM stores WHERE slug = $1", [slug]);
  let store = storeRes.rows[0];

  if (!store && (slug === 'demo-store' || slug === 'demo')) {
    store = { id: -1, default_currency: 'TRY', currency_rates: { "USD": 45.0, "EUR": 48.5, "GBP": 56.2 } };
  }

  if (!store) return res.status(404).json({ error: "Store not found" });

  if (store.id === -1) {
    // Return demo products
    return res.json([
      { id: 1, name: "Örnek Ürün 1", price: 100, currency: "TRY", barcode: "123", description: "Açıklama 1" },
      { id: 2, name: "Örnek Ürün 2", price: 200, currency: "TRY", barcode: "456", description: "Açıklama 2" },
      { id: 3, name: "Örnek Ürün 3", price: 300, currency: "TRY", barcode: "789", description: "Açıklama 3" }
    ]);
  }

  const productsRes = await pool.query("SELECT * FROM products WHERE store_id = $1 ORDER BY name ASC", [store.id]);
  
  // Convert prices to store's default currency
  const defaultCurrency = store.default_currency || 'TRY';
  const rates = typeof store.currency_rates === 'string' ? JSON.parse(store.currency_rates) : (store.currency_rates || { "USD": 1, "EUR": 1, "GBP": 1 });
  
  const convertedProducts = productsRes.rows.map(p => {
    let convertedPrice = p.price;
    const fromCurrency = p.currency || 'TRY';
    
    if (fromCurrency !== defaultCurrency) {
      if (defaultCurrency === 'TRY') {
        const rate = rates[fromCurrency] || 1;
        convertedPrice = p.price * rate;
      } else if (fromCurrency === 'TRY') {
        const rate = rates[defaultCurrency] || 1;
        convertedPrice = p.price / rate;
      } else {
        const fromRate = rates[fromCurrency] || 1;
        const toRate = rates[defaultCurrency] || 1;
        convertedPrice = (p.price * fromRate) / toRate;
      }
    }
    
    return {
      ...p,
      price: convertedPrice,
      original_price: p.price,
      original_currency: p.currency,
      currency: defaultCurrency
    };
  });

  res.json(convertedProducts);
});

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "customer-secret-key";

// Customer: Register
router.post("/customers/register", async (req, res) => {
  const { storeId, email, password, name, surname, phone, address, country, city, tc_id, is_corporate, marketing_email, marketing_sms } = req.body;
  if (!storeId || !email || !password || !name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const existing = await pool.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Bu e-posta adresi zaten kayıtlı." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO customers (store_id, email, password, full_name, surname, phone, address, country, city, tc_id, is_corporate, marketing_email, marketing_sms) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id, email, full_name as name, surname, phone, address, country, city, tc_id, is_corporate, marketing_email, marketing_sms",
      [storeId, email, hashedPassword, name, surname || '', phone || '', address || '', country || '', city || '', tc_id || '', is_corporate || false, marketing_email || false, marketing_sms || false]
    );
    res.json({ success: true, customer: result.rows[0] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Customer: Login
router.post("/customers/login", async (req, res) => {
  const { storeId, email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM customers WHERE store_id = $1 AND email = $2", [storeId, email]);
    const customer = result.rows[0];
    if (!customer) return res.status(401).json({ error: "E-posta veya şifre hatalı." });

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid) return res.status(401).json({ error: "E-posta veya şifre hatalı." });

    const token = jwt.sign({ id: customer.id, storeId: customer.store_id, type: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      customer: { id: customer.id, email: customer.email, name: customer.full_name, surname: customer.surname, phone: customer.phone, address: customer.address, country: customer.country, city: customer.city, tc_id: customer.tc_id, is_corporate: customer.is_corporate, marketing_email: customer.marketing_email, marketing_sms: customer.marketing_sms } 
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Customer Middleware
const authenticateCustomer = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'customer') throw new Error("Invalid token type");
    req.customer = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Customer: Profile
router.get("/customers/profile", authenticateCustomer, async (req: any, res) => {
  try {
    const result = await pool.query("SELECT id, email, full_name as name, surname, phone, address, country, city, tc_id, is_corporate, marketing_email, marketing_sms FROM customers WHERE id = $1", [req.customer.id]);
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/customers/profile", authenticateCustomer, async (req: any, res) => {
  const { name, surname, phone, address, country, city, tc_id, is_corporate, marketing_email, marketing_sms } = req.body;
  try {
    const result = await pool.query(
      "UPDATE customers SET full_name = $1, surname = $2, phone = $3, address = $4, country = $5, city = $6, tc_id = $7, is_corporate = $8, marketing_email = $9, marketing_sms = $10 WHERE id = $11 RETURNING id, email, full_name as name, surname, phone, address, country, city, tc_id, is_corporate, marketing_email, marketing_sms",
      [name, surname, phone, address, country, city, tc_id, is_corporate, marketing_email, marketing_sms, req.customer.id]
    );
    res.json({ success: true, customer: result.rows[0] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Customer: Orders
router.get("/customers/orders", authenticateCustomer, async (req: any, res) => {
  try {
    const result = await pool.query("SELECT * FROM sales WHERE customer_id = $1 ORDER BY created_at DESC", [req.customer.id]);
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/customers/orders/:id", authenticateCustomer, async (req: any, res) => {
  try {
    const saleRes = await pool.query("SELECT * FROM sales WHERE id = $1 AND customer_id = $2", [req.params.id, req.customer.id]);
    if (saleRes.rows.length === 0) return res.status(404).json({ error: "Order not found" });
    
    const itemsRes = await pool.query("SELECT * FROM sale_items WHERE sale_id = $1", [req.params.id]);
    res.json({ ...saleRes.rows[0], items: itemsRes.rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Customer: Returns
router.post("/returns", authenticateCustomer, async (req: any, res) => {
  const { saleId, reason, items } = req.body;
  try {
    const saleRes = await pool.query("SELECT id FROM sales WHERE id = $1 AND customer_id = $2", [saleId, req.customer.id]);
    if (saleRes.rows.length === 0) return res.status(404).json({ error: "Order not found" });

    const result = await pool.query(
      "INSERT INTO return_requests (store_id, sale_id, customer_id, reason, items, status) VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *",
      [req.customer.storeId, saleId, req.customer.id, reason, JSON.stringify(items || [])]
    );
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/returns", authenticateCustomer, async (req: any, res) => {
  try {
    const result = await pool.query("SELECT * FROM return_requests WHERE customer_id = $1 ORDER BY created_at DESC", [req.customer.id]);
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Public: Website Content (FAQ, Blog, Legal)
router.get("/store/:slug/content", async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await pool.query(
      "SELECT faq, blog_posts, legal_pages, social_links, about_text, hero_title, hero_subtitle, hero_image_url FROM stores WHERE slug = $1",
      [slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Public: Get Products by Category/Label
router.get("/store/:slug/collections/:type", async (req, res) => {
  const { slug, type } = req.params; // type: 'new', 'bestseller', 'discounted' or category name
  try {
    const storeRes = await pool.query("SELECT id, default_currency, currency_rates FROM stores WHERE slug = $1", [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    const store = storeRes.rows[0];
    const storeId = store.id;

    let query = "SELECT * FROM products WHERE store_id = $1";
    let params: any[] = [storeId];

    if (type === 'new') {
      query += " AND labels @> '\"Yeni\"'";
    } else if (type === 'bestseller') {
      query += " AND labels @> '\"Çok Satanlar\"'";
    } else if (type === 'discounted') {
      query += " AND labels @> '\"İndirimde\"'";
    } else {
      query += " AND (LOWER(category) = LOWER($2) OR LOWER(sub_category) = LOWER($2))";
      params.push(type);
    }

    query += " ORDER BY updated_at DESC LIMIT 50";
    const result = await pool.query(query, params);
    
    // Convert prices to store's default currency
    const defaultCurrency = store.default_currency || 'TRY';
    const rates = typeof store.currency_rates === 'string' ? JSON.parse(store.currency_rates) : (store.currency_rates || { "USD": 1, "EUR": 1, "GBP": 1 });
    
    const convertedProducts = result.rows.map(p => {
      let convertedPrice = p.price;
      const fromCurrency = p.currency || 'TRY';
      
      if (fromCurrency !== defaultCurrency) {
        if (defaultCurrency === 'TRY') {
          const rate = rates[fromCurrency] || 1;
          convertedPrice = p.price * rate;
        } else if (fromCurrency === 'TRY') {
          const rate = rates[defaultCurrency] || 1;
          convertedPrice = p.price / rate;
        } else {
          const fromRate = rates[fromCurrency] || 1;
          const toRate = rates[defaultCurrency] || 1;
          convertedPrice = (p.price * fromRate) / toRate;
        }
      }
      
      return {
        ...p,
        price: convertedPrice,
        original_price: p.price,
        original_currency: p.currency,
        currency: defaultCurrency
      };
    });

    res.json(convertedProducts);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Update Public Sales to handle customer_id
router.post("/sales", async (req, res) => {
  const { storeId, items, total, currency, customerName, customerPhone, customerAddress, customerEmail, notes, paymentMethod, customerId, createAccount } = req.body;
  
  if (!paymentMethod) {
    return res.status(400).json({ error: "Lütfen bir ödeme yöntemi seçin." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    let finalCustomerId = customerId;

    if (createAccount && customerEmail) {
      // Check if customer exists
      const existingCustomer = await client.query("SELECT id FROM customers WHERE email = $1 AND store_id = $2", [customerEmail, storeId]);
      if (existingCustomer.rows.length > 0) {
        finalCustomerId = existingCustomer.rows[0].id;
      } else {
        // Create new customer
        const newCustomer = await client.query(
          "INSERT INTO customers (store_id, name, surname, email, phone, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
          [storeId, customerName?.split(' ')[0] || '', customerName?.split(' ')[1] || '', customerEmail, customerPhone, customerAddress]
        );
        finalCustomerId = newCustomer.rows[0].id;
      }
    }

    const saleRes = await client.query(
      "INSERT INTO sales (store_id, total_amount, currency, customer_name, customer_phone, customer_address, notes, payment_method, status, customer_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9) RETURNING id",
      [storeId, total || 0, currency || 'TRY', customerName || 'Müşteri', customerPhone || '', customerAddress || '', notes || '', paymentMethod, finalCustomerId || null]
    );
    const saleId = saleRes.rows[0].id;

    if (!items || !Array.isArray(items)) {
      throw new Error("Sipariş içeriği geçersiz.");
    }

    for (const item of items) {
      await client.query(
        "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [saleId, item.productId || item.id, item.name || 'Bilinmeyen Ürün', item.barcode || '', item.quantity || 1, item.price || 0, (item.price || 0) * (item.quantity || 1), currency || 'TRY']
      );
    }

    // Handle Payment Gateways
    const storeRes = await client.query("SELECT payment_settings, default_currency FROM stores WHERE id = $1", [storeId]);
    const storeData = storeRes.rows[0];
    const paymentSettings = storeData?.payment_settings || {};

    // 1. Payoneer Integration
    if (paymentMethod === 'payoneer' && paymentSettings.payoneer_enabled) {
      const { payoneer_username, payoneer_password, payoneer_store_code, payoneer_sandbox } = paymentSettings;
      
      if (payoneer_username && payoneer_password && payoneer_store_code) {
        const baseUrl = payoneer_sandbox ? 'https://api.sandbox.checkout.payoneer.com' : 'https://api.checkout.payoneer.com';
        const auth = Buffer.from(`${payoneer_username}:${payoneer_password}`).toString('base64');
        
        const listRequest = {
          transactionId: `SALE-${saleId}-${Date.now()}`,
          country: "TR", 
          division: payoneer_store_code,
          integration: "HOSTED_CHECKOUT",
          operation: "CHARGE",
          payment: {
            amount: total,
            currency: currency || storeData.default_currency || 'TRY',
            reference: `Order #${saleId}`
          },
          style: {
            language: "en_US"
          },
          callback: {
            returnUrl: `${req.headers.origin}/checkout/success?saleId=${saleId}`,
            cancelUrl: `${req.headers.origin}/checkout/cancel?saleId=${saleId}`,
            notificationUrl: `${req.headers.origin}/api/public/webhooks/payoneer`
          }
        };

        try {
          const response = await fetch(`${baseUrl}/api/lists`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(listRequest)
          });

          const result = await response.json();
          if (result.links && result.links.redirect) {
            await client.query("COMMIT");
            return res.json({ 
              success: true, 
              saleId, 
              redirectUrl: result.links.redirect,
              paymentProvider: 'payoneer'
            });
          }
        } catch (payoneerErr) {
          console.error("Payoneer Fetch Error:", payoneerErr);
        }
      }
    }

    // 2. Iyzico Integration
    if (paymentMethod === 'iyzico' && paymentSettings.iyzico_enabled) {
      const { iyzico_api_key, iyzico_secret_key, iyzico_sandbox } = paymentSettings;
      if (iyzico_api_key && iyzico_secret_key) {
        const baseUrl = iyzico_sandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com';
        const randomString = Date.now().toString();
        const signature = generateIyzicoSignature(iyzico_api_key, iyzico_secret_key, randomString, {});
        
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const callbackUrl = `${protocol}://${host}/api/public/webhooks/iyzico?saleId=${saleId}`;

        const iyzicoRequest = {
          locale: "tr",
          conversationId: saleId.toString(),
          price: total.toString(),
          paidPrice: total.toString(),
          currency: currency || storeData.default_currency || 'TRY',
          basketId: `B-${saleId}`,
          paymentGroup: "PRODUCT",
          callbackUrl: callbackUrl,
          enabledInstallments: [1, 2, 3, 6, 9],
          buyer: {
            id: customerId?.toString() || "GUEST",
            name: customerName?.split(' ')[0] || "Müşteri",
            surname: customerName?.split(' ').slice(1).join(' ') || "Soyad",
            email: customerEmail || "customer@example.com",
            identityNumber: "11111111111",
            registrationAddress: customerAddress || "Adres",
            ip: req.ip,
            city: "Istanbul",
            country: "Turkey"
          },
          shippingAddress: {
            contactName: customerName || "Müşteri",
            city: "Istanbul",
            country: "Turkey",
            address: customerAddress || "Adres"
          },
          billingAddress: {
            contactName: customerName || "Müşteri",
            city: "Istanbul",
            country: "Turkey",
            address: customerAddress || "Adres"
          },
          basketItems: items.map(item => ({
            id: (item.productId || item.id).toString(),
            name: item.name || 'Ürün',
            category1: "Genel",
            itemType: "PHYSICAL",
            price: item.price.toString()
          }))
        };

        try {
          const response = await fetch(`${baseUrl}/payment/iyzipay/checkoutform/initialize/auth`, {
            method: 'POST',
            headers: {
              'Authorization': `IYZIPAY ${Buffer.from(`${iyzico_api_key}:${signature}`).toString('base64')}`,
              'x-iyzipay-rnd': randomString,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(iyzicoRequest)
          });

          const result = await response.json();
          if (result.status === 'success' && result.paymentPageUrl) {
            await client.query("COMMIT");
            return res.json({ 
              success: true, 
              saleId, 
              redirectUrl: result.paymentPageUrl,
              paymentProvider: 'iyzico'
            });
          }
        } catch (iyzicoErr) {
          console.error("Iyzico Fetch Error:", iyzicoErr);
        }
      }
    }

    // 3. PayPal Integration
    if (paymentMethod === 'paypal' && paymentSettings.paypal_enabled) {
      const { paypal_client_id, paypal_secret, paypal_sandbox } = paymentSettings;
      if (paypal_client_id && paypal_secret) {
        try {
          const accessToken = await getPayPalAccessToken(paypal_client_id, paypal_secret, paypal_sandbox);
          const baseUrl = paypal_sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
          
          const paypalRequest = {
            intent: "CAPTURE",
            purchase_units: [{
              reference_id: saleId.toString(),
              amount: {
                currency_code: currency || storeData.default_currency || 'USD',
                value: total.toString()
              }
            }],
            application_context: {
              return_url: `${req.headers.origin}/checkout/success?saleId=${saleId}`,
              cancel_url: `${req.headers.origin}/checkout/cancel?saleId=${saleId}`
            }
          };

          const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(paypalRequest)
          });

          const result = await response.json();
          const approveLink = result.links?.find((l: any) => l.rel === 'approve');
          
          if (approveLink) {
            await client.query("COMMIT");
            return res.json({ 
              success: true, 
              saleId, 
              redirectUrl: approveLink.href,
              paymentProvider: 'paypal'
            });
          }
        } catch (paypalErr) {
          console.error("PayPal Fetch Error:", paypalErr);
        }
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, saleId });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Public: Registration Request
router.post("/register-request", async (req, res) => {
  const { 
    storeName, username, password, companyTitle, 
    address, phone, country, language, currency, plan, 
    uploadMethod, excelData, mapping 
  } = req.body;
  
  try {
    await pool.query(
      `INSERT INTO registration_requests 
      (store_name, username, password, company_title, address, phone, country, language, currency, plan, upload_method, excel_data, mapping) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [storeName, username, password, companyTitle, address, phone, country || 'TR', language, currency, plan, uploadMethod, JSON.stringify(excelData || []), JSON.stringify(mapping || {})]
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Public Sales Status
router.get("/sales/:id/status", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT status FROM sales WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Sale not found" });
    res.json({ status: result.rows[0].status });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Public Quotation View
router.get("/quotations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT q.*, s.name as store_name, s.logo_url, s.address as store_address, s.phone as store_phone, s.email as store_email FROM quotations q JOIN stores s ON q.store_id = s.id WHERE q.id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Quotation not found" });
    }
    
    const quotation = result.rows[0];
    const itemsResult = await pool.query("SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id ASC", [id]);
    quotation.items = itemsResult.rows;
    
    res.json(quotation);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Public Quotation Action (Approve/Reject)
router.post("/quotations/:id/action", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const quotationId = parseInt(id);
    const { action, notes: customerNotes, paymentMethod: bodyPaymentMethod, dueDate: bodyDueDate } = req.body; // action: 'approve' or 'reject'
    
    console.log(`[PublicQuotationAction] ID: ${id}, Action: ${action}, Notes: ${customerNotes}`);

    if (isNaN(quotationId)) {
      return res.status(400).json({ error: "Invalid quotation ID" });
    }

    if (action !== 'approve') {
      console.log(`[PublicQuotationAction] Rejecting quotation ${quotationId}`);
      const result = await pool.query(
        "UPDATE quotations SET status = 'cancelled', notes = COALESCE(notes, '') || '\nCustomer Note (Reject): ' || $1 WHERE id = $2 AND status = 'pending' RETURNING id",
        [customerNotes || '', quotationId]
      );
      
      console.log(`[PublicQuotationAction] Reject result:`, result.rows);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Quotation not found or already processed" });
      }
      return res.json({ success: true });
    }

    // Approval logic (similar to store admin approval)
    console.log(`[PublicQuotationAction] Approving quotation ${quotationId}`);
    await client.query("BEGIN");
    
    const qResult = await client.query(
      "SELECT * FROM quotations WHERE id = $1 FOR UPDATE",
      [quotationId]
    );
    
    if (qResult.rows.length === 0) {
      console.error(`[PublicQuotationAction] Quotation ${quotationId} not found`);
      throw new Error("Quotation not found");
    }
    
    const quotation = qResult.rows[0];
    const storeId = quotation.store_id;
    
    console.log(`[PublicQuotationAction] Quotation found:`, { id: quotation.id, status: quotation.status, is_sale: quotation.is_sale });

    if (quotation.status === 'approved' || quotation.is_sale) {
      console.warn(`[PublicQuotationAction] Quotation ${quotationId} already processed`);
      throw new Error("Quotation already approved or converted to sale");
    }
    
    const paymentMethod = bodyPaymentMethod || quotation.payment_method || 'cash';
    const dueDate = (bodyDueDate || quotation.due_date) || null;

    if (!quotation.company_id && paymentMethod === 'term') {
      throw new Error("Quotation must be linked to a company for 'Term' payment");
    }

    // Create Sale
    console.log(`[PublicQuotationAction] Creating sale for quotation ${quotationId}`);
    const saleRes = await client.query(
      "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, payment_method, due_date, quotation_id, notes, company_id) VALUES ($1, $2, $3, 'completed', $4, $5, $6, $7, $8, $9) RETURNING id",
      [storeId, quotation.total_amount, quotation.currency, quotation.customer_name, paymentMethod, dueDate, quotation.id, (quotation.notes || '') + (customerNotes ? `\nCustomer Note: ${customerNotes}` : ''), quotation.company_id]
    );
    const saleId = saleRes.rows[0].id;
    console.log(`[PublicQuotationAction] Sale created: ${saleId}`);

    // Items and Stock
    const itemsRes = await client.query("SELECT * FROM quotation_items WHERE quotation_id = $1", [quotation.id]);
    for (const item of itemsRes.rows) {
      await client.query(
        "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [saleId, item.product_id, item.product_name, item.barcode, item.quantity, item.unit_price, item.total_price]
      );
      
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
          [item.quantity, item.product_id]
        );

        await client.query(
          "INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, customer_info) VALUES ($1, $2, 'out', $3, 'quotation', $4, $5, $6)",
          [storeId, item.product_id, item.quantity, `Müşteri Onaylı Satış #${saleId} (Teklif #${quotation.id})`, item.unit_price, quotation.customer_name]
        );
      }
    }

    // Current Account Transactions
    if (quotation.company_id) {
      await client.query(
        "INSERT INTO current_account_transactions (store_id, company_id, quotation_id, sale_id, type, amount, description, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [storeId, quotation.company_id, quotation.id, saleId, 'debt', quotation.total_amount, `Müşteri Onaylı Satış #${quotation.id} (${paymentMethod})`, paymentMethod]
      );

      if (paymentMethod !== 'term') {
        await client.query(
          "INSERT INTO current_account_transactions (store_id, company_id, quotation_id, sale_id, type, amount, description, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [storeId, quotation.company_id, quotation.id, saleId, 'credit', quotation.total_amount, `Teklif #${quotation.id} Ödemesi (${paymentMethod})`, paymentMethod]
        );
      }
    }

    if (paymentMethod !== 'term') {
      await client.query(
        "INSERT INTO sale_payments (sale_id, payment_method, amount) VALUES ($1, $2, $3)",
        [saleId, paymentMethod, quotation.total_amount]
      );
    }

    // Update Quotation Status
    console.log(`[PublicQuotationAction] Updating quotation ${quotationId} status to approved`);
    await client.query(
      "UPDATE quotations SET status = 'approved', is_sale = TRUE, payment_method = $1, due_date = $2, notes = COALESCE(notes, '') || $3 WHERE id = $4",
      [paymentMethod, dueDate, customerNotes ? `\nCustomer Note: ${customerNotes}` : '', quotation.id]
    );

    await client.query("COMMIT");
    console.log(`[PublicQuotationAction] Successfully processed quotation ${quotationId}`);
    res.json({ success: true, saleId });
  } catch (e: any) {
    console.error(`[PublicQuotationAction] Error processing quotation:`, e);
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.get("/schema-check", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='current_account_transactions'
    `);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Iyzico Webhook / Callback
router.post("/webhooks/iyzico", async (req, res) => {
  const { token } = req.body;
  const { saleId } = req.query;

  if (!token || !saleId) {
    return res.status(400).send("Missing token or saleId");
  }

  try {
    // We need to retrieve the store's iyzico settings to verify the token
    const saleRes = await pool.query("SELECT store_id FROM sales WHERE id = $1", [saleId]);
    if (saleRes.rows.length === 0) return res.status(404).send("Sale not found");
    
    const storeId = saleRes.rows[0].store_id;
    const storeRes = await pool.query("SELECT payment_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0].payment_settings;

    const baseUrl = settings.iyzico_sandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com';
    const randomString = Date.now().toString();
    const signature = generateIyzicoSignature(settings.iyzico_api_key, settings.iyzico_secret_key, randomString, {});

    const response = await fetch(`${baseUrl}/payment/iyzipay/checkoutform/auth/retrieve`, {
      method: 'POST',
      headers: {
        'Authorization': `IYZIPAY ${Buffer.from(`${settings.iyzico_api_key}:${signature}`).toString('base64')}`,
        'x-iyzipay-rnd': randomString,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ locale: "tr", conversationId: saleId.toString(), token })
    });

    const result = await response.json();
    
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrlForRedirect = `${protocol}://${host}`;

    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      await pool.query("UPDATE sales SET status = 'processing' WHERE id = $1", [saleId]);
      // Redirect back to success page
      res.redirect(`${baseUrlForRedirect}/checkout/success?saleId=${saleId}`);
    } else {
      await pool.query("UPDATE sales SET status = 'cancelled' WHERE id = $1", [saleId]);
      res.redirect(`${baseUrlForRedirect}/checkout/cancel?saleId=${saleId}`);
    }
  } catch (e: any) {
    console.error("Iyzico Callback Error:", e.message);
    res.status(500).send(e.message);
  }
});

// Payoneer Webhook
router.post("/webhooks/payoneer", async (req, res) => {
  console.log("Payoneer Webhook Received:", JSON.stringify(req.body, null, 2));
  const { transactionId, status, result } = req.body;

  if (!transactionId) {
    return res.status(400).json({ error: "Missing transactionId" });
  }

  // transactionId format: SALE-{saleId}-{timestamp}
  const parts = transactionId.split("-");
  const saleId = parts[1];

  if (!saleId) {
    return res.status(400).json({ error: "Invalid transactionId format" });
  }

  try {
    // Status can be 'PROCESSED', 'PENDING', 'FAILED', etc.
    // Result code can be '00000' for success
    let newStatus = 'pending';
    if (result && result.code === '00000') {
      newStatus = 'processing'; // Or 'completed' depending on workflow
    } else if (status === 'FAILED') {
      newStatus = 'cancelled';
    }

    await pool.query("UPDATE sales SET status = $1 WHERE id = $2", [newStatus, saleId]);
    res.json({ success: true });
  } catch (e: any) {
    console.error("Webhook Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// PayPal Capture
router.post("/paypal/capture", async (req, res) => {
  const { orderId, saleId } = req.body;

  if (!orderId || !saleId) {
    return res.status(400).json({ error: "Missing orderId or saleId" });
  }

  try {
    const saleRes = await pool.query("SELECT store_id FROM sales WHERE id = $1", [saleId]);
    if (saleRes.rows.length === 0) return res.status(404).json({ error: "Sale not found" });
    
    const storeId = saleRes.rows[0].store_id;
    const storeRes = await pool.query("SELECT payment_settings FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0].payment_settings;

    const accessToken = await getPayPalAccessToken(settings.paypal_client_id, settings.paypal_secret, settings.paypal_sandbox);
    const baseUrl = settings.paypal_sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    if (result.status === 'COMPLETED') {
      await pool.query("UPDATE sales SET status = 'processing' WHERE id = $1", [saleId]);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Payment not completed", details: result });
    }
  } catch (e: any) {
    console.error("PayPal Capture Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
