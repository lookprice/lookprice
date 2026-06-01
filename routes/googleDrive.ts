import express from "express";
import { google } from "googleapis";
import { pool } from "../models/db";
import { authenticate } from "../middleware/auth";
import * as xlsx from "xlsx";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";

const router = express.Router();

function getOAuth2Client(req: express.Request) {
  const missing = [];
  if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  
  if (missing.length > 0) {
    const errorMsg = `Google Drive API kimlik bilgileri eksik veya yapılandırılmamış: ${missing.join(", ")}. Lütfen Secrets ayarlarından GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET değerlerini kontrol edin.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
  
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  // Try to use forwarded host, then host, then a default.
  // In production, explicitly set a BASE_URL env variable if needed.
  const host = req.headers["x-forwarded-host"] || req.get("host") || "lookprice.net";
  
  const redirectUrl = `${protocol}://${host}/api/google-drive/callback`;
  
  console.log(`OAuth2 Client initialized with: ClientID=${process.env.GOOGLE_CLIENT_ID?.substring(0, 5)}..., RedirectURL=${redirectUrl}`);

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUrl
  );
}

// 1. Get Google Drive Auth URL
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

// 2. Google Auth Callback
router.get("/callback", async (req: any, res) => {
  const { code, state } = req.query;
  const storeId = state;

  if (!code || !storeId) {
    return res.status(400).send("Geçersiz istek.");
  }

  try {
    const oauth2Client = getOAuth2Client(req);
    if (!oauth2Client) throw new Error("Google Drive yapılandırılmamış.");
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // tokens contains access_token and refresh_token
    await pool.query(
      "UPDATE stores SET google_drive_settings = $1 WHERE id = $2",
      [
        {
          connected: true,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date
        },
        storeId
      ]
    );

    res.send("<html><body><h1>Google Drive Bağlantısı Başarılı!</h1><p>Bu pencereyi kapatıp uygulamaya dönebilirsiniz.</p><script>setTimeout(() => window.close(), 3000);</script></body></html>");
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
