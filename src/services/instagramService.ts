import axios from "axios";
import { pool } from "../../models/db";

export class InstagramService {
  private static GLOBAL_ACCESS_TOKEN = process.env.GLOBAL_INSTAGRAM_ACCESS_TOKEN;
  private static GLOBAL_BUSINESS_ACCOUNT_ID = process.env.GLOBAL_INSTAGRAM_BUSINESS_ACCOUNT_ID;

  /**
   * Posts an image or carousel of images to Instagram Business Account
   * @param storeId Store ID or 'global' for enrakipsiz main account
   * @param imageUrlOrUrls Publicly accessible image URL or array of URLs
   * @param caption Post caption
   * @param metaData Optional metadata to generate a beautiful branded cover image overlay
   */
  static async postToInstagram(
    storeId: number | 'global',
    imageUrlOrUrls: string | string[],
    caption: string,
    metaData?: {
      type: 'vehicle' | 'property';
      title: string;
      price: string;
      location?: string;
      storeName?: string;
      referenceNo?: string | null;
      status?: string | null;
      sub1?: string | null;
      sub2?: string | null;
      sub3?: string | null;
      sub4?: string | null;
      agentName?: string | null;
      agentPhone?: string | null;
      baseDomain?: string;
    }
  ) {
    let accessToken: string | undefined;
    let businessAccountId: string | undefined;

    if (storeId === 'global') {
      accessToken = this.GLOBAL_ACCESS_TOKEN || process.env.GLOBAL_INSTAGRAM_ACCESS_TOKEN;
      businessAccountId = this.GLOBAL_BUSINESS_ACCOUNT_ID || process.env.GLOBAL_INSTAGRAM_BUSINESS_ACCOUNT_ID;
    } else {
      const res = await pool.query(
        "SELECT instagram_access_token, instagram_business_account_id, instagram_settings FROM stores WHERE id = $1",
        [storeId]
      );
      if (res.rows.length > 0) {
        accessToken = res.rows[0].instagram_access_token;
        businessAccountId = res.rows[0].instagram_business_account_id;

        // Fallback to instagram_settings JSONB if direct columns are not set
        if ((!accessToken || !businessAccountId) && res.rows[0].instagram_settings) {
          const igSettings = typeof res.rows[0].instagram_settings === 'string'
            ? JSON.parse(res.rows[0].instagram_settings)
            : res.rows[0].instagram_settings;
          accessToken = igSettings.access_token || accessToken;
          businessAccountId = igSettings.account_id || businessAccountId;
        }
      }
    }

    if (!accessToken || !businessAccountId) {
      console.warn(`Instagram not configured for store ${storeId}. Missing access token or business account ID.`);
      return null;
    }

    try {
      // Parse image URLs
      let rawUrls: string[] = [];
      if (Array.isArray(imageUrlOrUrls)) {
        rawUrls = imageUrlOrUrls;
      } else if (typeof imageUrlOrUrls === 'string') {
        if (imageUrlOrUrls.startsWith('[') || imageUrlOrUrls.startsWith('"')) {
          try {
            const parsed = JSON.parse(imageUrlOrUrls);
            rawUrls = Array.isArray(parsed) ? parsed : [parsed];
          } catch (e) {
            rawUrls = [imageUrlOrUrls];
          }
        } else {
          rawUrls = [imageUrlOrUrls];
        }
      }

      // Filter and limit to max 10 images (Instagram Carousel limit)
      const sanitizedUrls = rawUrls.filter(u => typeof u === 'string' && u.trim().length > 0).slice(0, 10);
      if (sanitizedUrls.length === 0) {
        console.warn(`No valid images found for Instagram post (Store: ${storeId})`);
        return null;
      }

      const domain = metaData?.baseDomain || process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || "https://www.enrakipsiz.com";
      const baseDomain = domain.replace(/\/$/, "");

      // Map URLs to absolute URLs with optional proxy and overlays
      const mappedUrls = sanitizedUrls.map((imgUrl, index) => {
        let urlStr = imgUrl;
        
        // Ensure fully qualified absolute URL
        if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
          urlStr = `${baseDomain}/${urlStr.replace(/^\//, "")}`;
        }

        // Apply overlay only to the first (cover) image if metadata is present
        if (index === 0 && metaData) {
          const params = new URLSearchParams({
            url: urlStr,
            overlay: 'true',
            type: metaData.type,
            title: metaData.title,
            price: metaData.price,
            location: metaData.location || '',
            storeName: metaData.storeName || '',
            ref: metaData.referenceNo || '',
            status: metaData.status || '',
            sub1: metaData.sub1 || '',
            sub2: metaData.sub2 || '',
            sub3: metaData.sub3 || '',
            sub4: metaData.sub4 || '',
            agentName: metaData.agentName || '',
            agentPhone: metaData.agentPhone || ''
          });
          return `${baseDomain}/api/instagram/proxy-image?${params.toString()}`;
        }

        // Subsequent images or if no metadata: just convert from WebP to JPEG
        return `${baseDomain}/api/instagram/proxy-image?url=${encodeURIComponent(urlStr)}`;
      });

      console.log(`[Instagram] Preparing to post to ${storeId} (Carousel size: ${mappedUrls.length}). First URL: ${mappedUrls[0]}`);

      if (mappedUrls.length === 1) {
        // Single Image Post
        const containerRes = await axios.post(
          `https://graph.facebook.com/v19.0/${businessAccountId}/media`,
          {
            image_url: mappedUrls[0],
            caption: caption,
            access_token: accessToken,
          }
        );
        const containerId = containerRes.data.id;

        const publishRes = await axios.post(
          `https://graph.facebook.com/v19.0/${businessAccountId}/media_publish`,
          {
            creation_id: containerId,
            access_token: accessToken,
          }
        );
        console.log(`Successfully posted single image to Instagram for store ${storeId}:`, publishRes.data.id);
        return publishRes.data.id;
      } else {
        // Carousel Post (Multiple Images)
        // 1. Create container for each image item (max 10) with is_carousel_item = true
        const childContainerIds = await Promise.all(mappedUrls.map(async (url, idx) => {
          try {
            const res = await axios.post(
              `https://graph.facebook.com/v19.0/${businessAccountId}/media`,
              {
                image_url: url,
                is_carousel_item: true,
                access_token: accessToken,
              }
            );
            return res.data.id;
          } catch (itemErr: any) {
            console.error(`Error creating carousel item #${idx} container:`, itemErr.response?.data?.error || itemErr.message);
            throw itemErr;
          }
        }));

        // 2. Create the Carousel (MEDIA_BUNDLE) Container containing all children
        const carouselContainerRes = await axios.post(
          `https://graph.facebook.com/v19.0/${businessAccountId}/media`,
          {
            media_type: 'CAROUSEL',
            children: childContainerIds.join(','),
            caption: caption,
            access_token: accessToken,
          }
        );
        const carouselContainerId = carouselContainerRes.data.id;

        // 3. Publish the Carousel container
        const publishRes = await axios.post(
          `https://graph.facebook.com/v19.0/${businessAccountId}/media_publish`,
          {
            creation_id: carouselContainerId,
            access_token: accessToken,
          }
        );
        console.log(`Successfully posted Carousel to Instagram for store ${storeId}:`, publishRes.data.id);
        return publishRes.data.id;
      }
    } catch (error: any) {
      const errorData = error.response?.data?.error || {};
      console.error("Instagram Post Error detail:", JSON.stringify(errorData));
      console.error("Instagram Post Error message:", errorData.message || error.message);
      throw new Error(`Instagram post failed: ${errorData.message || error.message}`);
    }
  }

  /**
   * Helper to strip HTML tags and decode HTML entities from descriptions
   */
  private static stripHtml(html: string): string {
    if (!html) return "";
    
    // 1. Decode basic entities first
    let text = html
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&deg;/gi, "°");

    // 2. Replace block tags with space/newlines to avoid fusing words
    text = text.replace(/<\/(p|div|h[1-6])>/gi, "\n");
    text = text.replace(/<(br|hr)\s*\/?>/gi, "\n");
    
    // 3. Strip remaining tags
    text = text.replace(/<[^>]*>/g, "");
    
    // 4. Normalize
    text = text.replace(/[ \t]+/g, " ");
    text = text.replace(/\n\s*\n+/g, "\n\n");
    return text.trim();
  }

  /**
   * Translitterates and sanitizes a string to make it a clean hashtag
   */
  private static toHashtag(str: string): string {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9]/g, "");
  }

  /**
   * Main function to post to Instagram (Single or Carousel)
   */
  static async postCarouselToInstagram(accessToken: string, instagramUserId: string, imageUrls: string[], caption: string) {
    if (imageUrls.length === 0) throw new Error("No images provided");

    // 1. Ensure absolute URLs
    const domain = process.env.APP_URL || "https://www.enrakipsiz.com";
    const absoluteUrls = imageUrls.map(url => 
        url.startsWith("http") ? url : `${domain.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
    );

    if (absoluteUrls.length === 1) {
        // Single Image Post
        const containerRes = await axios.post(
            `https://graph.facebook.com/v20.0/${instagramUserId}/media`,
            { image_url: absoluteUrls[0], caption, access_token: accessToken }
        );
        return await this.publishMedia(instagramUserId, containerRes.data.id, accessToken);
    } else {
        // Carousel Post
        const childContainerIds = await Promise.all(absoluteUrls.map(async (url) => {
            const res = await axios.post(
                `https://graph.facebook.com/v20.0/${instagramUserId}/media`,
                { image_url: url, is_carousel_item: true, access_token: accessToken }
            );
            return res.data.id;
        }));

        const carouselContainerRes = await axios.post(
            `https://graph.facebook.com/v20.0/${instagramUserId}/media`,
            { 
                media_type: 'CAROUSEL', 
                children: childContainerIds.join(','), 
                caption, 
                access_token: accessToken 
            }
        );
        return await this.publishMedia(instagramUserId, carouselContainerRes.data.id, accessToken);
    }
  }

  private static async publishMedia(instagramUserId: string, creationId: string, accessToken: string) {
      return await axios.post(
          `https://graph.facebook.com/v20.0/${instagramUserId}/media_publish`,
          { creation_id: creationId, access_token: accessToken }
      );
  }

  /**
   * Generates a caption based on vehicle/property data
   */
  static generateCaption(item: any, type: 'vehicle' | 'property', storeName: string, agentName?: string, agentPhone?: string) {
    const cleanDesc = this.stripHtml(item.description || "");
    const descExcerpt = cleanDesc.length > 250 
      ? cleanDesc.substring(0, 250) + "..." 
      : cleanDesc;

    const brandTag = type === 'vehicle' ? this.toHashtag(item.brand || "arac") : "";
    const storeTag = this.toHashtag(storeName || "seckin");

    const contactBlock = (agentName || agentPhone)
      ? `📞 Detaylı Bilgi ve İletişim için:\n` +
        (agentName ? `👤 Yetkili: ${agentName}\n` : '') +
        (agentPhone ? `📱 Telefon: ${agentPhone}\n` : '') + `\n`
      : '';

    if (type === 'vehicle') {
      const fuelText = item.fuel_type || "Belirtilmedi";
      const transText = item.transmission || "Belirtilmedi";
      const priceText = item.selling_price ? `${item.selling_price} ${item.currency || 'TRY'}` : "Görüşülecek";
      const kmText = item.current_mileage !== undefined ? `${item.current_mileage} km` : "Belirtilmedi";

      return `🚗 ${item.brand || ''} ${item.model || ''} (${item.year || ''})\n\n` +
             `💰 Fiyat: ${priceText}\n` +
             `📍 Kilometre: ${kmText}\n` +
             `⚙️ Şanzıman: ${transText}\n` +
             `⛽ Yakıt: ${fuelText}\n\n` +
             `${descExcerpt ? descExcerpt + '\n\n' : ''}` +
             contactBlock +
             `#enrakipsiz #otogaleri #satilikarac${brandTag ? ' #' + brandTag : ''}${storeTag ? ' #' + storeTag : ''}`;
    } else {
      const priceText = item.price ? `${item.price} ${item.currency || 'TRY'}` : "Görüşülecek";
      const locationText = item.location || item.kktc_region || "Kıbrıs";
      const areaText = item.square_meters ? `${item.square_meters} m²` : "Belirtilmedi";
      const roomText = item.room_count || "Belirtilmedi";

      return `🏠 ${item.title || 'Lüks Gayrimenkul Fırsatı'}\n\n` +
             `💰 Fiyat: ${priceText}\n` +
             `📍 Konum: ${locationText}\n` +
             `📐 Alan: ${areaText}\n` +
             `🛏️ Oda: ${roomText}\n\n` +
             `${descExcerpt ? descExcerpt + '\n\n' : ''}` +
             contactBlock +
             `#enrakipsiz #emlak #satilikdaire #gayrimenkul${storeTag ? ' #' + storeTag : ''}`;
    }
  }
}
