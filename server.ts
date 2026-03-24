import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { initDb } from "./models/db.js";
import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import storeRoutes from "./routes/store.js";
import { authenticate } from "./middleware/auth.js";
import { pool } from "./models/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Starting server process...");
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize Database
  console.log("Calling initDb...");
  await initDb();
  console.log("initDb finished.");

  app.use(express.json());

  // Root route for debugging
  app.get("/api/health", (req, res) => {
    const keys = {
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      API_KEY: !!process.env.API_KEY,
      VITE_GEMINI_API_KEY: !!process.env.VITE_GEMINI_API_KEY
    };
    console.log("API Keys available:", keys);
    res.json({ status: "ok", time: new Date().toISOString(), keys });
  });

  // Security Headers (Refined for security and flexibility)
  app.use((req, res, next) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: blob: https:; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "connect-src 'self' https://www.google-analytics.com https://*.run.app https://*.onrender.com;"
    );
    next();
  });

  console.log("Setting up routes...");

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api/admin", authenticate, adminRoutes);
  app.use("/api/store", authenticate, storeRoutes);

  // CRM: Tickets (Special case, mounted at /api/tickets)
  app.get("/api/tickets", authenticate, async (req: any, res) => {
    try {
      let tickets;
      if (req.user.role === "superadmin") {
        tickets = await pool.query("SELECT t.*, s.name as store_name FROM tickets t JOIN stores s ON t.store_id = s.id");
      } else {
        tickets = await pool.query("SELECT * FROM tickets WHERE store_id = $1", [req.user.store_id]);
      }
      res.json(tickets.rows);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/tickets", authenticate, async (req: any, res) => {
    if (req.user.role !== "storeadmin") return res.status(403).json({ error: "Forbidden" });
    const { subject, message } = req.body;
    try {
      await pool.query("INSERT INTO tickets (store_id, subject, message) VALUES ($1, $2, $3)", [req.user.store_id, subject, message]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Vite Integration for Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    
    app.get("/api/vite-config", (req, res) => {
      res.json({ define: vite.config.define });
    });
    
    // Inject process.env into index.html
    app.use("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      if (req.headers.accept && req.headers.accept.includes("text/html")) {
        try {
          const fs = await import("fs");
          const url = req.originalUrl;
          let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
          
          // Inject process.env into the head
          const injection = `<script>window.process = { env: { GEMINI_API_KEY: ${JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY || "")} } };</script>`;
          template = template.replace("</head>", `${injection}</head>`);
          
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      } else {
        next();
      }
    });

    app.use(vite.middlewares);
  } else {
    // Serve Static Files in Production
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static assets (js, css, images) directly
    app.use(express.static(distPath, { index: false }));
    
    // For all other routes, serve index.html with injected process.env
    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) return next();
      
      try {
        const fs = await import("fs");
        const indexPath = path.join(distPath, "index.html");
        let template = fs.readFileSync(indexPath, "utf-8");
        
        // Inject process.env into the head
        const injection = `<script>window.process = { env: { GEMINI_API_KEY: ${JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY || "")} } };</script>`;
        template = template.replace("</head>", `${injection}</head>`);
        
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  console.log("Starting server listener...");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
