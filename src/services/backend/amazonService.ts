import axios from "axios";
import zlib from "zlib";
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

export const AMAZON_TR_MARKETPLACE_ID = "A33AVAJ2PDY3EV";
export const AMAZON_TOKEN_ENDPOINT = "https://api.amazon.com.tr/auth/o2/token";
export const AMAZON_TOKEN_FALLBACK_ENDPOINT = "https://api.amazon.com/auth/o2/token";
export const AMAZON_API_ENDPOINT = "https://sellingpartnerapi-eu.amazon.com";
export const AMAZON_SANDBOX_API_ENDPOINT = "https://sandbox.sellingpartnerapi-eu.amazon.com";

export class AmazonService {
  private settings: AmazonSettings;
  private storeId: number;
  private rdtAddressDenied: boolean = false;
  private rdtBuyerInfoDenied: boolean = false;

  constructor(settings: AmazonSettings, storeId: number = 1) {
    this.settings = settings || {};
    this.storeId = storeId;
  }

  public getApiEndpoint(): string {
    return this.settings.isSandbox ? AMAZON_SANDBOX_API_ENDPOINT : AMAZON_API_ENDPOINT;
  }

  public getMarketplaceId(): string {
    const mp = this.settings.marketplace_id;
    if (!mp || mp === "A33AVAJ2PDY3WV") return AMAZON_TR_MARKETPLACE_ID;
    return mp;
  }

  private static lwaBackoffMap = new Map<string, number>();

  /**
   * Get LWA (Login with Amazon) Access Token using Refresh Token
   */
  async getAccessToken(): Promise<string> {
    let clientId = this.settings.clientId || process.env.AMAZON_CLIENT_ID;
    let clientSecret = this.settings.clientSecret || process.env.AMAZON_CLIENT_SECRET;
    const refreshToken = this.settings.refresh_token || (this.settings as any).refreshToken;

    if (!clientId || !clientSecret) {
      try {
        const masterRes = await pool.query(
          `SELECT amazon_settings FROM stores 
           WHERE amazon_settings->>'clientId' IS NOT NULL 
             AND amazon_settings->>'clientId' != '' 
             AND amazon_settings->>'clientSecret' IS NOT NULL 
             AND amazon_settings->>'clientSecret' != ''
           ORDER BY CASE WHEN id = 2 THEN 0 ELSE 1 END, id ASC LIMIT 1`
        );
        const master = masterRes.rows[0]?.amazon_settings;
        if (master) {
          if (!clientId && master.clientId) clientId = String(master.clientId).trim();
          if (!clientSecret && master.clientSecret) clientSecret = String(master.clientSecret).trim();
        }
      } catch (e) {
        // ignore fallback query error
      }
    }

    if (!clientId) {
      throw new Error("LookPrice Merkezi LWA Client ID bulunamadı.");
    }
    if (!clientSecret) {
      throw new Error("LookPrice Merkezi LWA Client Secret bulunamadı.");
    }
    if (!refreshToken) {
      throw new Error("Amazon OAuth Refresh Token bulunamadı. Lütfen 'Tek Tıkla Amazon'dan Yetki Al (OAuth)' butonunu kullanarak mağazanızı yetkilendiriniz.");
    }

    const cacheKey = `${this.storeId}:${clientId.trim().slice(0, 8)}:${refreshToken.trim().slice(0, 8)}`;
    const backoffUntil = AmazonService.lwaBackoffMap.get(cacheKey);
    if (backoffUntil && Date.now() < backoffUntil) {
      return "AMAZON_UNAUTHORIZED_MOCK_TOKEN";
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
      AmazonService.lwaBackoffMap.delete(cacheKey);
      return response.data.access_token;
    } catch (err: any) {
      // Fallback to global endpoint if TR endpoint returns error
      try {
        const fallbackRes = await axios.post(AMAZON_TOKEN_FALLBACK_ENDPOINT, payload, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        AmazonService.lwaBackoffMap.delete(cacheKey);
        return fallbackRes.data.access_token;
      } catch (fallbackErr: any) {
        // Back off for 60 minutes on client auth / token failure so background crons don't spam LWA
        AmazonService.lwaBackoffMap.set(cacheKey, Date.now() + 60 * 60 * 1000);
        return "AMAZON_UNAUTHORIZED_MOCK_TOKEN";
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
  async fetchOrders(createdAfterDays: number = 14, orderStatuses?: string): Promise<any[]> {
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
        const msg = err.response?.data?.errors?.[0]?.message || err.message;
        console.info("[AmazonService] Sandbox order query note:", msg);
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
      if (accessToken === "AMAZON_UNAUTHORIZED_MOCK_TOKEN") {
        console.info("[AmazonService] Skipping fetchOrders due to unconfigured or mock Amazon credentials.");
        return [];
      }
      const createdAfter = new Date(Date.now() - createdAfterDays * 24 * 60 * 60 * 1000).toISOString();
      const marketplaceId = this.getMarketplaceId();

      const params: any = {
        MarketplaceIds: marketplaceId,
        CreatedAfter: createdAfter,
      };

      if (orderStatuses) {
        params.OrderStatuses = orderStatuses;
      }

      const response = await axios.get(`${this.getApiEndpoint()}/orders/v0/orders`, {
        params,
        headers: {
          "x-amz-access-token": accessToken,
        },
      });

      return response.data?.payload?.Orders || [];
    } catch (err: any) {
      const errMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message;
      console.warn("[AmazonService] Live fetchOrders error (ignoring to prevent cron spam):", errMsg);
      return [];
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
        console.info("[AmazonService] Sandbox order items fetch note:", err.message);
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
      console.info(`[AmazonService] Order items fetch note for ${amazonOrderId}:`, err.message);
      return [];
    }
  }

  /**
   * Get Restricted Data Token (RDT) for sensitive PII (BuyerInfo, ShippingAddress)
   */
  async getRestrictedDataToken(restrictedResources: Array<{ method: string; path: string; dataElements?: string[] }>): Promise<string | null> {
    if (this.settings.isSandbox) return null;
    try {
      const accessToken = await this.getAccessToken();
      const response = await axios.post(
        `${this.getApiEndpoint()}/tokens/2021-03-01/restrictedDataToken`,
        { restrictedResources },
        {
          headers: {
            "x-amz-access-token": accessToken,
            "Content-Type": "application/json",
          },
          timeout: 2500,
        }
      );
      return response.data?.restrictedDataToken || null;
    } catch (err: any) {
      return null;
    }
  }

  /**
   * Fetch Order Shipping Address (Müşteri Adresi ve Kişisel Bilgiler)
   */
  async fetchOrderAddress(amazonOrderId: string): Promise<any | null> {
    if (this.settings.isSandbox) {
      return {
        Name: "Ahmet Yılmaz (Amazon Sandbox)",
        AddressLine1: "Levent Mah. Cömert Sk. No: 14/B",
        City: "İstanbul",
        District: "Beşiktaş",
        StateOrRegion: "İstanbul",
        PostalCode: "34330",
        CountryCode: "TR",
        Phone: "0532 000 00 00"
      };
    }

    if (this.rdtAddressDenied) return null;

    try {
      const rdtToken = await this.getRestrictedDataToken([
        { method: "GET", path: `/orders/v0/orders/${amazonOrderId}/address`, dataElements: ["shippingAddress"] }
      ]);
      const token = rdtToken || (await this.getAccessToken());

      const response = await axios.get(`${this.getApiEndpoint()}/orders/v0/orders/${amazonOrderId}/address`, {
        headers: { "x-amz-access-token": token },
        timeout: 6000,
      });

      return response.data?.payload?.ShippingAddress || null;
    } catch (err: any) {
      if (err.response?.status === 403) {
        this.rdtAddressDenied = true;
      }
      return null;
    }
  }

  /**
   * Fetch Order Buyer Info (Alıcı ve Vergi/TC Bilgisi)
   */
  async fetchOrderBuyerInfo(amazonOrderId: string): Promise<any | null> {
    if (this.settings.isSandbox) {
      return {
        BuyerEmail: "ahmet.sandbox@lookprice.me",
        BuyerName: "Ahmet Yılmaz",
        BuyerTaxInfo: {
          CompanyLegalName: "Amazon Test Müşterisi",
          TaxingRegion: "TR"
        }
      };
    }

    if (this.rdtBuyerInfoDenied) return null;

    try {
      const rdtToken = await this.getRestrictedDataToken([
        { method: "GET", path: `/orders/v0/orders/${amazonOrderId}/buyerInfo`, dataElements: ["buyerInfo"] }
      ]);
      const token = rdtToken || (await this.getAccessToken());

      const response = await axios.get(`${this.getApiEndpoint()}/orders/v0/orders/${amazonOrderId}/buyerInfo`, {
        headers: { "x-amz-access-token": token },
        timeout: 6000,
      });

      return response.data?.payload || null;
    } catch (err: any) {
      if (err.response?.status === 403) {
        this.rdtBuyerInfoDenied = true;
      }
      return null;
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
          asin: "B07QJ32SJR",
          sku: "DIGITUS-DA-90368",
          title: "DIGITUS Dizüstü Bilgisayar Standı Ayarlanabilir (DA-90368)",
          price: 649.00,
          quantity: 15,
          barcode: "4016032456063",
          status: "ACTIVE"
        }
      ];
    }

    // Live mode listing fetch attempt via Amazon SP-API Reports API
    try {
      const accessToken = await this.getAccessToken();
      const endpoint = this.getApiEndpoint();
      const sellerId = this.settings.sellerId || "A2M0PNCK7GMIY6";
      
      const liveReportListings: any[] = [];

      // 1. Check for ready/completed merchant listings reports
      try {
        const reportsRes = await axios.get(
          `${endpoint}/reports/2021-06-30/reports?reportTypes=GET_MERCHANT_LISTINGS_ALL_DATA,GET_FLAT_FILE_OPEN_LISTINGS_DATA&pageSize=5`,
          {
            headers: { "x-amz-access-token": accessToken },
            timeout: 10000,
          }
        );

        const reportsList = reportsRes.data?.reports || [];
        const doneReport = reportsList.find((r: any) => r.processingStatus === "DONE" && r.reportDocumentId);

        if (doneReport) {
          const docRes = await axios.get(`${endpoint}/reports/2021-06-30/documents/${doneReport.reportDocumentId}`, {
            headers: { "x-amz-access-token": accessToken },
            timeout: 10000,
          });

          if (docRes.data?.url) {
            const downloadRes = await axios.get(docRes.data.url, { responseType: "arraybuffer", timeout: 15000 });
            let text = "";
            if (docRes.data.compressionAlgorithm === "GZIP") {
              text = zlib.gunzipSync(downloadRes.data).toString("utf-8");
            } else {
              text = Buffer.from(downloadRes.data).toString("utf-8");
            }

            const lines = text.split("\n").filter((l: string) => l.trim().length > 0);
            if (lines.length > 1) {
              const header = lines[0].replace(/^\uFEFF/, '').trim().split("\t").map(h => h.trim());
              for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split("\t");
                const rowObj: any = {};
                header.forEach((h: string, idx: number) => {
                  rowObj[h] = cols[idx];
                });

                const asin = rowObj["asin1"] || rowObj["product-id"];
                const sku = rowObj["seller-sku"];
                const title = rowObj["item-name"] || rowObj["title"] || rowObj["product-name"] || "";
                const price = parseFloat(rowObj["price"]) || 0;
                const quantity = parseInt(rowObj["quantity"] || "0", 10);
                const status = String(rowObj["status"] || "ACTIVE").toUpperCase();

                if (asin || sku) {
                  liveReportListings.push({
                    asin,
                    sku,
                    title,
                    price,
                    quantity,
                    barcode: sku && !sku.includes("-") ? sku : null,
                    status: status === "ACTIVE" ? "ACTIVE" : "INACTIVE",
                    raw: rowObj
                  });
                }
              }
            }
          }
        } else {
          // If no report is done yet, trigger a new background report request
          axios.post(
            `${endpoint}/reports/2021-06-30/reports`,
            {
              reportType: "GET_MERCHANT_LISTINGS_ALL_DATA",
              marketplaceIds: [this.settings.marketplace_id || "A33AVAJ2PDY3EV"]
            },
            {
              headers: { "x-amz-access-token": accessToken },
              timeout: 10000
            }
          ).catch((e: any) => console.warn("[AmazonService] Report trigger warn:", e.message));
        }
      } catch (err: any) {
        console.warn("[AmazonService] SP-API Reports fetch warn:", err.message);
      }

      // 2. Real-time SP-API Listings Items search (overrides stale report status with live BUYABLE / quantity / issues)
      const liveItemsBySku = new Map<string, any>();
      const buyableAsins = new Set<string>();
      const mpId = this.settings.marketplace_id || AMAZON_TR_MARKETPLACE_ID;
      if (sellerId) {
        try {
          let pageToken: string | undefined = undefined;
          let pageCount = 0;
          do {
            const searchUrl = new URL(`${endpoint}/listings/2021-08-01/items/${sellerId}`);
            searchUrl.searchParams.set("marketplaceIds", mpId);
            searchUrl.searchParams.set("includedData", "summaries,offers,fulfillmentAvailability,issues");
            searchUrl.searchParams.set("pageSize", "20");
            if (pageToken) searchUrl.searchParams.set("pageToken", pageToken);

            const searchRes = await axios.get(searchUrl.toString(), {
              headers: { "x-amz-access-token": accessToken },
              timeout: 12000,
            });
            const items = searchRes.data?.items || [];
            for (const it of items) {
              const sku = String(it.sku || "").trim();
              if (!sku) continue;
              const summary = Array.isArray(it.summaries) ? it.summaries[0] : null;
              const offer = Array.isArray(it.offers) ? it.offers[0] : null;
              const fa = Array.isArray(it.fulfillmentAvailability) ? it.fulfillmentAvailability[0] : null;
              const issues = Array.isArray(it.issues) ? it.issues : [];
              const statusArr: string[] = Array.isArray(summary?.status) ? summary.status : [];
              const isBuyable = statusArr.includes("BUYABLE");
              const qty = typeof fa?.quantity === "number" ? fa.quantity : 0;
              const price = parseFloat(offer?.price?.amount || "0") || 0;
              const asin = String(summary?.asin || "").trim();
              const title = summary?.itemName || "";
              const productType = summary?.productType || "";
              const isActiveListing = isBuyable && qty > 0;
              if (isActiveListing && asin) {
                buyableAsins.add(asin);
              }

              // Filter blocking issues (ignore non-blocking attribute quality warnings 90244, 99022, 18448, 100858, 100859, 100916, 101265)
              const blockingErrors = issues.filter(
                (iss: any) =>
                  iss.severity === "ERROR" &&
                  !["90244", "99022", "18448", "100858", "100859", "100916", "101265"].includes(String(iss.code))
              );
              const hasPriceIssue = issues.some(
                (iss: any) =>
                  (Array.isArray(iss.categories) && iss.categories.includes("INVALID_PRICE")) ||
                  /fiyat|price|pricing|fahiş/i.test(String(iss.message || ""))
              );

              let errorCode: string | null = null;
              let errorMessage: string | null = null;
              let priceAlert = false;

              if (!isActiveListing && qty > 0) {
                if (hasPriceIssue || blockingErrors.length === 0) {
                  errorCode = "HIGH_PRICE";
                  errorMessage = "Yüksek Fiyat";
                  priceAlert = true;
                } else if (blockingErrors.some((e: any) => String(e.code) === "18299")) {
                  errorCode = "BRAND_APPROVAL";
                  errorMessage = "Marka Onayı";
                } else if (blockingErrors.some((e: any) => String(e.code) === "5886")) {
                  errorCode = "RESTRICTED_ASIN";
                  errorMessage = "Kısıtlı ASIN";
                } else if (blockingErrors.some((e: any) => String(e.code) === "13013")) {
                  errorCode = "CATALOG_ERROR";
                  errorMessage = "Katalog Hatası";
                } else {
                  errorCode = "LISTING_ERROR";
                  errorMessage = blockingErrors[0]?.message || "İlan Kısıtlı";
                }
              }

              liveItemsBySku.set(sku, {
                asin,
                sku,
                title,
                productType,
                price,
                quantity: qty,
                barcode: sku && /^\d{8,14}$/.test(sku) ? sku : null,
                status: isActiveListing ? "ACTIVE" : "INACTIVE",
                isBuyable: isActiveListing,
                summaryStatus: statusArr,
                issues: blockingErrors,
                errorCode,
                errorMessage,
                priceAlert,
                raw: it,
              });
            }
            pageToken = searchRes.data?.pagination?.nextToken;
            pageCount++;
          } while (pageToken && pageCount < 10);
        } catch (liveErr: any) {
          console.warn("[AmazonService] Live searchListingsItems warn:", liveErr.message);
        }
      }

      // Merge liveItemsBySku with liveReportListings (preferring live SP-API status/quantity/issues)
      const mergedMap = new Map<string, any>();
      for (const rep of liveReportListings) {
        const key = String(rep.sku || rep.asin || "").trim();
        if (!key) continue;
        const repAsin = String(rep.asin || "").trim();
        const isRepInactiveWithStock = rep.status !== "ACTIVE" && Number(rep.quantity || 0) > 0 && !buyableAsins.has(repAsin);
        mergedMap.set(key, {
          ...rep,
          isBuyable: rep.status === "ACTIVE" && Number(rep.quantity || 0) > 0,
          priceAlert: isRepInactiveWithStock,
          errorCode: isRepInactiveWithStock ? "HIGH_PRICE" : null,
          errorMessage: isRepInactiveWithStock ? "Yüksek Fiyat" : null,
        });
      }
      for (const [sku, liveItem] of liveItemsBySku.entries()) {
        const existing = mergedMap.get(sku);
        const resolvedAsin = liveItem.asin || existing?.asin || "";
        // If another SKU for the same ASIN is already BUYABLE, don't flag old duplicate SKU as price alert
        const suppressedByPrice = liveItem.priceAlert && !buyableAsins.has(resolvedAsin);
        mergedMap.set(sku, {
          ...(existing || {}),
          ...liveItem,
          asin: resolvedAsin,
          title: liveItem.title || existing?.title || "",
          price: liveItem.price > 0 ? liveItem.price : (existing?.price || 0),
          barcode: liveItem.barcode || existing?.barcode || null,
          priceAlert: suppressedByPrice,
          errorCode: suppressedByPrice ? "HIGH_PRICE" : (liveItem.priceAlert ? null : liveItem.errorCode),
          errorMessage: suppressedByPrice ? "Yüksek Fiyat" : (liveItem.priceAlert ? null : liveItem.errorMessage),
        });
      }

      const combined = Array.from(mergedMap.values());

      // 3. Batch query competitive reference prices for High Pricing Error items (max 20 ASINs per call)
      const priceAlertAsins = Array.from(
        new Set(
          combined
            .filter((item) => item.priceAlert && item.asin && /^B[0-9A-Z]{9}$/i.test(String(item.asin)))
            .map((item) => String(item.asin).trim().toUpperCase())
        )
      ).slice(0, 20);

      if (priceAlertAsins.length > 0) {
        try {
          const compUrl = `${endpoint}/products/pricing/v0/competitivePrice?MarketplaceId=${mpId}&Asins=${priceAlertAsins.join(",")}&ItemType=Asin`;
          const compRes = await axios.get(compUrl, {
            headers: { "x-amz-access-token": accessToken },
            timeout: 8000,
          });
          const compList = Array.isArray(compRes.data?.payload) ? compRes.data.payload : [];
          const refPriceByAsin = new Map<string, number>();
          for (const entry of compList) {
            const cAsin = String(entry?.ASIN || "").trim().toUpperCase();
            const compPrices = entry?.Product?.CompetitivePricing?.CompetitivePrices || [];
            const landed = Number(compPrices[0]?.Price?.LandedPrice?.Amount || compPrices[0]?.Price?.ListingPrice?.Amount || 0);
            if (cAsin && landed > 0) {
              refPriceByAsin.set(cAsin, landed);
            }
          }
          for (const item of combined) {
            if (item.priceAlert && item.asin) {
              const refP = refPriceByAsin.get(String(item.asin).trim().toUpperCase());
              if (refP && refP > 0) {
                item.referencePrice = refP;
                item.errorMessage = `Yüksek Fiyat (Ref: ${refP.toLocaleString("tr-TR")} TL)`;
              }
            }
          }
        } catch (compErr: any) {
          // Non-blocking if competitive pricing endpoint is rate-limited
        }
      }

      return combined;
    } catch (err: any) {
      console.warn("[AmazonService] Fetch listings error:", err.message);
      return [];
    }
  }

  /**
   * Resolve Amazon ASIN & Catalog ProductType from Amazon SP-API Catalog Items (2022-04-01)
   * Supports lookup by ASIN, EAN/GTIN barcode, or product title keywords.
   */
  async resolveCatalogItem(params: {
    asin?: string | null;
    barcode?: string | null;
    title?: string | null;
  }): Promise<{
    found: boolean;
    asin?: string;
    productType?: string;
    itemName?: string;
    brand?: string;
  }> {
    const accessToken = await this.getAccessToken();
    if (accessToken === "AMAZON_UNAUTHORIZED_MOCK_TOKEN") {
      return { found: false };
    }
    const endpoint = this.getApiEndpoint();
    const mpId = this.settings.marketplace_id || AMAZON_TR_MARKETPLACE_ID;
    const headers = { "x-amz-access-token": accessToken };

    const cleanAsin = params.asin && String(params.asin).trim().toLowerCase() !== "null" && !String(params.asin).startsWith("http")
      ? String(params.asin).trim().toUpperCase()
      : "";
    const cleanBarcode = params.barcode ? String(params.barcode).trim() : "";
    const cleanTitle = params.title ? String(params.title).trim() : "";

    // 1. Direct ASIN lookup
    if (cleanAsin && /^B[0-9A-Z]{9}$/.test(cleanAsin)) {
      try {
        const res = await axios.get(
          `${endpoint}/catalog/2022-04-01/items/${encodeURIComponent(cleanAsin)}?marketplaceIds=${mpId}&includedData=summaries,productTypes`,
          { headers, timeout: 10000 }
        );
        const summary = res.data?.summaries?.[0];
        const pt = res.data?.productTypes?.[0]?.productType || summary?.productType || "PRODUCT";
        return {
          found: true,
          asin: cleanAsin,
          productType: pt,
          itemName: summary?.itemName || "",
          brand: summary?.brand || "",
        };
      } catch (e: any) {
        // Continue to barcode/keyword search if ASIN lookup fails
      }
    }

    // 2. Barcode (EAN / GTIN / UPC) lookup
    if (cleanBarcode && /^\d{8,14}$/.test(cleanBarcode)) {
      const idTypes = cleanBarcode.length === 12 ? ["UPC", "EAN", "GTIN"] : ["EAN", "GTIN", "UPC"];
      for (const idType of idTypes) {
        try {
          const res = await axios.get(
            `${endpoint}/catalog/2022-04-01/items?marketplaceIds=${mpId}&identifiers=${encodeURIComponent(cleanBarcode)}&identifiersType=${idType}&includedData=summaries,productTypes`,
            { headers, timeout: 10000 }
          );
          const item = res.data?.items?.[0];
          if (item?.asin) {
            const summary = item.summaries?.[0];
            const pt = item.productTypes?.[0]?.productType || summary?.productType || "PRODUCT";
            return {
              found: true,
              asin: String(item.asin).trim().toUpperCase(),
              productType: pt,
              itemName: summary?.itemName || "",
              brand: summary?.brand || "",
            };
          }
        } catch (e: any) {
          // Ignore and try next identifier type
        }
      }
    }

    // 3. Keyword search by barcode or product title
    const keywordQueries: string[] = [];
    if (cleanBarcode && cleanBarcode.length >= 5) keywordQueries.push(cleanBarcode);
    if (cleanTitle && cleanTitle.length >= 4) keywordQueries.push(cleanTitle);

    for (const kw of keywordQueries) {
      try {
        const res = await axios.get(
          `${endpoint}/catalog/2022-04-01/items?marketplaceIds=${mpId}&keywords=${encodeURIComponent(kw)}&includedData=summaries,productTypes&pageSize=5`,
          { headers, timeout: 10000 }
        );
        const items = res.data?.items || [];
        if (items.length > 0) {
          // Pick best match based on brand/model tokens in title
          const normTitle = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
          let bestItem = items[0];
          if (normTitle) {
            const titleWords = cleanTitle
              .split(/\s+/)
              .map(w => w.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase())
              .filter(w => w.length >= 3);
            let bestScore = -1;
            for (const candidate of items) {
              const candName = String(candidate.summaries?.[0]?.itemName || "").toLowerCase();
              let score = 0;
              for (const w of titleWords) {
                if (candName.includes(w)) score++;
              }
              if (score > bestScore) {
                bestScore = score;
                bestItem = candidate;
              }
            }
          }
          if (bestItem?.asin) {
            const summary = bestItem.summaries?.[0];
            const pt = bestItem.productTypes?.[0]?.productType || summary?.productType || "PRODUCT";
            return {
              found: true,
              asin: String(bestItem.asin).trim().toUpperCase(),
              productType: pt,
              itemName: summary?.itemName || "",
              brand: summary?.brand || "",
            };
          }
        }
      } catch (e: any) {
        // Ignore keyword search error
      }
    }

    return { found: false };
  }

  /**
   * Create or repair an Amazon Offer on an existing Catalog ASIN using LISTING_OFFER_ONLY.
   * Ensures `merchant_suggested_asin`, `condition_type`, `skip_offer`, `purchasable_offer`, and `fulfillment_availability`
   * are bound with the exact catalog `productType` so the SKU never falls into error 13013 (LISTING_SUPPRESSED).
   */
  async upsertListingOffer(params: {
    sku: string;
    asin: string;
    price: number;
    quantity: number;
    productType?: string;
  }): Promise<{
    success: boolean;
    sku: string;
    asin: string;
    productType: string;
    status?: string;
    isBuyable?: boolean;
    issues?: any[];
    message?: string;
  }> {
    const accessToken = await this.getAccessToken();
    if (accessToken === "AMAZON_UNAUTHORIZED_MOCK_TOKEN") {
      return { success: false, sku: params.sku, asin: params.asin, productType: "PRODUCT", message: "Amazon LWA yetkisi bekliyor." };
    }
    const sellerId = this.settings.sellerId;
    if (!sellerId) {
      throw new Error("Amazon Seller ID (Merchant ID) girilmelidir.");
    }

    const cleanSku = String(params.sku || "").trim();
    const cleanAsin = String(params.asin || "").trim().toUpperCase();
    const mpId = this.settings.marketplace_id || AMAZON_TR_MARKETPLACE_ID;
    const endpoint = this.getApiEndpoint();
    const headers = {
      "x-amz-access-token": accessToken,
      "Content-Type": "application/json",
    };

    // 1. Resolve exact catalog productType for this ASIN
    let resolvedProductType = params.productType || "";
    if (!resolvedProductType || resolvedProductType === "PRODUCT") {
      const catInfo = await this.resolveCatalogItem({ asin: cleanAsin });
      resolvedProductType = catInfo.productType || "PRODUCT";
    }

    const safePrice = Number(Number(params.price || 0).toFixed(2));
    const safeQty = Math.max(0, Math.floor(Number(params.quantity || 0)));

    // 2. PUT LISTING_OFFER_ONLY to bind the SKU to the catalog ASIN with condition_type = new_new
    const putUrl = `${endpoint}/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(cleanSku)}?marketplaceIds=${mpId}`;
    const putBody = {
      productType: resolvedProductType,
      requirements: "LISTING_OFFER_ONLY",
      attributes: {
        merchant_suggested_asin: [{ value: cleanAsin, marketplace_id: mpId }],
        condition_type: [{ value: "new_new", marketplace_id: mpId }],
        skip_offer: [{ value: false, marketplace_id: mpId }],
        purchasable_offer: [
          {
            currency: "TRY",
            audience: "ALL",
            our_price: [{ schedule: [{ value_with_tax: safePrice }] }],
            marketplace_id: mpId,
          },
        ],
        fulfillment_availability: [
          {
            fulfillment_channel_code: "DEFAULT",
            quantity: safeQty,
          },
        ],
      },
    };

    try {
      const putRes = await axios.put(putUrl, putBody, { headers, timeout: 15000 });
      const putStatus = putRes.data?.status || "ACCEPTED";
      const putIssues = putRes.data?.issues || [];

      // Also apply PATCH for immediate price & quantity update if listing already exists
      try {
        await axios.patch(
          putUrl,
          {
            productType: resolvedProductType,
            patches: [
              {
                op: "replace",
                path: "/attributes/purchasable_offer",
                value: [
                  {
                    currency: "TRY",
                    audience: "ALL",
                    our_price: [{ schedule: [{ value_with_tax: safePrice }] }],
                    marketplace_id: mpId,
                  },
                ],
              },
              {
                op: "replace",
                path: "/attributes/fulfillment_availability",
                value: [
                  {
                    fulfillment_channel_code: "DEFAULT",
                    quantity: safeQty,
                  },
                ],
              },
            ],
          },
          { headers, timeout: 12000 }
        );
      } catch (patchErr) {
        // Non-blocking if PUT already succeeded
      }

      return {
        success: putStatus === "ACCEPTED" || putStatus === "VALID",
        sku: cleanSku,
        asin: cleanAsin,
        productType: resolvedProductType,
        status: putStatus,
        issues: putIssues,
        message: putStatus === "ACCEPTED" ? "Amazon teklifi (Offer) başarıyla oluşturuldu/güncellendi." : `Amazon yanıtı: ${putStatus}`,
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message;
      return {
        success: false,
        sku: cleanSku,
        asin: cleanAsin,
        productType: resolvedProductType,
        message: errMsg,
      };
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
    const listings = await this.fetchListings();

    const storeRateRes = await pool.query(
      "SELECT currency_rates, branding FROM stores WHERE id = $1",
      [this.storeId]
    );
    const storeRow = storeRateRes.rows[0] || {};
    let storeBranding: any = storeRow.branding || {};
    if (typeof storeBranding === "string") {
      try { storeBranding = JSON.parse(storeBranding); } catch (e) { storeBranding = {}; }
    }
    let dbRates: any = storeRow.currency_rates || {};
    if (typeof dbRates === "string") {
      try { dbRates = JSON.parse(dbRates); } catch (e) { dbRates = {}; }
    }
    const effectiveRates: Record<string, number> = {
      ...(storeBranding?.currency_rates || {}),
      ...(dbRates || {})
    };

    const storeProductsRes = await pool.query(
      `SELECT id, name, barcode, sku, price, currency, category, sub_category, stock_quantity, marketplace_data, amazon_asin, amazon_sku, is_amazon_active 
       FROM products 
       WHERE store_id = $1`,
      [this.storeId]
    );
    const storeProducts = storeProductsRes.rows;

    let matchedCount = 0;
    const importedCount = 0;
    let updatedCount = 0;
    const details: any[] = [];
    const activeMatchedIds = new Set<number>();

    const normalizeStr = (s: string | null | undefined) =>
      (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    // Sort listings so ACTIVE / BUYABLE ones are processed first
    const sortedListings = [...listings].sort((a, b) => {
      const aAct = a.status === "ACTIVE" || a.isBuyable ? 1 : 0;
      const bAct = b.status === "ACTIVE" || b.isBuyable ? 1 : 0;
      return bAct - aAct;
    });

    for (const listing of sortedListings) {
      const asin = listing.asin;
      const sku = listing.sku;
      const barcode = listing.barcode;
      const title = listing.title;
      const normAsin = normalizeStr(asin);
      const normSku = normalizeStr(sku);
      const normBarcode = normalizeStr(barcode);
      const normTitle = normalizeStr(title);

      const matchedProd = storeProducts.find((p: any) => {
        const pBarcode = normalizeStr(p.barcode);
        const pSku = normalizeStr(p.sku);
        const pAmzAsin = normalizeStr(p.amazon_asin);
        const pAmzSku = normalizeStr(p.amazon_sku);
        const pName = normalizeStr(p.name);

        if (normBarcode && pBarcode && pBarcode === normBarcode) return true;
        if (normAsin && pAmzAsin && pAmzAsin === normAsin) return true;
        if (normSku && (pAmzSku === normSku || pSku === normSku || pBarcode === normSku)) return true;
        if (normBarcode && pSku && pSku === normBarcode) return true;
        if (normTitle && pName && normTitle.length > 15 && pName.length > 15 && (normTitle.includes(pName) || pName.includes(normTitle))) return true;

        return false;
      });

      if (matchedProd) {
        // Do not overwrite an already-active matched product with a secondary inactive SKU
        if (activeMatchedIds.has(matchedProd.id)) continue;

        let mpData: any = matchedProd.marketplace_data;
        if (typeof mpData === "string") {
          try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
        }
        mpData = mpData || {};

        const cleanAsin = (asin || matchedProd.amazon_asin) && String(asin || matchedProd.amazon_asin).trim().toLowerCase() !== "null" && !String(asin || matchedProd.amazon_asin).startsWith("http")
          ? String(asin || matchedProd.amazon_asin).trim().toUpperCase()
          : null;
        const hasValidAsin = Boolean(cleanAsin && cleanAsin.length >= 9);

        const pPrice = Number(matchedProd.price || 0);
        const pStock = Number(matchedProd.stock_quantity || 0);
        const isListingActiveOnAmz = String(listing.status || "ACTIVE").toUpperCase() === "ACTIVE";
        const isBuyableOnAmz = listing.isBuyable === true;

        // Only respect manual unpublish if the listing is NOT actively BUYABLE on Amazon right now
        const isExplicitlyUnpublished = mpData.amazon?.manuallyUnpublished === true && !isBuyableOnAmz;

        const finalIsActive = !isExplicitlyUnpublished && hasValidAsin && pPrice > 0 && pStock > 0 && isListingActiveOnAmz && isBuyableOnAmz;
        if (finalIsActive) {
          activeMatchedIds.add(matchedProd.id);
        }

        const issueError = !finalIsActive
          ? (listing.errorMessage ||
              (Array.isArray(listing.issues) && listing.issues.length > 0
                ? listing.issues.filter((i: any) => i.severity === "ERROR").map((i: any) => i.message).join(" | ")
                : null))
          : null;

        let rawPriceTry = pPrice;
        const curr = String(matchedProd.currency || "TRY").toUpperCase();
        if (curr === "USD" && effectiveRates.USD) rawPriceTry *= Number(effectiveRates.USD);
        else if (curr === "EUR" && effectiveRates.EUR) rawPriceTry *= Number(effectiveRates.EUR);
        else if (curr === "GBP" && effectiveRates.GBP) rawPriceTry *= Number(effectiveRates.GBP);

        const policyPrice = pPrice > 0
          ? this.calculateMarketplacePrice(rawPriceTry, matchedProd.category, matchedProd.sub_category)
          : Number(listing.price || 0);

        mpData.amazon = {
          ...(mpData.amazon || {}),
          asin: cleanAsin || mpData.amazon?.asin,
          sku: sku || mpData.amazon?.sku,
          productType: listing.productType || mpData.amazon?.productType,
          price: policyPrice,
          priceAlert: !finalIsActive && Boolean(listing.priceAlert),
          errorType: !finalIsActive ? (listing.errorCode || null) : null,
          referencePrice: !finalIsActive && listing.referencePrice ? Number(listing.referencePrice) : null,
          attributes: {
            ...(mpData.amazon?.attributes || {}),
            price: String(policyPrice),
          },
          matchedAt: new Date().toISOString(),
          lastSync: new Date().toISOString(),
          status: finalIsActive ? "ACTIVE" : (listing.priceAlert ? "PRICE_ERROR" : "INACTIVE"),
        };
        if (finalIsActive) {
          delete mpData.amazon.manuallyUnpublished;
          delete mpData.amazon.priceAlert;
          delete mpData.amazon.errorType;
          delete mpData.amazon.referencePrice;
        }

        await pool.query(
          `UPDATE products 
           SET is_amazon_active = $1,
               amazon_asin = $2,
               amazon_sku = $3,
               amazon_last_sync = NOW(),
               amazon_last_error = $4,
               marketplace_data = $5
           WHERE id = $6 AND store_id = $7`,
          [
            finalIsActive,
            cleanAsin || null,
            sku || matchedProd.amazon_sku || null,
            !hasValidAsin ? "ASIN Eksik" : (issueError || null),
            JSON.stringify(mpData),
            matchedProd.id,
            this.storeId,
          ]
        );

        matchedCount++;
        updatedCount++;
        details.push({
          action: "matched",
          productId: matchedProd.id,
          productName: matchedProd.name,
          barcode: matchedProd.barcode,
          amazonAsin: cleanAsin,
          amazonSku: sku,
          price: policyPrice || listing.price,
          stock: listing.quantity,
          isActive: finalIsActive,
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
      message: `Amazon İlan Eşleştirme Tamamlandı. ${matchedCount} ürün canlı Amazon verileriyle eşleşti.`,
    };
  }

  /**
   * Calculate effective Amazon price using commission & fixed fee markup:
   * P_AMZ = (P_Web_TRY * (1 + CommissionRate / 100)) + FixedFee
   */
  calculateMarketplacePrice(webPriceTry: number, category?: string, subCategory?: string): number {
    const rawPrice = Number(webPriceTry) || 0;
    if (rawPrice <= 0) return 0;

    const settings: any = this.settings || {};
    const categoryMarkups = settings.categoryMarkups || {};

    let commissionRate = settings.defaultCommissionRate !== undefined && settings.defaultCommissionRate !== null
      ? Number(settings.defaultCommissionRate) 
      : 0;
    let fixedFee = settings.defaultFixedFee !== undefined && settings.defaultFixedFee !== null 
      ? Number(settings.defaultFixedFee) 
      : 0;

    const cat1 = category ? String(category).trim() : '';
    const sub1 = subCategory ? String(subCategory).trim() : '';
    const subKey = cat1 && sub1 ? `${cat1} > ${sub1}` : '';

    if (subKey && categoryMarkups[subKey]) {
      const cm = categoryMarkups[subKey];
      if (cm.commissionRate !== undefined && cm.commissionRate !== null && cm.commissionRate !== '') {
        commissionRate = Number(cm.commissionRate);
      }
      if (cm.fixedFee !== undefined && cm.fixedFee !== null && cm.fixedFee !== '') {
        fixedFee = Number(cm.fixedFee);
      }
    } else if (cat1 && categoryMarkups[cat1]) {
      const cm = categoryMarkups[cat1];
      if (cm.commissionRate !== undefined && cm.commissionRate !== null && cm.commissionRate !== '') {
        commissionRate = Number(cm.commissionRate);
      }
      if (cm.fixedFee !== undefined && cm.fixedFee !== null && cm.fixedFee !== '') {
        fixedFee = Number(cm.fixedFee);
      }
    }

    if (commissionRate <= 0 && fixedFee <= 0) {
      return Number(rawPrice.toFixed(2));
    }

    const method = settings.priceCalculationMethod || settings.priceCalculation || 'markup';
    let calculatedPrice: number;

    if (method === 'margin') {
      if (commissionRate >= 100) {
        commissionRate = 99.9;
      }
      const divisor = 1 - (commissionRate / 100);
      calculatedPrice = (rawPrice + fixedFee) / divisor;
    } else {
      // Standard Turkish e-commerce markup formula: P_satış = (P_web * (1 + komisyon / 100)) + sabit_bedel
      calculatedPrice = (rawPrice * (1 + (commissionRate / 100))) + fixedFee;
    }

    return Number(calculatedPrice.toFixed(2));
  }

  /**
   * Update Price & Stock for a single SKU via Listings Items API.
   * Automatically resolves the SKU's actual productType or uses upsertListingOffer if the SKU is missing catalog binding (error 13013).
   */
  async updateListingsItem(
    sku: string,
    price: number,
    quantity: number,
    maxRetries = 3,
    options?: { asin?: string; productType?: string }
  ): Promise<{ success: boolean; sku: string; message?: string }> {
    const accessToken = await this.getAccessToken();
    if (accessToken === "AMAZON_UNAUTHORIZED_MOCK_TOKEN") {
      return { success: false, sku, message: "Amazon LWA yetkisi bekliyor." };
    }
    const sellerId = this.settings.sellerId;

    if (!sellerId) {
      throw new Error("Amazon Seller ID (Merchant ID) girilmelidir.");
    }

    const cleanSku = encodeURIComponent(sku.trim());
    const mpId = this.settings.marketplace_id || AMAZON_TR_MARKETPLACE_ID;
    const url = `${this.getApiEndpoint()}/listings/2021-08-01/items/${sellerId}/${cleanSku}?marketplaceIds=${mpId}`;

    // Check existing SKU on Amazon to get its real productType and see if summaries are bound
    let resolvedProductType = options?.productType || "";
    let needsOfferUpsert = false;
    try {
      const checkRes = await axios.get(`${url}&includedData=summaries,issues`, {
        headers: { "x-amz-access-token": accessToken },
        timeout: 10000,
      });
      const summaries = checkRes.data?.summaries || [];
      const issues = checkRes.data?.issues || [];
      if (summaries.length > 0 && summaries[0]?.productType) {
        resolvedProductType = summaries[0].productType;
      }
      const has13013 = issues.some((i: any) => i.code === "13013");
      if (summaries.length === 0 || has13013) {
        needsOfferUpsert = true;
      }
    } catch (checkErr: any) {
      if (checkErr.response?.status === 404) {
        needsOfferUpsert = true;
      }
    }

    if (needsOfferUpsert && options?.asin) {
      const upsertRes = await this.upsertListingOffer({
        sku: sku.trim(),
        asin: options.asin,
        price,
        quantity,
        productType: resolvedProductType || undefined,
      });
      return {
        success: upsertRes.success,
        sku,
        message: upsertRes.message,
      };
    }

    if (!resolvedProductType) {
      if (options?.asin) {
        const cat = await this.resolveCatalogItem({ asin: options.asin });
        resolvedProductType = cat.productType || "PRODUCT";
      } else {
        resolvedProductType = "PRODUCT";
      }
    }

    const patchBody = {
      productType: resolvedProductType,
      patches: [
        {
          op: "replace",
          path: "/attributes/purchasable_offer",
          value: [
            {
              currency: "TRY",
              audience: "ALL",
              our_price: [
                {
                  schedule: [{ value_with_tax: Number(Number(price).toFixed(2)) }],
                },
              ],
              marketplace_id: mpId,
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

    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const response = await axios.patch(url, patchBody, {
          headers: {
            "x-amz-access-token": accessToken,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        });
        return { success: true, sku, message: response.data?.status || "Updated" };
      } catch (err: any) {
        const status = err.response?.status;
        const errMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message;
        
        // If rate limit (429 or quota exceeded), back off and retry
        if ((status === 429 || String(errMsg).toLowerCase().includes('quota')) && attempt < maxRetries) {
          attempt++;
          const waitMs = 500 * Math.pow(2, attempt); // 1000ms, 2000ms, 4000ms
          await new Promise(resolve => setTimeout(resolve, waitMs));
          continue;
        }

        return { success: false, sku, message: errMsg };
      }
    }
    return { success: false, sku, message: "Amazon SP-API istek kotası aşıldı." };
  }

  /**
   * Delete / Unpublish a listing item completely from Amazon TR catalog
   */
  async deleteListingsItem(sku: string): Promise<{ success: boolean; sku: string; message?: string }> {
    const accessToken = await this.getAccessToken();
    const sellerId = this.settings.sellerId;
    if (!sellerId) {
      throw new Error("Amazon Seller ID girilmelidir.");
    }
    const cleanSku = encodeURIComponent(sku.trim());
    const url = `${this.getApiEndpoint()}/listings/2021-08-01/items/${sellerId}/${cleanSku}?marketplaceIds=${AMAZON_TR_MARKETPLACE_ID}`;

    try {
      const response = await axios.delete(url, {
        headers: {
          "x-amz-access-token": accessToken,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });
      return { success: true, sku, message: response.data?.status || "Deleted" };
    } catch (err: any) {
      const errMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message;
      return { success: false, sku, message: errMsg };
    }
  }

  /**
   * Bulk Sync Products Stock & Price
   */
  async bulkSyncInventory(products: any[], options?: { rates?: any }): Promise<{ syncedCount: number; errorsCount: number; details: any[] }> {
    let syncedCount = 0;
    let errorsCount = 0;
    const details: any[] = [];

    let rates = options?.rates;
    if (!rates) {
      const storeRes = await pool.query("SELECT currency_rates, branding FROM stores WHERE id = $1", [this.storeId]);
      const st = storeRes.rows[0];
      rates = st?.currency_rates || st?.branding?.currency_rates || {};
    }

    for (const prod of products) {
      let mpData: any = prod.marketplace_data;
      if (typeof mpData === "string") {
        try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
      }
      mpData = mpData || {};
      const sku = prod.amazon_sku || mpData?.amazon?.sku || prod.sku || prod.barcode;
      let asin = prod.amazon_asin || mpData?.amazon?.asin;
      let rawPrice = parseFloat(prod.price || prod.sale_price || 0);
      const curr = String(prod.currency || 'TRY').toUpperCase();
      if (curr === 'USD' && rates.USD) rawPrice *= Number(rates.USD);
      else if (curr === 'EUR' && rates.EUR) rawPrice *= Number(rates.EUR);
      else if (curr === 'GBP' && rates.GBP) rawPrice *= Number(rates.GBP);

      const effectivePrice = this.calculateMarketplacePrice(rawPrice, prod.category, prod.sub_category);
      const stock = Math.max(0, parseInt(prod.stock_quantity || prod.stock || 0, 10));

      if (!sku || effectivePrice <= 0) continue;

      // Auto-resolve ASIN if missing
      if (!asin || String(asin).trim().length < 9) {
        const resolved = await this.resolveCatalogItem({ barcode: prod.barcode, title: prod.name });
        if (resolved.found && resolved.asin) {
          asin = resolved.asin;
          mpData.amazon = { ...(mpData.amazon || {}), asin: resolved.asin, productType: resolved.productType };
        }
      }

      // Add pacing delay to respect Amazon SP-API 5 req/sec quota
      await new Promise(resolve => setTimeout(resolve, 250));

      const res = await this.updateListingsItem(String(sku).trim(), effectivePrice, stock, 3, {
        asin: asin ? String(asin).trim() : undefined,
        productType: mpData?.amazon?.productType,
      });
      
      if (!mpData.amazon) mpData.amazon = {};
      if (!mpData.amazon.attributes) mpData.amazon.attributes = {};
      mpData.amazon.attributes.price = String(effectivePrice);
      mpData.amazon.lastSync = new Date().toISOString();

      if (res.success) {
        syncedCount++;
        await pool.query(
          "UPDATE products SET amazon_asin = COALESCE($1, amazon_asin), amazon_sku = COALESCE($2, amazon_sku), amazon_last_sync = NOW(), amazon_last_error = NULL, marketplace_data = $3 WHERE id = $4",
          [asin || null, String(sku).trim(), JSON.stringify(mpData), prod.id]
        );
      } else {
        errorsCount++;
        await pool.query(
          "UPDATE products SET amazon_last_error = $1, marketplace_data = $2 WHERE id = $3",
          [res.message, JSON.stringify(mpData), prod.id]
        );
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

  /**
   * Sync Amazon Orders to Local Database:
   * Creates customers, sales, sales invoices, stock movements, and amazon_orders rows.
   */
  async syncOrdersToDatabase(options?: { days?: number }): Promise<{ syncedCount: number; errors: any[] }> {
    const days = options?.days !== undefined ? options.days : 30;
    const rawOrders = await this.fetchOrders(days);
    let syncedCount = 0;
    const errors: any[] = [];

    for (const order of rawOrders) {
      const amazonOrderId = String(order.AmazonOrderId || '').trim();
      if (!amazonOrderId) continue;

      const orderStatus = String(order.OrderStatus || '').trim();
      const totalAmountFloat = parseFloat(order.OrderTotal?.Amount || '0') || 0;
      const isCanceled = orderStatus === 'Canceled' || orderStatus === 'Cancelled' || orderStatus === 'Unfulfillable';

      // Zero-amount or cancelled orders
      if (totalAmountFloat <= 0 || isCanceled) {
        try {
          const existing = await pool.query(
            "SELECT id, sale_id, sales_invoice_id, status FROM amazon_orders WHERE store_id = $1 AND amazon_order_id = $2",
            [this.storeId, amazonOrderId]
          );
          if (existing.rows.length === 0) {
            await pool.query(
              "INSERT INTO amazon_orders (store_id, amazon_order_id, sale_id, sales_invoice_id, status, order_data) VALUES ($1, $2, NULL, NULL, $3, $4)",
              [this.storeId, amazonOrderId, orderStatus || 'Canceled', order]
            );
          } else {
            const exRow = existing.rows[0];
            const prevStatus = String(exRow.status || '').trim();
            const wasAlreadyCanceled = prevStatus === 'Canceled' || prevStatus === 'Cancelled' || prevStatus === 'Unfulfillable';
            if (wasAlreadyCanceled) {
              continue;
            }
            await pool.query(
              "UPDATE amazon_orders SET status = $1, order_data = $2 WHERE store_id = $3 AND amazon_order_id = $4",
              [orderStatus || 'Canceled', order, this.storeId, amazonOrderId]
            );
            if (isCanceled && !wasAlreadyCanceled && (exRow.sale_id || exRow.sales_invoice_id)) {
              if (exRow.sales_invoice_id) {
                await pool.query("UPDATE sales_invoices SET status = 'cancelled' WHERE id = $1 AND store_id = $2", [exRow.sales_invoice_id, this.storeId]);
              }
              if (exRow.sale_id) {
                const saleCheck = await pool.query("SELECT status FROM sales WHERE id = $1 AND store_id = $2", [exRow.sale_id, this.storeId]);
                const wasSaleCancelled = ['cancelled', 'iptal', 'canceled'].includes(String(saleCheck.rows[0]?.status || '').toLowerCase().trim());
                await pool.query("UPDATE sales SET status = 'cancelled', cancellation_reason = COALESCE(cancellation_reason, 'Amazon Siparişi İptal Edildi') WHERE id = $1 AND store_id = $2", [exRow.sale_id, this.storeId]);
                if (!wasSaleCancelled) {
                  const items = await pool.query("SELECT product_id, quantity, unit_price FROM sale_items WHERE sale_id = $1", [exRow.sale_id]);
                  for (const it of items.rows) {
                    if (it.product_id && it.quantity > 0) {
                      await pool.query("UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3", [it.quantity, it.product_id, this.storeId]);
                    }
                  }
                  await pool.query(
                    "DELETE FROM stock_movements WHERE store_id = $1 AND (sale_id = $2 OR (invoice_id IS NOT NULL AND invoice_id = $3) OR invoice_number = $4)",
                    [this.storeId, exRow.sale_id, exRow.sales_invoice_id || -1, `AMZ-${amazonOrderId}`]
                  );
                }
              }
            } else if (isCanceled && (exRow.sale_id || exRow.sales_invoice_id)) {
              if (exRow.sales_invoice_id) {
                await pool.query("UPDATE sales_invoices SET status = 'cancelled' WHERE id = $1 AND store_id = $2 AND COALESCE(status, '') != 'cancelled'", [exRow.sales_invoice_id, this.storeId]);
              }
              if (exRow.sale_id) {
                await pool.query("UPDATE sales SET status = 'cancelled', cancellation_reason = COALESCE(cancellation_reason, 'Amazon Siparişi İptal Edildi') WHERE id = $1 AND store_id = $2 AND COALESCE(status, '') != 'cancelled'", [exRow.sale_id, this.storeId]);
              }
              await pool.query(
                "DELETE FROM stock_movements WHERE store_id = $1 AND (sale_id = $2 OR (invoice_id IS NOT NULL AND invoice_id = $3) OR invoice_number = $4)",
                [this.storeId, exRow.sale_id || -1, exRow.sales_invoice_id || -1, `AMZ-${amazonOrderId}`]
              );
            }
          }
        } catch (e: any) {
          console.warn("[Amazon Sync] Cancelled order record error:", e.message);
        }
        continue;
      }

      // Check if already synced with sale_id
      const existing = await pool.query(
        "SELECT id, sale_id, sales_invoice_id FROM amazon_orders WHERE store_id = $1 AND amazon_order_id = $2",
        [this.storeId, amazonOrderId]
      );
      if (existing.rows.length > 0 && existing.rows[0].sale_id) {
        const exRow = existing.rows[0];
        let buyerInfo = order.BuyerInfo || {};
        let shippingAddress = order.ShippingAddress || {};

        try {
          const fetchedAddress = await this.fetchOrderAddress(amazonOrderId);
          if (fetchedAddress) shippingAddress = { ...shippingAddress, ...fetchedAddress };
        } catch (e) {}

        try {
          const fetchedBuyer = await this.fetchOrderBuyerInfo(amazonOrderId);
          if (fetchedBuyer) buyerInfo = { ...buyerInfo, ...fetchedBuyer };
        } catch (e) {}

        const enrichedOrder = {
          ...order,
          ShippingAddress: Object.keys(shippingAddress).length > 0 ? shippingAddress : order.ShippingAddress,
          BuyerInfo: Object.keys(buyerInfo).length > 0 ? buyerInfo : order.BuyerInfo
        };

        await pool.query(
          "UPDATE amazon_orders SET status = $1, order_data = $2 WHERE store_id = $3 AND amazon_order_id = $4",
          [orderStatus, enrichedOrder, this.storeId, amazonOrderId]
        );

        // If Amazon now provides unmasked name, street or district/city, update customer & invoice if currently generic
        const district = (shippingAddress.Municipality || shippingAddress.District || '').trim();
        const neighborhood = (shippingAddress.County || '').trim();
        const city = (shippingAddress.City || shippingAddress.StateOrRegion || '').trim();
        const postalCode = (shippingAddress.PostalCode || '').trim();
        const street = [shippingAddress.AddressLine1, shippingAddress.AddressLine2, shippingAddress.AddressLine3]
          .map(s => String(s || '').trim())
          .filter(s => s && s.toLowerCase() !== 'null')
          .join(' ');
        const addressParts = [
          street || null,
          neighborhood && neighborhood.toLowerCase() !== district.toLowerCase() ? neighborhood : null,
          district ? `${district}${city ? ` / ${city.toUpperCase()}` : ''}` : (city ? city.toUpperCase() : null),
          postalCode ? `(PK: ${postalCode})` : null
        ].filter(Boolean);
        const resolvedAddr = addressParts.join(' ');

        const realApiName = (
          buyerInfo.BuyerTaxInfo?.CompanyLegalName ||
          shippingAddress.Name ||
          buyerInfo.BuyerName ||
          ''
        ).trim();

        const taxClassifications = Array.isArray(buyerInfo.BuyerTaxInfo?.TaxClassifications)
          ? buyerInfo.BuyerTaxInfo.TaxClassifications
          : [];
        const extractedTaxNum = (
          taxClassifications[0]?.Value ||
          buyerInfo.TaxIdentificationNumber ||
          shippingAddress.TaxIdentificationNumber ||
          ''
        ).trim();
        const extractedTaxOffice = (
          taxClassifications[1]?.Value ||
          buyerInfo.BuyerTaxInfo?.TaxingRegion ||
          ''
        ).trim();

        if (exRow.sales_invoice_id) {
          const fakeNames = [
            'Ahmet Yıldırım', 'Mehmet Öztürk', 'Mustafa Demir', 'Ali Çelik', 'Emre Kaya',
            'Canan Aydın', 'Burak Şahin', 'Selin Koç', 'Deniz Arslan', 'Onur Doğan',
            'Serkan Çakır', 'Gökhan Karabulut', 'Cemre Demir', 'Murat Yılmaz', 'Tolga Özdemir'
          ];
          const isBusinessPref = order.BuyerInvoicePreference === 'BUSINESS' || order.IsBusinessOrder === true;
          const fallbackLabel = realApiName || (
            isBusinessPref
              ? `Amazon Kurumsal Alıcı (${district || city || 'TR'} #${amazonOrderId})`
              : `Amazon Alıcısı (${district || city || 'TR'} #${amazonOrderId})`
          );

          await pool.query(
            `UPDATE sales_invoices SET
               address = CASE WHEN (address IS NULL OR address = '' OR address = 'Amazon Türkiye Teslimat Adresi' OR $1 != '') THEN COALESCE(NULLIF($1, ''), address) ELSE address END,
               customer_name = CASE WHEN ($2 != '' OR customer_name = ANY($5)) THEN $3 ELSE customer_name END,
               company_title = CASE WHEN ($2 != '' OR company_title = ANY($5)) THEN $3 ELSE company_title END,
               tax_number = CASE WHEN $4 != '' THEN $4 ELSE tax_number END,
               tax_office = CASE WHEN $6 != '' THEN $6 ELSE tax_office END
             WHERE id = $7 AND store_id = $8`,
            [resolvedAddr, realApiName, fallbackLabel, extractedTaxNum, fakeNames, extractedTaxOffice, exRow.sales_invoice_id, this.storeId]
          );

          await pool.query(
            `UPDATE customers SET
               address = CASE WHEN (address IS NULL OR address = '' OR address = 'Amazon Türkiye Teslimat Adresi' OR $1 != '') THEN COALESCE(NULLIF($1, ''), address) ELSE address END,
               city = COALESCE(NULLIF($2, ''), city),
               full_name = CASE WHEN ($3 != '' OR full_name = ANY($5)) THEN $4 ELSE full_name END,
               tax_number = CASE WHEN $6 != '' THEN $6 ELSE tax_number END,
               tax_office = CASE WHEN $7 != '' THEN $7 ELSE tax_office END
             WHERE id = (SELECT customer_id FROM sales_invoices WHERE id = $8) AND store_id = $9`,
            [resolvedAddr, city, realApiName, fallbackLabel, fakeNames, extractedTaxNum, extractedTaxOffice, exRow.sales_invoice_id, this.storeId]
          );
        }
        continue;
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Customer Details Resolution from Amazon SP-API
        let buyerInfo = order.BuyerInfo || {};
        let shippingAddress = order.ShippingAddress || {};

        try {
          const fetchedAddress = await this.fetchOrderAddress(amazonOrderId);
          if (fetchedAddress) shippingAddress = { ...shippingAddress, ...fetchedAddress };
        } catch (e) {}

        try {
          const fetchedBuyer = await this.fetchOrderBuyerInfo(amazonOrderId);
          if (fetchedBuyer) buyerInfo = { ...buyerInfo, ...fetchedBuyer };
        } catch (e) {}

        const taxClassifications = Array.isArray(buyerInfo.BuyerTaxInfo?.TaxClassifications)
          ? buyerInfo.BuyerTaxInfo.TaxClassifications
          : [];
        const buyerTaxNumber = (
          taxClassifications[0]?.Value ||
          buyerInfo.TaxIdentificationNumber ||
          shippingAddress.TaxIdentificationNumber ||
          '11111111111'
        ).trim();
        const buyerTaxOffice = (
          taxClassifications[1]?.Value ||
          (buyerInfo.BuyerTaxInfo?.TaxingRegion !== 'TR' ? buyerInfo.BuyerTaxInfo?.TaxingRegion : '') ||
          ''
        ).trim();

        let buyerName = (
          buyerInfo.BuyerTaxInfo?.CompanyLegalName ||
          shippingAddress.Name ||
          buyerInfo.BuyerName ||
          ''
        ).trim();
        let buyerPhone = (shippingAddress.Phone || '').trim();
        let district = (shippingAddress.Municipality || shippingAddress.District || '').trim();
        let neighborhood = (shippingAddress.County || '').trim();
        let city = (shippingAddress.City || shippingAddress.StateOrRegion || '').trim();
        let postalCode = (shippingAddress.PostalCode || '').trim();
        let street = [shippingAddress.AddressLine1, shippingAddress.AddressLine2, shippingAddress.AddressLine3]
          .map(s => String(s || '').trim())
          .filter(s => s && s.toLowerCase() !== 'null')
          .join(' ');

        const isBusinessOrder = order.BuyerInvoicePreference === 'BUSINESS' || order.IsBusinessOrder === true || (buyerTaxNumber.length === 10 && buyerTaxNumber !== '11111111111');

        // Honest, transparent label when Amazon SP-API masks PII (never invent fake customer names!)
        if (!buyerName || buyerName.toLowerCase() === 'null') {
          const locTag = [district, city].filter(Boolean).join('/');
          buyerName = isBusinessOrder
            ? `Amazon Kurumsal Alıcı (${locTag ? `${locTag} - ` : ''}#${amazonOrderId})`
            : `Amazon Alıcısı (${locTag ? `${locTag} - ` : ''}#${amazonOrderId})`;
        }
        const buyerEmail = buyerInfo.BuyerEmail || `amazon_${amazonOrderId.replace(/[^a-zA-Z0-9]/g, '_')}@amazon.com.tr`;

        const addressParts = [
          street || null,
          neighborhood && neighborhood.toLowerCase() !== district.toLowerCase() ? neighborhood : null,
          district ? `${district}${city ? ` / ${city.toUpperCase()}` : ''}` : (city ? city.toUpperCase() : null),
          postalCode ? `(PK: ${postalCode})` : null
        ].filter(Boolean);
        const fullAddress = addressParts.join(' ') || 'Amazon Türkiye Teslimat Adresi';

        const rawBuyerName = buyerName.trim();
        const nameParts = rawBuyerName.split(' ');
        const surname = nameParts.length > 1 ? nameParts.pop()! : '';
        const firstName = nameParts.join(' ') || rawBuyerName;

        // Upsert customer
        const custRes = await client.query(
          "SELECT id FROM customers WHERE store_id = $1 AND email = $2",
          [this.storeId, buyerEmail]
        );
        let customerId: number | null = null;
        if (custRes.rows.length > 0) {
          customerId = custRes.rows[0].id;
          await client.query(
            `UPDATE customers SET 
               full_name = COALESCE(NULLIF($1, ''), full_name),
               name = COALESCE(NULLIF($2, ''), name),
               surname = COALESCE(NULLIF($3, ''), surname),
               phone = COALESCE(NULLIF($4, ''), phone),
               address = COALESCE(NULLIF($5, ''), address),
               city = COALESCE(NULLIF($6, ''), city),
               is_corporate = $7,
               tax_number = COALESCE(NULLIF($8, ''), tax_number),
               tax_office = COALESCE(NULLIF($9, ''), tax_office)
             WHERE id = $10`,
            [rawBuyerName, firstName, surname, buyerPhone, fullAddress, city, isBusinessOrder, buyerTaxNumber, buyerTaxOffice, customerId]
          );
        } else {
          const newCust = await client.query(
            `INSERT INTO customers 
               (store_id, email, password, full_name, name, surname, phone, address, city, is_corporate, tax_number, tax_office)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (store_id, email) DO UPDATE SET
               full_name = EXCLUDED.full_name,
               phone = COALESCE(NULLIF(EXCLUDED.phone, ''), customers.phone),
               address = COALESCE(NULLIF(EXCLUDED.address, ''), customers.address),
               city = COALESCE(NULLIF(EXCLUDED.city, ''), customers.city),
               tax_number = COALESCE(NULLIF(EXCLUDED.tax_number, ''), customers.tax_number),
               tax_office = COALESCE(NULLIF(EXCLUDED.tax_office, ''), customers.tax_office)
             RETURNING id`,
            [this.storeId, buyerEmail, 'marketplace_user', rawBuyerName, firstName, surname, buyerPhone, fullAddress, city, isBusinessOrder, buyerTaxNumber, buyerTaxOffice]
          );
          customerId = newCust.rows[0]?.id || null;
        }

        // Fetch Order Items
        const rawItems = await this.fetchOrderItems(amazonOrderId);
        const orderTotal = totalAmountFloat > 0 ? totalAmountFloat : (
          rawItems.reduce((acc: number, item: any) => acc + (parseFloat(item.ItemPrice?.Amount || '0') || 0), 0)
        );

        const taxAmount = Number((orderTotal * (20 / 120)).toFixed(2));
        const subtotal = Number((orderTotal - taxAmount).toFixed(2));
        const grandTotal = orderTotal;

        const orderNotes = [
          `Amazon.com.tr Siparişi #${amazonOrderId}`,
          `Fatura Tercihi: ${isBusinessOrder ? 'KURUMSAL (BUSINESS)' : 'BİREYSEL (INDIVIDUAL)'}`,
          `Teslimat Bölgesi: ${fullAddress}`
        ].filter(Boolean).join(' | ');

        // Create Sale
        const saleRes = await client.query(
          `INSERT INTO sales 
            (store_id, total_amount, currency, status, customer_name, customer_id, customer_phone, customer_address, payment_method, source, notes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
          [
            this.storeId,
            grandTotal,
            order.OrderTotal?.CurrencyCode || "TRY",
            "completed",
            rawBuyerName,
            customerId,
            buyerPhone,
            fullAddress,
            "Amazon / Kredi Kartı",
            "amazon",
            orderNotes,
          ]
        );
        const saleId = saleRes.rows[0].id;

        // Create Sales Invoice (e-Arşiv / e-Fatura)
        const invoiceNumber = `AMZ-${amazonOrderId}`;
        const invoiceDate = order.PurchaseDate ? new Date(order.PurchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

        const invRes = await client.query(
          `INSERT INTO sales_invoices 
            (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, invoice_type, status, payment_method, address, notes, document_number, e_document_type, customer_email, customer_name, company_title, tax_number, tax_office, invoice_profile, is_tax_inclusive) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, true) RETURNING id`,
          [
            this.storeId,
            saleId,
            customerId,
            invoiceNumber,
            invoiceDate,
            subtotal,
            taxAmount,
            grandTotal,
            "TRY",
            "SATIS",
            "approved",
            "Amazon",
            fullAddress,
            orderNotes,
            null,
            "E-ARSIV",
            buyerEmail,
            rawBuyerName,
            rawBuyerName,
            buyerTaxNumber,
            buyerTaxOffice,
            "EARSIVFATURA"
          ]
        );
        const invoiceId = invRes.rows[0].id;

        // Process Items & Stock Movements
        for (const item of rawItems) {
          const asin = String(item.ASIN || '').trim();
          const sku = String(item.SellerSKU || '').trim();
          const title = String(item.Title || 'Amazon Ürünü').trim();
          const quantity = parseInt(item.QuantityOrdered || item.QuantityShipped || '1', 10) || 1;
          const itemGrossTotal = parseFloat(item.ItemPrice?.Amount || '0') || (grandTotal / Math.max(1, rawItems.length));
          const unitPriceGross = Number((itemGrossTotal / quantity).toFixed(2));
          const itemSubtotal = Number((itemGrossTotal / 1.20).toFixed(2));
          const itemTax = Number((itemGrossTotal - itemSubtotal).toFixed(2));

          // Match product in store database
          const prodRes = await client.query(
            `SELECT id, name, barcode, sku, stock_quantity 
             FROM products 
             WHERE store_id = $1 AND (
               amazon_asin = $2 
               OR amazon_sku = $3 
               OR sku = $3 
               OR barcode = $3 
               OR (barcode = '4016032456063' AND $2 = 'B07QJ32SJR')
               OR (barcode = '745883788651' AND $2 = 'B084N16WSN')
               OR (barcode = '5013719020042' AND $2 = 'B01FTWOTJ6')
               OR (barcode = '8683143204096' AND $2 = 'B09VPNHR2R')
               OR (barcode = '6974202726713' AND $2 = 'B0D4VQSCTN')
             )
             ORDER BY (amazon_asin = $2) DESC LIMIT 1`,
            [this.storeId, asin, sku]
          );

          const matchedProd = prodRes.rows[0];
          const productId = matchedProd?.id || null;
          const barcode = matchedProd?.barcode || sku || asin || '';
          const prodName = matchedProd?.name || title;

          // Insert into sale_items (unit_price = gross, total_price = gross)
          await client.query(
            `INSERT INTO sale_items 
              (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency, tax_rate, tax_amount) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [saleId, productId, prodName, barcode, quantity, unitPriceGross, itemGrossTotal, "TRY", 20, itemTax]
          );

          // Insert into sales_invoice_items (total_price = net subtotal so total_price + tax_amount = gross!)
          await client.query(
            `INSERT INTO sales_invoice_items 
              (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [invoiceId, productId, prodName, barcode, quantity, unitPriceGross, 20, itemTax, itemSubtotal]
          );

          // Stock Movement & Inventory Deduction
          if (productId) {
            await client.query(
              `INSERT INTO stock_movements 
                (store_id, product_id, type, quantity, description, source, unit_price, customer_info, currency, sale_id, invoice_id, invoice_type, invoice_number) 
               VALUES ($1, $2, 'out', $3, $4, 'AMAZON', $5, $6, 'TRY', $7, $8, 'SATIS', $9)`,
              [
                this.storeId,
                productId,
                quantity,
                `Amazon Satışı (Sipariş #${amazonOrderId})`,
                unitPriceGross,
                rawBuyerName,
                saleId,
                invoiceId,
                invoiceNumber
              ]
            );

            // Deduct real inventory stock
            await client.query(
              "UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2 AND store_id = $3",
              [quantity, productId, this.storeId]
            );
          }
        }

        const enrichedOrder = {
          ...order,
          ShippingAddress: Object.keys(shippingAddress).length > 0 ? shippingAddress : order.ShippingAddress,
          BuyerInfo: Object.keys(buyerInfo).length > 0 ? buyerInfo : order.BuyerInfo
        };

        // Record in amazon_orders table
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO amazon_orders 
              (store_id, amazon_order_id, sale_id, sales_invoice_id, status, order_data) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [this.storeId, amazonOrderId, saleId, invoiceId, orderStatus || 'Shipped', enrichedOrder]
          );
        } else {
          await client.query(
            `UPDATE amazon_orders 
             SET sale_id = $1, sales_invoice_id = $2, status = $3, order_data = $4 
             WHERE store_id = $5 AND amazon_order_id = $6`,
            [saleId, invoiceId, orderStatus || 'Shipped', enrichedOrder, this.storeId, amazonOrderId]
          );
        }

        await client.query("COMMIT");
        syncedCount++;
        console.log(`[Amazon Sync] #${amazonOrderId} siparişi (${rawBuyerName} - ${grandTotal} TRY) başarıyla sisteme işlendi.`);
      } catch (err: any) {
        await client.query("ROLLBACK");
        console.error(`[Amazon Sync Error] Sipariş #${amazonOrderId} işlenirken hata:`, err.message || err);
        errors.push({ orderId: amazonOrderId, error: err.message });
      } finally {
        client.release();
      }
    }

    return { syncedCount, errors };
  }
}

