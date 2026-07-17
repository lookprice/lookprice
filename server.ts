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

  app.get("/api/instagram/proxy-image", async (req, res) => {
    const { 
      url, overlay, type, title, price, location, storeName,
      ref, status, sub1, sub2, sub3, sub4, agentName, agentPhone
    } = req.query;
    if (!url) return res.status(400).send("Missing url parameter");

    try {
      const response = await axios.get(url as string, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);
      
      let processedImage = sharp(imageBuffer);

      if (overlay === 'true') {
        // XML Escape helper
        const escapeXml = (str: string) => {
          if (!str) return "";
          return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
        };

        // Truncate helper
        const truncate = (str: string, maxLen: number) => {
          if (!str) return "";
          return str.length > maxLen ? str.substring(0, maxLen) + "..." : str;
        };

        const typeVal = type as string || 'property';
        const rawTitle = title as string || '';
        const rawPrice = price as string || '';
        const rawLocation = location as string || '';
        const rawStoreName = storeName as string || '';
        
        const rawRef = ref as string || '';
        const rawStatus = status as string || '';
        const rawSub1 = sub1 as string || '';
        const rawSub2 = sub2 as string || '';
        const rawSub3 = sub3 as string || '';
        const rawSub4 = sub4 as string || '';
        const rawAgentName = agentName as string || '';
        const rawAgentPhone = agentPhone as string || '';

        const titleText = escapeXml(truncate(rawTitle, 40));
        const priceText = escapeXml(truncate(rawPrice, 20));
        const locationText = escapeXml(truncate(rawLocation, 45));
        const storeText = escapeXml(truncate(rawStoreName, 25));

        const refText = rawRef ? rawRef.toUpperCase() : 'EN-PORTFÖY';
        const agentText = rawAgentName ? rawAgentName.toUpperCase() : (rawStoreName ? rawStoreName.toUpperCase() : 'SEÇKİN AGENT');
        const phoneText = rawAgentPhone || '+90 548 890 23 09';

        const sub1Text = truncate(rawSub1 || (typeVal === 'vehicle' ? 'Otomobil' : 'Gayrimenkul'), 15);
        const sub2Text = truncate(rawSub2 || (typeVal === 'vehicle' ? 'Otomatik' : 'Belirtilmedi'), 15);
        const sub3Text = truncate(rawSub3 || (typeVal === 'vehicle' ? 'Dizel' : 'Belirtilmedi'), 15);
        const sub4Text = truncate(rawSub4 || (typeVal === 'vehicle' ? '0 KM' : 'İletişime Geçin'), 20);

        const isRental = rawPrice.toLowerCase().includes('ay') || rawPrice.toLowerCase().includes('kira') || rawStatus.toLowerCase().includes('kiral');
        const priceLabel = typeVal === 'vehicle' ? 'SATIŞ BEDELİ' : (isRental ? 'AYLIK KİRA BEDELİ' : 'SATIŞ BEDELİ');

        let bannerText = '';
        const sLower = rawStatus.toLowerCase();
        if (sLower === 'kiralandi' || sLower === 'rented' || sLower === 'kiralandı') {
          bannerText = 'KİRALANDI';
        } else if (sLower === 'satildi' || sLower === 'sold' || sLower === 'satıldı') {
          bannerText = 'SATILDI';
        }
        
        // Define SVG overlay
        const svgOverlay = `
          <svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <!-- Amber/Yellow-Gold Gradient for bottom bar -->
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f59e0b" />
                <stop offset="100%" stop-color="#d97706" />
              </linearGradient>
            </defs>

            <!-- Outer Double Borders (Warm amber/gold) -->
            <rect x="18" y="18" width="1044" height="1044" fill="none" stroke="#d97706" stroke-width="4" rx="8" />
            <rect x="25" y="25" width="1030" height="1030" fill="none" stroke="#d97706" stroke-width="1.5" />

            <!-- Photo Frame Thin Border -->
            <rect x="48" y="138" width="984" height="644" fill="none" stroke="#4b5563" stroke-width="2" />
            <!-- Inside golden accent on the photo frame -->
            <rect x="45" y="135" width="990" height="650" fill="none" stroke="#d97706" stroke-width="1" />

            <!-- TOP HEADER (Consultant, Reference, Phone) -->
            <!-- Consultant Info (Left) -->
            <g transform="translate(50, 48)">
              <!-- Beautiful user icon -->
              <circle cx="25" cy="25" r="20" fill="#1e293b" stroke="#d97706" stroke-width="2" />
              <!-- User silhouette path -->
              <path d="M15,36 C15,29 19,27 25,27 C31,27 35,29 35,36" stroke="#d97706" stroke-width="2.5" fill="none" />
              <circle cx="25" cy="18" r="6" fill="#d97706" />
              <text x="60" y="32" font-family="'Inter', -apple-system, sans-serif" font-size="22" font-weight="900" fill="#ffffff" letter-spacing="0.5">${escapeXml(agentText)}</text>
            </g>

            <!-- Reference Badge (Center) -->
            <g transform="translate(540, 48)">
              <rect x="-140" y="5" width="280" height="40" fill="#0f172a" stroke="#d97706" stroke-width="2" rx="4" />
              <text x="0" y="31" font-family="'JetBrains Mono', SFMono-Regular, monospace" font-size="16" font-weight="bold" fill="#f59e0b" text-anchor="middle" letter-spacing="1.5">${escapeXml(refText)}</text>
            </g>

            <!-- Phone (Right) -->
            <g transform="translate(1030, 48)">
              <!-- Crisp white phone receiver icon -->
              <g transform="translate(-250, 8) scale(1.4)">
                <path d="M2 3a1 1 0 0 1 .945.681l1.199 3.598a1 1 0 0 1-.242 1.05l-1.393 1.393a11.582 11.582 0 0 0 5.316 5.316l1.393-1.393a1 1 0 0 1 1.05-.242l3.598 1.199a1 1 0 0 1 .681.945V15a2 2 0 0 1-2 2A15 15 0 0 1 2 3z" fill="#d97706" />
              </g>
              <text x="-10" y="32" font-family="'Inter', -apple-system, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="end" letter-spacing="0.5">${escapeXml(phoneText)}</text>
            </g>

            <!-- DETAILS ROW (Under Photo Frame) -->
            <!-- Location (Centered) -->
            <g transform="translate(540, 805)">
              <rect x="-320" y="0" width="640" height="42" fill="#0f172a" fill-opacity="0.95" stroke="#374151" stroke-width="1.5" rx="8" />
              <!-- Map pin icon -->
              <g transform="translate(-280, 10) scale(1.2)">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" fill="#ef4444" />
                <circle cx="12" cy="10" r="3" fill="#ffffff" />
              </g>
              <text x="0" y="27" font-family="'Inter', -apple-system, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">${escapeXml(locationText)}</text>
            </g>

            <!-- Badges Row (Centered at y=885) -->
            <g transform="translate(540, 885)" font-family="'Inter', -apple-system, sans-serif" font-size="20" font-weight="900" fill="#cbd5e1" text-anchor="middle" letter-spacing="0.5">
              <text y="0">
                <tspan fill="#f59e0b">${typeVal === 'vehicle' ? '🚗' : '🏠'}</tspan> ${escapeXml(sub1Text)}   •   <tspan fill="#f59e0b">${typeVal === 'vehicle' ? '⚙️' : '📐'}</tspan> ${escapeXml(sub2Text)}   •   <tspan fill="#f59e0b">${typeVal === 'vehicle' ? '⛽' : '📦'}</tspan> ${escapeXml(sub3Text)}   •   <tspan fill="#f59e0b">${typeVal === 'vehicle' ? '⏱' : '💰'}</tspan> ${escapeXml(sub4Text)}
              </text>
            </g>

            <!-- BOTTOM SOLID BAR (Gold background with high-contrast dark text) -->
            <g transform="translate(48, 935)">
              <rect x="0" y="0" width="984" height="110" fill="url(#goldGrad)" rx="6" />

              <!-- Price Label & Value & Store Name (Vertically stacked on the Left) -->
              <text x="35" y="26" font-family="'Inter', -apple-system, sans-serif" font-size="11" font-weight="900" fill="#0f172a" letter-spacing="1.5">${escapeXml(priceLabel.toUpperCase())}</text>
              <text x="35" y="68" font-family="'Inter', -apple-system, sans-serif" font-size="38" font-weight="950" fill="#0f172a" letter-spacing="-1">${escapeXml(priceText)}</text>
              <text x="35" y="98" font-family="'Inter', -apple-system, sans-serif" font-size="16" font-weight="900" fill="#ffffff" letter-spacing="0.5">${escapeXml(storeText.toUpperCase())}</text>

              <!-- Portal Name (Right) -->
              <text x="949" y="64" font-family="'Inter', -apple-system, sans-serif" font-size="26" font-weight="950" fill="#0f172a" text-anchor="end" letter-spacing="0.5">ENRAKİPSİZ<tspan fill="#ffffff">.COM</tspan></text>
            </g>

            <!-- Optional Tilted Red Banner (Sold/Rented) -->
            ${bannerText ? `
            <g transform="rotate(-20, 540, 460)">
              <!-- Red ribbon background with double borders -->
              <rect x="-200" y="405" width="1480" height="110" fill="#dc2626" stroke="#fef08a" stroke-width="4" />
              <!-- Red ribbon text -->
              <text x="540" y="478" font-family="'Inter', -apple-system, sans-serif" font-size="54" font-weight="950" fill="#ffffff" text-anchor="middle" letter-spacing="12">${escapeXml(bannerText)}</text>
            </g>
            ` : ''}
          </svg>
        `;

        // Resize the listing image to fit inside the photo frame
        const listingPhotoBuffer = await processedImage
          .resize(980, 640, { fit: 'cover', position: 'center' })
          .toBuffer();

        // Create deep slate background (color: #0b111e)
        const baseBackground = sharp({
          create: {
            width: 1080,
            height: 1080,
            channels: 4,
            background: { r: 11, g: 17, b: 30, alpha: 1 }
          }
        });

        processedImage = baseBackground.composite([
          { input: listingPhotoBuffer, top: 140, left: 50 },
          { input: Buffer.from(svgOverlay), top: 0, left: 0 }
        ]);
      }

      const converted = await processedImage
        .jpeg({ quality: 90 })
        .toBuffer();
      
      res.set('Content-Type', 'image/jpeg');
      res.send(converted);
    } catch (err: any) {
      console.error("Instagram proxy-image error:", err.message);
      res.status(500).send("Error converting image");
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
