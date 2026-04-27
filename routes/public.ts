import express from "express";
import { pool, processSaleAutomation } from "../models/db";
import crypto from "crypto";

const router = express.Router();

// Helper for Iyzico Signature
function generateIyzicoSignature(apiKey: string, secretKey: string, randomString: string, payload: any) {
  let pkiString = `[apiKey=${apiKey}][randomString=${randomString}]`;
  
  const fields = [
    'locale', 'conversationId', 'price', 'paidPrice', 'currency', 
    'basketId', 'paymentGroup', 'buyer', 'shippingAddress', 'billingAddress', 
    'basketItems', 'callbackUrl', 'posOrderId', 'enabledInstallments', 'token'
  ];

  const nestedFields: any = {
    buyer: ['id', 'name', 'surname', 'identityNumber', 'email', 'registrationAddress', 'city', 'country', 'ip'],
    shippingAddress: ['contactName', 'city', 'country', 'address'],
    billingAddress: ['contactName', 'city', 'country', 'address'],
    basketItems: ['id', 'name', 'itemType', 'category1', 'category2', 'price']
  };

  for (const field of fields) {
    const value = payload[field];
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        let str = `[${field}=[`;
        if (value.length > 0 && typeof value[0] === 'object') {
          str += value.map(item => {
            let itemStr = "[";
            const subFields = nestedFields[field] || Object.keys(item);
            itemStr += subFields
              .filter((f: string) => item[f] !== undefined && item[f] !== null)
              .map((f: string) => `[${f}=${item[f]}]`)
              .join("");
            itemStr += "]";
            return itemStr;
          }).join("");
        } else {
          str += value.join(", ");
        }
        str += "]]";
        pkiString += str;
      } else if (typeof value === 'object') {
        let str = `[${field}=[`;
        const subFields = nestedFields[field] || Object.keys(value);
        str += subFields
          .filter((f: string) => value[f] !== undefined && value[f] !== null)
          .map((f: string) => `[${f}=${value[f]}]`)
          .join("");
        str += "]]";
        pkiString += str;
      } else {
        pkiString += `[${field}=${value}]`;
      }
    }
  }

  const hash = crypto.createHash('sha1').update(apiKey + randomString + secretKey + pkiString).digest('base64');
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

router.get("/stores/by-domain", async (req, res) => {
  const { domain } = req.query;
  if (!domain) return res.status(400).json({ error: "Domain required" });

  try {
    const normalizedDomain = (domain as string).startsWith("www.") ? (domain as string).substring(4) : domain;
    const result = await pool.query(
      "SELECT slug FROM stores WHERE custom_domain = $1 OR custom_domain = $2 LIMIT 1",
      [domain, normalizedDomain]
    );

    if (result.rows.length > 0) {
      res.json({ slug: result.rows[0].slug });
    } else {
      res.status(404).json({ error: "Store not found" });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/store/:slug", async (req, res) => {
  const { slug } = req.params;
  const storeRes = await pool.query(`
    SELECT 
      id, name, logo_url, favicon_url, primary_color, default_currency, background_image_url,
      hero_title, hero_subtitle, hero_image_url, about_text, description,
      instagram_url, facebook_url, twitter_url, whatsapp_number,
      address, phone, email, emails, phones, footer_links, parent_id, payment_settings, shipping_profiles
    FROM stores 
    WHERE LOWER(slug) = LOWER($1)
  `, [slug]);
  let store = storeRes.rows[0];

  if (store) {
    const jsonFields = ['emails', 'phones', 'footer_links', 'shipping_profiles'];
    jsonFields.forEach(field => {
      if (typeof store[field] === 'string') {
        try {
          store[field] = JSON.parse(store[field]);
        } catch (e) {
          store[field] = [];
        }
      } else if (!store[field]) {
        store[field] = [];
      }
    });

    // Sanitize payment_settings to only expose enabled flags and sandbox mode
    let ps = store.payment_settings || {};
    if (typeof ps === 'string') {
      try {
        ps = JSON.parse(ps);
      } catch (e) {
        ps = {};
      }
    }
    store.payment_settings = {
      iyzico_enabled: !!ps.iyzico_enabled,
      iyzico_sandbox: !!ps.iyzico_sandbox,
      paypal_enabled: !!ps.paypal_enabled,
      paypal_sandbox: !!ps.paypal_sandbox,
      payoneer_enabled: !!ps.payoneer_enabled,
      payoneer_sandbox: !!ps.payoneer_sandbox,
      bank_transfer_enabled: !!ps.bank_transfer_enabled,
      bank_details: ps.bank_details || '',
      cod_enabled: !!ps.cod_enabled
    };
  }

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
  const storeRes = await pool.query("SELECT id, default_currency, currency_rates FROM stores WHERE LOWER(slug) = LOWER($1)", [slug]);
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

  const productsRes = await pool.query("SELECT * FROM products WHERE store_id = $1 AND (is_web_sale = true OR is_web_sale IS NULL) ORDER BY name ASC", [store.id]);
  
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

// Public: Facebook Product Catalog XML Feed
router.get(["/store/:slug/catalog", "/store/:slug/catalog.xml"], async (req, res) => {
  const { slug } = req.params;
  try {
    const storeRes = await pool.query("SELECT id, name, slug, description, default_currency, currency_rates, meta_settings, custom_domain FROM stores WHERE slug = $1", [slug]);
    if (storeRes.rows.length === 0) return res.status(404).send("Store not found");
    const store = storeRes.rows[0];
    
    // Check if meta catalog is enabled
    const metaSettings = typeof store.meta_settings === 'string' ? JSON.parse(store.meta_settings) : (store.meta_settings || {});
    if (metaSettings.enabled === false) {
      return res.status(403).send("Meta Catalog is not enabled for this store.");
    }

    const productsRes = await pool.query("SELECT * FROM products WHERE store_id = $1 AND (is_web_sale = true OR is_web_sale IS NULL) ORDER BY name ASC", [store.id]);
    const products = productsRes.rows;
    
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = store.custom_domain || req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    const catalogCurrency = metaSettings.catalog_currency || store.default_currency || 'TRY';
    const rates = typeof store.currency_rates === 'string' ? JSON.parse(store.currency_rates) : (store.currency_rates || { "USD": 1, "EUR": 1, "GBP": 1 });

    const escapeXml = (unsafe: string) => {
      return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    let xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(store.name)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(store.description || store.name + " Ürün Kataloğu")}</description>\n`;

    products.forEach(p => {
      // Currency conversion
      let convertedPrice = p.price;
      const fromCurrency = p.currency || 'TRY';
      if (fromCurrency !== catalogCurrency) {
        if (catalogCurrency === 'TRY') {
          const rate = rates[fromCurrency] || 1;
          convertedPrice = p.price * rate;
        } else if (fromCurrency === 'TRY') {
          const rate = rates[catalogCurrency] || 1;
          convertedPrice = p.price / rate;
        } else {
          const fromRate = rates[fromCurrency] || 1;
          const toRate = rates[catalogCurrency] || 1;
          convertedPrice = (p.price * fromRate) / toRate;
        }
      }

      const availability = (p.stock_quantity > 0) ? 'in stock' : 'out of stock';
      const productUrl = store.custom_domain ? `${baseUrl}/p/${p.barcode || p.id}` : `${baseUrl}/s/${store.slug}/p/${p.barcode || p.id}`;
      const imageUrl = p.image_url || '';
      const brand = p.brand || store.name;
      const description = escapeXml(p.description || p.name);
      
      const category = p.category ? escapeXml(p.category) : 'Apparel &amp; Accessories';

      xml += `    <item>
      <g:id>${escapeXml(String(p.barcode || p.id))}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${convertedPrice.toFixed(2)} ${catalogCurrency}</g:price>
      <g:google_product_category>${category}</g:google_product_category>
    </item>\n`;
    });

    xml += `  </channel>
</rss>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (e: any) {
    res.status(500).send(e.message);
  }
});

// Public: Store Privacy Policy HTML for Facebook Review
router.get("/store/:slug/privacy", async (req, res) => {
  const { slug } = req.params;
  try {
    const storeRes = await pool.query("SELECT name, legal_pages FROM stores WHERE slug = $1", [slug]);
    if (storeRes.rows.length === 0) return res.status(404).send("Store not found");
    
    const store = storeRes.rows[0];
    const legalPages = typeof store.legal_pages === 'string' ? JSON.parse(store.legal_pages) : (store.legal_pages || {});
    
    // Facebook wants a privacy policy. We'll use the 'kvkk' (PDPL) content or fallback
    const privacyContent = legalPages?.kvkk?.content || legalPages?.pre_info?.content || `${store.name} Gizlilik Politikası (Privacy Policy). Bu sayfa Meta Katalog entegrasyonu için oluşturulmuştur.`;
    
    const html = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${store.name} - Gizlilik Politikası</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { border-bottom: 2px solid #eaeaea; padding-bottom: 0.5rem; }
    .content { white-space: pre-wrap; margin-top: 2rem; }
  </style>
</head>
<body>
  <h1>${store.name} - Gizlilik Politikası</h1>
  <div class="content">${privacyContent}</div>
</body>
</html>
    `;
    
    res.header('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e: any) {
    res.status(500).send(e.message);
  }
});

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";

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

    let query = "SELECT * FROM products WHERE store_id = $1 AND (is_web_sale = true OR is_web_sale IS NULL)";
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
  console.log("POST /api/public/sales request body:", JSON.stringify(req.body, null, 2));
  const { 
    storeId, items, total, currency, customerName, customerPhone, 
    customerAddress, customerCity, customerCountry, customerEmail, 
    customerTcId, notes, paymentMethod, customerId, createAccount 
  } = req.body;
  
  if (!paymentMethod) {
    console.warn("POST /api/public/sales: Missing paymentMethod");
    return res.status(400).json({ error: "Lütfen bir ödeme yöntemi seçin." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    let finalCustomerId = customerId;

    if (customerEmail) {
      const existingCustomer = await client.query("SELECT id FROM customers WHERE email = $1 AND store_id = $2", [customerEmail, storeId]);
      if (existingCustomer.rows.length > 0) {
        finalCustomerId = existingCustomer.rows[0].id;
      } else if (createAccount) {
        // Create new customer
        const newCustomer = await client.query(
          "INSERT INTO customers (store_id, name, surname, email, phone, address, tax_number, tc_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
          [storeId, customerName?.split(' ')[0] || '', customerName?.split(' ').slice(1).join(' ') || '', customerEmail, customerPhone, customerAddress, customerTcId, customerTcId]
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
      const taxRate = Number(item.tax_rate || 20);
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      const taxAmount = itemTotal - (itemTotal / (1 + taxRate / 100));

      await client.query(
        "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [saleId, item.productId || item.id || null, item.name || 'Bilinmeyen Ürün', item.barcode || '', item.quantity || 1, item.price || 0, taxRate, taxAmount, itemTotal, currency || 'TRY']
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
      await client.query("COMMIT");
      return res.json({ 
        success: true, 
        saleId, 
        paymentProvider: 'iyzico',
        initializeUrl: '/api/payment/initialize'
      });
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
    console.error("POST /api/public/sales error:", e);
    res.status(400).json({ error: e.message, stack: e.stack });
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
    
    const storeRes = await client.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
    const branding = storeRes.rows[0]?.branding || {};
    
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
      const taxRate = (item.tax_rate !== undefined && item.tax_rate !== null) ? Number(item.tax_rate) : (branding?.default_tax_rate !== undefined ? Number(branding.default_tax_rate) : 20);
      const kdvHariçPrice = Number(item.unit_price) / (1 + taxRate / 100);
      const kdvHariçTotal = Number(item.quantity) * kdvHariçPrice;
      const taxAmount = (Number(item.quantity) * Number(item.unit_price)) - kdvHariçTotal;

      await client.query(
        "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [saleId, item.product_id, item.product_name, item.barcode, item.quantity, kdvHariçPrice, taxRate, taxAmount, kdvHariçTotal]
      );
      
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
          [item.quantity, item.product_id]
        );

        await client.query(
          "INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, customer_info) VALUES ($1, $2, 'out', $3, 'quotation', $4, $5, $6)",
          [storeId, item.product_id, item.quantity, `Müşteri Onaylı Satış #${saleId} (Teklif #${quotation.id})`, kdvHariçPrice, quotation.customer_name]
        );
      }
    }

    // Current Account Transactions
    if (quotation.company_id) {
      await client.query(
        "INSERT INTO current_account_transactions (store_id, company_id, quotation_id, sale_id, type, amount, description, payment_method, currency, exchange_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [storeId, quotation.company_id, quotation.id, saleId, 'debt', quotation.total_amount, `Müşteri Onaylı Satış #${quotation.id} (${paymentMethod})`, paymentMethod, quotation.currency || 'TRY', quotation.exchange_rate || 1]
      );

      if (paymentMethod !== 'term') {
        await client.query(
          "INSERT INTO current_account_transactions (store_id, company_id, quotation_id, sale_id, type, amount, description, payment_method, currency, exchange_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
          [storeId, quotation.company_id, quotation.id, saleId, 'credit', quotation.total_amount, `Teklif #${quotation.id} Ödemesi (${paymentMethod})`, paymentMethod, quotation.currency || 'TRY', quotation.exchange_rate || 1]
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
    const numericSaleId = Number(saleId);
    // We need to retrieve the store's iyzico settings to verify the token
    const saleRes = await pool.query("SELECT store_id FROM sales WHERE id = $1", [numericSaleId]);
    if (saleRes.rows.length === 0) return res.status(404).send("Sale not found");
    
    const storeId = saleRes.rows[0].store_id;
    const storeRes = await pool.query("SELECT payment_settings FROM stores WHERE id = $1", [storeId]);
    let settings = storeRes.rows[0].payment_settings;
    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
      } catch (e) {
        settings = {};
      }
    }

    const baseUrl = settings.iyzico_sandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com';
    const randomString = Date.now().toString();
    
    const retrieveRequest = { locale: "tr", conversationId: numericSaleId.toString(), token };
    const signature = generateIyzicoSignature(settings.iyzico_api_key, settings.iyzico_secret_key, randomString, retrieveRequest);

    const response = await fetch(`${baseUrl}/payment/iyzipay/checkoutform/auth/retrieve`, {
      method: 'POST',
      headers: {
        'Authorization': `IYZIPAY ${Buffer.from(`${settings.iyzico_api_key}:${signature}`).toString('base64')}`,
        'x-iyzipay-rnd': randomString,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(retrieveRequest)
    });

    const result = await response.json();
    
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrlForRedirect = `${protocol}://${host}`;

    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("UPDATE sales SET status = 'processing', payment_method = 'iyzico' WHERE id = $1", [numericSaleId]);
        
        // --- AUTOMATION: Stock Deduction and Invoice Creation ---
        await processSaleAutomation(client, numericSaleId, storeId);
        
        await client.query("COMMIT");
      } catch (automationError) {
        await client.query("ROLLBACK");
        console.error("Iyzico Webhook Automation Error:", automationError);
        // We still redirect to success because payment WAS successful, but we log the error
      } finally {
        client.release();
      }

      // Redirect back to success page
      res.redirect(`${baseUrlForRedirect}/checkout/success?saleId=${numericSaleId}`);
    } else {
      const errorMsg = result.errorMessage || "Unknown payment error";
      await pool.query(
        "UPDATE sales SET status = 'cancelled', notes = COALESCE(notes, '') || '\n[Iyzico Error]: ' || $1 WHERE id = $2",
        [errorMsg, numericSaleId]
      );
      res.redirect(`${baseUrlForRedirect}/checkout/cancel?saleId=${numericSaleId}`);
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
