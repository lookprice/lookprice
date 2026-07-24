import express from "express";
import { pool } from "../../models/db";
import { getAuthorizedStoreId } from "./utils";
import { cleanDeepBase64, replaceAllBase64InString } from "../utils/imageStorage";

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

    // Clean base64 data in incoming body
    const cleanedBody = cleanDeepBase64(req.body, `store_${targetStoreId}_branding`);

    // Merge incoming cleaned body with existing branding
    const updatedBranding = cleanDeepBase64({ ...existingBranding, ...cleanedBody }, `store_${targetStoreId}_branding`);

    // Resolve column values (prefer cleanedBody, then existingStore)
    const name = cleanedBody.name !== undefined ? cleanedBody.name : existingStore.name;
    const logo_url = replaceAllBase64InString(cleanedBody.logo_url !== undefined ? cleanedBody.logo_url : existingStore.logo_url, `store_${targetStoreId}_logo`);
    const favicon_url = replaceAllBase64InString(cleanedBody.favicon_url !== undefined ? cleanedBody.favicon_url : existingStore.favicon_url, `store_${targetStoreId}_favicon`);
    const primary_color = cleanedBody.primary_color !== undefined ? cleanedBody.primary_color : existingStore.primary_color;
    const background_image_url = replaceAllBase64InString(cleanedBody.background_image_url !== undefined ? cleanedBody.background_image_url : existingStore.background_image_url, `store_${targetStoreId}_bg`);
    const about_text = cleanedBody.about_text !== undefined ? cleanedBody.about_text : existingStore.about_text;
    const description = cleanedBody.description !== undefined ? cleanedBody.description : existingStore.description;
    const phone = cleanedBody.phone !== undefined ? cleanedBody.phone : existingStore.phone;
    const address = cleanedBody.address !== undefined ? cleanedBody.address : existingStore.address;
    const email = cleanedBody.email !== undefined ? cleanedBody.email : existingStore.email;
    
    let page_layout = cleanedBody.page_layout !== undefined ? cleanedBody.page_layout : existingStore.page_layout;
    page_layout = cleanDeepBase64(page_layout, `store_${targetStoreId}_layout`);
    
    const menu_links = cleanedBody.menu_links !== undefined ? cleanedBody.menu_links : existingStore.menu_links;
    const footer_links = cleanedBody.footer_links !== undefined ? cleanedBody.footer_links : existingStore.footer_links;
    const store_type = cleanedBody.store_type !== undefined ? cleanedBody.store_type : existingStore.store_type;
    const sub_sector = cleanedBody.sub_sector !== undefined ? cleanedBody.sub_sector : existingStore.sub_sector;

    const hero_title = cleanedBody.hero_title !== undefined ? cleanedBody.hero_title : existingStore.hero_title;
    const hero_subtitle = cleanedBody.hero_subtitle !== undefined ? cleanedBody.hero_subtitle : existingStore.hero_subtitle;
    const hero_image_url = replaceAllBase64InString(cleanedBody.hero_image_url !== undefined ? cleanedBody.hero_image_url : existingStore.hero_image_url, `store_${targetStoreId}_hero`);
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
