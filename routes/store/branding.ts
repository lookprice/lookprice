import express from "express";
import { pool } from "../../models/db";
import { getAuthorizedStoreId } from "./utils";

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
        branding
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

    // Merge incoming req.body with existing branding
    const updatedBranding = { ...existingBranding, ...req.body };

    // Resolve column values (prefer req.body, then existingStore)
    const name = req.body.name !== undefined ? req.body.name : existingStore.name;
    const logo_url = req.body.logo_url !== undefined ? req.body.logo_url : existingStore.logo_url;
    const favicon_url = req.body.favicon_url !== undefined ? req.body.favicon_url : existingStore.favicon_url;
    const primary_color = req.body.primary_color !== undefined ? req.body.primary_color : existingStore.primary_color;
    const background_image_url = req.body.background_image_url !== undefined ? req.body.background_image_url : existingStore.background_image_url;
    const about_text = req.body.about_text !== undefined ? req.body.about_text : existingStore.about_text;
    const description = req.body.description !== undefined ? req.body.description : existingStore.description;
    const phone = req.body.phone !== undefined ? req.body.phone : existingStore.phone;
    const address = req.body.address !== undefined ? req.body.address : existingStore.address;
    const email = req.body.email !== undefined ? req.body.email : existingStore.email;
    
    const page_layout = req.body.page_layout !== undefined ? req.body.page_layout : existingStore.page_layout;
    const menu_links = req.body.menu_links !== undefined ? req.body.menu_links : existingStore.menu_links;
    const footer_links = req.body.footer_links !== undefined ? req.body.footer_links : existingStore.footer_links;
    const store_type = req.body.store_type !== undefined ? req.body.store_type : existingStore.store_type;
    const sub_sector = req.body.sub_sector !== undefined ? req.body.sub_sector : existingStore.sub_sector;

    const hero_title = req.body.hero_title !== undefined ? req.body.hero_title : existingStore.hero_title;
    const hero_subtitle = req.body.hero_subtitle !== undefined ? req.body.hero_subtitle : existingStore.hero_subtitle;
    const hero_image_url = req.body.hero_image_url !== undefined ? req.body.hero_image_url : existingStore.hero_image_url;
    const instagram_url = req.body.instagram_url !== undefined ? req.body.instagram_url : existingStore.instagram_url;
    const facebook_url = req.body.facebook_url !== undefined ? req.body.facebook_url : existingStore.facebook_url;
    const twitter_url = req.body.twitter_url !== undefined ? req.body.twitter_url : existingStore.twitter_url;
    const whatsapp_number = req.body.whatsapp_number !== undefined ? req.body.whatsapp_number : existingStore.whatsapp_number;

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
        branding = $23
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
      targetStoreId
    ]);

    res.json({ success: true, message: "Branding updated successfully" });
  } catch (error: any) {
    console.error("Error in POST /api/store/branding:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
