import express from "express";
import { google } from "googleapis";
import { pool } from "../models/db";
import { authenticate } from "../middleware/auth";
import * as xlsx from "xlsx";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

const router = express.Router();

function getOAuth2Client(req: express.Request, customClientId?: string, customClientSecret?: string) {
  const oauthClientId =
    customClientId ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.CLIENT_ID ||
    "";
  const oauthClientSecret =
    customClientSecret ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.CLIENT_SECRET ||
    "";

  let protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  if (typeof protocol === "string" && protocol.includes(",")) {
    protocol = protocol.split(",")[0].trim();
  }

  let host = req.headers["x-forwarded-host"] || req.get("host") || "enrakipsiz.com";
  if (typeof host === "string" && host.includes(",")) {
    host = host.split(",")[0].trim();
  }

  // Always use https on non-localhost hosts
  if (!host.includes("localhost") && !host.startsWith("127.0.0.1")) {
    protocol = "https";
  }

  const redirectUrl = `${protocol}://${host}/api/google-drive/callback`;

  return new google.auth.OAuth2(
    oauthClientId,
    oauthClientSecret,
    redirectUrl
  );
}

async function getSuperAdminDriveConfig(): Promise<any | null> {
  try {
    const res = await pool.query(
      "SELECT id, client_id, client_secret, config, updated_at FROM integrator_configs WHERE marketplace = 'google_drive_5tb' ORDER BY id DESC LIMIT 1"
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    let cfg = row.config;
    if (typeof cfg === "string") {
      try { cfg = JSON.parse(cfg); } catch { cfg = {}; }
    }
    return {
      id: row.id,
      client_id: row.client_id,
      client_secret: row.client_secret,
      config: cfg || {},
      updated_at: row.updated_at
    };
  } catch {
    return null;
  }
}

async function saveSuperAdminDriveConfig(configData: any): Promise<void> {
  const existing = await getSuperAdminDriveConfig();
  const clientId = process.env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || DEFAULT_GOOGLE_CLIENT_SECRET;
  const mergedConfig = {
    ...(existing?.config || {}),
    ...configData
  };

  if (existing?.id) {
    await pool.query(
      "UPDATE integrator_configs SET client_id = $1, client_secret = $2, config = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4",
      [clientId, clientSecret, JSON.stringify(mergedConfig), existing.id]
    );
  } else {
    await pool.query(
      "INSERT INTO integrator_configs (marketplace, env, client_id, client_secret, config) VALUES ('google_drive_5tb', 'production', $1, $2, $3)",
      [clientId, clientSecret, JSON.stringify(mergedConfig)]
    );
  }
}

// SuperAdmin: Get 5 TB Google Drive Status & Quota
router.get("/superadmin-status", authenticate, async (req: any, res) => {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const record = await getSuperAdminDriveConfig();
    const cfg = record?.config || {};
    if (!cfg.connected || !cfg.refresh_token) {
      return res.json({
        connected: false,
        email: null,
        limitGB: 5000,
        usageGB: 0,
        lastBackupAt: cfg.lastBackupAt || null,
        lastBackupFileName: cfg.lastBackupFileName || null
      });
    }

    const oauth2Client = getOAuth2Client(req, record?.client_id, record?.client_secret);
    oauth2Client.setCredentials({
      access_token: cfg.access_token,
      refresh_token: cfg.refresh_token,
      expiry_date: cfg.expiry_date
    });

    let email = cfg.email || "lookprice.me@gmail.com";
    let limitGB = 5120;
    let usageGB = 0;

    try {
      const drive = google.drive({ version: "v3", auth: oauth2Client });
      const aboutRes = await drive.about.get({ fields: "user(emailAddress,displayName),storageQuota(limit,usage)" });
      if (aboutRes.data?.user?.emailAddress) {
        email = aboutRes.data.user.emailAddress;
      }
      const qLimit = Number(aboutRes.data?.storageQuota?.limit || 0);
      const qUsage = Number(aboutRes.data?.storageQuota?.usage || 0);
      if (qLimit > 0) limitGB = parseFloat((qLimit / (1024 * 1024 * 1024)).toFixed(1));
      if (qUsage > 0) usageGB = parseFloat((qUsage / (1024 * 1024 * 1024)).toFixed(2));
    } catch {
      // Fallback to cached info if Drive about call only has drive.file scope
    }

    return res.json({
      connected: true,
      email,
      limitGB,
      usageGB,
      lastBackupAt: cfg.lastBackupAt || null,
      lastBackupFileName: cfg.lastBackupFileName || null,
      lastBackupSizeKB: cfg.lastBackupSizeKB || null
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// SuperAdmin: Get 5 TB Google Drive OAuth URL
router.get("/superadmin-auth-url", authenticate, async (req: any, res) => {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/userinfo.email"
      ],
      state: "superadmin_5tb"
    });
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SuperAdmin: Trigger Immediate Full System Database Backup to 5 TB Google Drive
router.post("/superadmin-backup", authenticate, async (req: any, res) => {
  if (req.user?.role !== "superadmin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const record = await getSuperAdminDriveConfig();
    const cfg = record?.config || {};
    if (!cfg.connected || !cfg.refresh_token) {
      return res.status(400).json({ error: "Önce '5 TB Drive Bağla' butonu ile Google Drive hesabınızı bağlayın." });
    }

    const oauth2Client = getOAuth2Client(req, record?.client_id, record?.client_secret);
    oauth2Client.setCredentials({
      access_token: cfg.access_token,
      refresh_token: cfg.refresh_token,
      expiry_date: cfg.expiry_date
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 1. Find or create 'LookPrice_5TB_Backups' folder on Google Drive
    let folderId = cfg.backupFolderId || null;
    if (!folderId) {
      try {
        const folderSearch = await drive.files.list({
          q: "mimeType='application/vnd.google-apps.folder' and name='LookPrice_5TB_Backups' and trashed=false",
          fields: "files(id, name)"
        });
        if (folderSearch.data.files && folderSearch.data.files.length > 0) {
          folderId = folderSearch.data.files[0].id || null;
        } else {
          const createdFolder = await drive.files.create({
            requestBody: {
              name: "LookPrice_5TB_Backups",
              mimeType: "application/vnd.google-apps.folder"
            },
            fields: "id"
          });
          folderId = createdFolder.data.id || null;
        }
      } catch {
        folderId = null;
      }
    }

    // 2. Collect core database tables in safe sequential queries
    const tablesToBackup = [
      { name: "stores", query: "SELECT * FROM stores ORDER BY id ASC" },
      { name: "users", query: "SELECT id, store_id, email, role, name, full_name, phone, is_active, created_at FROM users ORDER BY id ASC" },
      { name: "products", query: "SELECT * FROM products ORDER BY id ASC" },
      { name: "customers", query: "SELECT * FROM customers ORDER BY id ASC" },
      { name: "companies", query: "SELECT * FROM companies ORDER BY id ASC" },
      { name: "sales_invoices", query: "SELECT * FROM sales_invoices ORDER BY id DESC LIMIT 5000" },
      { name: "purchase_invoices", query: "SELECT id, store_id, supplier_id, supplier_name, tax_number, invoice_number, document_number, ettn, invoice_date, total_amount, tax_amount, grand_total, currency, status, created_at FROM purchase_invoices ORDER BY id DESC LIMIT 5000" },
      { name: "real_estate_properties", query: "SELECT * FROM real_estate_properties ORDER BY id DESC" },
      { name: "vehicles", query: "SELECT * FROM vehicles ORDER BY id DESC" }
    ];

    const backupPayload: Record<string, any> = {
      meta: {
        exportedAt: new Date().toISOString(),
        platform: "LookPrice & Enrakipsiz 5TB Cloud Backup",
        counts: {}
      },
      data: {}
    };

    for (const tbl of tablesToBackup) {
      try {
        const qRes = await pool.query(tbl.query);
        backupPayload.data[tbl.name] = qRes.rows;
        backupPayload.meta.counts[tbl.name] = qRes.rows.length;
      } catch {
        backupPayload.data[tbl.name] = [];
        backupPayload.meta.counts[tbl.name] = 0;
      }
    }

    const jsonString = JSON.stringify(backupPayload, null, 2);
    const buffer = Buffer.from(jsonString, "utf-8");
    const sizeKB = Math.round(buffer.length / 1024);
    const dateStamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `LookPrice_Full_DB_Backup_${dateStamp}.json`;

    const fileStream = new PassThrough();
    fileStream.end(buffer);

    const uploadRes = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: "application/json",
        ...(folderId ? { parents: [folderId] } : {})
      },
      media: {
        mimeType: "application/json",
        body: fileStream
      },
      fields: "id, name, webViewLink"
    });

    await saveSuperAdminDriveConfig({
      backupFolderId: folderId,
      lastBackupAt: new Date().toISOString(),
      lastBackupFileName: fileName,
      lastBackupFileId: uploadRes.data.id,
      lastBackupSizeKB: sizeKB
    });

    return res.json({
      success: true,
      fileId: uploadRes.data.id,
      fileName,
      sizeKB,
      counts: backupPayload.meta.counts,
      message: `Tam sistem yedeği (${sizeKB} KB) 5 TB Google Drive 'LookPrice_5TB_Backups' klasörüne başarıyla kaydedildi.`
    });
  } catch (error: any) {
    console.error("SuperAdmin 5TB Drive backup error:", error);
    return res.status(500).json({ error: error.message || "Google Drive yedekleme hatası." });
  }
});

// 1. Get Google Drive Auth URL (Store Level)
router.get("/auth-url", authenticate, async (req: any, res) => {
  const storeId = req.user.storeId || req.user.store_id; 
  if (!storeId) {
    return res.status(400).json({ error: "Store ID bulunamadı." });
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent", // Force to get refresh token
      scope: ["https://www.googleapis.com/auth/drive.file"],
      state: storeId.toString()
    });

    res.json({ url });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// 2. Google Auth Callback (Supports both SuperAdmin 5TB Vault & Store Level)
router.get("/callback", async (req: any, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send("Geçersiz istek.");
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    const { tokens } = await oauth2Client.getToken(code as string);

    if (state === "superadmin_5tb") {
      oauth2Client.setCredentials(tokens);
      let email = "lookprice.me@gmail.com";
      try {
        const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        if (userInfo.data?.email) email = userInfo.data.email;
      } catch {}

      await saveSuperAdminDriveConfig({
        connected: true,
        email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        connectedAt: new Date().toISOString()
      });

      return res.send(
        "<html><body style='font-family:sans-serif;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;'><div style='text-align:center;padding:32px;background:#1e293b;border-radius:16px;border:1px solid #334155;'><h2 style='color:#34d399;margin-top:0;'>5 TB Google Drive Kasası Bağlandı!</h2><p>Hesap: " +
          email +
          "</p><p style='color:#94a3b8;font-size:13px;'>Bu pencere otomatik kapanıyor...</p></div><script>if(window.opener){window.opener.postMessage('google_drive_5tb_connected','*');}setTimeout(() => window.close(), 1800);</script></body></html>"
      );
    }

    const storeId = state;
    const existingRes = await pool.query("SELECT google_drive_settings FROM stores WHERE id = $1", [storeId]);
    const prevSettings = existingRes.rows[0]?.google_drive_settings || {};

    await pool.query(
      "UPDATE stores SET google_drive_settings = $1 WHERE id = $2",
      [
        {
          ...prevSettings,
          connected: true,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || prevSettings.refresh_token,
          expiry_date: tokens.expiry_date
        },
        storeId
      ]
    );

    res.send("<html><body><h1>Google Drive Bağlantısı Başarılı!</h1><p>Bu pencereyi kapatıp uygulamaya dönebilirsiniz.</p><script>setTimeout(() => window.close(), 2500);</script></body></html>");
  } catch (error: any) {
    console.error("Google Drive Callback Error:", error.message || error);
    res.status(500).send("Bağlantı sırasında bir hata oluştu: " + error.message);
  }
});

// 3. Get Google Drive Settings
router.get("/settings", authenticate, async (req: any, res) => {
  const storeId = req.user.storeId || req.user.store_id;
  try {
    const { rows } = await pool.query("SELECT google_drive_settings FROM stores WHERE id = $1", [storeId]);
    const settings = rows[0]?.google_drive_settings || {};
    res.json({ connected: !!settings.connected });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Disconnect Google Drive
router.post("/disconnect", authenticate, async (req: any, res) => {
  const storeId = req.user.storeId || req.user.store_id;
  try {
    await pool.query("UPDATE stores SET google_drive_settings = '{}' WHERE id = $1", [storeId]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Export Data to Google Drive (XLS/PDF)
router.post("/export", authenticate, async (req: any, res) => {
  const storeId = req.user.storeId || req.user.store_id;
  const { format, targetType } = req.body; // format 'xls' or 'pdf', targetType 'products' or 'real_estate'

  if (!format || !targetType) {
    return res.status(400).json({ error: "Format ve targetType zorunludur." });
  }

  try {
    const { rows } = await pool.query("SELECT google_drive_settings FROM stores WHERE id = $1", [storeId]);
    const settings = rows[0]?.google_drive_settings;

    if (!settings || !settings.connected || !settings.refresh_token) {
      return res.status(400).json({ error: "Google Drive bağlı değil." });
    }

    const oauth2Client = getOAuth2Client(req);
    if (!oauth2Client) throw new Error("Google Drive yapılandırılmamış.");
    
    oauth2Client.setCredentials({
      access_token: settings.access_token,
      refresh_token: settings.refresh_token,
      expiry_date: settings.expiry_date
    });

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Fetch data based on targetType
    let dataRows: any[] = [];
    let title = "";
    
    if (targetType === "products") {
      const q = await pool.query("SELECT * FROM products WHERE store_id = $1", [storeId]);
      dataRows = q.rows;
      title = `Urunler_Yedegi_${Date.now()}`;
    } else if (targetType === "real_estate") {
      const q = await pool.query("SELECT * FROM real_estate_properties WHERE store_id = $1", [storeId]);
      dataRows = q.rows;
      title = `Portfoy_Yedegi_${Date.now()}`;
    } else {
      return res.status(400).json({ error: "Geçersiz targetType." });
    }

    let mimeType = "";
    let fileStream = new PassThrough();

    if (format === "xls") {
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const worksheet = xlsx.utils.json_to_sheet(dataRows);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
      const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
      fileStream.end(buffer);
    } else if (format === "pdf") {
      mimeType = "application/pdf";
      const doc = new PDFDocument();
      doc.pipe(fileStream);
      doc.fontSize(20).text(`Yedek: ${targetType.toUpperCase()}`, { align: "center" });
      doc.moveDown();
      
      dataRows.forEach((row, i) => {
        doc.fontSize(12).text(`--- Kayit ${i + 1} ---`);
        Object.keys(row).forEach(k => {
          doc.fontSize(10).text(`${k}: ${row[k]}`);
        });
        doc.moveDown();
      });
      doc.end();
    } else {
       return res.status(400).json({ error: "Geçersiz format" });
    }

    const uploadResponse = await drive.files.create({
      requestBody: {
        name: `${title}.${format === 'xls' ? 'xlsx' : 'pdf'}`,
        mimeType: mimeType
      },
      media: {
        mimeType: mimeType,
        body: fileStream
      }
    });

    res.json({ success: true, fileId: uploadResponse.data.id, message: "Dosya Google Drive'a başarıyla yüklendi." });
  } catch (error: any) {
    console.error("Drive upload error:", error);
    res.status(500).json({ error: "Yedekleme sırasında bir hata oluştu." });
  }
});

export default router;
