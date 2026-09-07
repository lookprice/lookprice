import express from "express";
import { authenticate } from "../middleware/auth";

// Import sub-routers
import productsRouter from "./store/products";
import salesRouter from "./store/sales";
import invoicesRouter from "./store/invoices";
import reportsRouter from "./store/reports";
import usersRouter from "./store/users";
import quotationsRouter from "./store/quotations";
import companiesRouter from "./store/companies";
import customersRouter from "./store/customers";
import restaurantRouter from "./store/restaurant";
import seoRouter from "./store/seo";
import blogRouter from "./store/blog";
import aiRouter from "./store/ai";
import domainRouter from "./store/domain";
import branchRouter from "./store/branches";
import stockTransferRouter from "./store/stock-transfers";
import notificationRouter from "./store/notifications";
import consultantRouter from "./store/consultants";
import procurementRouter from "./store/procurements";
import serviceRouter from "./store/service";
import logsRouter from "./store/logs";
import importRouter from "./store/import";
import infoRouter from "./store/info";
import brandingRouter from "./store/branding";
import supplierApisRouter from "./store/supplier-apis";
import transactionsRouter from "./store/transactions";

const router = express.Router();


// Debug middleware
router.use((req, res, next) => {
  console.log(`DEBUG: Store route hit: ${req.method} ${req.originalUrl}`);
  next();
});

// Auth middleware applied to all store routes
router.use(authenticate);

// Mount Sub-Routers
router.use("/products", productsRouter);
router.use("/sales", salesRouter);
router.use("/invoices", invoicesRouter);
// Fast POS Sale
router.use("/pos/sale", (req: any, res, next) => {
  req.url = "/pos";
  salesRouter(req, res, next);
});
router.use("/reports", reportsRouter);
router.use("/users", usersRouter);
router.use("/quotations", quotationsRouter);
router.use("/companies", companiesRouter);
router.use("/customers", customersRouter);
router.use("/transactions", transactionsRouter);
router.use("/restaurant", restaurantRouter);
router.use("/seo", seoRouter);
router.use("/blog", blogRouter);
router.use("/ai", aiRouter);
router.use("/domain", domainRouter);
router.use("/branches", branchRouter);
router.use("/stock-transfers", stockTransferRouter);
router.use("/notifications", notificationRouter);
router.use("/consultants", consultantRouter);
router.use("/procurements", procurementRouter);
router.use("/service", serviceRouter);
router.use("/logs", logsRouter);
router.use("/import", importRouter);
router.use("/info", infoRouter);
router.use("/branding", brandingRouter);
router.use("/supplier-apis", supplierApisRouter);

// Rewrite mappings for direct frontend API endpoints
router.use("/sales-invoices", (req: any, res, next) => {
  if (req.url.startsWith("/?")) {
    req.url = "/sales" + req.url.substring(1);
  } else if (req.url === "/") {
    req.url = "/sales";
  } else {
    req.url = "/sales" + req.url;
  }
  invoicesRouter(req, res, next);
});

router.use("/purchase-invoices", (req: any, res, next) => {
  if (req.url.startsWith("/?")) {
    req.url = "/purchase" + req.url.substring(1);
  } else if (req.url === "/") {
    req.url = "/purchase";
  } else {
    req.url = "/purchase" + req.url;
  }
  invoicesRouter(req, res, next);
});

router.use("/analytics", (req: any, res, next) => {
  const queryIndex = req.url.indexOf("?");
  const query = queryIndex !== -1 ? req.url.substring(queryIndex) : "";
  req.url = "/analytics" + query;
  reportsRouter(req, res, next);
});

router.use("/audit-logs", (req: any, res, next) => {
  const queryIndex = req.url.indexOf("?");
  const query = queryIndex !== -1 ? req.url.substring(queryIndex) : "";
  req.url = "/audit-logs" + query;
  logsRouter(req, res, next);
});

router.use("/service-records", (req: any, res, next) => {
  if (req.url.startsWith("/?")) {
    req.url = "/records" + req.url.substring(1);
  } else if (req.url === "/") {
    req.url = "/records";
  } else {
    req.url = "/records" + req.url;
  }
  serviceRouter(req, res, next);
});

router.post("/log-error", (req: any, res) => {
  console.error("Client Error:", req.body);
  res.json({ success: true });
});

router.post("/sync-tcmb", async (req: any, res) => {
  try {
    const targetStoreId = req.query.storeId ? Number(req.query.storeId) : req.user.store_id;
    const { default: axios } = await import("axios");
    const xml2js = await import("xml2js");
    const { pool } = await import("../models/db");

    const { data } = await axios.get("https://www.tcmb.gov.tr/kurlar/today.xml");
    const parser = new xml2js.Parser();
    
    const rates: Record<string, number> = await new Promise((resolve, reject) => {
      parser.parseString(data, (err: any, result: any) => {
        if (err) return reject(err);
        const currencies = result?.Tarih_Date?.Currency;
        if (!currencies || !Array.isArray(currencies)) {
          return reject(new Error("Invalid TCMB XML structure"));
        }
        const extracted: Record<string, number> = {};
        for (const c of currencies) {
          const code = c['$']?.CurrencyCode || c['$']?.Kod;
          if (['USD', 'EUR', 'GBP'].includes(code)) {
            const rateStr = (c.ForexBuying && c.ForexBuying[0]) || (c.ForexSelling && c.ForexSelling[0]);
            if (rateStr) {
              const val = parseFloat(rateStr);
              if (!isNaN(val)) extracted[code] = val;
            }
          }
        }
        resolve(extracted);
      });
    });

    if (Object.keys(rates).length === 0) {
      return res.status(400).json({ error: "Could not extract rates from TCMB XML" });
    }

    const storeRes = await pool.query("SELECT branding, currency_rates FROM stores WHERE id = $1", [targetStoreId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    let currentRates = {};
    const curStore = storeRes.rows[0];
    try {
      if (typeof curStore.currency_rates === 'string') {
        currentRates = JSON.parse(curStore.currency_rates);
      } else if (typeof curStore.currency_rates === 'object' && curStore.currency_rates !== null) {
        currentRates = curStore.currency_rates;
      }
    } catch (e) {}

    const newRates = { ...currentRates, ...rates };

    await pool.query(
      "UPDATE stores SET currency_rates = $1 WHERE id = $2",
      [JSON.stringify(newRates), targetStoreId]
    );

    res.json({ success: true, rates: newRates, message: "TCMB kurları başarıyla güncellendi." });
  } catch (error: any) {
    console.error("Error in POST /api/store/sync-tcmb:", error);
    res.status(500).json({ error: error.message });
  }
});

// Fallback for direct restaurant tables access if still used by old UI
router.use("/restaurant-tables", restaurantRouter);
router.use("/blog-posts", blogRouter);

export default router;
