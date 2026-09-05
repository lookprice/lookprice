import express from "express";
import { pool } from "../../models/db";
import { getAuthorizedStoreId } from "./utils";

const router = express.Router();

// GET /api/store/info
router.get("/", async (req: any, res) => {
  try {
    let targetStoreId: number;

    if (req.query.slug) {
      const slug = req.query.slug as string;
      const storeRes = await pool.query("SELECT id FROM stores WHERE LOWER(slug) = LOWER($1)", [slug]);
      if (storeRes.rows.length === 0) {
        return res.status(404).json({ error: "Store not found" });
      }
      targetStoreId = storeRes.rows[0].id;
    } else {
      const reqStoreId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;
      const resolvedId = await getAuthorizedStoreId(req, reqStoreId);
      if (!resolvedId) {
        return res.status(403).json({ error: "Unauthorized store access" });
      }
      targetStoreId = resolvedId;
    }

    const storeRes = await pool.query(`
      SELECT 
        id, name, slug, address, contact_person, phone, country, email, api_key, subscription_end,
        logo_url, favicon_url, primary_color, default_currency, language, plan, background_image_url,
        fiscal_brand, fiscal_terminal_id, fiscal_active, default_tax_rate, currency_rates, branding, payment_settings, meta_settings,
        custom_domain, custom_domain_status, page_layout, menu_links, shipping_profiles, emails, phones,
        description, einvoice_settings, footer_links, parent_id, store_type, sub_sector, store_code,
        hero_title, hero_subtitle, hero_image_url, instagram_url, facebook_url, twitter_url, whatsapp_number, about_text,
        hepsiburada_settings, trendyol_settings, amazon_settings, pazarama_settings, n11_settings
      FROM stores 
      WHERE id = $1
    `, [targetStoreId]);

    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    const store = storeRes.rows[0];

    if (!store.whatsapp_number || store.whatsapp_number === "905428655000") {
      store.whatsapp_number = "905488902309";
    }
    if (!store.phone || store.phone === "905428655000" || store.phone === "+905428655000") {
      store.phone = "+90 548 890 23 09";
    }

    // Parse JSON fields
    const jsonFields = [
      'emails', 'phones', 'footer_links', 'shipping_profiles', 'branding', 
      'payment_settings', 'meta_settings', 'page_layout', 'menu_links', 'currency_rates', 'einvoice_settings',
      'hepsiburada_settings', 'trendyol_settings', 'amazon_settings', 'pazarama_settings', 'n11_settings'
    ];
    jsonFields.forEach(field => {
      if (typeof store[field] === 'string') {
        try {
          store[field] = JSON.parse(store[field]);
        } catch (e) {
          store[field] = field === 'branding' || field === 'payment_settings' || field === 'meta_settings' || field === 'einvoice_settings' || field === 'currency_rates' || field.endsWith('_settings') ? {} : [];
        }
      } else if (!store[field]) {
        store[field] = field === 'branding' || field === 'payment_settings' || field === 'meta_settings' || field === 'einvoice_settings' || field === 'currency_rates' || field.endsWith('_settings') ? {} : [];
      }
    });

    // Merge branding onto store top-level and sync marketplace settings
    if (!store.branding || typeof store.branding !== 'object') {
      store.branding = {};
    }

    const psFromCol = store.payment_settings || {};
    const psFromBr = store.branding.payment_settings || {};
    const msFromCol = store.meta_settings || {};
    const msFromBr = store.branding.meta_settings || {};
    const esFromCol = store.einvoice_settings || {};
    const esFromBr = store.branding.einvoice_settings || {};

    const hbFromCol = store.hepsiburada_settings || {};
    const hbFromBr = store.branding.hepsiburada_settings || {};
    const tyFromCol = store.trendyol_settings || {};
    const tyFromBr = store.branding.trendyol_settings || {};
    const amzFromCol = store.amazon_settings || {};
    const amzFromBr = store.branding.amazon_settings || {};
    const pzFromCol = store.pazarama_settings || {};
    const pzFromBr = store.branding.pazarama_settings || {};
    const n11FromCol = store.n11_settings || {};
    const n11FromBr = store.branding.n11_settings || {};

    Object.assign(store, store.branding);
    store.payment_settings = { ...psFromCol, ...psFromBr };
    store.meta_settings = { ...msFromCol, ...msFromBr };
    store.einvoice_settings = { ...esFromCol, ...esFromBr };

    store.hepsiburada_settings = { ...hbFromBr, ...hbFromCol };
    store.trendyol_settings = { ...tyFromBr, ...tyFromCol };
    store.amazon_settings = { ...amzFromBr, ...amzFromCol };
    store.pazarama_settings = { ...pzFromBr, ...pzFromCol };
    store.n11_settings = { ...n11FromBr, ...n11FromCol };

    store.branding.meta_settings = store.meta_settings;
    store.branding.einvoice_settings = store.einvoice_settings;
    store.branding.hepsiburada_settings = store.hepsiburada_settings;
    store.branding.trendyol_settings = store.trendyol_settings;
    store.branding.amazon_settings = store.amazon_settings;
    store.branding.pazarama_settings = store.pazarama_settings;
    store.branding.n11_settings = store.n11_settings;

    // Fetch branches if this is a main store
    if (!store.parent_id) {
      const branchesRes = await pool.query(
        "SELECT id, name, slug, address, phone FROM stores WHERE parent_id = $1",
        [store.id]
      );
      store.branches = branchesRes.rows;
    }

    res.json(store);
  } catch (error: any) {
    console.error("Error in GET /api/store/info:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
