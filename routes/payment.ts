import express from "express";
import Iyzipay from "iyzipay";
import { pool } from "../models/db";

const router = express.Router();
const getIyzipay = (s: any) => new Iyzipay({
  apiKey: s.apiKey || s.api_key || s.iyzico_api_key,
  secretKey: s.secretKey || s.secret_key || s.iyzico_secret_key,
  uri: s.iyzico_sandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com',
});

// POST /api/payment/initialize
router.post("/initialize", async (req, res) => {
  const { saleId } = req.body;
  try {
    const saleRes = await pool.query("SELECT * FROM sales WHERE id = $1", [saleId]);
    if (saleRes.rows.length === 0) return res.status(404).json({ error: "Sale not found" });
    const sale = saleRes.rows[0];
    const { store_id, total_amount } = sale;
    
    const storeRes = await pool.query("SELECT payment_settings FROM stores WHERE id = $1", [store_id]);
    const settingsRaw = storeRes.rows[0].payment_settings;
    let s = typeof settingsRaw === 'string' ? JSON.parse(settingsRaw) : settingsRaw;
    
    const iyzipay = getIyzipay(s);
    const formattedPrice = Number(total_amount).toFixed(2);
    const uniqueOrderId = `${saleId}-${Date.now()}`;
    
    // Split customer name
    const fullName = (sale.customer_name || "Guest User").trim();
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "Guest";
    const lastName = nameParts.slice(1).join(" ") || "User";

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: uniqueOrderId,
      price: formattedPrice,
      paidPrice: formattedPrice,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: uniqueOrderId,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/payment/webhook?saleId=${saleId}`,
      buyer: { 
        id: (sale.customer_id || '1').toString(), 
        name: firstName, 
        surname: lastName, 
        email: sale.customer_email || 'guest@example.com', 
        identityNumber: '11111111111', 
        registrationAddress: sale.customer_address || 'Address', 
        city: 'Istanbul', 
        country: 'Turkey',
        ip: req.ip || '127.0.0.1'
      },
      shippingAddress: { contactName: fullName, city: 'Istanbul', country: 'Turkey', address: sale.customer_address || 'Address' },
      billingAddress: { contactName: fullName, city: 'Istanbul', country: 'Turkey', address: sale.customer_address || 'Address' },
      basketItems: [{ id: '1', name: `Order #${saleId}`, category1: 'General', itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL, price: formattedPrice }]
    };
    iyzipay.checkoutFormInitialize.create(request, (err, result: any) => {
      if (err) return res.status(500).json({ error: "Ödeme başlatılamadı (Teknik Hata)." });
      if (result.status !== 'success') return res.status(500).json({ error: result.errorMessage || "Iyzico başlatma hatası." });
      res.json({ success: true, paymentPageUrl: result.paymentPageUrl });
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
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
  let saleId = req.query.saleId;

  if (!token) {
    console.error("WEBHOOK ERROR: Token missing");
    return res.status(400).send("TOKEN_MISSING");
  }

  try {
    // If saleId missing from query, we will try to find it later from Iyzico's result.conversationId
    if (!saleId) {
       console.warn("WEBHOOK WARN: saleId missing from query, attempting to peek it from DB or conversationId later");
       saleId = req.body.conversationId;
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

    const storeRes = await pool.query("SELECT payment_settings FROM stores WHERE id = $1", [saleRes.rows[0].store_id]);
    const settingsRaw = storeRes.rows[0].payment_settings;
    let s = typeof settingsRaw === 'string' ? JSON.parse(settingsRaw) : settingsRaw;
    
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

    // Double check saleId from conversationId if they mismatched for some reason
    if (result.conversationId && result.conversationId !== saleId.toString()) {
        console.warn(`ConversationId mismatch: Query=${saleId}, Iyzico=${result.conversationId}`);
        saleId = result.conversationId; 
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
