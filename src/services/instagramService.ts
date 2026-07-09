import axios from "axios";
import { pool } from "../../models/db";

export class InstagramService {
  private static GLOBAL_ACCESS_TOKEN = process.env.GLOBAL_INSTAGRAM_ACCESS_TOKEN;
  private static GLOBAL_BUSINESS_ACCOUNT_ID = process.env.GLOBAL_INSTAGRAM_BUSINESS_ACCOUNT_ID;

  /**
   * Posts an image to Instagram Business Account
   * @param storeId Store ID or 'global' for enrakipsiz main account
   * @param imageUrl Publicly accessible image URL
   * @param caption Post caption
   */
  static async postToInstagram(storeId: number | 'global', imageUrl: string, caption: string) {
    let accessToken: string | undefined;
    let businessAccountId: string | undefined;

    if (storeId === 'global') {
      accessToken = this.GLOBAL_ACCESS_TOKEN;
      businessAccountId = this.GLOBAL_BUSINESS_ACCOUNT_ID;
    } else {
      const res = await pool.query(
        "SELECT instagram_access_token, instagram_business_account_id FROM stores WHERE id = $1",
        [storeId]
      );
      if (res.rows.length > 0) {
        accessToken = res.rows[0].instagram_access_token;
        businessAccountId = res.rows[0].instagram_business_account_id;
      }
    }

    if (!accessToken || !businessAccountId) {
      console.warn(`Instagram not configured for store ${storeId}`);
      return null;
    }

    try {
      // 1. Create Media Container
      // Reference: https://developers.facebook.com/docs/instagram-api/reference/ig-user/media#creating
      const containerRes = await axios.post(
        `https://graph.facebook.com/v19.0/${businessAccountId}/media`,
        {
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken,
        }
      );

      const containerId = containerRes.data.id;

      // 2. Publish Media
      // Reference: https://developers.facebook.com/docs/instagram-api/reference/ig-user/media_publish#creating
      const publishRes = await axios.post(
        `https://graph.facebook.com/v19.0/${businessAccountId}/media_publish`,
        {
          creation_id: containerId,
          access_token: accessToken,
        }
      );

      console.log(`Successfully posted to Instagram for store ${storeId}:`, publishRes.data.id);
      return publishRes.data.id;
    } catch (error: any) {
      const errorData = error.response?.data?.error || {};
      console.error("Instagram Post Error:", errorData.message || error.message);
      throw new Error(`Instagram post failed: ${errorData.message || error.message}`);
    }
  }

  /**
   * Generates a caption based on vehicle/property data
   */
  static generateCaption(item: any, type: 'vehicle' | 'property', storeName: string) {
    if (type === 'vehicle') {
      return `🚗 ${item.brand} ${item.model} (${item.year})\n\n` +
             `💰 Fiyat: ${item.selling_price} ${item.currency}\n` +
             `📍 Kilometre: ${item.current_mileage} km\n` +
             `⚙️ Şanzıman: ${item.transmission}\n` +
             `⛽ Yakıt: ${item.fuel_type}\n\n` +
             `${item.description ? item.description.substring(0, 100) + '...' : ''}\n\n` +
             `#enrakipsiz #otogaleri #satilikarac #${item.brand.replace(/\s+/g, '')} #${storeName.replace(/\s+/g, '')}`;
    } else {
      return `🏠 ${item.title}\n\n` +
             `💰 Fiyat: ${item.price} ${item.currency}\n` +
             `📍 Konum: ${item.location}\n` +
             `📐 Alan: ${item.square_meters} m²\n` +
             `🛏️ Oda: ${item.room_count}\n\n` +
             `${item.description ? item.description.substring(0, 100) + '...' : ''}\n\n` +
             `#enrakipsiz #emlak #satilikdaire #gayrimenkul #${storeName.replace(/\s+/g, '')}`;
    }
  }
}
