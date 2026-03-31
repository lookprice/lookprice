import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { initDb } from "./models/db.ts";
import authRoutes from "./routes/auth.ts";
import publicRoutes from "./routes/public.ts";
import adminRoutes from "./routes/admin.ts";
import storeRoutes from "./routes/store.ts";
import fleetRoutes from "./routes/fleet.ts";
import { authenticate } from "./middleware/auth.ts";
import { pool } from "./models/db.ts";
import multer from "multer";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import admin from "firebase-admin";

// Import the Firebase configuration
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket
  });
}

const bucket = admin.storage().bucket();

async function startServer() {
  console.log("Starting server process...");
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set("trust proxy", true);

  // Initialize Database
  console.log("Calling initDb...");
  await initDb();
  console.log("initDb finished.");

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Ensure uploads directory exists (still used for temp files if needed)
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // File Upload Route (using Firebase Storage)
  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/upload", authenticate, upload.single("file"), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = uniqueSuffix + "-" + req.file.originalname;
      const file = bucket.file(`uploads/${filename}`);

      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      // Make the file public (or use signed URLs, but public is simpler for now)
      await file.makePublic();
      const fileUrl = `https://storage.googleapis.com/${bucket.name}/uploads/${filename}`;
      
      res.json({ url: fileUrl });
    } catch (error: any) {
      console.error("Firebase upload error:", error);
      res.status(500).json({ error: "Failed to upload file to Firebase Storage" });
    }
  });

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
      "connect-src 'self' wss://*.run.app:* https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net https://*.run.app https://*.onrender.com https://generativelanguage.googleapis.com https://*.firebaseio.com https://*.googleapis.com;"
    );
    next();
  });

  // Keep-alive logic for Render (pings the app every 5 minutes)
  const APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
  if (APP_URL) {
    console.log(`Keep-alive system initialized for: ${APP_URL}`);
    
    // Initial ping after 30 seconds to confirm it's working
    setTimeout(async () => {
      try {
        const response = await fetch(`${APP_URL}/api/health`);
        console.log(`Initial keep-alive check for ${APP_URL}: ${response.status}`);
      } catch (e) {
        console.error("Initial keep-alive check failed. Check your APP_URL variable.");
      }
    }, 30000);

    setInterval(async () => {
      try {
        const response = await fetch(`${APP_URL}/api/health`);
        if (response.status !== 200) {
          console.warn(`Keep-alive ping returned non-200 status: ${response.status}`);
        }
      } catch (e: any) {
        console.error("Keep-alive ping failed:", e.message);
      }
    }, 5 * 60 * 1000); // 5 minutes is safer than 14
  } else {
    console.warn("KEEP-ALIVE WARNING: APP_URL environment variable is NOT set. The app will go to sleep on Render free tier.");
  }

  console.log("Setting up routes...");

  // Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/public", publicRoutes);
  app.use("/api/admin", authenticate, adminRoutes);
  app.use("/api/store", authenticate, storeRoutes);
  app.use("/api/fleet", authenticate, fleetRoutes);

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
      if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/uploads")) return next();
      if (req.headers.accept && req.headers.accept.includes("text/html")) {
        try {
          const fs = await import("fs");
          const url = req.originalUrl;
          let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
          
          // Transform HTML first
          template = await vite.transformIndexHtml(url, template);
          
          // Then inject process.env into the head
          const envVars = {
            GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.API_KEY || "",
            API_KEY: process.env.API_KEY || process.env.GEMINI_API_KEY || "",
            VITE_API_KEY: process.env.VITE_API_KEY || process.env.API_KEY || "",
            VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ""
          };

          console.log("Injecting API Keys into HTML (Dev):", {
            hasGemini: !!envVars.GEMINI_API_KEY,
            hasApiKey: !!envVars.API_KEY,
            allKeys: Object.keys(process.env).filter(k => k.includes("API") || k.includes("KEY") || k.includes("GEMINI"))
          });

          const injection = `<script>
            (function() {
              globalThis.process = globalThis.process || { env: {} };
              globalThis.process.env = globalThis.process.env || {};
              const env = ${JSON.stringify(envVars)};
              Object.keys(env).forEach(key => {
                if (env[key]) {
                  globalThis.process.env[key] = globalThis.process.env[key] || env[key];
                }
              });
              console.log("Runtime env injection complete. Keys:", Object.keys(globalThis.process.env));
            })();
          </script>`;
          template = template.replace("</head>", `${injection}</head>`);
          
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
      if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/uploads")) return next();
      
      try {
        const fs = await import("fs");
        const indexPath = path.join(distPath, "index.html");
        let template = fs.readFileSync(indexPath, "utf-8");
        
        // Inject process.env into the head
        const envVars = {
          GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.API_KEY || "",
          API_KEY: process.env.API_KEY || process.env.GEMINI_API_KEY || "",
          VITE_API_KEY: process.env.VITE_API_KEY || process.env.API_KEY || "",
          VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || ""
        };

        console.log("Injecting API Keys into HTML (Prod):", {
          hasGemini: !!envVars.GEMINI_API_KEY,
          hasApiKey: !!envVars.API_KEY,
          allKeys: Object.keys(process.env).filter(k => k.includes("API") || k.includes("KEY") || k.includes("GEMINI"))
        });

        const injection = `<script>
          (function() {
            globalThis.process = globalThis.process || { env: {} };
            globalThis.process.env = globalThis.process.env || {};
            const env = ${JSON.stringify(envVars)};
            Object.keys(env).forEach(key => {
              if (env[key]) {
                globalThis.process.env[key] = globalThis.process.env[key] || env[key];
              }
            });
          })();
        </script>`;
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
