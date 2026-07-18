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
        fiscal_brand, fiscal_terminal_id, fiscal_active, default_tax_rate, currency_rates, branding,
        custom_domain, custom_domain_status, page_layout, menu_links, shipping_profiles, emails, phones,
        description, einvoice_settings, footer_links, parent_id, store_type, sub_sector,
        hero_title, hero_subtitle, hero_image_url, instagram_url, facebook_url, twitter_url, whatsapp_number, about_text
      FROM stores 
      WHERE id = $1
    `, [targetStoreId]);

    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    const store = storeRes.rows[0];

    // Parse JSON fields
    const jsonFields = ['emails', 'phones', 'footer_links', 'shipping_profiles', 'branding', 'page_layout', 'menu_links', 'currency_rates', 'einvoice_settings'];
    jsonFields.forEach(field => {
      if (typeof store[field] === 'string') {
        try {
          store[field] = JSON.parse(store[field]);
        } catch (e) {
          store[field] = field === 'branding' || field === 'einvoice_settings' || field === 'currency_rates' ? {} : [];
        }
      } else if (!store[field]) {
        store[field] = field === 'branding' || field === 'einvoice_settings' || field === 'currency_rates' ? {} : [];
      }
    });

    // Merge branding onto store top-level
    if (store.branding && typeof store.branding === 'object') {
      Object.assign(store, store.branding);
    }

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
