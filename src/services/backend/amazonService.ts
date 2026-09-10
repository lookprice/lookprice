import axios from "axios";

export interface AmazonSettings {
  connected?: boolean;
  clientId?: string;
  clientSecret?: string;
  refresh_token?: string;
  sellerId?: string;
  isSandbox?: boolean;
  marketplace_id?: string;
  last_sync?: string | null;
  categoryMappings?: Record<string, any>;
  categoryAttributes?: Record<string, any>;
}

export const AMAZON_TR_MARKETPLACE_ID = "A33AVAJ2PDY3WV";
export const AMAZON_TOKEN_ENDPOINT = "https://api.amazon.com.tr/auth/o2/token";
export const AMAZON_TOKEN_FALLBACK_ENDPOINT = "https://api.amazon.com/auth/o2/token";
export const AMAZON_API_ENDPOINT = "https://sellingpartnerapi-eu.amazon.com";
export const AMAZON_SANDBOX_API_ENDPOINT = "https://sandbox.sellingpartnerapi-eu.amazon.com";

export class AmazonService {
  private settings: AmazonSettings;
  private storeId: number;

  constructor(settings: AmazonSettings, storeId: number = 1) {
    this.settings = settings || {};
    this.storeId = storeId;
  }

  private getApiEndpoint(): string {
    return this.settings.isSandbox ? AMAZON_SANDBOX_API_ENDPOINT : AMAZON_API_ENDPOINT;
  }

  /**
   * Get LWA (Login with Amazon) Access Token using Refresh Token
   */
  async getAccessToken(): Promise<string> {
    const clientId = this.settings.clientId || process.env.AMAZON_CLIENT_ID;
    const clientSecret = this.settings.clientSecret || process.env.AMAZON_CLIENT_SECRET;
    const refreshToken = this.settings.refresh_token;

    if (!clientId) {
      throw new Error("LWA Client ID (Application ID) bulunamadı. Lütfen Amazon LWA Client ID giriniz.");
    }
    if (!clientSecret) {
      throw new Error("LWA Client Secret bulunamadı. Lütfen Amazon LWA Client Secret giriniz.");
    }
    if (!refreshToken) {
      throw new Error("Amazon LWA Refresh Token bulunamadı. Lütfen Refresh Token giriniz veya OAuth yetkilendirmesi yapınız.");
    }

    const payload = {
      grant_type: "refresh_token",
      refresh_token: refreshToken.trim(),
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
    };

    try {
      const response = await axios.post(AMAZON_TOKEN_ENDPOINT, payload, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return response.data.access_token;
    } catch (err: any) {
      // Fallback to global endpoint if TR endpoint returns error
      try {
        const fallbackRes = await axios.post(AMAZON_TOKEN_FALLBACK_ENDPOINT, payload, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        return fallbackRes.data.access_token;
      } catch (fallbackErr: any) {
        const msg = fallbackErr.response?.data?.error_description || fallbackErr.response?.data?.error || err.response?.data?.error_description || err.message;
        throw new Error(`Amazon LWA Token Alma Hatası: ${msg}`);
      }
    }
  }

  /**
   * Test Amazon SP-API Connection
   */
  async testConnection(): Promise<{ success: boolean; sellerId?: string; marketplaceName?: string; participations?: any[]; message?: string }> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.get(`${this.getApiEndpoint()}/sellers/v1/marketplaceParticipations`, {
        headers: {
          "x-amz-access-token": accessToken,
          "User-Agent": "LookPrice/1.0 (Language=JavaScript)",
        },
      });

      const participations = response.data?.payload || response.data || [];
      const trParticipation = Array.isArray(participations)
        ? participations.find((p: any) => p.marketplace?.id === AMAZON_TR_MARKETPLACE_ID || p.marketplace?.countryCode === "TR")
        : null;

      const sellerId = this.settings.sellerId || trParticipation?.participation?.sellerId || (Array.isArray(participations) ? participations[0]?.participation?.sellerId : undefined);

      return {
        success: true,
        sellerId: sellerId,
        marketplaceName: trParticipation ? "Amazon.com.tr (Türkiye)" : "Amazon EU Selling Partner API",
        participations: participations,
        message: "Amazon SP-API Bağlantısı ve Yetkilendirme Başarılı!",
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message;
      throw new Error(`Amazon SP-API Erişim Hatası: ${errMsg}`);
    }
  }

  /**
   * Fetch Recent Amazon SP-API Orders
   */
  async fetchOrders(createdAfterDays: number = 7): Promise<any[]> {
    const accessToken = await this.getAccessToken();
    const createdAfter = new Date(Date.now() - createdAfterDays * 24 * 60 * 60 * 1000).toISOString();

    const response = await axios.get(`${this.getApiEndpoint()}/orders/v0/orders`, {
      params: {
        MarketplaceIds: AMAZON_TR_MARKETPLACE_ID,
        CreatedAfter: createdAfter,
      },
      headers: {
        "x-amz-access-token": accessToken,
      },
    });

    return response.data?.payload?.Orders || [];
  }

  /**
   * Fetch Order Items for a Specific Order
   */
  async fetchOrderItems(amazonOrderId: string): Promise<any[]> {
    const accessToken = await this.getAccessToken();
    try {
      const response = await axios.get(`${this.getApiEndpoint()}/orders/v0/orders/${amazonOrderId}/orderItems`, {
        headers: {
          "x-amz-access-token": accessToken,
        },
      });
      return response.data?.payload?.OrderItems || [];
    } catch (err: any) {
      console.warn(`[AmazonService] Order items fetch error for ${amazonOrderId}:`, err.message);
      return [];
    }
  }

  /**
   * Update Price & Stock for a single SKU via Listings Items API
   */
  async updateListingsItem(sku: string, price: number, quantity: number): Promise<{ success: boolean; sku: string; message?: string }> {
    const accessToken = await this.getAccessToken();
    const sellerId = this.settings.sellerId;

    if (!sellerId) {
      throw new Error("Amazon Seller ID (Merchant ID) girilmelidir.");
    }

    const cleanSku = encodeURIComponent(sku.trim());
    const url = `${this.getApiEndpoint()}/listings/2021-08-01/items/${sellerId}/${cleanSku}?marketplaceIds=${AMAZON_TR_MARKETPLACE_ID}`;

    const patchBody = {
      productType: "PRODUCT",
      patches: [
        {
          op: "replace",
          path: "/attributes/purchasable_offer",
          value: [
            {
              currency: "TRY",
              our_price: [
                {
                  schedule: [{ value_with_tax: price }],
                },
              ],
              marketplace_id: AMAZON_TR_MARKETPLACE_ID,
            },
          ],
        },
        {
          op: "replace",
          path: "/attributes/fulfillment_availability",
          value: [
            {
              fulfillment_channel_code: "DEFAULT",
              quantity: Math.max(0, Math.floor(quantity)),
            },
          ],
        },
      ],
    };

    try {
      const response = await axios.patch(url, patchBody, {
        headers: {
          "x-amz-access-token": accessToken,
          "Content-Type": "application/json",
        },
      });
      return { success: true, sku, message: response.data?.status || "Updated" };
    } catch (err: any) {
      const errMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message;
      return { success: false, sku, message: errMsg };
    }
  }

  /**
   * Bulk Sync Products Stock & Price
   */
  async bulkSyncInventory(products: any[]): Promise<{ syncedCount: number; errorsCount: number; details: any[] }> {
    let syncedCount = 0;
    let errorsCount = 0;
    const details: any[] = [];

    for (const prod of products) {
      const sku = prod.sku || prod.barcode;
      const price = parseFloat(prod.sale_price || prod.price || 0);
      const stock = parseInt(prod.stock_quantity || prod.stock || 0, 10);

      if (!sku || price <= 0) continue;

      const res = await this.updateListingsItem(sku, price, stock);
      if (res.success) {
        syncedCount++;
      } else {
        errorsCount++;
      }
      details.push(res);
    }

    return { syncedCount, errorsCount, details };
  }

  /**
   * Submit Shipment Tracking (Kargo Bildirimi)
   */
  async submitShipmentTracking(amazonOrderId: string, carrierCode: string, trackingNumber: string): Promise<{ success: boolean; message?: string }> {
    const accessToken = await this.getAccessToken();
    const url = `${this.getApiEndpoint()}/orders/v0/orders/${amazonOrderId}/shipment`;
    
    // In Sandbox, Amazon returns success for this payload structure
    const payload = {
      marketplaceId: AMAZON_TR_MARKETPLACE_ID,
      shipmentStatus: "Shipped",
      carrierCode: carrierCode,
      trackingNumber: trackingNumber
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          "x-amz-access-token": accessToken,
          "Content-Type": "application/json",
        },
      });
      return { success: true, message: "Kargo bilgisi Amazon'a başarıyla iletildi." };
    } catch (err: any) {
      const errMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message;
      return { success: false, message: errMsg };
    }
  }
}

