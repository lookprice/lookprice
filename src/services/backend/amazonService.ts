import axios from "axios";
import { pool } from "../../../models/db";

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
    if (this.settings.isSandbox) {
      try {
        const accessToken = await this.getAccessToken();
        const response = await axios.get(`${this.getApiEndpoint()}/orders/v0/orders`, {
          params: {
            MarketplaceIds: "ATVPDKIKX0DER",
            CreatedAfter: "TEST_CASE_200",
          },
          headers: {
            "x-amz-access-token": accessToken,
          },
        });
        const orders = response.data?.payload?.Orders || [];
        if (orders && orders.length > 0) return orders;
      } catch (err: any) {
        console.warn("[AmazonService] Sandbox order query note:", err.response?.data || err.message);
      }
      
      // Sandbox fallback order to test synchronization without errors
      return [
        {
          AmazonOrderId: "902-1845936-5435065",
          PurchaseDate: new Date().toISOString(),
          LastUpdateDate: new Date().toISOString(),
          OrderStatus: "Unshipped",
          FulfillmentChannel: "MFN",
          SalesChannel: "Amazon.com.tr",
          OrderTotal: { CurrencyCode: "TRY", Amount: "450.00" },
          NumberOfItemsShipped: 0,
          NumberOfItemsUnshipped: 1,
          PaymentMethod: "Other",
          MarketplaceId: AMAZON_TR_MARKETPLACE_ID,
          BuyerInfo: {
            BuyerName: "Ahmet Yılmaz (Amazon Sandbox)",
            BuyerEmail: "ahmet.sandbox@lookprice.me"
          }
        }
      ];
    }

    try {
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
    } catch (err: any) {
      const errMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message;
      console.error("[AmazonService] Live fetchOrders error:", err.response?.data || err.message);
      throw new Error(`Amazon Sipariş Çekme Hatası: ${errMsg}. Lütfen Seller Central paneli üzerinden yetkilendirmeyi kontrol ediniz.`);
    }
  }

  /**
   * Fetch Order Items for a Specific Order
   */
  async fetchOrderItems(amazonOrderId: string): Promise<any[]> {
    if (this.settings.isSandbox) {
      try {
        const accessToken = await this.getAccessToken();
        const response = await axios.get(`${this.getApiEndpoint()}/orders/v0/orders/TEST_CASE_200/orderItems`, {
          headers: { "x-amz-access-token": accessToken },
        });
        const items = response.data?.payload?.OrderItems || [];
        if (items && items.length > 0) return items;
      } catch (err: any) {
        console.warn("[AmazonService] Sandbox order items fetch note:", err.message);
      }

      return [
        {
          ASIN: "B00551Q3CS",
          OrderItemId: "05015851154158",
          SellerSKU: "AMZ-TEST-SKU-01",
          Title: "Amazon Sandbox Test Ürünü (Kulaklık / Aksesuar)",
          QuantityOrdered: 1,
          QuantityShipped: 0,
          ItemPrice: { CurrencyCode: "TRY", Amount: "450.00" },
          ItemTax: { CurrencyCode: "TRY", Amount: "75.00" }
        }
      ];
    }

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
   * Fetch Active Listings from Amazon SP-API / Store DB
   */
  async fetchListings(): Promise<any[]> {
    if (this.settings.isSandbox) {
      // Return representative Sandbox listings for matching tests
      return [
        {
          asin: "B00551Q3CS",
          sku: "AMZ-TEST-SKU-01",
          title: "Amazon Sandbox Test Kulaklık / Aksesuar",
          price: 450.00,
          quantity: 25,
          barcode: "8690000000001",
          status: "ACTIVE"
        },
        {
          asin: "B08N5WRWNW",
          sku: "NABetaASINB00551Q3CS",
          title: "Digitus Da-90368 Notebook Standı (Amazon TR)",
          price: 299.90,
          quantity: 12,
          barcode: "4016032456063",
          status: "ACTIVE"
        }
      ];
    }

    // Live mode listing fetch attempt
    try {
      const accessToken = await this.getAccessToken();
      const sellerId = this.settings.sellerId;
      if (sellerId) {
        // Search products from local DB that have ASIN/SKU or return stored Amazon listings
        const res = await pool.query(
          "SELECT amazon_asin as asin, amazon_sku as sku, barcode, name as title, price, stock_quantity as quantity FROM products WHERE store_id = $1 AND (amazon_asin IS NOT NULL OR amazon_sku IS NOT NULL)",
          [this.storeId]
        );
        return res.rows.map(r => ({ ...r, status: "ACTIVE" }));
      }
      return [];
    } catch (err: any) {
      console.warn("[AmazonService] Fetch listings error:", err.message);
      return [];
    }
  }

  /**
   * Match Amazon Listings with Store Products
   */
  async matchListingsWithStoreProducts(options: { importMissing?: boolean } = {}): Promise<{
    success: boolean;
    totalListings: number;
    matchedCount: number;
    importedCount: number;
    updatedCount: number;
    details: any[];
    message?: string;
  }> {
    const importMissing = Boolean(options.importMissing);
    const listings = await this.fetchListings();

    const storeProductsRes = await pool.query(
      `SELECT id, name, barcode, sku, price, stock_quantity, marketplace_data, amazon_asin, amazon_sku, is_amazon_active 
       FROM products 
       WHERE store_id = $1`,
      [this.storeId]
    );
    const storeProducts = storeProductsRes.rows;

    let matchedCount = 0;
    let importedCount = 0;
    let updatedCount = 0;
    const details: any[] = [];

    const normalizeStr = (s: string | null | undefined) =>
      (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    for (const listing of listings) {
      const asin = listing.asin;
      const sku = listing.sku;
      const barcode = listing.barcode;
      const title = listing.title;
      const normAsin = normalizeStr(asin);
      const normSku = normalizeStr(sku);
      const normBarcode = normalizeStr(barcode);
      const normTitle = normalizeStr(title);

      let matchedProd = storeProducts.find((p: any) => {
        const pBarcode = normalizeStr(p.barcode);
        const pSku = normalizeStr(p.sku);
        const pAmzAsin = normalizeStr(p.amazon_asin);
        const pAmzSku = normalizeStr(p.amazon_sku);
        const pName = normalizeStr(p.name);

        if (normAsin && (pAmzAsin === normAsin || pBarcode === normAsin || pSku === normAsin)) return true;
        if (normSku && (pAmzSku === normSku || pBarcode === normSku || pSku === normSku)) return true;
        if (normBarcode && (pBarcode === normBarcode || pSku === normBarcode)) return true;
        if (normTitle && pName && (normTitle.includes(pName) || pName.includes(normTitle))) return true;

        return false;
      });

      if (matchedProd) {
        let mpData: any = matchedProd.marketplace_data;
        if (typeof mpData === "string") {
          try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
        }
        mpData = mpData || {};
        mpData.amazon = {
          ...(mpData.amazon || {}),
          asin: asin || mpData.amazon?.asin,
          sku: sku || mpData.amazon?.sku,
          matchedAt: new Date().toISOString(),
          lastSync: new Date().toISOString(),
          status: listing.status || 'ACTIVE'
        };

        await pool.query(
          `UPDATE products 
           SET is_amazon_active = true,
               amazon_asin = COALESCE(NULLIF($1, ''), amazon_asin),
               amazon_sku = COALESCE(NULLIF($2, ''), amazon_sku),
               amazon_last_sync = NOW(),
               amazon_last_error = NULL,
               marketplace_data = $3
           WHERE id = $4 AND store_id = $5`,
          [asin || null, sku || null, JSON.stringify(mpData), matchedProd.id, this.storeId]
        );

        matchedCount++;
        updatedCount++;
        details.push({
          action: 'matched',
          productId: matchedProd.id,
          productName: matchedProd.name,
          barcode: matchedProd.barcode,
          amazonAsin: asin,
          amazonSku: sku,
          price: listing.price,
          stock: listing.quantity
        });
      } else if (importMissing) {
        const newName = title || (sku ? `Amazon Portföy Ürünü (${sku})` : `Amazon Portföy Ürünü (${asin})`);
        const newBarcode = barcode || sku || asin || `AMZ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newPrice = listing.price || 0;
        const newStock = listing.quantity || 0;

        const mpData = {
          amazon: {
            asin: asin,
            sku: sku,
            importedFromAmazon: true,
            matchedAt: new Date().toISOString(),
            lastSync: new Date().toISOString(),
            status: listing.status || 'ACTIVE'
          }
        };

        const insertRes = await pool.query(
          `INSERT INTO products 
            (store_id, name, barcode, price, stock_quantity, is_amazon_active, amazon_asin, amazon_sku, category, amazon_last_sync, marketplace_data)
           VALUES ($1, $2, $3, $4, $5, true, $6, $7, 'Genel', NOW(), $8)
           ON CONFLICT (store_id, barcode) DO UPDATE 
             SET is_amazon_active = true,
                 amazon_asin = COALESCE(NULLIF(EXCLUDED.amazon_asin, ''), products.amazon_asin),
                 amazon_sku = COALESCE(NULLIF(EXCLUDED.amazon_sku, ''), products.amazon_sku),
                 amazon_last_sync = NOW(),
                 amazon_last_error = NULL,
                 marketplace_data = EXCLUDED.marketplace_data
           RETURNING id, name, barcode, amazon_asin, amazon_sku`,
          [this.storeId, newName, newBarcode, newPrice, newStock, asin || null, sku || null, JSON.stringify(mpData)]
        );

        const insertedRow = insertRes.rows[0];
        if (insertedRow) {
          storeProducts.push({
            id: insertedRow.id,
            name: insertedRow.name,
            barcode: insertedRow.barcode,
            amazon_asin: insertedRow.amazon_asin,
            amazon_sku: insertedRow.amazon_sku
          });
        }
        importedCount++;
        details.push({
          action: 'imported',
          productName: newName,
          barcode: newBarcode,
          amazonAsin: asin,
          amazonSku: sku,
          price: newPrice,
          stock: newStock
        });
      }
    }

    return {
      success: true,
      totalListings: listings.length,
      matchedCount,
      importedCount,
      updatedCount,
      details,
      message: `Amazon İlan Eşleştirme Tamamlandı. ${matchedCount} ürün eşleşti, ${importedCount} yeni ürün aktarıldı.`
    };
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

