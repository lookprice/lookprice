import express from "express";
import Iyzipay from "iyzipay";
import { pool } from "../models/db.ts";

const router = express.Router();

// Helper to get Iyzipay instance
const getIyzipay = (settings: any) => {
  return new Iyzipay({
    apiKey: settings.iyzico_api_key,
    secretKey: settings.iyzico_secret_key,
    uri: settings.iyzico_sandbox ? 'https://sandbox-api.iyzipay.com' : 'https://api.iyzipay.com',
  });
};

// POST /api/payment/iyzico/initialize
router.post("/initialize", async (req, res) => {
  const { saleId, paymentMethod } = req.body;
  
  try {
    const saleRes = await pool.query("SELECT store_id, total_amount FROM sales WHERE id = $1", [saleId]);
    if (saleRes.rows.length === 0) return res.status(404).json({ error: "Sale not found" });
    
    const { store_id, total_amount } = saleRes.rows[0];
    const storeRes = await pool.query("SELECT payment_settings FROM stores WHERE id = $1", [store_id]);
    let settings = storeRes.rows[0].payment_settings;
    if (typeof settings === 'string') settings = JSON.parse(settings);

    const iyzipay = getIyzipay(settings);

    const request = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: saleId.toString(),
      price: total_amount.toString(),
      paidPrice: total_amount.toString(),
      currency: Iyzipay.CURRENCY.TRY,
      basketId: saleId.toString(),
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api/payment/webhook?saleId=${saleId}`,
      buyer: {
        id: '1',
        name: 'Guest',
        surname: 'User',
        email: 'guest@example.com',
        identityNumber: '11111111111',
        registrationAddress: 'Address',
        city: 'Istanbul',
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: 'Guest User',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Address',
      },
      billingAddress: {
        contactName: 'Guest User',
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Address',
      },
      basketItems: [
        {
          id: '1',
          name: 'Order',
          category1: 'General',
          itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
          price: total_amount.toString(),
        }
      ]
    };

    iyzipay.checkoutFormInitialize.create(request, (err, result) => {
      if (err) {
        console.error("Iyzipay Error:", err);
        return res.status(500).json({ error: "Ödeme başlatılamadı." });
      }
      if (result.status === 'failure') {
        console.error("Iyzipay API Failure:", result.errorMessage, result);
        return res.status(400).json({ error: result.errorMessage || "Ödeme başlatılamadı (API Hatası)." });
      }
      res.json(result);
    });
  } catch (e: any) {
    console.error("Payment Init Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/payment/webhook (Iyzico sends POST to callbackUrl)
router.post("/webhook", async (req, res) => {
  const { token } = req.body;
  const { saleId } = req.query;
  
  try {
    const saleRes = await pool.query("SELECT store_id FROM sales WHERE id = $1", [saleId]);
    if (saleRes.rows.length === 0) return res.status(404).send("Sale not found");
    
    const storeRes = await pool.query("SELECT payment_settings FROM stores WHERE id = $1", [saleRes.rows[0].store_id]);
    let settings = storeRes.rows[0].payment_settings;
    if (typeof settings === 'string') settings = JSON.parse(settings);

    const iyzipay = getIyzipay(settings);

    iyzipay.checkoutFormAuthRetrieve.retrieve({
      locale: Iyzipay.LOCALE.TR,
      conversationId: saleId.toString(),
      token: token as string,
    }, async (err, result) => {
      if (err || result.status !== 'success') {
        await pool.query("UPDATE sales SET status = 'cancelled' WHERE id = $1", [saleId]);
        return res.redirect(`${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/checkout/cancel?saleId=${saleId}`);
      }

      // Payment successful
      await pool.query("UPDATE sales SET status = 'processing' WHERE id = $1", [saleId]);
      
      // Reduce stock
      const itemsRes = await pool.query("SELECT product_id, quantity FROM sale_items WHERE sale_id = $1", [saleId]);
      for (const item of itemsRes.rows) {
        if (item.product_id) {
          await pool.query(
            "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
            [item.quantity, item.product_id]
          );
        }
      }

      res.redirect(`${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/checkout/success?saleId=${saleId}`);
    });
  } catch (e: any) {
    console.error("Webhook Error:", e);
    res.status(500).send("Webhook error");
  }
});

export default router;
