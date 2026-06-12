import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../models/db";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Middleware to ensure superadmin
const isSuperAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== "superadmin") return res.status(403).json({ error: "Forbidden" });
  next();
};

router.use(authenticate);
router.use(isSuperAdmin);

// SuperAdmin: Stats
router.get("/stats", async (req: any, res) => {
  const totalStores = (await pool.query("SELECT COUNT(*)::INT as count FROM stores")).rows[0].count;
  const activeStores = (await pool.query("SELECT COUNT(*)::INT as count FROM stores WHERE subscription_end > CURRENT_DATE")).rows[0].count;
  const totalScans = (await pool.query("SELECT COUNT(*)::INT as count FROM scan_logs")).rows[0].count;
  const scansLast24h = (await pool.query("SELECT COUNT(*)::INT as count FROM scan_logs WHERE created_at > NOW() - INTERVAL '1 day'")).rows[0].count;

  res.json({
    totalStores: parseInt(totalStores),
    activeStores: parseInt(activeStores),
    totalScans: parseInt(totalScans),
    scansLast24h: parseInt(scansLast24h)
  });
});

// SuperAdmin: Manage Stores
router.get("/stores", async (req: any, res) => {
  const stores = await pool.query(`
    SELECT s.*, u.email as admin_email 
    FROM stores s 
    LEFT JOIN users u ON s.id = u.store_id AND u.role = 'storeadmin'
  `);
  res.json(stores.rows);
});

router.post("/stores", async (req: any, res) => {
  const { name, slug, address, contact_person, phone, country, email, subscription_end, admin_email, admin_password, default_currency, language, plan, parent_id, store_type, sub_sector } = req.body;
  try {
    await pool.query("BEGIN");
    const storeRes = await pool.query(
      "INSERT INTO stores (name, slug, address, contact_person, phone, country, email, subscription_end, default_currency, language, plan, parent_id, store_type, sub_sector) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id",
      [name, slug, address, contact_person, phone, country || 'TR', email, subscription_end, default_currency || 'TRY', language || 'tr', plan || 'free', parent_id || null, store_type || 'product', sub_sector || null]
    );
    const storeId = storeRes.rows[0].id;
    const hashedPassword = bcrypt.hashSync(admin_password, 10);
    await pool.query("INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)", [storeId, admin_email, hashedPassword, "storeadmin"]);
    await pool.query("COMMIT");
    res.json({ success: true, storeId });
  } catch (e: any) {
    await pool.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  }
});

router.put("/stores/:id", async (req: any, res) => {
  const { name, slug, address, contact_person, phone, country, email, subscription_end, default_currency, language, admin_password, plan, parent_id, store_type, sub_sector } = req.body;
  try {
    await pool.query("BEGIN");
    await pool.query(`
      UPDATE stores 
      SET name = $1, slug = $2, address = $3, contact_person = $4, phone = $5, country = $6, email = $7, subscription_end = $8, default_currency = $9, language = $10, plan = $11, parent_id = $12, store_type = $13, sub_sector = $14
      WHERE id = $15
    `, [name, slug, address, contact_person, phone, country || 'TR', email, subscription_end, default_currency || 'TRY', language || 'tr', plan || 'free', parent_id || null, store_type || 'product', sub_sector || null, req.params.id]);

    if (admin_password) {
      const hashedPassword = bcrypt.hashSync(admin_password, 10);
      await pool.query(`
        UPDATE users 
        SET password = $1 
        WHERE store_id = $2 AND role = 'storeadmin'
      `, [hashedPassword, req.params.id]);
    }

    await pool.query("COMMIT");
    res.json({ success: true });
  } catch (e: any) {
    await pool.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  }
});

router.post("/stores/:id/delete", async (req: any, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ error: "Password required" });

  try {
    // Verify admin password
    const admin = await pool.query("SELECT password FROM users WHERE id = $1", [req.user.id]);
    if (!bcrypt.compareSync(password, admin.rows[0].password)) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    await pool.query("BEGIN");
    // Delete related records that don't have ON DELETE CASCADE
    await pool.query("DELETE FROM scan_logs WHERE store_id = $1", [id]);
    await pool.query("DELETE FROM tickets WHERE store_id = $1", [id]);
    await pool.query("DELETE FROM users WHERE store_id = $1", [id]);
    await pool.query("DELETE FROM products WHERE store_id = $1", [id]);
    await pool.query("DELETE FROM real_estate_properties WHERE store_id = $1", [id]).catch(() => {});
    await pool.query("DELETE FROM real_estate WHERE store_id = $1", [id]).catch(() => {});
    await pool.query("DELETE FROM vehicles WHERE store_id = $1", [id]).catch(() => {});
    await pool.query("DELETE FROM radar_news WHERE store_id = $1", [id]).catch(() => {});
    await pool.query("DELETE FROM consultants WHERE store_id = $1", [id]).catch(() => {});
    await pool.query("DELETE FROM blog_posts WHERE store_id = $1", [id]).catch(() => {});
    await pool.query("DELETE FROM stores WHERE id = $1", [id]);
    await pool.query("COMMIT");
    
    res.json({ success: true });
  } catch (e: any) {
    await pool.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  }
});

router.post("/stores/bulk-subscription", async (req: any, res) => {
  const { storeIds, days } = req.body;
  if (!storeIds || !Array.isArray(storeIds) || !days) return res.status(400).json({ error: "Invalid data" });

  try {
    await pool.query("BEGIN");
    for (const id of storeIds) {
      await pool.query(`
        UPDATE stores 
        SET subscription_end = COALESCE(subscription_end, CURRENT_DATE) + ($1 || ' days')::INTERVAL 
        WHERE id = $2
      `, [days, id]);
    }
    await pool.query("COMMIT");
    res.json({ success: true });
  } catch (e) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: "Bulk update failed" });
  }
});

// Admin: Leads Management
router.get("/leads", async (req: any, res) => {
  try {
    const leads = await pool.query("SELECT * FROM leads ORDER BY created_at DESC");
    res.json(leads.rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/leads/:id", async (req: any, res) => {
  const { status, probability, notes } = req.body;
  try {
    await pool.query(
      "UPDATE leads SET status = $1, probability = $2, notes = $3 WHERE id = $4",
      [status, probability, notes, req.params.id]
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/leads/:id", async (req: any, res) => {
  try {
    await pool.query("DELETE FROM leads WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e: any) {
    console.error("Delete lead error:", e);
    res.status(400).json({ error: e.message });
  }
});

// Admin: Registration Requests
router.get("/registration-requests", async (req: any, res) => {
  try {
    const requests = await pool.query("SELECT * FROM registration_requests ORDER BY created_at DESC");
    res.json(requests.rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/stores/:id/custom-domain", async (req: any, res) => {
  const { id } = req.params;
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: "Domain required" });

  try {
    const { cloudflareService } = await import("../src/services/cloudflareService");
    
    // 1. Create Zone
    const zoneResult = await cloudflareService.createZone(domain);
    const zoneId = zoneResult.id;
    const nameServers = zoneResult.name_servers;

    // 2. Add DNS Records (A record to Render, CNAME for www) - PROXIED for Origin Rules
    await cloudflareService.addDnsRecord(zoneId, "A", "@", "216.24.57.1", false);
    await cloudflareService.addDnsRecord(zoneId, "CNAME", "www", "lookprice-2bpv.onrender.com", true);

    // 3. Setup Origin Rules to handle Host header override for Render
    await cloudflareService.setupOriginRules(zoneId, "lookprice-2bpv.onrender.com");

    // 4. Ensure SSL mode is set to "full" to prevent 502/redirect loops
    await cloudflareService.setZoneSslMode(zoneId, "full");

    // 5. Save to database
    await pool.query(
      "UPDATE stores SET custom_domain = $1, custom_domain_status = $2, cf_zone_id = $3, cf_name_servers = $4 WHERE id = $5",
      [domain, zoneResult.status || 'pending', zoneId, JSON.stringify(nameServers), id]
    );
    
    res.json({ success: true, name_servers: nameServers, status: zoneResult.status });
  } catch (e: any) {
    console.error(`POST /api/admin/stores/${id}/custom-domain error:`, e);
    res.status(400).json({ error: e.message });
  }
});

router.get("/stores/:id/custom-domain/status", async (req: any, res) => {
  const { id } = req.params;
  try {
    const storeRes = await pool.query("SELECT custom_domain, cf_zone_id, custom_domain_status, cf_name_servers FROM stores WHERE id = $1", [id]);
    const store = storeRes.rows[0];
    if (!store?.custom_domain || !store?.cf_zone_id) {
      return res.json({ success: true, domain: store?.custom_domain || null, status: 'none' });
    }

    const { cloudflareService } = await import("../src/services/cloudflareService");
    const zoneStatus = await cloudflareService.getZoneStatus(store.cf_zone_id);
    
    if (zoneStatus.status !== store.custom_domain_status) {
      await pool.query("UPDATE stores SET custom_domain_status = $1 WHERE id = $2", [zoneStatus.status, id]);
      store.custom_domain_status = zoneStatus.status;
    }
    
    res.json({ 
      success: true, 
      domain: store.custom_domain, 
      status: store.custom_domain_status,
      name_servers: store.cf_name_servers 
    });
  } catch (e: any) {
    console.error(`GET /api/admin/stores/${id}/custom-domain/status error:`, e);
    res.status(400).json({ error: e.message });
  }
});

router.post("/stores/:id/custom-domain/manual", async (req: any, res) => {
  const { id } = req.params;
  const { domain } = req.body;
  if (!domain) return res.status(400).json({ error: "Domain required" });

  try {
    await pool.query(
      "UPDATE stores SET custom_domain = $1, custom_domain_status = $2 WHERE id = $3",
      [domain, 'manual', id]
    );
    res.json({ success: true, message: "Domain saved manually" });
  } catch (e: any) {
    console.error(`POST /api/admin/stores/${id}/custom-domain/manual error:`, e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/registration-requests/:id/approve", async (req: any, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const requestRes = await client.query("SELECT * FROM registration_requests WHERE id = $1", [id]);
    const request = requestRes.rows[0];
    if (!request) throw new Error("Request not found");
    if (request.status !== 'pending') throw new Error("Request already processed");

    // 1. Create Store
    const slug = request.store_name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Math.random().toString(36).substring(2, 5);
    const storeRes = await client.query(
      "INSERT INTO stores (name, slug, address, contact_person, phone, email, default_currency, language, plan, country, subscription_end) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE + INTERVAL '1 year') RETURNING id",
      [request.store_name, slug, request.address, request.company_title, request.phone, request.username, request.currency, request.language, request.plan || 'free', request.country || 'TR']
    );
    const storeId = storeRes.rows[0].id;

    // 2. Create User
    const hashedPassword = bcrypt.hashSync(request.password, 10);
    await client.query("INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)", [storeId, request.username, hashedPassword, "storeadmin"]);

    // 3. Import Products if any
    if (request.upload_method === 'excel' && request.excel_data && request.mapping) {
      const products = request.excel_data;
      const mapping = request.mapping;
      for (const p of products) {
        const barcode = String(p[mapping.barcode] || "");
        const name = String(p[mapping.name] || "");
        const price = parseFloat(p[mapping.price]) || 0;
        const description = String(p[mapping.description] || "");
        
        if (barcode && name) {
          await client.query(
            "INSERT INTO products (store_id, barcode, name, price, currency, description) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING",
            [storeId, barcode, name, price, request.currency, description]
          );
        }
      }
    }

    // 4. Update request status
    await client.query("UPDATE registration_requests SET status = 'approved' WHERE id = $1", [id]);

    await client.query("COMMIT");
    res.json({ success: true, slug });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.post("/registration-requests/:id/reject", async (req: any, res) => {
  try {
    await pool.query("UPDATE registration_requests SET status = 'rejected' WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/registration-requests/:id", async (req: any, res) => {
  try {
    await pool.query("DELETE FROM registration_requests WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

async function ensureEnrakipsizTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS enrakipsiz_settings (
      id INT PRIMARY KEY,
      portal_title TEXT,
      portal_description TEXT,
      announcement TEXT,
      primary_color TEXT DEFAULT '#4f46e5',
      footer_text TEXT,
      portal_domain TEXT
    );
  `);
  
  // Seed settings if not exists
  const settingsCheck = await pool.query("SELECT id FROM enrakipsiz_settings WHERE id = 1");
  if (settingsCheck.rows.length === 0) {
    await pool.query(`
      INSERT INTO enrakipsiz_settings (id, portal_title, portal_description, announcement, primary_color, footer_text, portal_domain)
      VALUES (1, 'Göz Alıcı İhtişam, Mühendislik Harikası', 'Seçkin oto galerilerimizin sertifikalı ultra lüks, eşsiz kondisyondaki araç koleksiyonunu doğrudan inceleyin.', 'Sadece portal müşterilerine lüks gayrimenkul ve araç alımlarında 12 ila 36 ay vadede kişiye özel oranlı prestij kredisi ve takas desteği.', '#4f46e5', '© 2026 Enrakipsiz.com. Tüm hakları saklıdır.', 'enrakipsiz.com')
    `);
  } else {
    // Ensure column exists for existing tables
    await pool.query("ALTER TABLE enrakipsiz_settings ADD COLUMN IF NOT EXISTS portal_domain TEXT").catch(() => {});
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enrakipsiz_slides (
      id SERIAL PRIMARY KEY,
      image_url TEXT NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      description TEXT,
      badge TEXT,
      accent TEXT DEFAULT 'from-indigo-500 to-purple-500',
      type TEXT,
      link_url TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enrakipsiz_ads (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      broker TEXT,
      description TEXT,
      profit_badge TEXT,
      action_text TEXT DEFAULT 'Anında Başvur',
      link_url TEXT,
      media_type TEXT DEFAULT 'image',
      media_url TEXT,
      position TEXT DEFAULT 'middle',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default slides if empty
  const slidesCheck = await pool.query("SELECT id FROM enrakipsiz_slides LIMIT 1");
  if (slidesCheck.rows.length === 0) {
    await pool.query(`
      INSERT INTO enrakipsiz_slides (image_url, title, subtitle, description, badge, accent, type, is_active)
      VALUES 
      ('https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80', 'Göz Alıcı İhtişam, Mühendislik Harikası', 'YENİ NESİL SÜPER SPOR COUPE COIL', 'Seçkin oto galerilerimizin sertifikalı ultra lüks, eşsiz kondisyondaki araç koleksiyonunu doğrudan inceleyin.', 'Prestige Motors', 'from-rose-500 to-amber-500', 'vehicle', TRUE),
      ('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', 'Prestij Sahibi Seçkin Malikaneler', 'DENİZE SIFIR AKDENİZ VE BOĞAZ YALILARI', 'Eşsiz manzaralara, tam güvenlik donanımına ve modern mimari çizgilere sahip en değerli akredite portföy.', 'Elite Properties', 'from-amber-400 to-yellow-500', 'real_estate', TRUE),
      ('https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=80', 'Zamanın Ötesinde Bir Başyapıt', 'HAUTE-HORLOGERIE SINIRLI SAYI SAATLER', 'Dünya mirası butik markaların özel koleksiyoncu serisi mekanik saatlerini ve nadide aksesuarlarını keşfedin.', 'Grand Boutique', 'from-purple-500 to-pink-500', 'product', TRUE)
    `);
  }

  // Seed default ads if empty
  const adsCheck = await pool.query("SELECT id FROM enrakipsiz_ads LIMIT 1");
  if (adsCheck.rows.length === 0) {
    await pool.query(`
      INSERT INTO enrakipsiz_ads (title, broker, description, profit_badge, action_text, link_url, media_type, media_url, position, is_active)
      VALUES
      ('Enrakipsiz Özel Taşıt & Konut Finansmanı', 'LOOKPRICE BANK PARTNERS', 'Sadece portal müşterilerine lüks gayrimenkul ve araç alımlarında 12 ila 36 ay vadede kişiye özel oranlı prestij kredisi ve takas desteği.', '%1.19 Tercihli Faiz', 'Anında Başvur', '', 'image', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=400&q=80', 'middle', TRUE),
      ('7/24 VIP Concierge & Ekspertiz Sigortası', 'LOOKPRICE LUXURY CARE', 'Satın aldığınız tüm araç veya villalar için adrese teslimat, noter takibi, sigorta poliçesi ve 12 ay mekanik garanti paketi avantajları.', 'Full Teminat Güvencesi', 'Hizmeti İncele', '', 'image', 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=80', 'middle', TRUE),
      ('Burada Yer Alın: Aylık 1.2M+ Nitelikli Ziyaretçi', 'ENRAKİPSİZ SPONSOR NETWORK', 'Markanızı, projenizi veya özel hizmetlerinizi portalımızda sergileyerek doğrudan Alıcı ve Satıcı premium kitleyle buluşturun.', 'Yüksek Prestij & Dönüşüm', 'Sponsor Ol', '', 'image', '', 'middle', TRUE)
    `);
  }
}

router.get("/enrakipsiz/settings", async (req: any, res) => {
  try {
    await ensureEnrakipsizTables();
    const settings = await pool.query("SELECT * FROM enrakipsiz_settings WHERE id = 1");
    const slides = await pool.query("SELECT * FROM enrakipsiz_slides ORDER BY id ASC");
    const ads = await pool.query("SELECT * FROM enrakipsiz_ads ORDER BY id ASC");
    res.json({
      settings: settings.rows[0],
      slides: slides.rows,
      ads: ads.rows
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/enrakipsiz/settings", async (req: any, res) => {
  const { portal_title, portal_description, announcement, primary_color, footer_text, portal_domain } = req.body;
  try {
    await ensureEnrakipsizTables();
    await pool.query(`
      UPDATE enrakipsiz_settings
      SET portal_title = $1, portal_description = $2, announcement = $3, primary_color = $4, footer_text = $5, portal_domain = $6
      WHERE id = 1
    `, [portal_title, portal_description, announcement, primary_color, footer_text, portal_domain]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/enrakipsiz/slides", async (req: any, res) => {
  const { id, image_url, title, subtitle, description, badge, accent, type, link_url, is_active } = req.body;
  try {
    await ensureEnrakipsizTables();
    if (id) {
      await pool.query(`
        UPDATE enrakipsiz_slides
        SET image_url = $1, title = $2, subtitle = $3, description = $4, badge = $5, accent = $6, type = $7, link_url = $8, is_active = $9
        WHERE id = $10
      `, [image_url, title, subtitle, description, badge, accent, type, link_url, is_active, id]);
    } else {
      await pool.query(`
        INSERT INTO enrakipsiz_slides (image_url, title, subtitle, description, badge, accent, type, link_url, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [image_url, title, subtitle, description, badge, accent, type, link_url, is_active]);
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/enrakipsiz/slides/:id", async (req: any, res) => {
  try {
    await ensureEnrakipsizTables();
    await pool.query("DELETE FROM enrakipsiz_slides WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/enrakipsiz/ads", async (req: any, res) => {
  const { id, title, broker, description, profit_badge, action_text, link_url, media_type, media_url, position, is_active } = req.body;
  try {
    await ensureEnrakipsizTables();
    if (id) {
      await pool.query(`
        UPDATE enrakipsiz_ads
        SET title = $1, broker = $2, description = $3, profit_badge = $4, action_text = $5, link_url = $6, media_type = $7, media_url = $8, position = $9, is_active = $10
        WHERE id = $11
      `, [title, broker, description, profit_badge, action_text, link_url, media_type, media_url, position, is_active, id]);
    } else {
      await pool.query(`
        INSERT INTO enrakipsiz_ads (title, broker, description, profit_badge, action_text, link_url, media_type, media_url, position, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [title, broker, description, profit_badge, action_text, link_url, media_type, media_url, position, is_active]);
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/enrakipsiz/ads/:id", async (req: any, res) => {
  try {
    await ensureEnrakipsizTables();
    await pool.query("DELETE FROM enrakipsiz_ads WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
