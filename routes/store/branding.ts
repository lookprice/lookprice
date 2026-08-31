import express from "express";
import { pool } from "../../models/db";
import { getAuthorizedStoreId } from "./utils";
import { cleanDeepBase64, replaceAllBase64InString } from "../utils/imageStorage";
import { publicApiCache } from "../public";

const router = express.Router();

// POST /api/store/branding
router.post("/", async (req: any, res) => {
  try {
    const reqStoreId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;
    const targetStoreId = await getAuthorizedStoreId(req, reqStoreId);
    if (!targetStoreId) {
      return res.status(403).json({ error: "Unauthorized store access" });
    }

    // Fetch existing store
    const existingRes = await pool.query(`
      SELECT 
        name, logo_url, favicon_url, primary_color, background_image_url, about_text, description,
        phone, address, email, page_layout, menu_links, footer_links, store_type, sub_sector,
        hero_title, hero_subtitle, hero_image_url, instagram_url, facebook_url, twitter_url, whatsapp_number,
        branding, payment_settings, meta_settings, einvoice_settings
      FROM stores 
      WHERE id = $1
    `, [targetStoreId]);

    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    const existingStore = existingRes.rows[0];
    let existingBranding = existingStore.branding || {};
    if (typeof existingBranding === 'string') {
      try { existingBranding = JSON.parse(existingBranding); } catch (e) { existingBranding = {}; }
    }

    let existingPaymentSettings = existingStore.payment_settings || {};
    if (typeof existingPaymentSettings === 'string') {
      try { existingPaymentSettings = JSON.parse(existingPaymentSettings); } catch (e) { existingPaymentSettings = {}; }
    }

    let existingMetaSettings = existingStore.meta_settings || {};
    if (typeof existingMetaSettings === 'string') {
      try { existingMetaSettings = JSON.parse(existingMetaSettings); } catch (e) { existingMetaSettings = {}; }
    }

    let existingEinvoiceSettings = existingStore.einvoice_settings || {};
    if (typeof existingEinvoiceSettings === 'string') {
      try { existingEinvoiceSettings = JSON.parse(existingEinvoiceSettings); } catch (e) { existingEinvoiceSettings = {}; }
    }

    // Clean base64 data in incoming body
    const cleanedBody = await cleanDeepBase64(req.body, `store_${targetStoreId}_branding`);

    // Merge incoming cleaned body with existing branding
    const updatedBranding = await cleanDeepBase64({ ...existingBranding, ...cleanedBody }, `store_${targetStoreId}_branding`);

    // Ensure payment_settings are merged and kept consistent across branding and payment_settings column
    const mergedPaymentSettings = { ...existingPaymentSettings, ...(existingBranding.payment_settings || {}), ...(updatedBranding.payment_settings || {}) };
    updatedBranding.payment_settings = mergedPaymentSettings;

    // Ensure meta_settings are merged and kept consistent across branding and meta_settings column
    const mergedMetaSettings = { ...existingMetaSettings, ...(existingBranding.meta_settings || {}), ...(updatedBranding.meta_settings || {}) };
    updatedBranding.meta_settings = mergedMetaSettings;

    // Ensure einvoice_settings are merged and kept consistent across branding and einvoice_settings column
    const mergedEinvoiceSettings = { ...existingEinvoiceSettings, ...(existingBranding.einvoice_settings || {}), ...(updatedBranding.einvoice_settings || {}) };
    updatedBranding.einvoice_settings = mergedEinvoiceSettings;

    // Resolve column values (prefer cleanedBody, then existingStore)
    const name = cleanedBody.name !== undefined ? cleanedBody.name : existingStore.name;
    const logo_url = await replaceAllBase64InString(cleanedBody.logo_url !== undefined ? cleanedBody.logo_url : existingStore.logo_url, `store_${targetStoreId}_logo`);
    const favicon_url = await replaceAllBase64InString(cleanedBody.favicon_url !== undefined ? cleanedBody.favicon_url : existingStore.favicon_url, `store_${targetStoreId}_favicon`);
    const primary_color = cleanedBody.primary_color !== undefined ? cleanedBody.primary_color : existingStore.primary_color;
    const background_image_url = await replaceAllBase64InString(cleanedBody.background_image_url !== undefined ? cleanedBody.background_image_url : existingStore.background_image_url, `store_${targetStoreId}_bg`);
    const about_text = cleanedBody.about_text !== undefined ? cleanedBody.about_text : existingStore.about_text;
    const description = cleanedBody.description !== undefined ? cleanedBody.description : existingStore.description;
    const phone = cleanedBody.phone !== undefined ? cleanedBody.phone : existingStore.phone;
    const address = cleanedBody.address !== undefined ? cleanedBody.address : existingStore.address;
    const email = cleanedBody.email !== undefined ? cleanedBody.email : existingStore.email;
    
    let page_layout = cleanedBody.page_layout !== undefined ? cleanedBody.page_layout : existingStore.page_layout;
    page_layout = await cleanDeepBase64(page_layout, `store_${targetStoreId}_layout`);
    
    const menu_links = cleanedBody.menu_links !== undefined ? cleanedBody.menu_links : existingStore.menu_links;
    const footer_links = cleanedBody.footer_links !== undefined ? cleanedBody.footer_links : existingStore.footer_links;
    const store_type = cleanedBody.store_type !== undefined ? cleanedBody.store_type : existingStore.store_type;
    const sub_sector = cleanedBody.sub_sector !== undefined ? cleanedBody.sub_sector : existingStore.sub_sector;

    const hero_title = cleanedBody.hero_title !== undefined ? cleanedBody.hero_title : existingStore.hero_title;
    const hero_subtitle = cleanedBody.hero_subtitle !== undefined ? cleanedBody.hero_subtitle : existingStore.hero_subtitle;
    const hero_image_url = await replaceAllBase64InString(cleanedBody.hero_image_url !== undefined ? cleanedBody.hero_image_url : existingStore.hero_image_url, `store_${targetStoreId}_hero`);
    const instagram_url = cleanedBody.instagram_url !== undefined ? cleanedBody.instagram_url : existingStore.instagram_url;
    const facebook_url = cleanedBody.facebook_url !== undefined ? cleanedBody.facebook_url : existingStore.facebook_url;
    const twitter_url = cleanedBody.twitter_url !== undefined ? cleanedBody.twitter_url : existingStore.twitter_url;
    const whatsapp_number = cleanedBody.whatsapp_number !== undefined ? cleanedBody.whatsapp_number : existingStore.whatsapp_number;

    await pool.query(`
      UPDATE stores 
      SET 
        name = $1,
        logo_url = $2,
        favicon_url = $3,
        primary_color = $4,
        background_image_url = $5,
        about_text = $6,
        description = $7,
        phone = $8,
        address = $9,
        email = $10,
        page_layout = $11,
        menu_links = $12,
        footer_links = $13,
        store_type = $14,
        sub_sector = $15,
        hero_title = $16,
        hero_subtitle = $17,
        hero_image_url = $18,
        instagram_url = $19,
        facebook_url = $20,
        twitter_url = $21,
        whatsapp_number = $22,
        branding = $23,
        payment_settings = $25,
        meta_settings = $26,
        einvoice_settings = $27
      WHERE id = $24
    `, [
      name,
      logo_url,
      favicon_url,
      primary_color,
      background_image_url,
      about_text,
      description,
      phone,
      address,
      email,
      page_layout ? (typeof page_layout === 'string' ? page_layout : JSON.stringify(page_layout)) : null,
      menu_links ? (typeof menu_links === 'string' ? menu_links : JSON.stringify(menu_links)) : null,
      footer_links ? (typeof footer_links === 'string' ? footer_links : JSON.stringify(footer_links)) : null,
      store_type,
      sub_sector,
      hero_title,
      hero_subtitle,
      hero_image_url,
      instagram_url,
      facebook_url,
      twitter_url,
      whatsapp_number,
      JSON.stringify(updatedBranding),
      targetStoreId,
      JSON.stringify(mergedPaymentSettings),
      JSON.stringify(mergedMetaSettings),
      JSON.stringify(mergedEinvoiceSettings)
    ]);

    // Sync team/consultants to consultants table if provided
    const teamMembers = cleanedBody.team || (cleanedBody.page_layout_settings && cleanedBody.page_layout_settings.team) || cleanedBody.consultants;
    if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
      try {
        for (const m of teamMembers) {
          if (!m.name) continue;
          const cId = m.id && !isNaN(parseInt(m.id)) ? parseInt(m.id) : null;
          const mRole = m.role || "Danışman";
          const mImg = m.image || m.image_url || "";
          if (cId) {
            await pool.query(
              `UPDATE consultants SET name = $1, role = $2, image_url = $3 WHERE id = $4 AND store_id = $5`,
              [m.name, mRole, mImg, cId, targetStoreId]
            );
          } else {
            const existingC = await pool.query(
              `SELECT id FROM consultants WHERE store_id = $1 AND LOWER(name) = LOWER($2)`,
              [targetStoreId, m.name]
            );
            if (existingC.rows.length > 0) {
              await pool.query(
                `UPDATE consultants SET role = $1, image_url = $2 WHERE id = $3`,
                [mRole, mImg, existingC.rows[0].id]
              );
            } else {
              await pool.query(
                `INSERT INTO consultants (store_id, name, role, image_url) VALUES ($1, $2, $3, $4)`,
                [targetStoreId, m.name, mRole, mImg]
              );
            }
          }
        }
      } catch (syncErr) {
        console.warn("Failed to sync team members to consultants table:", syncErr);
      }
    }

    try {
      const storeInfoRes = await pool.query("SELECT slug, custom_domain FROM stores WHERE id = $1", [targetStoreId]);
      if (storeInfoRes.rows.length > 0) {
        const sSlug = storeInfoRes.rows[0].slug;
        const sCustomDomain = storeInfoRes.rows[0].custom_domain;
        publicApiCache.del(`store_${targetStoreId}`);
        if (sSlug) {
          publicApiCache.del(`store_${sSlug.toLowerCase()}`);
          publicApiCache.del(`products_${sSlug.toLowerCase()}`);
        }
        if (sCustomDomain) {
          publicApiCache.del(`domain_${sCustomDomain.toLowerCase()}`);
        }
      }
      publicApiCache.del("enrakipsiz_portal");
      publicApiCache.del("marketplace_listings");
    } catch (cacheErr) {
      console.warn("Failed to invalidate public API cache on branding update:", cacheErr);
    }

    res.json({ success: true, message: "Branding updated successfully" });
  } catch (error: any) {
    console.error("Error in POST /api/store/branding:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/store/sync-tcmb - Manual TCMB ForexBuying sync
router.post("/sync-tcmb", async (req: any, res) => {
  try {
    const reqStoreId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;
    const targetStoreId = await getAuthorizedStoreId(req, reqStoreId);
    const { default: axios } = await import("axios");
    const xml2js = await import("xml2js");

    const { data } = await axios.get("https://www.tcmb.gov.tr/kurlar/today.xml");
    const parser = new xml2js.Parser();
    
    const rates: Record<string, number> = await new Promise((resolve, reject) => {
      parser.parseString(data, (err: any, result: any) => {
        if (err) return reject(err);
        const currencies = result?.Tarih_Date?.Currency;
        if (!currencies || !Array.isArray(currencies)) {
          return reject(new Error("Invalid TCMB XML structure"));
        }
        const extracted: Record<string, number> = {};
        for (const c of currencies) {
          const code = c['$']?.CurrencyCode || c['$']?.Kod;
          if (['USD', 'EUR', 'GBP'].includes(code)) {
            const rateStr = (c.ForexBuying && c.ForexBuying[0]) || (c.ForexSelling && c.ForexSelling[0]);
            if (rateStr) {
              const val = parseFloat(rateStr);
              if (!isNaN(val)) extracted[code] = val;
            }
          }
        }
        resolve(extracted);
      });
    });

    if (Object.keys(rates).length === 0) {
      return res.status(400).json({ error: "Could not extract rates from TCMB XML" });
    }

    // Get current store branding / currency_rates
    const storeRes = await pool.query("SELECT branding, currency_rates FROM stores WHERE id = $1", [targetStoreId]);
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    let currentRates = {};
    const curStore = storeRes.rows[0];
    try {
      if (typeof curStore.currency_rates === 'string') {
        currentRates = JSON.parse(curStore.currency_rates);
      } else if (typeof curStore.currency_rates === 'object' && curStore.currency_rates !== null) {
        currentRates = curStore.currency_rates;
      }
    } catch (e) {}

    const newRates = { ...currentRates, ...rates };

    await pool.query(
      "UPDATE stores SET currency_rates = $1 WHERE id = $2",
      [JSON.stringify(newRates), targetStoreId]
    );

    res.json({ success: true, rates: newRates, message: "TCMB kurları başarıyla güncellendi." });
  } catch (error: any) {
    console.error("Error in POST /api/store/sync-tcmb:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
