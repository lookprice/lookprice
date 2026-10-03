import express from "express";
import Iyzipay from "iyzipay";
import axios from "axios";
import { pool } from "../models/db";

const router = express.Router();
const getIyzipay = (s: any) => new Iyzipay({
  apiKey: s.apiKey || s.api_key || s.iyzico_api_key,
  secretKey: s.secretKey || s.secret_key || s.iyzico_secret_key,
  uri: s.iyzico_sandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com',
});

// Simple in-memory cache for static iyzico CDN assets (bundle.js, chunks, fonts, SVGs)
const cdnAssetCache = new Map<string, { data: Buffer | string; contentType: string; timestamp: number }>();
const CDN_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

function getMimeType(assetPath: string, fallback?: string): string {
  const clean = assetPath.split("?")[0].toLowerCase();
  if (clean.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (clean.endsWith(".css")) return "text/css; charset=utf-8";
  if (clean.endsWith(".svg")) return "image/svg+xml";
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg")) return "image/jpeg";
  if (clean.endsWith(".gif")) return "image/gif";
  if (clean.endsWith(".ico")) return "image/x-icon";
  if (clean.endsWith(".ttf")) return "font/ttf";
  if (clean.endsWith(".woff")) return "font/woff";
  if (clean.endsWith(".woff2")) return "font/woff2";
  return fallback || "application/octet-stream";
}

function rewriteIyzicoUrls(content: string): string {
  return content
    .replace(/https?:\/\/cdn\.iyzipay\.com/g, "/api/payment/iyzico-cdn")
    .replace(/https?:\/\/cdn-cpp\.iyzipay\.com/g, "/api/payment/iyzico-cpp-cdn")
    .replace(/https?:\/\/api\.iyzipay\.com/g, "/api/payment/iyzico-api")
    .replace(/https?:\/\/sandbox-api\.iyzipay\.com/g, "/api/payment/iyzico-sandbox-api")
    .replace(/https?:\/\/merchant-gateway\.iyzipay\.com/g, "/api/payment/iyzico-merchant-gw")
    .replace(/https?:\/\/consumerapigw\.iyzipay\.com/g, "/api/payment/iyzico-consumer-gw")
    .replace(/https?:\/\/countly\.iyzico\.com/g, "/api/payment/iyzico-telemetry")
    .replace(/https?:\/\/www\.clarity\.ms/g, "/api/payment/iyzico-telemetry");
}

// Proxy for cdn.iyzipay.com/*
router.get("/iyzico-cdn/*", async (req, res) => {
  try {
    const subPath = (req.params as any)[0] || "";
    const queryStr = req.originalUrl.includes("?") ? req.originalUrl.substring(req.originalUrl.indexOf("?")) : "";
    const targetUrl = `https://cdn.iyzipay.com/${subPath}${queryStr}`;
    const cacheKey = `cdn:${subPath}${queryStr}`;

    const cached = cdnAssetCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CDN_CACHE_TTL) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=1800");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.send(cached.data);
    }

    const isText = subPath.endsWith(".js") || subPath.endsWith(".css") || subPath.endsWith(".svg");
    const response = await axios.get(targetUrl, {
      responseType: isText ? "text" : "arraybuffer",
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    });

    const contentType = getMimeType(subPath, response.headers["content-type"]);
    let payload: Buffer | string = response.data;
    if (isText && typeof payload === "string") {
      payload = rewriteIyzicoUrls(payload);
    }

    cdnAssetCache.set(cacheKey, { data: payload, contentType, timestamp: Date.now() });
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=1800");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(payload);
  } catch (err: any) {
    console.error("[Iyzico CDN Proxy Error]:", req.originalUrl, err.message);
    return res.status(err.response?.status || 502).send("Asset unavailable");
  }
});

// Proxy for cdn-cpp.iyzipay.com/*
router.get("/iyzico-cpp-cdn/*", async (req, res) => {
  try {
    const subPath = (req.params as any)[0] || "";
    const queryStr = req.originalUrl.includes("?") ? req.originalUrl.substring(req.originalUrl.indexOf("?")) : "";
    const targetUrl = `https://cdn-cpp.iyzipay.com/${subPath}${queryStr}`;
    const cacheKey = `cpp:${subPath}${queryStr}`;

    const cached = cdnAssetCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CDN_CACHE_TTL) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=1800");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.send(cached.data);
    }

    const isText = subPath.endsWith(".js") || subPath.endsWith(".css") || subPath.endsWith(".svg");
    const response = await axios.get(targetUrl, {
      responseType: isText ? "text" : "arraybuffer",
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    });

    const contentType = getMimeType(subPath, response.headers["content-type"]);
    let payload: Buffer | string = response.data;
    if (isText && typeof payload === "string") {
      payload = rewriteIyzicoUrls(payload);
    }

    cdnAssetCache.set(cacheKey, { data: payload, contentType, timestamp: Date.now() });
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=1800");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.send(payload);
  } catch (err: any) {
    console.error("[Iyzico CPP CDN Proxy Error]:", req.originalUrl, err.message);
    return res.status(err.response?.status || 502).send("Asset unavailable");
  }
});

// Silent no-op for optional telemetry (countly / clarity) so adblockers or DNS blocks never throw console errors
router.all("/iyzico-telemetry*", (req, res) => {
  res.status(200).json({ result: "Success" });
});

// Helper to proxy API requests to iyzico gateways
async function proxyIyzicoApi(req: express.Request, res: express.Response, targetBase: string) {
  try {
    const subPath = (req.params as any)[0] || "";
    const queryStr = req.originalUrl.includes("?") ? req.originalUrl.substring(req.originalUrl.indexOf("?")) : "";
    const targetUrl = `${targetBase}/${subPath}${queryStr}`;

    const forwardHeaders: Record<string, string> = {
      "Content-Type": req.headers["content-type"] || "application/json",
      "Accept": req.headers["accept"] || "application/json",
      "Origin": "https://cpp.iyzipay.com",
      "Referer": "https://cpp.iyzipay.com/",
      "User-Agent": req.headers["user-agent"] || "Mozilla/5.0"
    };

    if (req.headers["x-iyzi-token"]) forwardHeaders["X-IYZI-TOKEN"] = String(req.headers["x-iyzi-token"]);
    if (req.headers["authorization"]) forwardHeaders["Authorization"] = String(req.headers["authorization"]);
    if (req.headers["iyzi_lc"]) forwardHeaders["IYZI_LC"] = String(req.headers["iyzi_lc"]);
    if (req.headers["x-forwarded-for"]) forwardHeaders["X-Forwarded-For"] = String(req.headers["x-forwarded-for"]);

    const response = await axios({
      method: req.method as any,
      url: targetUrl,
      headers: forwardHeaders,
      data: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      timeout: 30000,
      validateStatus: () => true
    });

    if (response.headers["iyzi_lc"]) {
      res.setHeader("iyzi_lc", response.headers["iyzi_lc"]);
      res.setHeader("Access-Control-Expose-Headers", "iyzi_lc");
    }
    if (response.headers["content-type"]) {
      res.setHeader("Content-Type", response.headers["content-type"]);
    }
    return res.status(response.status).send(response.data);
  } catch (err: any) {
    console.error(`[Iyzico API Proxy Error -> ${targetBase}]:`, err.message);
    return res.status(502).json({ status: "failure", errorMessage: "Ödeme servisine bağlanılamadı." });
  }
}

router.all("/iyzico-api/*", (req, res) => proxyIyzicoApi(req, res, "https://api.iyzipay.com"));
router.all("/iyzico-sandbox-api/*", (req, res) => proxyIyzicoApi(req, res, "https://sandbox-api.iyzipay.com"));
router.all("/iyzico-merchant-gw/*", (req, res) => proxyIyzicoApi(req, res, "https://merchant-gateway.iyzipay.com"));
router.all("/iyzico-consumer-gw/*", (req, res) => proxyIyzicoApi(req, res, "https://consumerapigw.iyzipay.com"));

// Self-hosted Iyzico Checkout Page (Eliminates client-side DNS failures on cpp.iyzipay.com / cdn.iyzipay.com)
router.get("/iyzico-checkout", async (req, res) => {
  try {
    const token = String(req.query.token || "").trim();
    const saleId = String(req.query.saleId || "").trim();
    const lang = String(req.query.lang || "tr").trim();

    if (!token) {
      return res.status(400).send("Geçersiz ödeme oturumu (Token bulunamadı).");
    }

    // Fetch cpp.iyzipay.com HTML server-side
    const cppUrl = `https://cpp.iyzipay.com?token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
    const cppRes = await axios.get(cppUrl, {
      responseType: "text",
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    let html = String(cppRes.data || "");

    // Strip third-party security/telemetry scripts that cause CSP blob worker blocks or unnecessary external calls
    html = html.replace(/<script[^>]*src="https:\/\/js\.sentry-cdn\.com[^"]*"[^>]*><\/script>/gi, "");
    html = html.replace(/<script[^>]*src="https:\/\/cdn\.iyzipay\.com\/plugins\/agent\.js"[^>]*><\/script>/gi, "");
    html = html.replace(/Sentry\?\.init\([\s\S]*?\}\);/g, "");
    html = html.replace(/<script>NS_CSM_td=[\s\S]*?<\/script><script type="text\/javascript">function sendTimingInfoInit\(\)[\s\S]*?<\/script>/g, "");

    // Rewrite all iyzico CDN and API URLs to route through our server-side proxy
    html = rewriteIyzicoUrls(html);

    // Relax CSP for this checkout page so 3DS bank forms, inline styles, and workers work without restriction
    res.removeHeader("Content-Security-Policy");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; " +
      "script-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' https: data: 'unsafe-inline'; " +
      "img-src 'self' https: http: data: blob:; " +
      "font-src 'self' https: data:; " +
      "connect-src 'self' https: wss:; " +
      "worker-src 'self' blob:; " +
      "frame-src 'self' https:; " +
      "form-action 'self' https: http:;"
    );
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err: any) {
    console.error("[Iyzico Hosted Checkout Proxy Error]:", err.message);
    const token = String(req.query.token || "").trim();
    if (token) {
      return res.redirect(`https://cpp.iyzipay.com?token=${encodeURIComponent(token)}&lang=tr`);
    }
    return res.status(500).send("Ödeme sayfası yüklenirken bir hata oluştu. Lütfen sayfayı yenileyiniz.");
  }
});

// POST /api/payment/initialize
router.post("/initialize", async (req, res) => {
  const { saleId } = req.body;
  try {
    if (!saleId) {
      return res.status(400).json({ error: "Sipariş ID (saleId) gereklidir." });
    }

    const saleRes = await pool.query("SELECT * FROM sales WHERE id = $1", [saleId]);
    if (saleRes.rows.length === 0) return res.status(404).json({ error: "Sipariş bulunamadı." });
    const sale = saleRes.rows[0];
    const { store_id, total_amount } = sale;
    
    const storeRes = await pool.query("SELECT id, name, slug, payment_settings, branding FROM stores WHERE id = $1", [store_id]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı." });
    const storeRow = storeRes.rows[0];

    const rawPayment = storeRow?.payment_settings;
    const brandingPayment = storeRow?.branding?.payment_settings;
    let s: any = {};
    if (typeof rawPayment === 'string') {
      try { s = JSON.parse(rawPayment); } catch (e) {}
    } else if (rawPayment && typeof rawPayment === 'object') {
      s = { ...rawPayment };
    }
    if (typeof brandingPayment === 'string') {
      try { s = { ...s, ...JSON.parse(brandingPayment) }; } catch (e) {}
    } else if (brandingPayment && typeof brandingPayment === 'object') {
      s = { ...s, ...brandingPayment };
    }
    
    const apiKey = s.apiKey || s.api_key || s.iyzico_api_key;
    const secretKey = s.secretKey || s.secret_key || s.iyzico_secret_key;

    if (!apiKey || !secretKey) {
      console.error(`Iyzico initialization failed for store #${store_id}: API keys missing.`);
      await pool.query(
        "UPDATE sales SET status = 'payment_failed', notes = COALESCE(notes, '') || ' [İyzico API anahtarları tanımlanmamış]' WHERE id = $1",
        [saleId]
      );
      return res.status(400).json({ 
        success: false, 
        error: "İyzico Sanal POS hizmetimiz şu anda bakım / güncelleme aşamasındadır. Lütfen diğer ödeme alternatiflerini (Banka Havalesi / Kapıda Ödeme) kullanınız.",
        isMaintenance: true
      });
    }

    const iyzipay = getIyzipay(s);
    const formattedPrice = Number(total_amount || 0).toFixed(2);
    const uniqueOrderId = `${saleId}-${Date.now()}`;
    
    // Split & sanitize customer name
    const rawFullName = (sale.customer_name || "Müşteri").trim();
    const nameParts = rawFullName.split(/\s+/).filter(Boolean);
    const firstName = (nameParts[0] || "Musteri").replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ\s]/g, '') || "Musteri";
    const lastName = (nameParts.slice(1).join(" ") || "Kullanici").replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ\s]/g, '') || "Kullanici";

    // Clean email
    const rawEmail = (sale.customer_email || "").trim();
    const email = (rawEmail.includes("@") && rawEmail.includes(".")) ? rawEmail : "musteri@lookprice.net";

    // Clean address & city
    const rawAddress = (sale.customer_address || "").trim();
    const address = rawAddress.length >= 3 ? rawAddress.substring(0, 200) : "Merkez Adres";
    const city = "Istanbul";

    // Clean TC/Identity
    const rawTc = (sale.customer_tc_id || sale.customer_phone || "").replace(/\D/g, '');
    const identityNumber = rawTc.length === 11 ? rawTc : "11111111111";

    // Clean IP
    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    const ip = rawIp.includes(':') ? '127.0.0.1' : rawIp;

    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const callbackUrl = `${protocol}://${host}/api/payment/webhook?saleId=${saleId}`;

    // Prepare basket items
    const itemsRes = await pool.query("SELECT * FROM sale_items WHERE sale_id = $1", [saleId]);
    let basketItems: any[] = [];
    if (itemsRes.rows.length > 0) {
      basketItems = itemsRes.rows.map((it: any, idx: number) => {
        const itemPrice = Number(it.total_price || (Number(it.unit_price || 0) * Number(it.quantity || 1)) || 0).toFixed(2);
        return {
          id: String(it.product_id || it.id || (idx + 1)),
          name: (it.product_name || `Ürün ${idx + 1}`).replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ\s\-_.,]/g, '').substring(0, 80) || `Urun ${idx + 1}`,
          category1: 'Genel',
          itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
          price: itemPrice
        };
      });

      // Verify that the sum of basket items exactly equals formattedPrice (Iyzico constraint)
      const sumItems = basketItems.reduce((acc: number, cur: any) => acc + Number(cur.price), 0);
      if (Math.abs(sumItems - Number(formattedPrice)) > 0.05 || Number(formattedPrice) <= 0) {
        basketItems = [{
          id: String(saleId),
          name: `Sipariş #${saleId}`,
          category1: 'Genel',
          itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
          price: formattedPrice
        }];
      }
    } else {
      basketItems = [{
        id: String(saleId),
        name: `Sipariş #${saleId}`,
        category1: 'Genel',
        itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
        price: formattedPrice
      }];
    }

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: uniqueOrderId,
      price: formattedPrice,
      paidPrice: formattedPrice,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: uniqueOrderId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: callbackUrl,
      buyer: { 
        id: (sale.customer_id || '1').toString(), 
        name: firstName, 
        surname: lastName, 
        email: email, 
        identityNumber: identityNumber, 
        registrationAddress: address, 
        city: city, 
        country: 'Turkey',
        ip: ip
      },
      shippingAddress: { contactName: `${firstName} ${lastName}`, city: city, country: 'Turkey', address: address },
      billingAddress: { contactName: `${firstName} ${lastName}`, city: city, country: 'Turkey', address: address },
      basketItems: basketItems
    };

    console.log(`[Iyzico] Initializing checkout form for Sale #${saleId} (Total: ${formattedPrice} TRY)...`);

    iyzipay.checkoutFormInitialize.create(request, async (err, result: any) => {
      if (err) {
        console.error("[Iyzico] Error creating checkout form:", err);
        await pool.query(
          "UPDATE sales SET status = 'payment_failed', notes = COALESCE(notes, '') || ' [İyzico Hatası: ' || $1 || ']' WHERE id = $2",
          [err.message || 'Teknik Hata', saleId]
        );
        return res.status(500).json({ 
          success: false, 
          error: "İyzico Sanal POS hizmetimiz şu anda bakım / güncelleme aşamasındadır. Lütfen diğer ödeme alternatiflerini (Banka Havalesi / Kapıda Ödeme) kullanınız.",
          isMaintenance: true 
        });
      }

      if (result.status !== 'success') {
        console.error("[Iyzico] API Rejected Initialization:", result.errorMessage, result.errorCode);
        await pool.query(
          "UPDATE sales SET status = 'payment_failed', notes = COALESCE(notes, '') || ' [İyzico: ' || $1 || ']' WHERE id = $2",
          [result.errorMessage || 'Iyzico başlatılamadı', saleId]
        );
        return res.status(400).json({ 
          success: false, 
          error: "İyzico Sanal POS hizmetimiz şu anda bakım / güncelleme aşamasındadır. Lütfen diğer ödeme alternatiflerini (Banka Havalesi / Kapıda Ödeme) kullanınız.",
          details: result.errorMessage,
          isMaintenance: true 
        });
      }

      console.log(`[Iyzico] Checkout form created successfully for Sale #${saleId}. Payment URL generated.`);
      const hostedCheckoutUrl = `${protocol}://${host}/api/payment/iyzico-checkout?token=${encodeURIComponent(result.token)}&saleId=${encodeURIComponent(String(saleId))}&lang=tr`;
      res.json({ 
        success: true, 
        paymentPageUrl: hostedCheckoutUrl,
        rawPaymentPageUrl: result.paymentPageUrl,
        payWithIyzicoPageUrl: result.payWithIyzicoPageUrl,
        token: result.token
      });
    });
  } catch (e: any) {
    console.error("[Iyzico] Initialization Exception:", e);
    res.status(500).json({ 
      success: false, 
      error: "İyzico Sanal POS hizmetimiz şu anda bakım / güncelleme aşamasındadır. Lütfen diğer ödeme alternatiflerini kullanınız.",
      details: e.message 
    });
  }
});

// Webhook handler (Support both GET and POST)
const webhookHandler = async (req: express.Request, res: express.Response) => {
  console.log("--- IYZICO WEBHOOK START ---");
  console.log("Method:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("Query Params:", JSON.stringify(req.query));
  console.log("Body Params (Keys):", Object.keys(req.body || {}));

  const token = req.body?.token || req.query?.token;
  let saleId: any = req.query.saleId;

  if (!token) {
    console.error("WEBHOOK ERROR: Token missing");
    return res.status(400).send("TOKEN_MISSING");
  }

  try {
    // If saleId missing from query, we will try to find it later from Iyzico's result.conversationId
    if (!saleId && req.body?.conversationId) {
      console.warn("WEBHOOK WARN: saleId missing from query, extracting from body.conversationId");
      saleId = String(req.body.conversationId).split('-')[0];
    }

    if (saleId) {
      saleId = String(saleId).split('-')[0];
    }

    if (!saleId) {
      throw new Error("Sipariş ID (saleId) bulunamadı. Webhook doğrulanamıyor.");
    }

    const saleRes = await pool.query("SELECT store_id, status FROM sales WHERE id = $1", [saleId]);
    if (saleRes.rows.length === 0) throw new Error(`Sipariş bulunamadı: ${saleId}`);
    
    // Check if already processed
    if (saleRes.rows[0].status === 'processing' || saleRes.rows[0].status === 'shipped' || saleRes.rows[0].status === 'completed') {
        console.log("WebHook: Sale already processed, redirecting...");
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        return res.redirect(`${protocol}://${req.headers.host}/checkout/success?saleId=${saleId}`);
    }

    const storeRes = await pool.query("SELECT payment_settings, branding FROM stores WHERE id = $1", [saleRes.rows[0].store_id]);
    const storeRow = storeRes.rows[0];
    const rawPayment = storeRow?.payment_settings;
    const brandingPayment = storeRow?.branding?.payment_settings;
    let s: any = {};
    if (typeof rawPayment === 'string') {
      try { s = JSON.parse(rawPayment); } catch (e) {}
    } else if (rawPayment && typeof rawPayment === 'object') {
      s = { ...rawPayment };
    }
    if (typeof brandingPayment === 'string') {
      try { s = { ...s, ...JSON.parse(brandingPayment) }; } catch (e) {}
    } else if (brandingPayment && typeof brandingPayment === 'object') {
      s = { ...s, ...brandingPayment };
    }
    
    console.log("Iyzico Settings Mode:", s.iyzico_sandbox ? 'SANDBOX' : 'PRODUCTION');
    const iyzipay = getIyzipay(s);

    const checkPayment = async (t: string) => {
        return new Promise((resolve, reject) => {
            iyzipay.checkoutForm.retrieve({ locale: 'tr', token: t }, (err: any, result: any) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    };

    const result: any = await checkPayment(token as string);
    console.log("Iyzico Auth Result Full Object:", JSON.stringify(result));

    if (result && result.status !== 'success') {
        const msg = result.errorMessage || `Ödeme Durumu: ${result.status}`;
        console.error("Iyzico Verification Failed:", msg);
        
        // Instead of throwing 500, redirect to failure page with error message
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const failUrl = `${protocol}://${req.headers.host}/checkout/cancel?saleId=${saleId}&error=${encodeURIComponent(msg)}`;
        return res.redirect(failUrl);
    }

    // Double check saleId from conversationId (format: `${saleId}-${timestamp}`)
    if (result.conversationId) {
        const extractedSaleId = String(result.conversationId).split('-')[0];
        if (extractedSaleId && extractedSaleId !== String(saleId)) {
            console.warn(`ConversationId mismatch: Query=${saleId}, Extracted=${extractedSaleId}`);
            saleId = extractedSaleId;
        }
    }

    console.log("Payment Verified Successfully. Updating DB for SaleId:", saleId);
    await pool.query("UPDATE sales SET status = 'processing', payment_method = 'iyzico' WHERE id = $1", [saleId]);
    
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const redirectUrl = `${protocol}://${req.headers.host}/checkout/success?saleId=${saleId}`;
    res.redirect(redirectUrl);
    
  } catch (err: any) {
    console.error("CRITICAL WEBHOOK ERROR:", err.message);
    res.status(500).send(`
      Webhook Error: ${err.message || "Bilinmeyen bir hata oluştu"}
      DEBUG_IYZICO: ${JSON.stringify(err.iyzicoResult || {})}
    `);
  }
};

router.get("/webhook", webhookHandler);
router.post("/webhook", webhookHandler);

export default router;
