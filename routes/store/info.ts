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
        description, einvoice_settings, footer_links, parent_id, store_type, sub_sector, store_code, hotel_module_enabled,
        hero_title, hero_subtitle, hero_image_url, instagram_url, facebook_url, twitter_url, whatsapp_number, about_text,
        hepsiburada_settings, trendyol_settings, amazon_settings, pazarama_settings, n11_settings,
        google_merchant_settings, instagram_settings, instagram_access_token, instagram_business_account_id
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
      'hepsiburada_settings', 'trendyol_settings', 'amazon_settings', 'pazarama_settings', 'n11_settings',
      'google_merchant_settings', 'instagram_settings'
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

    // Sync database column values into branding object
    store.branding.id = store.id;
    store.branding.store_name = store.name || store.branding.store_name || store.branding.name;
    store.branding.name = store.name || store.branding.name || store.branding.store_name;
    store.branding.slug = store.slug;
    store.branding.address = store.address || store.branding.address;
    store.branding.contact_person = store.contact_person || store.branding.contact_person;
    store.branding.phone = store.phone || store.branding.phone;
    store.branding.email = store.email || store.branding.email;
    store.branding.country = store.country || store.branding.country || 'TR';
    store.branding.default_currency = store.default_currency || store.branding.default_currency || 'TRY';
    store.branding.language = store.language || store.branding.language || 'tr';
    store.branding.store_type = store.store_type || store.branding.store_type || 'product';
    store.branding.sub_sector = store.sub_sector || store.branding.sub_sector;
    const hotelLicenseGranted = Boolean(
      store.hotel_module_enabled || 
      (store.branding && (store.branding.hotel_license_enabled || store.branding.hotel_module_enabled))
    );
    store.hotel_license_enabled = hotelLicenseGranted;
    store.branding.hotel_license_enabled = hotelLicenseGranted;

    if (!hotelLicenseGranted) {
      store.hotel_module_enabled = false;
      store.branding.hotel_module_enabled = false;
    } else {
      const opEnabled = store.branding.hotel_module_enabled !== undefined 
        ? Boolean(store.branding.hotel_module_enabled) 
        : true;
      store.hotel_module_enabled = opEnabled;
      store.branding.hotel_module_enabled = opEnabled;
    }

    const mergeNonEmpty = (brObj: any, colObj: any) => {
      const a = (brObj && typeof brObj === 'object' && !Array.isArray(brObj)) ? brObj : {};
      const b = (colObj && typeof colObj === 'object' && !Array.isArray(colObj)) ? colObj : {};
      const out: any = { ...a, ...b };
      for (const [k, v] of Object.entries(a)) {
        if ((out[k] === '' || out[k] === null || out[k] === undefined) && v !== '' && v !== null && v !== undefined) {
          out[k] = v;
        }
      }
      if (a.enabled === true || b.enabled === true) {
        out.enabled = true;
      }
      return out;
    };

    const psFromCol = store.payment_settings || {};
    const psFromBr = store.branding.payment_settings || {};
    const msFromCol = store.meta_settings || {};
    const msFromBr = store.branding.meta_settings || {};
    const gmFromCol = store.google_merchant_settings || {};
    const gmFromBr = store.branding.google_merchant_settings || {};
    const igFromCol = store.instagram_settings || {};
    const igFromBr = store.branding.instagram_settings || {};
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

    const dbParentId = store.parent_id ? Number(store.parent_id) : null;
    store.parent_id = dbParentId;
    store.branding.parent_id = dbParentId;

    Object.assign(store, store.branding);
    // Re-enforce authoritative DB identity & branch hierarchy after Object.assign
    store.id = store.branding.id;
    store.parent_id = dbParentId;
    store.branding.parent_id = dbParentId;

    store.payment_settings = mergeNonEmpty(psFromBr, psFromCol);
    store.meta_settings = mergeNonEmpty(msFromBr, msFromCol);
    store.google_merchant_settings = mergeNonEmpty(gmFromBr, gmFromCol);
    store.instagram_settings = mergeNonEmpty(igFromBr, igFromCol);
    if (store.instagram_access_token && !store.instagram_settings.access_token) {
      store.instagram_settings.access_token = store.instagram_access_token;
    }
    if (store.instagram_business_account_id && !store.instagram_settings.account_id) {
      store.instagram_settings.account_id = store.instagram_business_account_id;
    }
    store.einvoice_settings = mergeNonEmpty(esFromBr, esFromCol);

    store.hepsiburada_settings = mergeNonEmpty(hbFromBr, hbFromCol);
    store.trendyol_settings = mergeNonEmpty(tyFromBr, tyFromCol);
    store.amazon_settings = mergeNonEmpty(amzFromBr, amzFromCol);
    store.pazarama_settings = mergeNonEmpty(pzFromBr, pzFromCol);
    store.n11_settings = mergeNonEmpty(n11FromBr, n11FromCol);

    store.branding.payment_settings = store.payment_settings;
    store.branding.meta_settings = store.meta_settings;
    store.branding.google_merchant_settings = store.google_merchant_settings;
    store.branding.instagram_settings = store.instagram_settings;
    store.branding.einvoice_settings = store.einvoice_settings;
    store.branding.hepsiburada_settings = store.hepsiburada_settings;
    store.branding.trendyol_settings = store.trendyol_settings;
    store.branding.amazon_settings = store.amazon_settings;
    store.branding.pazarama_settings = store.pazarama_settings;
    store.branding.n11_settings = store.n11_settings;

    // Fetch branches if this is a main store (HQ), or inherit HQ corporate identity if this is a branch
    if (!store.parent_id) {
      const branchesRes = await pool.query(
        "SELECT id, name, slug, address, phone FROM stores WHERE parent_id = $1",
        [store.id]
      );
      store.branches = branchesRes.rows;
    } else {
      const parentRes = await pool.query(
        "SELECT id, name, slug, logo_url, favicon_url, primary_color, store_type, sub_sector, branding FROM stores WHERE id = $1",
        [store.parent_id]
      );
      if (parentRes.rows.length > 0) {
        const parentStore = parentRes.rows[0];
        let parentBranding: any = parentStore.branding || {};
        if (typeof parentBranding === 'string') {
          try { parentBranding = JSON.parse(parentBranding); } catch (e) { parentBranding = {}; }
        }
        store.parent_store_name = parentStore.name;
        store.parent_store_slug = parentStore.slug;
        store.branding.parent_store_name = parentStore.name;
        store.branding.parent_store_slug = parentStore.slug;
        // Branch inherits sector & corporate visual identity from HQ
        store.store_type = parentStore.store_type || parentBranding.store_type || store.store_type;
        store.sub_sector = parentStore.sub_sector || parentBranding.sub_sector || store.sub_sector;
        store.branding.store_type = store.store_type;
        store.branding.sub_sector = store.sub_sector;
        if (!store.logo_url && (parentStore.logo_url || parentBranding.logo_url)) {
          store.logo_url = parentStore.logo_url || parentBranding.logo_url;
          store.branding.logo_url = store.logo_url;
        }
        if (!store.favicon_url && (parentStore.favicon_url || parentBranding.favicon_url)) {
          store.favicon_url = parentStore.favicon_url || parentBranding.favicon_url;
          store.branding.favicon_url = store.favicon_url;
        }
      }
    }

    res.json(store);
  } catch (error: any) {
    console.error("Error in GET /api/store/info:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
