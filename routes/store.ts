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
router.use("/reports", reportsRouter);
router.use("/users", usersRouter);
router.use("/quotations", quotationsRouter);
router.use("/companies", companiesRouter);
router.use("/customers", customersRouter);
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

// Fallback for direct restaurant tables access if still used by old UI
router.use("/restaurant-tables", restaurantRouter);
router.use("/blog-posts", blogRouter);
router.use("/audit-logs", logsRouter);

export default router;
