import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import compression from "compression";
import { initDb } from "./models/db";
import { startCronJobs } from "./src/services/cronJobs";
import { aiWorkerService } from "./src/services/ai_worker.js";
import authRoutes from "./routes/auth";
import publicRoutes from "./routes/public";
import adminRoutes from "./routes/admin";
import storeRoutes from "./routes/store";
import fleetRoutes from "./routes/fleet";
import paymentRoutes from "./routes/payment";
import integrationRoutes from "./routes/integrations";
import instagramRoutes from "./routes/instagram";
import einvoiceRoutes, { runGlobalEInvoiceSync } from "./routes/einvoice";
import realEstateRoutes from "./routes/real_estate";
import aiJobsRoutes from "./routes/ai_jobs.js";
import googleDriveRoutes from "./routes/googleDrive.js";
import { authenticate } from "./middleware/auth";
import { domainMiddleware } from "./middleware/domain";
import { pool } from "./models/db";
import multer from "multer";
import fs from "fs";
import { generateMetaTags } from "./src/utils/metaTags";
import axios from "axios";
import sharp from "sharp";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function injectEnrakipsizGtm(template: string, req: any): string {
  const host = req.get('host') || "";
  const normalizedHost = host.startsWith("www.") ? host.substring(4) : host;
  
  if (normalizedHost === "enrakipsiz.com") {
    // 1. Remove lookprice platform tracking & GTM to avoid duplicates or data leakage
    const lookpriceTrackingPattern = /<!-- Platform Tracking \(lookprice\.net\) -->[\s\S]*?<!-- End Platform Google Tag Manager -->/;
    template = template.replace(lookpriceTrackingPattern, "");

    const lookpriceNoscriptPattern = /<!-- Platform GTM \(noscript\) -->[\s\S]*?<!-- End Platform GTM \(noscript\) -->/;
    template = template.replace(lookpriceNoscriptPattern, "");

    // 2. Inject new GTM GTM-5PR778HH at the top of <head>
    const gtmScript = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5PR778HH');</script>
<!-- End Google Tag Manager -->`;

    template = template.replace("<head>", `<head>\n${gtmScript}`);

    // 3. Inject new GTM noscript right after <body>
    const gtmNoscript = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5PR778HH"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

    template = template.replace("<body>", `<body>\n${gtmNoscript}`);
  }
  
  return template;
}

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

async function startServer() {
  console.log("Starting server process...");
  console.log("Environment Variables Check:", {
    allKeys: Object.keys(process.env),
    nodeEnv: process.env.NODE_ENV,
    hasCloudflareToken: !!process.env.CLOUDFLARE_API_TOKEN,
    hasCloudflareAccount: !!process.env.CLOUDFLARE_ACCOUNT_ID,
    hasGoogleMapsKey: !!process.env.GOOGLE_MAPS_PLATFORM_KEY
  });
  const app = express();
  const PORT = 3000;

  app.set("trust proxy", true);

  // Enable Gzip/Deflate compression for all responses
  app.use(compression());

  // 1. Serve Static Files FIRST (Highest Priority)
  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { 
      index: false,
      maxAge: "1y",
      immutable: true,
      etag: true
    }));
  }
  app.use("/uploads", express.static(uploadsDir));

  // 2. Request Logger
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (duration > 2000 || res.statusCode >= 500) {
        console.log(`[SLOW/ERR] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
      }
    });
    next();
  });

  // 3. Initialize Database
  console.log("Calling initDb...");
  await initDb();
  console.log("initDb finished.");
  startCronJobs();
  aiWorkerService.startWorker();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use(domainMiddleware);

  // API route to annotate images for social sharing
  app.get("/api/annotate-image", async (req, res) => {
    const { imageUrl, status } = req.query;
    if (!imageUrl || !status) return res.status(400).send("Missing parameters");

    try {
      const response = await axios.get(imageUrl as string, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);
      
      // Create ribbon SVG
      const text = status === 'sold' ? 'SATILDI' : 'KİRALANDI';
      const color = status === 'sold' ? '#d32f2f' : '#f57c00'; // Red for sold, Orange for rented
      
      // SVG overlay for diagonal ribbon
      const svgRibbon = `
        <svg width="800" height="800">
          <rect x="-100" y="300" width="1000" height="200" fill="${color}" transform="rotate(-45 400 400)" fill-opacity="0.8"/>
          <text x="400" y="425" font-family="Arial" font-size="80" fill="white" text-anchor="middle" font-weight="bold" transform="rotate(-45 400 400)">${text}</text>
        </svg>
      `;
      
      const annotated = await sharp(imageBuffer)
        .composite([{ input: Buffer.from(svgRibbon), gravity: 'center' }])
        .toBuffer();
      
      res.set('Content-Type', 'image/jpeg');
      res.send(annotated);
    } catch (err) {
      console.error("Image annotation error:", err);
      res.status(500).send("Error annotating image");
    }
  });


function sanitizeFilename(originalName: string): string {
  const turkishMap: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U'
  };

  // Convert Turkish characters
  let clean = originalName.split('').map(char => turkishMap[char] || char).join('');

  // Replace spaces and special characters with harmless characters
  clean = clean.replace(/\s+/g, '_');
  
  // Keep only a-z, A-Z, 0-9, dot, underscore, hyphen
  clean = clean.replace(/[^a-zA-Z0-9._-]/g, '');

  return clean || 'file';
}

  // File Upload Route (Supabase Storage)
  const upload = multer({ storage: multer.memoryStorage() });

  app.post("/api/upload", authenticate, upload.single("file"), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Check file size (2MB limit)
    if (req.file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ error: "File size exceeds 2MB limit" });
    }

    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.project_url;
      const supabaseKey = process.env.SUPABASE_KEY || process.env.service_role;
      if (!supabaseUrl || !supabaseKey) {
        return res.status(400).json({ 
          error: "Supabase API anahtarları eksik! Lütfen AI Studio Secrets veya .env ayarlarından SUPABASE_URL ve SUPABASE_KEY tanımlayın." 
        });
      }
      const { supabase } = await import("./src/services/supabaseService");
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = uniqueSuffix + "-" + sanitizeFilename(req.file.originalname);

      const { data, error } = await supabase.storage
        .from("lookdocu")
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("lookdocu")
        .getPublicUrl(filename);

      res.json({ url: publicUrlData.publicUrl });
    } catch (error: any) {
      console.error("Supabase upload error:", error);
      res.status(500).json({ error: "Failed to upload file to Supabase" });
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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.iyzipay.com https://*.iyzico.com https://*.payten.com.tr https://*.bkm.com.tr https://*.halkbank.com.tr https://*.garanti.com.tr https://*.isbank.com.tr; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: blob: https: https://maps.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net https://*.iyzipay.com https://*.iyzico.com https://*.payten.com.tr https://sanalpos.halkbank.com.tr https://*.insales-cdn.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "media-src 'self' https://assets.mixkit.co; " +
      "connect-src 'self' wss://*.run.app:* https://maps.googleapis.com https://analytics.google.com https://*.google-analytics.com https://*.analytics.google.com https://stats.g.doubleclick.net https://*.doubleclick.net https://*.run.app https://*.onrender.com https://generativelanguage.googleapis.com https://*.iyzipay.com https://*.iyzico.com https://*.payten.com.tr https://*.bkm.com.tr https://*.halkbank.com.tr https://*.garanti.com.tr https://*.isbank.com.tr; " +
      "frame-src 'self' https://*.iyzipay.com https://*.iyzico.com https://*.payten.com.tr https://*.bkm.com.tr https://*.halkbank.com.tr https://*.garanti.com.tr https://*.isbank.com.tr https://cdn.pannellum.org;"
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
      
      // Also trigger invoice background sync silently
      try {
        await runGlobalEInvoiceSync();
      } catch (e: any) {
        console.error("Global E-Invoice sync failed:", e.message);
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
  app.use("/api/real-estate", authenticate, realEstateRoutes);
  app.use("/api/ai-jobs", authenticate, aiJobsRoutes);
  app.use("/api/google-drive", googleDriveRoutes);
  app.use("/api/payment", paymentRoutes);
  app.use("/api/integrations", integrationRoutes);
  app.use("/api/instagram", instagramRoutes);
  app.use("/api", einvoiceRoutes);

  // Special case: Single Blog Post getter for dashboard
  app.get("/api/blog-posts/:id", authenticate, async (req: any, res) => {
    const blogId = req.params.id;
    const requestedId = req.query.storeId;
    const currentStoreId = req.user.store_id;
    let storeId = currentStoreId;
    if (req.user.role === "superadmin" && requestedId) {
      storeId = parseInt(requestedId as string);
    }

    try {
      const result = await pool.query(
        "SELECT * FROM blog_posts WHERE id = $1 AND store_id = $2",
        [blogId, storeId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Yazı bulunamadı." });
      }
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("Error fetching single blog post:", error);
      res.status(500).json({ error: error.message });
    }
  });

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

  // Dynamic Sitemap Generator for SEO & AI Crawlers
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const host = req.get('host') || "lookprice.net";
      const baseUrl = `${protocol}://${host}`;

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

      // Portal Sitemap Handling
      if (host === "enrakipsiz.com" || host === "www.enrakipsiz.com") {
        const storeBaseUrl = `${protocol}://${host}`;
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(storeBaseUrl)}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

        // Vehicles
        const vehiclesRes = await pool.query(
          "SELECT id, updated_at FROM vehicles WHERE is_on_enrakipsiz = true AND status <> 'sold'"
        );
        vehiclesRes.rows.forEach((v: any) => {
          xml += `  <url>
    <loc>${escapeXml(`${storeBaseUrl}/p/v_${v.id}`)}</loc>
    <lastmod>${v.updated_at ? new Date(v.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
        });

        // Real estates
        const realEstateRes = await pool.query(
          "SELECT id, updated_at FROM real_estate_properties WHERE is_on_enrakipsiz = true AND status <> 'sold'"
        );
        realEstateRes.rows.forEach((r: any) => {
          xml += `  <url>
    <loc>${escapeXml(`${storeBaseUrl}/p/re_${r.id}`)}</loc>
    <lastmod>${r.updated_at ? new Date(r.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;
        });

        xml += `</urlset>`;
        res.header('Content-Type', 'application/xml; charset=utf-8');
        return res.send(xml);
      }

      // Smart check: If this request comes from a custom store domain (not the main platform domains)
      const isPlatformHost = host === "lookprice.net" || 
                             host === "www.lookprice.net" || 
                             host.includes("localhost") || 
                             host.includes(".run.app") || 
                             host.includes("0.0.0.0");

      if (!isPlatformHost) {
        // Look up if this custom domain belongs to a specific store
        const storeCheck = await pool.query(
          "SELECT id, name, slug, custom_domain, updated_at FROM stores WHERE LOWER(custom_domain) = LOWER($1) LIMIT 1",
          [host]
        );
        if (storeCheck.rows.length > 0) {
          const storeObj = storeCheck.rows[0];
          const storeBaseUrl = `${protocol}://${storeObj.custom_domain}`;
          const storeLastMod = storeObj.updated_at 
            ? new Date(storeObj.updated_at).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0];

          let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(storeBaseUrl)}</loc>
    <lastmod>${storeLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

          // Products
          const productsRes = await pool.query(
            "SELECT id, barcode, updated_at FROM products WHERE store_id = $1 AND (is_web_sale = true OR is_web_sale IS NULL)",
            [storeObj.id]
          );
          productsRes.rows.forEach((p: any) => {
            const prodUrl = `${storeBaseUrl}/p/${p.barcode || p.id}`;
            const prodLastMod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : storeLastMod;
            xml += `  <url>
    <loc>${escapeXml(prodUrl)}</loc>
    <lastmod>${prodLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
          });

          // Vehicles
          const vehiclesRes = await pool.query(
            "SELECT id, updated_at FROM vehicles WHERE store_id = $1 AND status = 'for_sale'",
            [storeObj.id]
          );
          vehiclesRes.rows.forEach((v: any) => {
            const vUrl = `${storeBaseUrl}/p/v_${v.id}`;
            const vLastMod = v.updated_at ? new Date(v.updated_at).toISOString().split('T')[0] : storeLastMod;
            xml += `  <url>
    <loc>${escapeXml(vUrl)}</loc>
    <lastmod>${vLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
          });

          // Real estates
          const realEstateRes = await pool.query(
            "SELECT id, updated_at FROM real_estate_properties WHERE store_id = $1 AND status = 'active'",
            [storeObj.id]
          );
          realEstateRes.rows.forEach((r: any) => {
            const rUrl = `${storeBaseUrl}/p/re_${r.id}`;
            const rLastMod = r.updated_at ? new Date(r.updated_at).toISOString().split('T')[0] : storeLastMod;
            xml += `  <url>
    <loc>${escapeXml(rUrl)}</loc>
    <lastmod>${rLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;
          });

          xml += `</urlset>`;
          res.header('Content-Type', 'application/xml; charset=utf-8');
          return res.send(xml);
        }
      }

      // Default: Generation of sitemap for the entire multi-store platform
      const storesRes = await pool.query("SELECT id, name, slug, custom_domain, updated_at FROM stores");
      const stores = storesRes.rows;

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Platform Mainpages -->
  <url>
    <loc>${escapeXml(baseUrl)}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeXml(baseUrl)}/login</loc>
    <lastmod>2026-06-03</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>\n`;

      const productsRes = await pool.query(
        "SELECT id, store_id, barcode, updated_at FROM products WHERE is_web_sale = true OR is_web_sale IS NULL"
      );
      const products = productsRes.rows;

      const vehiclesRes = await pool.query(
        "SELECT id, store_id, updated_at FROM vehicles WHERE status = 'for_sale'"
      );
      const vehicles = vehiclesRes.rows;

      const realEstateRes = await pool.query(
        "SELECT id, store_id, updated_at FROM real_estate_properties WHERE status = 'active'"
      );
      const realEstates = realEstateRes.rows;

      const productsByStore = products.reduce((acc: any, p: any) => {
        acc[p.store_id] = acc[p.store_id] || [];
        acc[p.store_id].push(p);
        return acc;
      }, {});

      const vehiclesByStore = vehicles.reduce((acc: any, v: any) => {
        acc[v.store_id] = acc[v.store_id] || [];
        acc[v.store_id].push(v);
        return acc;
      }, {});

      const realEstateByStore = realEstates.reduce((acc: any, r: any) => {
        acc[r.store_id] = acc[r.store_id] || [];
        acc[r.store_id].push(r);
        return acc;
      }, {});

      stores.forEach((storeObj) => {
        const storeBaseUrl = storeObj.custom_domain 
          ? `${protocol}://${storeObj.custom_domain}` 
          : `${baseUrl}/s/${storeObj.slug}`;

        const storeLastMod = storeObj.updated_at 
          ? new Date(storeObj.updated_at).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0];

        xml += `  <url>
    <loc>${escapeXml(storeBaseUrl)}</loc>
    <lastmod>${storeLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;

        const storeProds = productsByStore[storeObj.id] || [];
        storeProds.forEach((p: any) => {
          const prodUrl = `${storeBaseUrl}/p/${p.barcode || p.id}`;
          const prodLastMod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : storeLastMod;
          xml += `  <url>
    <loc>${escapeXml(prodUrl)}</loc>
    <lastmod>${prodLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
        });

        const storeVehicles = vehiclesByStore[storeObj.id] || [];
        storeVehicles.forEach((v: any) => {
          const vUrl = `${storeBaseUrl}/p/v_${v.id}`;
          const vLastMod = v.updated_at ? new Date(v.updated_at).toISOString().split('T')[0] : storeLastMod;
          xml += `  <url>
    <loc>${escapeXml(vUrl)}</loc>
    <lastmod>${vLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
        });

        const storeRealEstates = realEstateByStore[storeObj.id] || [];
        storeRealEstates.forEach((r: any) => {
          const rUrl = `${storeBaseUrl}/p/re_${r.id}`;
          const rLastMod = r.updated_at ? new Date(r.updated_at).toISOString().split('T')[0] : storeLastMod;
          xml += `  <url>
    <loc>${escapeXml(rUrl)}</loc>
    <lastmod>${rLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>\n`;
        });
      });

      xml += `</urlset>`;
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(xml);
    } catch (e: any) {
      console.error("Dynamic sitemap generation failed:", e);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Dynamic Individual Store Sitemap Generator
  app.get("/s/:storeSlug/sitemap.xml", async (req, res) => {
    try {
      const { storeSlug } = req.params;
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const host = req.get('host') || "lookprice.net";
      const baseUrl = `${protocol}://${host}`;

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

      // Look up store by slug
      const storeRes = await pool.query(
        "SELECT id, name, slug, custom_domain, updated_at FROM stores WHERE LOWER(slug) = LOWER($1) LIMIT 1",
        [storeSlug]
      );
      if (storeRes.rows.length === 0) {
        return res.status(404).send("Store sitemap not found");
      }
      const storeObj = storeRes.rows[0];

      const storeBaseUrl = storeObj.custom_domain 
        ? `${protocol}://${storeObj.custom_domain}` 
        : `${baseUrl}/s/${storeObj.slug}`;

      const storeLastMod = storeObj.updated_at 
        ? new Date(storeObj.updated_at).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(storeBaseUrl)}</loc>
    <lastmod>${storeLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

      // Products
      const productsRes = await pool.query(
        "SELECT id, barcode, updated_at FROM products WHERE store_id = $1 AND (is_web_sale = true OR is_web_sale IS NULL)",
        [storeObj.id]
      );
      productsRes.rows.forEach((p: any) => {
        const prodUrl = `${storeBaseUrl}/p/${p.barcode || p.id}`;
        const prodLastMod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : storeLastMod;
        xml += `  <url>
    <loc>${escapeXml(prodUrl)}</loc>
    <lastmod>${prodLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      });

      // Vehicles
      const vehiclesRes = await pool.query(
        "SELECT id, updated_at FROM vehicles WHERE store_id = $1 AND status = 'for_sale'",
        [storeObj.id]
      );
      vehiclesRes.rows.forEach((v: any) => {
        const vUrl = `${storeBaseUrl}/p/v_${v.id}`;
        const vLastMod = v.updated_at ? new Date(v.updated_at).toISOString().split('T')[0] : storeLastMod;
        xml += `  <url>
    <loc>${escapeXml(vUrl)}</loc>
    <lastmod>${vLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      });

      // Real Esates
      const realEstateRes = await pool.query(
        "SELECT id, updated_at FROM real_estate_properties WHERE store_id = $1 AND status = 'active'",
        [storeObj.id]
      );
      realEstateRes.rows.forEach((r: any) => {
        const rUrl = `${storeBaseUrl}/p/re_${r.id}`;
        const rLastMod = r.updated_at ? new Date(r.updated_at).toISOString().split('T')[0] : storeLastMod;
        xml += `  <url>
    <loc>${escapeXml(rUrl)}</loc>
    <lastmod>${rLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>\n`;
      });

      xml += `</urlset>`;
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.send(xml);
    } catch (e: any) {
      console.error("Store sitemap generation failed:", e);
      res.status(500).send("Error generating store sitemap");
    }
  });

  // Vite Integration for Development
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in DEVELOPMENT mode");
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
          const customMetaTags = await generateMetaTags(url, req);

          const injection = `${customMetaTags}`;
          template = template.replace("</head>", `${injection}</head>`);
          template = injectEnrakipsizGtm(template, req);
          
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
    console.log("Running in PRODUCTION mode (HTML Handler)");
    const distPath = path.join(process.cwd(), "dist");
    
    // For all other routes, serve index.html with injected process.env
    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/uploads")) return next();
      
      try {
        const fs = await import("fs");
        console.log(`Serving index.html for path: ${req.originalUrl}`);
        const indexPath = path.join(distPath, "index.html");
        if (!fs.existsSync(indexPath)) {
          console.error(`CRITICAL ERROR: index.html not found at ${indexPath}`);
          return res.status(404).send("index.html not found");
        }
        let template = fs.readFileSync(indexPath, "utf-8");
        
        // Inject process.env into the head
        const envVars = {
          GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.Gemini_API_Key || process.env.GOOGLE_API_KEY || process.env.API_KEY || "",
          GOOGLE_MAPS_PLATFORM_KEY: process.env.GOOGLE_MAPS_PLATFORM_KEY || "",
          Gemini_API_Key: process.env.Gemini_API_Key || process.env.GEMINI_API_KEY || "",
          GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "",
          API_KEY: process.env.API_KEY || process.env.GEMINI_API_KEY || "",
          VITE_API_KEY: process.env.VITE_API_KEY || process.env.API_KEY || "",
          VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "",
          NODE_ENV: process.env.NODE_ENV || "production"
        };

        const customMetaTags = await generateMetaTags(req.originalUrl, req);

        console.log(`Serving index.html for path: ${req.originalUrl}`);
        const injection = `${customMetaTags}`;
        template = template.replace("</head>", `${injection}</head>`);
        template = injectEnrakipsizGtm(template, req);
        
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        next(e);
      }
    });
  }

  // Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Error Handler:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  console.log("Starting server listener...");
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
