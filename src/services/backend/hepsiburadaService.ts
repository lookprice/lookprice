import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
import { pool, logAction } from "../../../models/db";
import { IntegrationService } from "../IntegrationService";
import { processMarketplaceOrderLines, computeSellableStock } from "../marketplaceSync";
import { syncMarketplaceOrderTreasury } from "../../../routes/store/treasurySync";
import { buildHepsiburadaProductUrl } from "../../utils/marketplaceUrls";

export interface HepsiburadaConfig {
  merchantId: string;
  apiKey: string;
  apiSecret: string;
  merchantName?: string;
  storeName?: string;
  isTestMode?: boolean;
  userAgent?: string;
  authUsername?: string;
  authUserAgent?: string;
  listingAuthUsername?: string;
  listingAuthUserAgent?: string;
  defaultDispatchTime?: number;
  defaultCargoCompany?: string;
  autoSyncOrders?: boolean;
  autoStockSync?: boolean;
  webhookSecret?: string;
  last_sync?: string | null;
}

export interface HepsiburadaAuthCandidate {
  username: string;
  userAgent: string;
}

export interface HepsiburadaInventoryItem {
  HepsiburadaSku?: string;
  MerchantSku: string;
  Price: number;
  AvailableStock: number;
  DispatchTime?: number;
  MaximumPurchasableQuantity?: number;
}

export interface HepsiburadaProductPayload {
  barcode: string;
  productName: string;
  categoryId: number | string;
  brand: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  attributes?: Record<string, any>;
  dispatchTime?: number;
}

export class HepsiburadaService {
  private config: HepsiburadaConfig;
  private storeId: number;
  private workingAuth: HepsiburadaAuthCandidate | null = null;
  private workingListingAuth: HepsiburadaAuthCandidate | null = null;
  private persistedWorkingAuth = false;

  constructor(config: HepsiburadaConfig, storeId: number) {
    const rawUa = String(config?.userAgent || "").trim();
    const cleanUa = /lookprice marketplace manager/i.test(rawUa) ? "" : rawUa;
    const rawAuthUa = String(config?.authUserAgent || "").trim();
    const cleanAuthUa = /lookprice marketplace manager/i.test(rawAuthUa) ? "" : rawAuthUa;
    const rawListUa = String(config?.listingAuthUserAgent || "").trim();
    const cleanListUa = /lookprice marketplace manager/i.test(rawListUa) ? "" : rawListUa;

    this.config = {
      ...config,
      merchantId: String(config?.merchantId || "").trim(),
      apiKey: String(config?.apiKey || "lookprice_dev").trim() || "lookprice_dev",
      apiSecret: String(config?.apiSecret || "").trim(),
      userAgent: cleanUa || undefined,
      authUserAgent: cleanAuthUa || undefined,
      listingAuthUserAgent: cleanListUa || undefined,
      isTestMode: !!config?.isTestMode,
      defaultDispatchTime: Math.max(1, Math.floor(Number(config?.defaultDispatchTime) || 1)),
    };
    this.storeId = storeId;

    if (this.config.authUsername && this.config.authUserAgent) {
      this.workingAuth = {
        username: String(this.config.authUsername).trim(),
        userAgent: this.config.authUserAgent,
      };
    }
    if (this.config.listingAuthUsername && this.config.listingAuthUserAgent) {
      this.workingListingAuth = {
        username: String(this.config.listingAuthUsername).trim(),
        userAgent: this.config.listingAuthUserAgent,
      };
    }
  }

  // Determine Base URLs depending on Test (SIT) vs Production mode
  private get omsBaseUrl(): string {
    return this.config.isTestMode
      ? "https://oms-external-sit.hepsiburada.com"
      : "https://oms-external.hepsiburada.com";
  }

  private get listingBaseUrl(): string {
    return this.config.isTestMode
      ? "https://listing-external-v2-gw-sit.hepsiburada.com"
      : "https://listing-external.hepsiburada.com";
  }

  private get listingDirectUrl(): string {
    return this.config.isTestMode
      ? "https://listing-external-sit.hepsiburada.com"
      : "https://listing-external.hepsiburada.com";
  }

  private get catalogBaseUrl(): string {
    return this.config.isTestMode
      ? "https://mpop-sit.hepsiburada.com/product/api"
      : "https://mpop.hepsiburada.com/product/api";
  }

  private get productBaseUrl(): string {
    return this.config.isTestMode
      ? "https://product-external-sit.hepsiburada.com"
      : "https://product-external.hepsiburada.com";
  }

  // Build prioritized, deduplicated list of Hepsiburada Basic Auth + User-Agent candidates
  public getAuthCandidates(preferred?: Partial<HepsiburadaAuthCandidate> | null): HepsiburadaAuthCandidate[] {
    const apiKey = (this.config.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const merchantId = (this.config.merchantId || "").trim();
    const customUa = (this.config.userAgent || "").trim();

    const list: HepsiburadaAuthCandidate[] = [];
    const seen = new Set<string>();
    const add = (username?: string, userAgent?: string) => {
      const u = String(username || "").trim();
      const ua = String(userAgent || "").trim();
      if (!u || !ua) return;
      const key = `${u}::${ua}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ username: u, userAgent: ua });
      }
    };

    if (preferred?.username && preferred?.userAgent) {
      add(preferred.username, preferred.userAgent);
    }
    if (this.workingListingAuth) {
      add(this.workingListingAuth.username, this.workingListingAuth.userAgent);
    }
    if (this.workingAuth) {
      add(this.workingAuth.username, this.workingAuth.userAgent);
    }
    if (customUa) {
      add(merchantId, customUa);
      add(apiKey, customUa);
    }

    // Standard Hepsiburada Integrator & Merchant auth formats
    add(merchantId, apiKey);
    add(apiKey, apiKey);
    if (merchantId) {
      add(merchantId, `${apiKey} - ${merchantId}`);
      add(apiKey, `${apiKey} - ${merchantId}`);
      add(merchantId, `${merchantId} - ${apiKey}`);
      add(apiKey, `${merchantId} - ${apiKey}`);
    }

    if (apiKey !== "lookprice_dev") {
      add(merchantId, "lookprice_dev");
      add("lookprice_dev", "lookprice_dev");
      if (merchantId) {
        add(merchantId, `lookprice_dev - ${merchantId}`);
        add("lookprice_dev", `lookprice_dev - ${merchantId}`);
        add(merchantId, `${merchantId} - lookprice_dev`);
      }
    }

    return list;
  }

  private isAuthError(err: any): boolean {
    const status = Number(err?.response?.status);
    return status === 401 || status === 403;
  }

  private async persistWorkingAuth(cand: HepsiburadaAuthCandidate, channel: "oms" | "listing" = "oms"): Promise<void> {
    if (channel === "listing") {
      this.workingListingAuth = cand;
      this.config.listingAuthUsername = cand.username;
      this.config.listingAuthUserAgent = cand.userAgent;
    } else {
      this.workingAuth = cand;
      this.config.authUsername = cand.username;
      this.config.authUserAgent = cand.userAgent;
      this.config.userAgent = cand.userAgent;
    }

    if (!this.storeId || this.storeId <= 0) return;

    try {
      const storeRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [this.storeId]);
      if (storeRes.rows.length === 0) return;

      let prev = storeRes.rows[0]?.hepsiburada_settings || {};
      if (typeof prev === "string") {
        try { prev = JSON.parse(prev); } catch { prev = {}; }
      }
      let br = storeRes.rows[0]?.branding || {};
      if (typeof br === "string") {
        try { br = JSON.parse(br); } catch { br = {}; }
      }

      // Only persist if stored credentials match current config (prevent overwriting during unsaved test probes)
      const storedMerchantId = String(prev?.merchantId || br?.hepsiburada_settings?.merchantId || "").trim();
      const storedSecret = String(prev?.apiSecret || br?.hepsiburada_settings?.apiSecret || "").trim();
      if (storedMerchantId && storedSecret && (storedMerchantId !== this.config.merchantId || storedSecret !== this.config.apiSecret)) {
        return;
      }

      const patch: Record<string, any> =
        channel === "listing"
          ? {
              listingAuthUsername: cand.username,
              listingAuthUserAgent: cand.userAgent,
              ...(prev.authUsername ? {} : { authUsername: cand.username, authUserAgent: cand.userAgent, userAgent: cand.userAgent }),
            }
          : {
              authUsername: cand.username,
              authUserAgent: cand.userAgent,
              userAgent: cand.userAgent,
            };

      const updatedHb = { ...(br.hepsiburada_settings || {}), ...prev, ...patch };
      br.hepsiburada_settings = updatedHb;

      await pool.query("UPDATE stores SET hepsiburada_settings = $1, branding = $2 WHERE id = $3", [
        updatedHb,
        br,
        this.storeId,
      ]);
      this.persistedWorkingAuth = true;
    } catch {
      // Non-blocking persistence (e.g. during unit tests without DB)
    }
  }

  private async withAuthRetry<T>(
    operation: (headers: Record<string, string>, cand: HepsiburadaAuthCandidate) => Promise<T>,
    options?: { preferred?: Partial<HepsiburadaAuthCandidate> | null; channel?: "oms" | "listing" }
  ): Promise<T> {
    const channel = options?.channel || "oms";
    const candidates = this.getAuthCandidates(
      options?.preferred || (channel === "listing" ? this.workingListingAuth : this.workingAuth)
    );

    let lastAuthError: any = null;
    for (const cand of candidates) {
      const headers = this.getHeaders(cand.username, cand.userAgent);
      try {
        const result = await operation(headers, cand);
        const alreadyKnown =
          channel === "listing"
            ? this.workingListingAuth?.username === cand.username && this.workingListingAuth?.userAgent === cand.userAgent
            : this.workingAuth?.username === cand.username && this.workingAuth?.userAgent === cand.userAgent;
        if (!alreadyKnown || !this.persistedWorkingAuth) {
          this.persistWorkingAuth(cand, channel).catch(() => {});
        }
        return result;
      } catch (err: any) {
        if (this.isAuthError(err)) {
          lastAuthError = err;
          continue;
        }
        throw err;
      }
    }

    throw lastAuthError || new Error("Hepsiburada API kimlik doğrulaması reddedildi (401/403).");
  }

  // Generate Base64 Auth header and mandatory User-Agent
  private getHeaders(customUsername?: string, customUserAgent?: string): Record<string, string> {
    const apiKey = (this.config.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const apiSecret = (this.config.apiSecret || "").trim();
    const merchantId = (this.config.merchantId || "").trim();

    const username = (
      customUsername ||
      this.workingAuth?.username ||
      this.config.authUsername ||
      merchantId ||
      apiKey ||
      "lookprice_dev"
    ).trim();
    const rawCredentials = `${username}:${apiSecret}`;
    const base64Auth = Buffer.from(rawCredentials).toString("base64");
    const userAgent = (
      customUserAgent ||
      this.workingAuth?.userAgent ||
      this.config.authUserAgent ||
      this.config.userAgent ||
      apiKey ||
      "lookprice_dev"
    ).trim();

    return {
      Authorization: `Basic ${base64Auth}`,
      "User-Agent": userAgent,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * 1. Test Connection:
   * Verifies credentials against both OMS and Listing endpoints with multiple candidate combinations
   */
  async testConnection(): Promise<{ success: boolean; message: string; error?: string; details?: any }> {
    const apiKey = (this.config.apiKey || "lookprice_dev").trim() || "lookprice_dev";
    const apiSecret = (this.config.apiSecret || "").trim();
    const merchantId = (this.config.merchantId || "").trim();

    if (!merchantId || !apiSecret) {
      return {
        success: false,
        message: "Hepsiburada API bilgileri eksik (Merchant ID veya API Secret şifresi girilmemiş).",
        error: "Merchant ID veya API Secret şifresi eksik."
      };
    }

    const candidates = this.getAuthCandidates();

    let workingCandidate: HepsiburadaAuthCandidate | null = null;
    let workingListingCandidate: HepsiburadaAuthCandidate | null = null;
    let omsOk = false;
    let listingOk = false;
    let omsError = "";
    let listingError = "";

    // Test candidates against OMS
    for (const cand of candidates) {
      const headers = this.getHeaders(cand.username, cand.userAgent);
      try {
        const res = await axios.get(
          `${this.omsBaseUrl}/orders/merchantid/${merchantId}?limit=1`,
          { headers, timeout: 8000 }
        );
        if (res.status === 200 && res.data && typeof res.data === 'object' && !String(res.data).includes('<!DOCTYPE')) {
          omsOk = true;
          workingCandidate = cand;
          omsError = "";
          break;
        }
      } catch (e: any) {
        if (this.isAuthError(e)) {
          omsError = "Hepsiburada OMS Yetkilendirme Hatası (401/403): Merchant ID veya Servis Anahtarı Hepsiburada tarafından onaylanmamış veya geçersiz.";
        } else {
          omsError = e.response?.data?.message || e.response?.data?.error || e.message || "OMS API Bağlantı hatası";
        }
      }
    }

    if (!workingCandidate) {
      // Test candidates against legacy merchant API
      for (const cand of candidates) {
        try {
          const legacyRes = await axios.get(
            `https://merchant.hepsiburada.com/api/orders/merchantid/${merchantId}`,
            {
              auth: { username: cand.username, password: apiSecret },
              headers: { "User-Agent": cand.userAgent },
              timeout: 8000,
            }
          );
          if (legacyRes.status === 200 && typeof legacyRes.data === 'object' && !String(legacyRes.data).includes('<!DOCTYPE') && legacyRes.data?.orders) {
            omsOk = true;
            workingCandidate = cand;
            omsError = "";
            break;
          }
        } catch (err2: any) {}
      }
    }

    if (workingCandidate) {
      this.workingAuth = workingCandidate;
      this.config.authUsername = workingCandidate.username;
      this.config.authUserAgent = workingCandidate.userAgent;
      this.config.userAgent = workingCandidate.userAgent;
      await this.persistWorkingAuth(workingCandidate, "oms");
    }

    // Test Listing endpoint across candidates (prioritizing workingCandidate if OMS succeeded)
    const listingCandidates = this.getAuthCandidates(workingCandidate);
    for (const cand of listingCandidates) {
      const testHeaders = this.getHeaders(cand.username, cand.userAgent);
      try {
        const res = await axios.get(
          `${this.listingDirectUrl}/listings/merchantid/${merchantId}?limit=1`,
          { headers: testHeaders, timeout: 8000 }
        );
        if (res.status === 200) {
          listingOk = true;
          workingListingCandidate = cand;
          listingError = "";
          break;
        }
      } catch (e: any) {
        if (this.isAuthError(e)) {
          listingError = "Hepsiburada Listing API yetkilendirme hatası (401/403): Entegratör yetkisi veya Servis Anahtarı geçersiz.";
          continue;
        }
        if (e.response?.status === 404 || e.response?.status === 400) {
          listingOk = true;
          workingListingCandidate = cand;
          listingError = "";
          break;
        }
        listingError = e.response?.data?.message || e.message || "Listing API bağlantı hatası";
      }
    }

    if (workingListingCandidate) {
      await this.persistWorkingAuth(workingListingCandidate, "listing");
    }

    const omsAuthFailed = !omsOk && (omsError.includes("401") || omsError.includes("403"));
    const listingAuthFailed = !listingOk && (listingError.includes("401") || listingError.includes("403"));
    const success = (omsOk || listingOk) && !omsAuthFailed && !listingAuthFailed;

    let errMsg = "";
    if (!success) {
      if (omsOk && listingAuthFailed) {
        errMsg = `Sipariş API bağlandı ancak İlan/Listing API yetkisi reddedildi (401/403). Entegratör (${apiKey}) yetkilerinizi kontrol edin.`;
      } else if (listingOk && omsAuthFailed) {
        errMsg = `İlan API bağlandı ancak Sipariş (OMS) API yetkisi reddedildi (401/403).`;
      } else {
        errMsg = omsError || listingError || "Hepsiburada API sunucusu istek yetkisini reddetti.";
      }
    }

    return {
      success,
      message: success
        ? "Hepsiburada API bağlantısı başarılı."
        : `Bağlantı başarısız: ${errMsg}`,
      error: success ? undefined : errMsg,
      details: {
        omsOk,
        listingOk,
        workingCandidate,
        workingListingCandidate,
        isTestMode: this.config.isTestMode,
        environment: this.config.isTestMode ? "Sandbox (Test)" : "Production",
        error: errMsg || undefined,
      },
    };
  }

  /**
   * 2. Sipariş Servisi (Order / OMS Service)
   * Fetches orders from Hepsiburada with full support for timespan, packages, statuses, and historical date ranges
   */
  async fetchOrders(options?: {
    status?: "open" | "unpacked" | "ready_to_ship" | "in_transit" | "delivered" | "cancelled" | "all";
    offset?: number;
    limit?: number;
    beginDate?: string;
    endDate?: string;
    timespan?: number;
  }): Promise<any[]> {
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;
    const merchantId = (this.config.merchantId || "").trim();
    const apiKey = (this.config.apiKey || "lookprice_dev").trim();
    const apiSecret = (this.config.apiSecret || "").trim();

    if (!merchantId || !apiSecret) {
      throw new Error("Hepsiburada API bilgileri eksik (Merchant ID veya API Secret şifresi girilmemiş).");
    }

    const timespan = options?.timespan !== undefined ? options.timespan : 30; // Default 30 days back to catch recent orders like 09.09.2026

    const groupedOrdersMap = new Map<string, any>();
    let lastError: any = null;

    // Helper to safely extract, group, and insert orders/packages into map
    const processRawItems = (items: any[]) => {
      if (!Array.isArray(items)) return;
      for (const item of items) {
        if (!item) continue;

        // If item already contains an array of items (e.g. package object from OMS)
        if (Array.isArray(item.items) && item.items.length > 0) {
          const oKey = String(item.orderNumber || item.packageNumber || item.orderId || item.id || "").trim();
          if (oKey) {
            if (!groupedOrdersMap.has(oKey)) {
              groupedOrdersMap.set(oKey, { ...item });
            } else {
              const existing = groupedOrdersMap.get(oKey);
              const existingItemIds = new Set((existing.items || []).map((it: any) => String(it.id || it.sku || it.merchantSKU || "")));
              for (const sub of item.items) {
                const sId = String(sub.id || sub.sku || sub.merchantSKU || "");
                if (sId && !existingItemIds.has(sId)) {
                  existing.items.push(sub);
                  existingItemIds.add(sId);
                }
              }
            }
          }
          continue;
        }

        // If item is a single order line item (from /orders/merchantid/...)
        const oNum = String(item.orderNumber || item.order_number || item.orderId || item.packageNumber || item.id || "").trim();
        if (!oNum) continue;

        if (!groupedOrdersMap.has(oNum)) {
          groupedOrdersMap.set(oNum, {
            ...item,
            id: item.orderId || item.id || oNum,
            orderNumber: oNum,
            items: [{ ...item }]
          });
        } else {
          const existing = groupedOrdersMap.get(oNum);
          if (!Array.isArray(existing.items)) {
            existing.items = [{ ...existing }];
          }
          const itemKey = String(item.id || item.sku || item.merchantSKU || item.name || "");
          const alreadyExists = existing.items.some((it: any) => String(it.id || it.sku || it.merchantSKU || it.name || "") === itemKey);
          if (!alreadyExists) {
            existing.items.push({ ...item });
          }
          // Merge metadata
          if (item.cargoTrackingNumber && !existing.cargoTrackingNumber) existing.cargoTrackingNumber = item.cargoTrackingNumber;
          if (item.packageNumber && !existing.packageNumber) existing.packageNumber = item.packageNumber;
          if (item.cargoCompany && !existing.cargoCompany) existing.cargoCompany = item.cargoCompany;
        }
      }
    };

    // Fast direct queries
    const queryUrls: string[] = [
      `${this.omsBaseUrl}/orders/merchantid/${merchantId}?timespan=${timespan}&limit=${limit}&offset=${offset}`,
      `${this.omsBaseUrl}/packages/merchantid/${merchantId}?timespan=${timespan}&limit=${limit}`,
      `${this.omsBaseUrl}/orders/merchantid/${merchantId}?limit=${limit}&offset=${offset}`,
      `${this.omsBaseUrl}/packages/merchantid/${merchantId}?limit=${limit}`,
    ];

    if (options?.beginDate) {
      queryUrls.unshift(`${this.omsBaseUrl}/orders/merchantid/${merchantId}?begindate=${encodeURIComponent(options.beginDate)}&limit=${limit}`);
      queryUrls.unshift(`${this.omsBaseUrl}/packages/merchantid/${merchantId}?begindate=${encodeURIComponent(options.beginDate)}&limit=${limit}`);
    }

    const candidates = this.getAuthCandidates(this.workingAuth);
    let anyAuthenticatedSuccess = false;

    for (const cand of candidates) {
      const headers = this.getHeaders(cand.username, cand.userAgent);
      let candGotAuthFailure = false;

      for (const url of queryUrls) {
        try {
          const response = await axios.get(url, { headers, timeout: 8000 });
          const rawData = response.data;
          if (typeof rawData === 'string' && rawData.includes('<!DOCTYPE')) continue;
          anyAuthenticatedSuccess = true;
          this.persistWorkingAuth(cand, "oms").catch(() => {});
          const items = rawData?.items || rawData?.orders || rawData?.packages || (Array.isArray(rawData) ? rawData : []);
          if (Array.isArray(items) && items.length > 0) {
            processRawItems(items);
          }
        } catch (err: any) {
          lastError = err;
          if (this.isAuthError(err)) {
            candGotAuthFailure = true;
            break; // Switch immediately to next auth candidate
          }
        }
      }

      if (anyAuthenticatedSuccess) {
        break;
      }

      // Also check legacy merchant API endpoint if current OMS failed
      if (candGotAuthFailure || lastError) {
        try {
          const legacyRes = await axios.get(
            `https://merchant.hepsiburada.com/api/orders/merchantid/${merchantId}`,
            { headers, timeout: 8000 }
          );
          const rawData = legacyRes.data;
          if (rawData && typeof rawData === 'object' && !String(rawData).includes('<!DOCTYPE')) {
            anyAuthenticatedSuccess = true;
            this.persistWorkingAuth(cand, "oms").catch(() => {});
            const items = rawData?.items || rawData?.orders || rawData?.packages || (Array.isArray(rawData) ? rawData : []);
            if (Array.isArray(items) && items.length > 0) {
              processRawItems(items);
            }
            break;
          }
        } catch (legacyErr: any) {
          if (!this.isAuthError(legacyErr)) {
            lastError = legacyErr;
          }
        }
      }
    }

    const finalOrders = Array.from(groupedOrdersMap.values());
    if (finalOrders.length > 0 || anyAuthenticatedSuccess) {
      return finalOrders;
    }

    if (lastError?.response?.status === 401 || lastError?.response?.status === 403) {
      throw new Error(
        `Hepsiburada API Kimlik Doğrulama Hatası (401/403): Satıcı ID (${merchantId}) ve Servis Anahtarı kombinasyonu Hepsiburada tarafından reddedildi.`
      );
    }

    return [];
  }

  /**
   * Sync Hepsiburada Orders to Local Database:
   * Creates customers, sales, sales invoices, stock movements, and hepsiburada_orders rows.
   */
  async syncOrdersToDatabase(options?: { beginDate?: string; timespan?: number }): Promise<{ syncedCount: number; errors: any[] }> {
    const rawOrders = await this.fetchOrders({ 
      limit: 100, 
      timespan: options?.timespan !== undefined ? options.timespan : 30,
      beginDate: options?.beginDate 
    });
    let syncedCount = 0;
    const errors: any[] = [];

    for (const order of rawOrders) {
      const orderId = String(order.id || order.orderNumber || order.orderId || '');
      if (!orderId) continue;

      const orderNumber = String(
        order.orderNumber ||
        order.order_number ||
        (order.items && order.items[0]?.orderNumber) ||
        ''
      ).trim();

      // Check if order was already imported by orderId or orderNumber
      const existing = await pool.query(
        `SELECT id, sales_invoice_id, sale_id FROM hepsiburada_orders 
         WHERE store_id = $1 AND (
           hepsiburada_order_id = $2 
           OR ($3 != '' AND (
             order_data->>'orderNumber' = $3 
             OR order_data->'items'->0->>'orderNumber' = $3
           ))
         )`,
        [this.storeId, orderId, orderNumber]
      );

      // Extract and map all order lines accurately
      const rawItems = (Array.isArray(order.items) && order.items.length > 0)
        ? order.items
        : (Array.isArray(order.lines) && order.lines.length > 0)
          ? order.lines
          : (Array.isArray(order.orderItems) && order.orderItems.length > 0)
            ? order.orderItems
            : (Array.isArray(order.lineItems) && order.lineItems.length > 0)
              ? order.lineItems
              : (order.name || order.sku || order.merchantSKU || order.productName)
                ? [order]
                : [];

      let calculatedGrossTotal = 0;
      let calculatedTaxTotal = 0;

      const mappedLines = rawItems.map((l: any) => {
        const pName = String(
          l.name ||
          l.productName ||
          l.title ||
          l.merchantSKU ||
          l.merchantSku ||
          (orderNumber ? `Hepsiburada Sipariş Ürünü (#${orderNumber})` : 'Hepsiburada Ürünü')
        ).trim();

        const qty = Number(l.quantity || l.qty || 1);
        const vatRate = Number(l.vatRate !== undefined ? l.vatRate : (l.vat_rate !== undefined ? l.vat_rate : 20));

        // Hepsiburada prices are tax-inclusive gross figures
        const rawGross = parseFloat(
          l.totalPrice?.amount ||
          l.totalPrice ||
          (parseFloat(l.unitPrice?.amount || l.price?.amount || l.unitPrice || l.price || 0) * qty)
        ) || 0;

        const lineTax = Number((rawGross - (rawGross / (1 + vatRate / 100))).toFixed(2));
        calculatedGrossTotal += rawGross;
        calculatedTaxTotal += lineTax;

        let netUnitPrice = 0;
        if (rawGross > 0 && qty > 0) {
          const grossUnit = rawGross / qty;
          netUnitPrice = Number((grossUnit / (1 + vatRate / 100)).toFixed(4));
        } else {
          netUnitPrice = 0;
        }

        const barcode = String(l.productBarcode || l.barcode || l.merchantSKU || l.merchantSku || l.sku || '').trim();
        const sku = String(l.merchantSKU || l.merchantSku || l.sku || '').trim();

        return {
          name: pName,
          quantity: qty,
          price: netUnitPrice,
          barcode: barcode,
          sku: sku,
          merchantSku: String(l.merchantSKU || l.merchantSku || '').trim(),
          hbSku: String(l.sku || l.hbSku || '').trim(),
          taxRate: vatRate,
        };
      });

      const grandTotal = calculatedGrossTotal > 0
        ? Number(calculatedGrossTotal.toFixed(2))
        : (parseFloat(order.total || order.totalPrice?.amount || order.grossAmount || order.totalAmount || 0) || 0);

      const taxAmount = calculatedTaxTotal > 0
        ? Number(calculatedTaxTotal.toFixed(2))
        : Number((grandTotal * (20 / 120)).toFixed(2));

      const subtotal = Number((grandTotal - taxAmount).toFixed(2));

      // Standardized, compact invoice number (e.g. HB-4741507589)
      const invoiceNumber = orderNumber
        ? `HB-${orderNumber}`
        : `HB-${String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;

      if (existing.rows.length === 0) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          // Extract Corporate & Individual Customer Info
          const invoiceAddr = order.invoice?.address || order.invoiceAddress || {};
          const shippingAddr = order.shippingAddress || order.deliveryAddress || {};

          const companyTitle = String(
            invoiceAddr.name ||
            order.companyName ||
            order.invoice?.title ||
            invoiceAddr.companyName ||
            ''
          ).trim();

          const contactName = String(
            order.customerName ||
            shippingAddr.name ||
            order.recipientName ||
            order.customer ||
            order.buyer?.name ||
            shippingAddr.fullName ||
            invoiceAddr.name ||
            ''
          ).trim();

          // Tax Information (VKN / TCKN & Tax Office)
          const rawTaxNumber = String(order.invoice?.taxNumber || order.taxNumber || '').trim();
          const rawTckn = String(order.invoice?.turkishIdentityNumber || order.identityNo || order.tcId || '').trim();
          
          let resolvedTaxNumber = '';
          if (rawTaxNumber && rawTaxNumber !== '11111111111') {
            resolvedTaxNumber = rawTaxNumber;
          } else if (rawTckn && rawTckn !== '11111111111') {
            resolvedTaxNumber = rawTckn;
          } else {
            resolvedTaxNumber = rawTaxNumber || rawTckn || '11111111111';
          }

          const taxOffice = String(order.invoice?.taxOffice || order.taxOffice || '').trim();
          const isCompany = resolvedTaxNumber.length === 10 && resolvedTaxNumber !== '11111111111';

          // Primary Customer / Legal Entity Display Name
          const customerName = (isCompany && companyTitle)
            ? companyTitle
            : (companyTitle || contactName || 'Hepsiburada Müşterisi');

          const customerEmail = String(
            invoiceAddr.email ||
            shippingAddr.email ||
            order.email ||
            order.customerEmail ||
            (orderNumber ? `${orderNumber}@hepsifatura.com` : `hb_${orderId}@hepsifatura.com`)
          ).trim();

          const customerPhone = String(
            invoiceAddr.phoneNumber ||
            shippingAddr.phoneNumber ||
            order.phone ||
            order.phoneNumber ||
            ''
          ).trim();

          // Full Clean Address
          const rawAddress = String(invoiceAddr.address || shippingAddr.address || order.billingAddress || '').trim();
          const addressTown = String(invoiceAddr.town || invoiceAddr.district || shippingAddr.town || shippingAddr.district || '').trim();
          const addressCity = String(invoiceAddr.city || shippingAddr.city || '').trim();
          const addressParts = [rawAddress];
          if (addressTown && !rawAddress.toLowerCase().includes(addressTown.toLowerCase())) {
            addressParts.push(addressTown);
          }
          if (addressCity && !rawAddress.toLowerCase().includes(addressCity.toLowerCase())) {
            addressParts.push(addressCity);
          }
          const fullAddress = addressParts.filter(Boolean).join(' ') || rawAddress;

          // Find or create customer
          let customerId = null;
          const custRes = await client.query(
            `SELECT id FROM customers 
             WHERE store_id = $1 AND (
               email = $2 
               OR (phone = $3 AND phone != '') 
               OR (tax_number = $4 AND tax_number != '11111111111' AND tax_number != '')
             )`,
            [this.storeId, customerEmail, customerPhone, resolvedTaxNumber]
          );

          if (custRes.rows.length > 0) {
            customerId = custRes.rows[0].id;
            await client.query(
              `UPDATE customers SET 
                 full_name = COALESCE(NULLIF(full_name, 'Hepsiburada Müşterisi'), $1),
                 company_title = COALESCE(company_title, $2),
                 tax_number = COALESCE(NULLIF(tax_number, '11111111111'), $3),
                 tax_office = COALESCE(tax_office, $4),
                 address = COALESCE(NULLIF(address, ''), $5),
                 phone = COALESCE(NULLIF(phone, ''), $6),
                 is_corporate = $7
               WHERE id = $8`,
              [customerName, companyTitle || null, resolvedTaxNumber || null, taxOffice || null, fullAddress, customerPhone, isCompany, customerId]
            );
          } else {
            const rawCustName = customerName.trim();
            const nameParts = rawCustName.split(' ');
            const surnameVal = nameParts.length > 1 ? nameParts.pop()! : '';
            const firstNameVal = nameParts.join(' ') || rawCustName;
            const effectiveEmail = customerEmail || `hb_${orderId || Date.now()}_${Math.random().toString(36).substring(2, 7)}@hepsifatura.com`;

            const newCust = await client.query(
              `INSERT INTO customers 
                (store_id, email, password, full_name, name, surname, phone, address, tax_number, tax_office, company_title, is_corporate, tc_id) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
               ON CONFLICT (store_id, email) DO UPDATE SET
                 full_name = COALESCE(NULLIF(EXCLUDED.full_name, 'Hepsiburada Müşterisi'), customers.full_name),
                 name = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
                 surname = COALESCE(NULLIF(EXCLUDED.surname, ''), customers.surname),
                 phone = COALESCE(NULLIF(EXCLUDED.phone, ''), customers.phone),
                 address = COALESCE(NULLIF(EXCLUDED.address, ''), customers.address),
                 tax_number = COALESCE(NULLIF(EXCLUDED.tax_number, '11111111111'), customers.tax_number),
                 tax_office = COALESCE(NULLIF(EXCLUDED.tax_office, ''), customers.tax_office),
                 company_title = COALESCE(NULLIF(EXCLUDED.company_title, ''), customers.company_title),
                 is_corporate = EXCLUDED.is_corporate,
                 tc_id = COALESCE(EXCLUDED.tc_id, customers.tc_id)
               RETURNING id`,
              [
                this.storeId,
                effectiveEmail,
                "marketplace_user",
                rawCustName,
                firstNameVal,
                surnameVal,
                customerPhone,
                fullAddress,
                resolvedTaxNumber,
                taxOffice,
                companyTitle || null,
                isCompany,
                resolvedTaxNumber.length === 11 ? resolvedTaxNumber : null,
              ]
            );
            customerId = newCust.rows[0]?.id;
          }

          const hbRawSt = String(order.status || '').toLowerCase();
          const isHbCancelled = hbRawSt.includes('cancel') || hbRawSt.includes('iptal') || hbRawSt === 'unpacked_cancelled';

          // Create Sale
          const saleRes = await client.query(
            `INSERT INTO sales 
              (store_id, total_amount, currency, status, customer_name, customer_id, customer_phone, customer_address, payment_method, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [
              this.storeId,
              grandTotal,
              order.currency || "TRY",
              isHbCancelled ? "cancelled" : "completed",
              customerName,
              customerId,
              customerPhone,
              fullAddress,
              "Hepsiburada Satış",
              `Hepsiburada Siparişi: #${orderNumber || orderId}`,
            ]
          );
          const saleId = saleRes.rows[0].id;

          const invoiceRes = await client.query(
            `INSERT INTO sales_invoices 
              (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status,
               customer_name, company_title, tax_number, tax_office, address, customer_email, is_tax_inclusive, invoice_profile, gi_invoice_type) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING id`,
            [
              this.storeId,
              saleId,
              customerId,
              invoiceNumber,
              new Date(order.orderDate || order.created_at || Date.now()),
              subtotal,
              taxAmount,
              grandTotal,
              order.currency || "TRY",
              "Hepsiburada Satış",
              `Hepsiburada Siparişi: #${orderNumber || orderId}`,
              "marketplace",
              isHbCancelled ? "cancelled" : "approved",
              customerName,
              companyTitle || customerName,
              resolvedTaxNumber,
              taxOffice,
              fullAddress,
              customerEmail,
              true,
              isCompany ? 'TICARIFATURA' : 'EARSIVFATURA',
              'SATIS'
            ]
          );
          const salesInvoiceId = invoiceRes.rows[0].id;

          if (mappedLines.length > 0) {
            await processMarketplaceOrderLines(
              client,
              this.storeId,
              saleId,
              salesInvoiceId,
              mappedLines,
              "Hepsiburada",
              orderNumber || orderId,
              customerName,
              invoiceNumber
            );
          } else {
            await client.query(
              `INSERT INTO sales_invoice_items 
                (sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) 
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                salesInvoiceId,
                `Hepsiburada Siparişi (#${orderNumber || orderId})`,
                1,
                subtotal,
                20,
                taxAmount,
                subtotal,
              ]
            );
          }

          // Insert into hepsiburada_orders
          await client.query(
            `INSERT INTO hepsiburada_orders 
              (store_id, hepsiburada_order_id, sale_id, sales_invoice_id, status, package_number, cargo_tracking_number, cargo_provider_name, order_data) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              this.storeId,
              orderId,
              saleId,
              salesInvoiceId,
              order.status || "New",
              order.packageNumber || null,
              order.cargoTrackingNumber || order.trackingNumber || null,
              order.cargoProviderName || order.cargoCompany || null,
              order,
            ]
          );

          await client.query("COMMIT");
          try {
            await syncMarketplaceOrderTreasury(pool, {
              storeId: this.storeId,
              platform: "hepsiburada",
              salesInvoiceId,
              saleId,
              invoiceNumber,
              orderReference: orderNumber || orderId,
              amount: grandTotal,
              currency: order.currency || "TRY",
              customerName,
              transactionDate: new Date(order.orderDate || order.created_at || Date.now()),
              status: isHbCancelled ? "cancelled" : "approved",
              notes: `Hepsiburada Siparişi: #${orderNumber || orderId}`,
            });
          } catch (trErr: any) {
            console.warn(`[HB Sync] Treasury sync warning for #${orderId}:`, trErr?.message || trErr);
          }
          syncedCount++;
        } catch (err: any) {
          await client.query("ROLLBACK");
          console.error(`HB Order ${orderId} sync error:`, err);
          errors.push({ orderId, error: err.message });
        } finally {
          client.release();
        }
      } else {
        // Order already exists: check if lines or totals need reconciliation
        const existingRow = existing.rows[0];
        const existingHbOrderId = existingRow.id;
        const existingInvoiceId = existingRow.sales_invoice_id;
        const existingSaleId = existingRow.sale_id;

        const hbRawSt = String(order.status || '').toLowerCase();
        const isHbCancelled = hbRawSt.includes('cancel') || hbRawSt.includes('iptal') || hbRawSt === 'unpacked_cancelled';
        if (isHbCancelled) {
          if (existingInvoiceId) {
            await pool.query("UPDATE sales_invoices SET status = 'cancelled' WHERE id = $1 AND store_id = $2", [existingInvoiceId, this.storeId]);
          }
          if (existingSaleId) {
            const saleCheck = await pool.query("SELECT status FROM sales WHERE id = $1 AND store_id = $2", [existingSaleId, this.storeId]);
            const wasSaleCancelled = ['cancelled', 'iptal', 'canceled'].includes(String(saleCheck.rows[0]?.status || '').toLowerCase().trim());
            await pool.query("UPDATE sales SET status = 'cancelled', cancellation_reason = 'Hepsiburada Sipariş İptali' WHERE id = $1 AND store_id = $2", [existingSaleId, this.storeId]);
            if (!wasSaleCancelled) {
              const items = await pool.query("SELECT product_id, quantity FROM sale_items WHERE sale_id = $1", [existingSaleId]);
              for (const it of items.rows) {
                if (it.product_id && it.quantity > 0) {
                  await pool.query("UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3", [it.quantity, it.product_id, this.storeId]);
                }
              }
            }
          }
          await pool.query(
            "DELETE FROM stock_movements WHERE store_id = $1 AND (sale_id = $2 OR (invoice_id IS NOT NULL AND invoice_id = $3) OR invoice_number = $4)",
            [this.storeId, existingSaleId || -1, existingInvoiceId || -1, invoiceNumber]
          );
          try {
            await syncMarketplaceOrderTreasury(pool, {
              storeId: this.storeId,
              platform: "hepsiburada",
              salesInvoiceId: existingInvoiceId,
              saleId: existingSaleId,
              invoiceNumber,
              orderReference: orderNumber || orderId,
              amount: grandTotal,
              currency: order.currency || "TRY",
              customerName: order.customerName || "Hepsiburada Müşterisi",
              status: "cancelled",
            });
          } catch (trErr: any) {
            console.warn(`[HB Sync] Treasury cancel sync warning for #${orderId}:`, trErr?.message || trErr);
          }
        }

        if (existingInvoiceId && mappedLines.length > 0) {
          const client = await pool.connect();
          try {
            await client.query("BEGIN");
            
            // Check existing invoice item count and linked product count
            const currItemsRes = await client.query(
              "SELECT COUNT(*) as count, COUNT(product_id) as linked_count FROM sales_invoice_items WHERE sales_invoice_id = $1",
              [existingInvoiceId]
            );
            const currCount = parseInt(currItemsRes.rows[0]?.count || 0);
            const linkedCount = parseInt(currItemsRes.rows[0]?.linked_count || 0);

            if (currCount < mappedLines.length || (linkedCount === 0 && mappedLines.length > 0)) {
              // Update invoice totals
              await client.query(
                `UPDATE sales_invoices 
                 SET total_amount = $1, tax_amount = $2, grand_total = $3, notes = $4 
                 WHERE id = $5`,
                [subtotal, taxAmount, grandTotal, `Hepsiburada Siparişi: #${orderNumber || orderId}`, existingInvoiceId]
              );

              if (existingSaleId) {
                await client.query(
                  `UPDATE sales SET total_amount = $1 WHERE id = $2`,
                  [grandTotal, existingSaleId]
                );
              }

              // Clean previous line items and re-populate with full set of items
              await client.query(`DELETE FROM sales_invoice_items WHERE sales_invoice_id = $1`, [existingInvoiceId]);
              if (existingSaleId) {
                await client.query(`DELETE FROM sale_items WHERE sale_id = $1`, [existingSaleId]);
              }

              await processMarketplaceOrderLines(
                client,
                this.storeId,
                existingSaleId,
                existingInvoiceId,
                mappedLines,
                "Hepsiburada",
                orderNumber || orderId,
                order.customerName || "Hepsiburada Müşterisi",
                invoiceNumber
              );

              // Update order_data in hepsiburada_orders
              await client.query(
                `UPDATE hepsiburada_orders 
                 SET order_data = $1, 
                     package_number = COALESCE($2, package_number),
                     cargo_tracking_number = COALESCE($3, cargo_tracking_number),
                     cargo_provider_name = COALESCE($4, cargo_provider_name),
                     status = COALESCE($5, status)
                 WHERE id = $6`,
                [
                  order,
                  order.packageNumber || null,
                  order.cargoTrackingNumber || order.trackingNumber || null,
                  order.cargoProviderName || order.cargoCompany || null,
                  order.status || null,
                  existingHbOrderId
                ]
              );
            }

            await client.query("COMMIT");
            try {
              await syncMarketplaceOrderTreasury(pool, {
                storeId: this.storeId,
                platform: "hepsiburada",
                salesInvoiceId: existingInvoiceId,
                saleId: existingSaleId,
                invoiceNumber,
                orderReference: orderNumber || orderId,
                amount: grandTotal,
                currency: order.currency || "TRY",
                customerName: order.customerName || "Hepsiburada Müşterisi",
                transactionDate: new Date(order.orderDate || order.created_at || Date.now()),
                status: isHbCancelled ? "cancelled" : "approved",
                notes: `Hepsiburada Siparişi: #${orderNumber || orderId}`,
              });
            } catch (trErr: any) {
              console.warn(`[HB Sync] Treasury update sync warning for #${orderId}:`, trErr?.message || trErr);
            }
            syncedCount++;
          } catch (updateErr: any) {
            await client.query("ROLLBACK");
            console.error(`HB Order ${orderId} update error:`, updateErr);
          } finally {
            client.release();
          }
        }
      }
    }

    // Update last sync time safely without clobbering DB fields
    try {
      const storeSyncRes = await pool.query("SELECT hepsiburada_settings, branding FROM stores WHERE id = $1", [this.storeId]);
      let prevDb = storeSyncRes.rows[0]?.hepsiburada_settings || {};
      if (typeof prevDb === "string") { try { prevDb = JSON.parse(prevDb); } catch { prevDb = {}; } }
      let brDb = storeSyncRes.rows[0]?.branding || {};
      if (typeof brDb === "string") { try { brDb = JSON.parse(brDb); } catch { brDb = {}; } }

      const cleanPrevUa = /lookprice marketplace manager/i.test(String(prevDb.userAgent || "")) ? undefined : prevDb.userAgent;
      const updatedSettings = {
        ...(brDb.hepsiburada_settings || {}),
        ...prevDb,
        ...(cleanPrevUa ? { userAgent: cleanPrevUa } : { userAgent: this.config.userAgent || this.config.apiKey || "lookprice_dev" }),
        ...(this.workingAuth ? { authUsername: this.workingAuth.username, authUserAgent: this.workingAuth.userAgent, userAgent: this.workingAuth.userAgent } : {}),
        ...(this.workingListingAuth ? { listingAuthUsername: this.workingListingAuth.username, listingAuthUserAgent: this.workingListingAuth.userAgent } : {}),
        last_sync: new Date().toISOString(),
      };
      brDb.hepsiburada_settings = updatedSettings;
      await pool.query(
        "UPDATE stores SET hepsiburada_settings = $1, branding = $2 WHERE id = $3",
        [updatedSettings, brDb, this.storeId]
      );
    } catch {
      // ignore sync timestamp save failure
    }

    return { syncedCount, errors };
  }

  /**
   * 3. Ürün & Envanter Servisi (Inventory & Price/Stock Management)
   * Bulk updates stock and price for products using Listing V2 API
   */
  async updatePriceAndStock(
    items: HepsiburadaInventoryItem[]
  ): Promise<{ success: boolean; trackingId?: string; message: string; details?: any }> {
    if (!items || items.length === 0) {
      return { success: false, message: "Güncellenecek ürün bulunamadı." };
    }

    const merchantId = this.config.merchantId;

    // PRE-FLIGHT LIVE LISTING SKU & MERCHANTSKU AUTO-RESOLVER (Self-Healing Architecture)
    // Prevents "ListingNotFound" (when parent productId HBC0... is stored instead of variant HBCV...)
    // and "MismatchingSkusSpecified" (when local barcode differs from HB's registered merchantSku).
    const normKey = (s: any) =>
      String(s || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

    let liveListings: any[] = [];
    try {
      liveListings = await this.fetchMerchantListings({ limit: 500 });
    } catch {
      liveListings = [];
    }

    const byHbSku = new Map<string, any>();
    const byProductId = new Map<string, any>();
    const byMerchantSku = new Map<string, any>();
    const byBarcode = new Map<string, any>();

    for (const l of liveListings) {
      if (l.hepsiburadaSku) byHbSku.set(normKey(l.hepsiburadaSku), l);
      if (l.productId) {
        // Prefer ACTIVE/salable variant if multiple variants share a parent productId
        const existing = byProductId.get(normKey(l.productId));
        if (!existing || (l.isSalable && !existing.isSalable)) {
          byProductId.set(normKey(l.productId), l);
        }
      }
      if (l.merchantSku) byMerchantSku.set(normKey(l.merchantSku), l);
      if (l.barcode) byBarcode.set(normKey(l.barcode), l);
    }

    const resolvedItems: HepsiburadaInventoryItem[] = [];
    for (const rawItem of items) {
      const origHbSku = String(rawItem.HepsiburadaSku || "").trim();
      const origMerchantSku = String(rawItem.MerchantSku || "").trim();

      const matchedLive =
        (origHbSku ? byHbSku.get(normKey(origHbSku)) : undefined) ||
        (origHbSku ? byProductId.get(normKey(origHbSku)) : undefined) ||
        (origMerchantSku ? byMerchantSku.get(normKey(origMerchantSku)) : undefined) ||
        (origMerchantSku ? byBarcode.get(normKey(origMerchantSku)) : undefined) ||
        (origMerchantSku ? byHbSku.get(normKey(origMerchantSku)) : undefined) ||
        (origMerchantSku ? byProductId.get(normKey(origMerchantSku)) : undefined);

      let finalHbSku = origHbSku;
      let finalMerchantSku = origMerchantSku;

      if (matchedLive) {
        if (matchedLive.hepsiburadaSku) {
          finalHbSku = String(matchedLive.hepsiburadaSku).trim();
        }
        if (matchedLive.merchantSku) {
          finalMerchantSku = String(matchedLive.merchantSku).trim();
        }

        // Self-heal database record if HepsiburadaSku (e.g. HBC0 -> HBCV) or MerchantSku changed
        if (finalHbSku !== origHbSku || finalMerchantSku !== origMerchantSku) {
          const healPid = String(matchedLive.productId || origHbSku || "").trim();
          pool
            .query(
              `UPDATE products
               SET hepsiburada_sku = $1,
                   marketplace_data = jsonb_set(
                     jsonb_set(
                       jsonb_set(
                         COALESCE(marketplace_data::jsonb, '{}'::jsonb),
                         '{hepsiburada,hepsiburadaSku}',
                         to_jsonb($1::text),
                         true
                       ),
                       '{hepsiburada,merchantSku}',
                       to_jsonb($2::text),
                       true
                     ),
                     '{hepsiburada,productId}',
                     to_jsonb($3::text),
                     true
                   )
               WHERE store_id = $4
                 AND (
                   hepsiburada_sku = $5
                   OR barcode = $6
                   OR sku = $6
                   OR marketplace_data->'hepsiburada'->>'productId' = $5
                   OR marketplace_data->'hepsiburada'->>'hepsiburadaSku' = $5
                 )`,
              [finalHbSku, finalMerchantSku, healPid, this.storeId, origHbSku || finalHbSku, origMerchantSku]
            )
            .catch(() => {});
        }
      }

      resolvedItems.push({
        ...rawItem,
        HepsiburadaSku: finalHbSku,
        MerchantSku: finalMerchantSku,
      });
    }

    // For batch uploads (>1 item), filter out items that have no valid variant HB SKU and aren't in live listings
    // to prevent Hepsiburada's internal JSON->XML converter from failing the whole batch with "MissingHeaders" or "ListingNotFound".
    const uploadableItems =
      resolvedItems.length > 1
        ? resolvedItems.filter((it) => {
            const s = String(it.HepsiburadaSku || "").trim().toUpperCase();
            return s.length > 0 && (s.startsWith("HBCV") || s.startsWith("HBV") || byHbSku.has(normKey(s)));
          })
        : resolvedItems;

    const effectiveUploadItems = uploadableItems.length > 0 ? uploadableItems : resolvedItems;

    const payloadV1 = effectiveUploadItems.map((item) => {
      const entry: any = {
        hepsiburadaSku: item.HepsiburadaSku ? String(item.HepsiburadaSku).trim() : "",
        merchantSku: String(item.MerchantSku).trim(),
        price: Number(Number(item.Price || 0).toFixed(2)),
        availableStock: Math.max(0, Math.floor(Number(item.AvailableStock) || 0)),
        dispatchTime: Number(item.DispatchTime || this.config.defaultDispatchTime || 1),
        maximumPurchasableQuantity: Number(item.MaximumPurchasableQuantity || 10),
      };
      if (!entry.hepsiburadaSku) {
        delete entry.hepsiburadaSku;
      }
      return entry;
    });

    const payloadV2 = effectiveUploadItems.map((item) => {
      const entry: any = {
        HepsiburadaSku: item.HepsiburadaSku ? String(item.HepsiburadaSku).trim() : "",
        MerchantSku: String(item.MerchantSku).trim(),
        Price: Number(Number(item.Price || 0).toFixed(2)),
        AvailableStock: Math.max(0, Math.floor(Number(item.AvailableStock) || 0)),
        DispatchTime: Number(item.DispatchTime || this.config.defaultDispatchTime || 1),
        MaximumPurchasableQuantity: Number(item.MaximumPurchasableQuantity || 10),
      };
      if (!entry.HepsiburadaSku) {
        delete entry.HepsiburadaSku;
      }
      return entry;
    });

    const listingDirectUrl = this.listingDirectUrl;

    const endpoints = [
      {
        name: "Listing V1 Inventory Uploads",
        url: `${listingDirectUrl}/listings/merchantid/${merchantId}/inventory-uploads`,
        data: payloadV1,
      },
      {
        name: "Listing V2 GW Import",
        url: `${this.listingBaseUrl}/inventory/import/${merchantId}`,
        data: payloadV2,
      },
      {
        name: "Listing V1 Direct",
        url: `${listingDirectUrl}/listings/merchantid/${merchantId}`,
        data: payloadV1,
      },
    ];

    const candidates = this.getAuthCandidates(this.workingListingAuth || this.workingAuth);
    let lastError: any = null;

    for (const cand of candidates) {
      const headers = this.getHeaders(cand.username, cand.userAgent);
      for (const ep of endpoints) {
        try {
          const response = await axios.post(ep.url, ep.data, { headers, timeout: 30000 });
          const trackingId =
            response.data?.trackingId ||
            response.data?.id ||
            response.data?.taskId ||
            response.data?.data?.trackingId;

          if (!this.workingListingAuth || this.workingListingAuth.username !== cand.username || this.workingListingAuth.userAgent !== cand.userAgent) {
            this.persistWorkingAuth(cand, "listing").catch(() => {});
          }

          // Also push to dedicated high-priority Price Uploads endpoint for immediate price propagation
          const priceUploadPayload = payloadV1
            .filter((x) => x.hepsiburadaSku && x.merchantSku && x.price > 0)
            .map((x) => ({
              hepsiburadaSku: x.hepsiburadaSku,
              merchantSku: x.merchantSku,
              price: x.price,
            }));
          if (priceUploadPayload.length > 0) {
            axios
              .post(`${listingDirectUrl}/listings/merchantid/${merchantId}/price-uploads`, priceUploadPayload, {
                headers,
                timeout: 15000,
              })
              .catch(() => {});
          }

          let priceValidations: any[] = Array.isArray(response.data?.priceValidations) ? response.data.priceValidations : [];
          let uploadErrors: any[] = Array.isArray(response.data?.errors) ? response.data.errors : [];

          if (trackingId && effectiveUploadItems.length <= 20) {
            for (let attempt = 0; attempt < 4; attempt++) {
              try {
                await new Promise((r) => setTimeout(r, attempt === 0 ? 1200 : 1400));
                const taskStatus = await this.checkTaskStatus(String(trackingId));
                if (Array.isArray(taskStatus?.priceValidations) && taskStatus.priceValidations.length > 0) {
                  priceValidations = taskStatus.priceValidations;
                }
                if (Array.isArray(taskStatus?.errors) && taskStatus.errors.length > 0) {
                  uploadErrors = taskStatus.errors;
                }
                const st = String(taskStatus?.status || "").toLowerCase();
                if (st === "done" || st === "completed" || st === "failed" || uploadErrors.length > 0 || priceValidations.length > 0) {
                  break;
                }
              } catch {
                break;
              }
            }
          }

          if (priceValidations.length > 0) {
            for (const pv of priceValidations) {
              const sku = pv?.merchantSku || pv?.MerchantSku || pv?.hepsiburadaSku || pv?.HepsiburadaSku || effectiveUploadItems[0]?.MerchantSku;
              if (sku) {
                await pool.query(
                  `UPDATE products 
                   SET is_hepsiburada_active = false, 
                       hepsiburada_last_error = 'Yüksek Fiyat',
                       marketplace_data = jsonb_set(COALESCE(marketplace_data::jsonb, '{}'::jsonb), '{hepsiburada,priceAlert}', 'true'::jsonb, true)
                   WHERE store_id = $1 AND (barcode = $2 OR sku = $2 OR hepsiburada_sku = $2 OR marketplace_data->'hepsiburada'->>'merchantSku' = $2)`,
                  [this.storeId, String(sku)]
                ).catch(() => {});
              }
            }
            if (items.length === 1) {
              throw new Error("Yüksek Fiyat");
            }
          }

          if (uploadErrors.length > 0 && items.length === 1) {
            const firstErrObj = uploadErrors[0];
            const firstErr =
              firstErrObj?.message ||
              firstErrObj?.error ||
              (Array.isArray(firstErrObj?.errors) ? firstErrObj.errors.join(", ") : null) ||
              JSON.stringify(firstErrObj);
            if (/fiyat|price|aralığın|fahiş|tavan|taban/i.test(String(firstErr))) {
              throw new Error("Yüksek Fiyat");
            }
            throw new Error(`Hepsiburada İlan Güncelleme Reddi: ${firstErr}`);
          }

          return {
            success: true,
            trackingId,
            message: `${effectiveUploadItems.length} adet ürün fiyat/stok güncellemesi Hepsiburada (${ep.name}) kuyruğuna iletildi ve doğrulandı.`,
            details: response.data,
          };
        } catch (err: any) {
          if (err?.message === "Yüksek Fiyat" || String(err?.message || "").startsWith("Hepsiburada İlan Güncelleme Reddi:")) {
            throw err;
          }
          lastError = err;
          console.warn(`[HB updatePriceAndStock] ${ep.name} (${cand.username}) denemesi başarısız oldu:`, err.response?.data || err.message);
          if (this.isAuthError(err) && !this.config.isTestMode) {
            // In production all 3 listing endpoints share listing-external.hepsiburada.com,
            // so on 401/403 advance directly to the next auth candidate.
            break;
          }
        }
      }
    }

    // If bulk endpoints failed, try single-SKU PUT fallback with auth retry
    if (payloadV2.length > 0) {
      try {
        const singleResults = await this.withAuthRetry(
          async (putHeaders) => {
            const results = [];
            for (const item of payloadV2) {
              const singleUrl = `${listingDirectUrl}/listings/merchantid/${merchantId}/sku/${encodeURIComponent(item.MerchantSku)}`;
              const singleRes = await axios.put(
                singleUrl,
                {
                  price: item.Price,
                  availableStock: item.AvailableStock,
                  dispatchTime: item.DispatchTime,
                },
                { headers: putHeaders, timeout: 15000 }
              );
              results.push(singleRes.data);
            }
            return results;
          },
          { channel: "listing", preferred: this.workingListingAuth || this.workingAuth }
        );

        return {
          success: true,
          message: `${payloadV2.length} adet ürün tekil SKU güncellemesiyle Hepsiburada'ya iletildi.`,
          details: singleResults,
        };
      } catch (putErr: any) {
        if (!lastError || !this.isAuthError(lastError)) {
          lastError = putErr;
        }
        console.warn("[HB updatePriceAndStock] Single SKU PUT fallback de başarısız oldu:", putErr.response?.data || putErr.message);
      }
    }

    // Format error response
    console.error("[HB updatePriceAndStock] Tüm aktarım kanalları başarısız oldu:", lastError?.response?.data || lastError?.message);
    const errObj = lastError?.response?.data;
    let errMsg =
      errObj?.message ||
      errObj?.error ||
      errObj?.errorMessage ||
      errObj?.error_description ||
      (Array.isArray(errObj?.errors) ? errObj.errors.map((e: any) => e.message || e).join(", ") : null) ||
      lastError?.message ||
      "Hepsiburada ürün fiyat/stok aktarımı başarısız.";

    if (lastError?.response?.status === 401 || lastError?.response?.status === 403) {
      errMsg = `Hepsiburada Yetkilendirme Hatası (${lastError.response.status}). Merchant ID ve API Anahtarlarınızı kontrol ediniz.`;
    } else if (lastError?.response?.status === 400) {
      errMsg = `Hepsiburada İsteği Reddetti (400): ${errMsg}`;
    }

    throw new Error(errMsg);
  }

  /**
   * Calculate effective Hepsiburada price using the net margin protection formula:
   * P_HB = (P_Web + FixedFee) / (1 - (CommissionRate / 100))
   */
  calculateMarketplacePrice(webPrice: number, category?: string, subCategory?: string): number {
    const rawPrice = Number(webPrice) || 0;
    if (rawPrice <= 0) return 0;

    const settings: any = this.config || {};
    const categoryMarkups = settings.categoryMarkups || {};

    let commissionRate = settings.defaultCommissionRate !== undefined && settings.defaultCommissionRate !== null
      ? Number(settings.defaultCommissionRate) 
      : 0;
    let fixedFee = settings.defaultFixedFee !== undefined && settings.defaultFixedFee !== null 
      ? Number(settings.defaultFixedFee) 
      : 0;

    // Check specific subcategory first, then main category
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
   * Bulk Sync all active store products to Hepsiburada
   */
  async syncAllActiveProducts(): Promise<{
    total: number;
    successCount: number;
    failedCount: number;
    trackingId?: string;
  }> {
    // Reconcile live listings first so parent productIds (HBC0...) and merchantSkus are healed before bulk upload
    try {
      await this.matchListingsWithStoreProducts({ importMissing: false });
    } catch {
      // continue even if pre-match warning occurs
    }

    const prodRes = await pool.query(
      `SELECT id, name, category, sub_category, barcode, price, currency, stock_quantity, COALESCE(reserved_stock, 0) as reserved_stock, hepsiburada_sku, is_hepsiburada_active, marketplace_data 
       FROM products 
       WHERE store_id = $1 AND (is_hepsiburada_active = true OR (hepsiburada_sku IS NOT NULL AND hepsiburada_sku != ''))`,
      [this.storeId]
    );

    const products = prodRes.rows;
    if (products.length === 0) {
      return { total: 0, successCount: 0, failedCount: 0 };
    }

    const storeRes = await pool.query("SELECT currency_rates, branding FROM stores WHERE id = $1", [this.storeId]);
    const storeRow = storeRes.rows[0];
    const rates = storeRow?.currency_rates || storeRow?.branding?.currency_rates || {};

    const inventoryItems: HepsiburadaInventoryItem[] = [];
    const productUpdates: Array<{ id: number; mpData: any }> = [];

    for (const p of products) {
      let rawPrice = parseFloat(p.price || "0");
      const curr = (p.currency || "TRY").toUpperCase();
      if (curr === "USD" && rates.USD) {
        rawPrice = rawPrice * Number(rates.USD);
      } else if (curr === "EUR" && rates.EUR) {
        rawPrice = rawPrice * Number(rates.EUR);
      } else if (curr === "GBP" && rates.GBP) {
        rawPrice = rawPrice * Number(rates.GBP);
      }

      const effectivePrice = this.calculateMarketplacePrice(rawPrice, p.category, p.sub_category);
      let mpData: any = p.marketplace_data;
      if (typeof mpData === "string") {
        try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
      }
      mpData = mpData || {};
      if (!mpData.hepsiburada) mpData.hepsiburada = {};
      if (!mpData.hepsiburada.attributes) mpData.hepsiburada.attributes = {};
      mpData.hepsiburada.price = effectivePrice;
      mpData.hepsiburada.attributes.price = String(effectivePrice);
      mpData.hepsiburada.lastSync = new Date().toISOString();

      const hbMerchantSku = mpData?.hepsiburada?.merchantSku || p.barcode || p.hepsiburada_sku;
      const hbSku = p.hepsiburada_sku || mpData?.hepsiburada?.hepsiburadaSku || "";

      if (hbMerchantSku && effectivePrice > 0) {
        inventoryItems.push({
          MerchantSku: hbMerchantSku,
          HepsiburadaSku: hbSku,
          Price: effectivePrice,
          AvailableStock: computeSellableStock(p.stock_quantity, p.reserved_stock),
          DispatchTime: this.config.defaultDispatchTime || 1,
        });
        productUpdates.push({ id: p.id, mpData });
      }
    }

    if (inventoryItems.length === 0) {
      return { total: 0, successCount: 0, failedCount: 0 };
    }

    try {
      const res = await this.updatePriceAndStock(inventoryItems);
      for (const u of productUpdates) {
        await pool.query(
          `UPDATE products 
           SET hepsiburada_last_sync = NOW(), 
               hepsiburada_last_error = NULL,
               marketplace_data = $1
           WHERE id = $2 AND store_id = $3`,
          [JSON.stringify(u.mpData), u.id, this.storeId]
        );
      }

      return {
        total: inventoryItems.length,
        successCount: inventoryItems.length,
        failedCount: 0,
        trackingId: res.trackingId,
      };
    } catch (err: any) {
      await pool.query(
        `UPDATE products 
         SET hepsiburada_last_error = $1 
         WHERE store_id = $2 AND is_hepsiburada_active = true`,
        [err.message, this.storeId]
      );
      throw err;
    }
  }

  /**
   * 4. Check Asynchronous Task / Import Status
   */
  async checkTaskStatus(taskId: string): Promise<any> {
    const listingDirectUrl = this.listingDirectUrl;
    return this.withAuthRetry(
      async (headers) => {
        try {
          const directUrl = `${listingDirectUrl}/listings/merchantid/${this.config.merchantId}/inventory-uploads/id/${taskId}`;
          const resDirect = await axios.get(directUrl, { headers, timeout: 15000 });
          return resDirect.data;
        } catch (directErr: any) {
          if (this.isAuthError(directErr)) throw directErr;
          const url = `${this.listingBaseUrl}/inventory/import/status/${this.config.merchantId}/task/${taskId}`;
          const response = await axios.get(url, { headers, timeout: 15000 });
          return response.data;
        }
      },
      { channel: "listing" }
    );
  }

  /**
   * 5. Katalog & Kategori Servisi (Catalog & Categories)
   */
  async getAllCategories(): Promise<any[]> {
    try {
      return await this.withAuthRetry(
        async (headers) => {
          const collected: any[] = [];
          const seenIds = new Set<string>();
          const pageSize = 2000;
          let totalPages = 1;

          for (let page = 0; page < Math.min(totalPages, 15); page++) {
            const url = `${this.catalogBaseUrl}/categories/get-all-categories?leaf=true&status=ACTIVE&available=true&page=${page}&size=${pageSize}`;
            try {
              const response = await axios.get(url, { headers, timeout: 30000 });
              const rawData = response.data?.data ?? response.data?.categories ?? response.data;
              const chunk = Array.isArray(rawData) ? rawData : [];
              if (typeof response.data?.totalPages === "number" && response.data.totalPages > 0) {
                totalPages = response.data.totalPages;
              }
              for (const item of chunk) {
                const cid = String(item?.categoryId ?? item?.id ?? "").trim();
                if (!cid || seenIds.has(cid)) continue;
                seenIds.add(cid);
                collected.push(item);
              }
              if (chunk.length < pageSize && page + 1 >= totalPages) {
                break;
              }
              if (chunk.length === 0) break;
            } catch (pageErr: any) {
              if (this.isAuthError(pageErr)) throw pageErr;
              if (page === 0) {
                // Fallback to unpaginated endpoint on the same host
                const fallbackUrl = `${this.catalogBaseUrl}/categories/get-all-categories`;
                const res = await axios.get(fallbackUrl, { headers, timeout: 30000 });
                const rawFallback = res.data?.data ?? res.data?.categories ?? res.data;
                return Array.isArray(rawFallback) ? rawFallback : [];
              }
              break;
            }
          }

          return collected;
        },
        { channel: "listing" }
      );
    } catch (error: any) {
      throw new Error(`Kategori listesi alınamadı: ${error.message}`);
    }
  }

  async getCategoryAttributes(categoryId: number | string): Promise<any> {
    try {
      return await this.withAuthRetry(
        async (headers) => {
          const url = `${this.catalogBaseUrl}/categories/${categoryId}/attributes`;
          const response = await axios.get(url, { headers, timeout: 20000 });
          return response.data?.data || response.data || {};
        },
        { channel: "listing" }
      );
    } catch (error: any) {
      throw new Error(`Kategori özellikleri alınamadı: ${error.message}`);
    }
  }

  async getCategoryAttributeValues(categoryId: number | string, attributeId: string): Promise<any[]> {
    try {
      return await this.withAuthRetry(
        async (headers) => {
          const url = `${this.catalogBaseUrl}/categories/${categoryId}/attribute/${attributeId}/values?page=0&size=100`;
          const response = await axios.get(url, { headers, timeout: 15000 });
          if (Array.isArray(response.data)) {
            return response.data;
          }
          return response.data?.data || [];
        },
        { channel: "listing" }
      );
    } catch {
      return [];
    }
  }

  /**
   * Hepsiburada Katalog İçe Aktarım (Multipart Form-Data POST /products/import)
   */
  async importCatalogProducts(products: any[]): Promise<{ success: boolean; trackingId?: string; message?: string }> {
    if (!products || products.length === 0) {
      return { success: false, message: "Kataloğa aktarılacak ürün bulunamadı" };
    }

    const payload = products.map((p) => ({
      categoryId: Number(p.categoryId),
      merchant: this.config.merchantId,
      attributes: p.attributes || {}
    }));

    const url = `${this.catalogBaseUrl}/products/import`;
    try {
      return await this.withAuthRetry(
        async (baseHeaders) => {
          const form = new FormData();
          form.append("file", Buffer.from(JSON.stringify(payload)), {
            filename: "products.json",
            contentType: "application/json"
          });

          const headers = {
            ...baseHeaders,
            ...form.getHeaders()
          };

          const response = await axios.post(url, form, { headers, timeout: 30000 });
          const trackingId = response.data?.data?.trackingId || response.data?.trackingId;
          return {
            success: true,
            trackingId,
            message: trackingId ? `Katalog içe aktarımı başlatıldı (Takip No: ${trackingId})` : "Katalog aktarıldı"
          };
        },
        { channel: "listing" }
      );
    } catch (error: any) {
      const detail = error.response?.data?.message || error.response?.data?.description || error.message;
      throw new Error(`Hepsiburada katalog aktarımı başarısız: ${detail}`);
    }
  }

  /**
   * 5.1 Check Catalog Tracking Status
   */
  async checkCatalogStatus(trackingId: string): Promise<any> {
    try {
      return await this.withAuthRetry(
        async (headers) => {
          try {
            const url = `${this.catalogBaseUrl}/products/status/${encodeURIComponent(trackingId)}`;
            const response = await axios.get(url, { headers, timeout: 15000 });
            if (response.data && response.data.success === false) {
              // Preserve full error response (e.g. code 4000 "Tracking id not found") instead of returning empty data: []
              return response.data;
            }
            return response.data?.data ?? response.data;
          } catch (error: any) {
            if (this.isAuthError(error)) throw error;
            return await this.checkTaskStatus(trackingId);
          }
        },
        { channel: "listing" }
      );
    } catch (error: any) {
      throw new Error(`Katalog takip durumu sorgulanamadı: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 5.2 Inspect Catalog Products directly on MPOP (all-products-of-merchant + WAITING/MISSING_INFO/REJECTED)
   */
  async checkCatalogProductsByStatus(merchantSkuOrBarcode?: string): Promise<{
    found: boolean;
    totalCatalogProducts: number;
    items: any[];
    matched?: any;
  }> {
    const norm = (v: any) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const targetNorm = norm(merchantSkuOrBarcode);

    return await this.withAuthRetry(
      async (headers) => {
        const items: any[] = [];
        const seen = new Set<string>();

        const addItem = (it: any, statusHint?: string) => {
          if (!it || typeof it !== "object") return;
          const mSku = String(it.merchantSku || it.MerchantSku || "").trim();
          const bc = String(it.barcode || it.Barcode || "").trim();
          const hbSku = String(it.hbSku || it.hepsiburadaSku || "").trim();
          const key = `${mSku}::${bc}::${hbSku}::${statusHint || ""}`;
          if (!seen.has(key)) {
            seen.add(key);
            items.push(statusHint && !it.productStatus ? { ...it, productStatus: statusHint } : it);
          }
        };

        try {
          const resAll = await axios.get(
            `${this.catalogBaseUrl}/products/all-products-of-merchant/${this.config.merchantId}?page=0&size=50`,
            { headers, timeout: 15000 }
          );
          if (Array.isArray(resAll.data?.data)) {
            for (const it of resAll.data.data) addItem(it);
          }
        } catch (err: any) {
          if (this.isAuthError(err)) throw err;
        }

        const statusesToCheck = ["WAITING", "MISSING_INFO", "PRE_MATCHED", "REJECTED", "MATCHED"];
        for (const st of statusesToCheck) {
          try {
            const resSt = await axios.get(
              `${this.catalogBaseUrl}/products/products-by-merchant-and-status?merchantId=${encodeURIComponent(this.config.merchantId)}&productStatus=${st}&page=0&size=50`,
              { headers, timeout: 12000 }
            );
            if (Array.isArray(resSt.data?.data)) {
              for (const it of resSt.data.data) addItem(it, st);
            }
          } catch (err: any) {
            if (this.isAuthError(err)) throw err;
          }
        }

        const matched = targetNorm
          ? items.find((it) => {
              const cands = [it.merchantSku, it.MerchantSku, it.barcode, it.Barcode, it.hbSku, it.hepsiburadaSku];
              return cands.some((c) => c && norm(c) === targetNorm);
            })
          : undefined;

        return {
          found: Boolean(matched),
          totalCatalogProducts: items.length,
          items,
          matched
        };
      },
      { channel: "listing" }
    ).catch((err) => {
      if (this.isAuthError(err)) throw err;
      return { found: false, totalCatalogProducts: 0, items: [] };
    });
  }

  /**
   * 6. Fatura ve Kargo Yükleme (Invoice & Package Upload)
   */
  async sendInvoice(orderNumberOrPackageNumber: string, invoiceData: {
    invoiceNumber: string;
    invoiceDate: string;
    invoiceUrl?: string;
    totalAmount: number;
    taxAmount: number;
  }): Promise<any> {
    const url = `${this.omsBaseUrl}/packages/merchantid/${this.config.merchantId}/invoice`;

    const payload = {
      packageNumber: orderNumberOrPackageNumber,
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceDate: invoiceData.invoiceDate,
      invoiceUrl: invoiceData.invoiceUrl || "",
      totalAmount: invoiceData.totalAmount,
      taxAmount: invoiceData.taxAmount,
    };

    try {
      const responseData = await this.withAuthRetry(
        async (headers) => {
          const response = await axios.post(url, payload, { headers, timeout: 20000 });
          return response.data;
        },
        { channel: "oms" }
      );
      await pool.query(
        `UPDATE hepsiburada_orders 
         SET invoice_sent = true, invoice_sent_at = NOW() 
         WHERE store_id = $1 AND (hepsiburada_order_id = $2 OR package_number = $2)`,
        [this.storeId, orderNumberOrPackageNumber]
      );
      return responseData;
    } catch (error: any) {
      throw new Error(`Fatura bilgisi Hepsiburada'ya iletilemedi: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * 7. Webhook Event Handler
   */
  async handleWebhook(event: {
    event_type: string;
    event_time?: string;
    payload: any;
  }): Promise<{ handled: boolean; action?: string; details?: any }> {
    const { event_type, payload } = event;

    await logAction(
      this.storeId,
      null,
      "hb_webhook_received",
      "marketplace_webhook",
      null,
      `Hepsiburada Webhook: ${event_type}`,
      null,
      payload
    );

    if (
      event_type === "order_created" ||
      event_type === "order_status_changed" ||
      event_type === "ORDER_CREATED" ||
      event_type === "PACKAGE_CREATED"
    ) {
      const syncResult = await this.syncOrdersToDatabase();
      return { handled: true, action: "order_synced", details: syncResult };
    }

    if (event_type === "merchant_stock_alert" || event_type === "STOCK_ALERT") {
      // Trigger stock sync for the specific item
      if (payload?.merchantSku) {
        const prod = await pool.query(
          "SELECT * FROM products WHERE store_id = $1 AND barcode = $2",
          [this.storeId, payload.merchantSku]
        );
        if (prod.rows.length > 0) {
          const p = prod.rows[0];
          await this.updatePriceAndStock([
            {
              MerchantSku: p.barcode,
              HepsiburadaSku: p.hepsiburada_sku || "",
              Price: parseFloat(p.price),
              AvailableStock: computeSellableStock(p.stock_quantity, p.reserved_stock),
            },
          ]);
          return { handled: true, action: "stock_updated", details: { barcode: p.barcode } };
        }
      }
    }

    return { handled: true, action: "event_logged", details: { event_type } };
  }

  /**
   * 8. Fetch All Active Merchant Listings from Hepsiburada
   * Queries Hepsiburada Listing API endpoints to retrieve all live/existing products of this merchant
   */
  async fetchMerchantListings(options?: { limit?: number; offset?: number }): Promise<any[]> {
    const merchantId = (this.config.merchantId || "").trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(merchantId);
    if (!merchantId || !isUuid) {
      return [];
    }

    const listingDirectUrl = this.listingDirectUrl;

    const allListingsMap = new Map<string, any>();
    let offset = 0;
    const limit = options?.limit || 100;
    let totalCount = 0;
    let activeHeaders: Record<string, string> | null = null;

    // Direct paginated fetch from official Listing API with auth fallback on page 0
    try {
      while (true) {
        const url = `${listingDirectUrl}/listings/merchantid/${merchantId}?limit=${limit}&offset=${offset}`;
        let res: any;
        if (!activeHeaders) {
          res = await this.withAuthRetry(
            async (hdrs) => {
              const r = await axios.get(url, { headers: hdrs, timeout: 10000 });
              activeHeaders = hdrs;
              return r;
            },
            { channel: "listing" }
          );
        } else {
          res = await axios.get(url, { headers: activeHeaders, timeout: 10000 });
        }
        const rawItems = res.data?.listings || res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        totalCount = res.data?.totalCount || rawItems.length;

        if (Array.isArray(rawItems) && rawItems.length > 0) {
          for (const item of rawItems) {
            const hbSku = String(item.hepsiburadaSku || item.HepsiburadaSku || item.sku || item.hbSku || "").trim();
            const merchantSku = String(item.merchantSku || item.MerchantSku || item.barcode || item.Barcode || item.stockCode || "").trim();
            const productId = String(item.productId || item.ProductId || "").trim();
            const key = hbSku || merchantSku;
            if (key && !allListingsMap.has(key)) {
              allListingsMap.set(key, {
                hepsiburadaSku: hbSku,
                merchantSku: merchantSku,
                productId: productId,
                barcode: merchantSku || item.barcode || item.Barcode || hbSku,
                productName: item.productName || item.name || item.title || item.UrunAdi || "",
                price: parseFloat(item.price || item.Price || item.salePrice || 0) || 0,
                availableStock: parseInt(item.availableStock ?? item.AvailableStock ?? item.stock ?? item.salableStock ?? 0, 10),
                dispatchTime: item.dispatchTime || item.DispatchTime || 1,
                cargoCompany: item.cargoCompany1 || item.cargoCompany || "",
                status: item.status || (item.isSalable ? "ACTIVE" : (item.isSuspended ? "SUSPENDED" : "LOCKED")),
                isSalable: Boolean(item.isSalable),
                isSuspended: Boolean(item.isSuspended),
                isLocked: Boolean(item.isLocked),
                lockReasons: Array.isArray(item.lockReasons) ? item.lockReasons : [],
                deactivationReasons: Array.isArray(item.deactivationReasons) ? item.deactivationReasons : [],
                freezeReasons: Array.isArray(item.freezeReasons) ? item.freezeReasons : [],
                priceIncreaseDisabled: Boolean(item.priceIncreaseDisabled),
                raw: item
              });
            }
          }
        }

        if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length < limit || allListingsMap.size >= totalCount || offset > 2000) {
          break;
        }
        offset += rawItems.length;
      }
    } catch (err: any) {
      // Gracefully stop paginated listing fetch if unauthorized or empty
    }

    return Array.from(allListingsMap.values());
  }

  /**
   * 9. Match Hepsiburada Merchant Listings with Local Store Products
   * Automatically pairs Hepsiburada active items with local database products by barcode/SKU/name
   * and can import missing products directly into the store catalog.
   */
  async matchListingsWithStoreProducts(options?: { importMissing?: boolean }): Promise<{
    success: boolean;
    totalListings: number;
    matchedCount: number;
    importedCount: number;
    updatedCount: number;
    message: string;
    items: any[];
  }> {
    const listings = await this.fetchMerchantListings();
    if (listings.length === 0) {
      return {
        success: true,
        totalListings: 0,
        matchedCount: 0,
        importedCount: 0,
        updatedCount: 0,
        message: "Hepsiburada hesabınızda listelenmiş ürün bulunamadı veya API bağlantısı ile liste boş döndü.",
        items: []
      };
    }

    const storeRateRes = await pool.query(
      "SELECT currency_rates, hepsiburada_settings, branding->'currency_rates' as branding_currency_rates, branding->'hepsiburada_settings' as branding_hb_settings FROM stores WHERE id = $1",
      [this.storeId]
    );
    const storeRow = storeRateRes.rows[0] || {};
    let brRates: any = storeRow.branding_currency_rates || {};
    if (typeof brRates === "string") {
      try { brRates = JSON.parse(brRates); } catch (e) { brRates = {}; }
    }
    let dbRates: any = storeRow.currency_rates || {};
    if (typeof dbRates === "string") {
      try { dbRates = JSON.parse(dbRates); } catch (e) { dbRates = {}; }
    }
    let hbDbCfg: any = storeRow.hepsiburada_settings || {};
    if (typeof hbDbCfg === "string") {
      try { hbDbCfg = JSON.parse(hbDbCfg); } catch { hbDbCfg = {}; }
    }
    let hbBrCfg: any = storeRow.branding_hb_settings || {};
    if (typeof hbBrCfg === "string") {
      try { hbBrCfg = JSON.parse(hbBrCfg); } catch { hbBrCfg = {}; }
    }
    const ownHbSellerName = String(
      this.config?.merchantName ||
      this.config?.storeName ||
      hbDbCfg?.merchantName ||
      hbDbCfg?.storeName ||
      hbBrCfg?.merchantName ||
      hbBrCfg?.storeName ||
      ""
    ).trim();
    const effectiveRates: Record<string, number> = {
      ...(brRates || {}),
      ...(dbRates || {})
    };

    const prodRes = await pool.query(
      "SELECT id, name, barcode, sku, product_code, brand, price, currency, category, sub_category, stock_quantity, hepsiburada_sku, hepsiburada_url, is_hepsiburada_active, hepsiburada_last_error, marketplace_data, sector_data->'alternate_barcodes' as alternate_barcodes FROM products WHERE store_id = $1",
      [this.storeId]
    );
    const storeProducts = prodRes.rows;

    let matchedCount = 0;
    let importedCount = 0;
    let updatedCount = 0;
    const matchResults: any[] = [];

    const importMissing = options?.importMissing === true;

    function normalizeStr(str: string): string {
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

    const activeMatchedIds = new Set<number>();
    const sortedListings = [...listings].sort((a, b) => {
      const aLive = a.status === "ACTIVE" && a.isSalable !== false && Number(a.availableStock || 0) > 0 ? 1 : 0;
      const bLive = b.status === "ACTIVE" && b.isSalable !== false && Number(b.availableStock || 0) > 0 ? 1 : 0;
      return bLive - aLive;
    });

    for (const listing of sortedListings) {
      const hbSku = (listing.hepsiburadaSku || "").trim();
      const lPid = (listing.productId || "").trim();
      const mSku = (listing.merchantSku || "").trim();
      const barcode = (listing.barcode || "").trim();
      const pName = (listing.productName || "").trim();
      const cleanMSku = mSku.replace(/_\d+$/, "").replace(/-s$/i, "").trim();
      const mSkuDigits = mSku.replace(/\D/g, "");

      const availableProducts = storeProducts.filter((p) => !activeMatchedIds.has(p.id));

      // Tier 1: Exact HB-SKU, Parent Catalog ProductId (-pm-HBC0...), Exact Barcode, or Alternate Barcode
      let matchedProd = availableProducts.find((p) => {
        const pBarcode = (p.barcode || "").trim();
        const pHbSku = (p.hepsiburada_sku || "").trim();

        let rawAltBc = p.alternate_barcodes;
        if (typeof rawAltBc === "string") { try { rawAltBc = JSON.parse(rawAltBc); } catch { rawAltBc = []; } }
        const altBc = Array.isArray(rawAltBc) ? rawAltBc.map(String) : [];

        let mpData = p.marketplace_data;
        if (typeof mpData === "string") { try { mpData = JSON.parse(mpData); } catch { mpData = {}; } }
        const mpHbSku = (mpData?.hepsiburada?.hepsiburadaSku || mpData?.hepsiburadaSku || "").trim();
        const mpHbPid = (mpData?.hepsiburada?.productId || "").trim();
        const mpHbMSku = (mpData?.hepsiburada?.merchantSku || "").trim();

        if (hbSku && pHbSku && normalizeStr(pHbSku) === normalizeStr(hbSku)) return true;
        if (hbSku && mpHbSku && normalizeStr(mpHbSku) === normalizeStr(hbSku)) return true;
        if (hbSku && mpHbPid && normalizeStr(mpHbPid) === normalizeStr(hbSku)) return true;
        if (lPid && pHbSku && normalizeStr(pHbSku) === normalizeStr(lPid)) return true;
        if (lPid && mpHbSku && normalizeStr(mpHbSku) === normalizeStr(lPid)) return true;
        if (lPid && mpHbPid && normalizeStr(mpHbPid) === normalizeStr(lPid)) return true;
        if (hbSku && pBarcode && normalizeStr(pBarcode) === normalizeStr(hbSku)) return true;

        if (mSku && pBarcode && normalizeStr(pBarcode) === normalizeStr(mSku)) return true;
        if (mSku && mpHbMSku && normalizeStr(mpHbMSku) === normalizeStr(mSku)) return true;
        if (barcode && pBarcode && normalizeStr(pBarcode) === normalizeStr(barcode)) return true;
        if (altBc.some((b) => normalizeStr(b) === normalizeStr(mSku) || normalizeStr(b) === normalizeStr(barcode))) return true;
        return false;
      });

      // Tier 2: Exact SKU / Product Code / Digits-Only Barcode / Exact Product Name
      if (!matchedProd) {
        matchedProd = availableProducts.find((p) => {
          const pBarcode = (p.barcode || "").trim();
          const pBcDigits = pBarcode.replace(/\D/g, "");
          const pSku = (p.sku || "").trim();
          const pCode = (p.product_code || "").trim();
          const pNameStr = (p.name || "").trim();

          if (mSku && pSku && normalizeStr(pSku) === normalizeStr(mSku)) return true;
          if (mSku && pCode && normalizeStr(pCode) === normalizeStr(mSku)) return true;
          if (cleanMSku && pSku && normalizeStr(pSku) === normalizeStr(cleanMSku)) return true;
          if (cleanMSku && pCode && normalizeStr(pCode) === normalizeStr(cleanMSku)) return true;
          if (pName && pNameStr && normalizeStr(pNameStr) === normalizeStr(pName)) return true;

          if (mSkuDigits && mSkuDigits.length >= 8 && pBcDigits) {
            if (pBcDigits === mSkuDigits) return true;
            if (pBcDigits.endsWith(mSkuDigits) || mSkuDigits.endsWith(pBcDigits)) return true;
          }
          return false;
        });
      }

      // Tier 3: Clean Model / Part Number in Name, Code, Barcode with Capacity Conflict Guard
      if (!matchedProd && cleanMSku && cleanMSku.length >= 3 && !cleanMSku.startsWith("HBCV") && !cleanMSku.startsWith("HBV") && !cleanMSku.startsWith("20025")) {
        const capMatch = cleanMSku.match(/(?:^|[^0-9])(8|16|32|64|120|128|240|256|480|500|512|960|1000|2000)\s*(gb|g|tb)\b/i);
        const requiredCapNum = capMatch ? capMatch[1] : null;

        matchedProd = availableProducts.find((p) => {
          const pBarcode = (p.barcode || "").trim();
          const pSku = (p.sku || "").trim();
          const pCode = (p.product_code || "").trim();
          const pNameStr = (p.name || "").trim();

          // If listing merchantSku specifies a capacity (e.g. 120G, 64G), candidate product name must match that capacity
          if (requiredCapNum) {
            const capRegex = new RegExp(`(?:^|[^0-9])${requiredCapNum}\\s*(?:gb|g|tb)\\b`, "i");
            if (!capRegex.test(pNameStr) && !capRegex.test(pSku) && !capRegex.test(pCode)) {
              return false;
            }
          }

          const normClean = normalizeStr(cleanMSku);
          const normName = normalizeStr(pNameStr);
          const normBarcode = normalizeStr(pBarcode);
          const normSku = normalizeStr(pSku);
          const normCode = normalizeStr(pCode);

          if (normClean && normName && normName.includes(normClean)) return true;

          const tokens = cleanMSku
            .split(/[-_/ ]+/)
            .filter((t) => t.length >= 3 && !["SSD", "USB", "KABLO", "GIGABIT", "DÖNÜŞTÜRÜCÜ"].includes(t.toUpperCase()));
          if (tokens.length > 0) {
            const allTokensInName = tokens.every((t) => normName && normName.includes(normalizeStr(t)));
            if (allTokensInName) return true;
          }

          if (!requiredCapNum) {
            if (normClean && normCode && (normCode === normClean || (normCode.length >= 5 && normClean.includes(normCode)) || normCode.includes(normClean))) return true;
            if (normClean && normSku && (normSku === normClean || (normSku.length >= 5 && normClean.includes(normSku)) || normSku.includes(normClean))) return true;
            if (normClean && normBarcode && (normBarcode === normClean || (normBarcode.length >= 6 && normBarcode.includes(normClean)))) return true;

            for (const token of tokens) {
              const nTok = normalizeStr(token);
              if (nTok.length >= 5 && ((normName && normName.includes(nTok)) || (normBarcode && normBarcode.includes(nTok)))) {
                return true;
              }
            }

            const numPart = cleanMSku.replace(/^[a-zA-Z]+/, "");
            if (numPart && numPart.length >= 5) {
              if (normBarcode && normBarcode.includes(numPart)) return true;
              if (normName && normName.includes(numPart)) return true;
            }
          }

          return false;
        });
      }

      if (matchedProd) {
        activeMatchedIds.add(matchedProd.id);

        // Update matched product in database
        let mpData: any = matchedProd.marketplace_data;
        if (typeof mpData === "string") {
          try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
        }
        mpData = mpData || {};
        const resolvedPid = lPid || hbSku || mpData?.hepsiburada?.productId || matchedProd.hepsiburada_sku || '';
        const resolvedUrl =
          buildHepsiburadaProductUrl({
            name: matchedProd.name || pName || 'urun',
            hepsiburadaSku: hbSku || matchedProd.hepsiburada_sku || mpData?.hepsiburada?.hepsiburadaSku || null,
            productId: lPid || mpData?.hepsiburada?.productId || null,
            fallbackSku: matchedProd.sku || matchedProd.product_code || null,
            barcode: matchedProd.barcode || null,
            sellerName: ownHbSellerName || null,
            fallbackToSearch: true,
          }) || undefined;

        const pPrice = Number(matchedProd.price || listing.price || 0);
        const pStock = Number(matchedProd.stock_quantity !== undefined ? matchedProd.stock_quantity : (listing.availableStock || 0));
        const isLiveOnHb = listing.status === 'ACTIVE' && listing.isSalable !== false && Number(listing.availableStock ?? pStock) > 0;
        const isManuallyUnpublished = mpData.hepsiburada?.manuallyUnpublished === true && !isLiveOnHb;
        const isValidForListing = !isManuallyUnpublished && pPrice > 0 && pStock > 0 && isLiveOnHb;

        let rawPriceTry = Number(matchedProd.price || 0);
        const curr = String(matchedProd.currency || "TRY").toUpperCase();
        if (curr === "USD" && effectiveRates.USD) rawPriceTry *= Number(effectiveRates.USD);
        else if (curr === "EUR" && effectiveRates.EUR) rawPriceTry *= Number(effectiveRates.EUR);
        else if (curr === "GBP" && effectiveRates.GBP) rawPriceTry *= Number(effectiveRates.GBP);

        const policyPrice = rawPriceTry > 0
          ? this.calculateMarketplacePrice(rawPriceTry, matchedProd.category, matchedProd.sub_category)
          : Number(listing.price || 0);

        const allReasons: string[] = [
          ...(Array.isArray(listing.lockReasons) ? listing.lockReasons : []),
          ...(Array.isArray(listing.deactivationReasons) ? listing.deactivationReasons : []),
          ...(Array.isArray(listing.freezeReasons) ? listing.freezeReasons : []),
        ].map(String);

        let hbErrorMsg: string | null = null;
        let hbPriceAlert = false;
        let hbErrorType: string | null = null;

        if (!isValidForListing && !isManuallyUnpublished && pPrice > 0 && pStock > 0 && listing.status !== 'PENDING_APPROVAL') {
          const hasPriceReason = allReasons.some((r) =>
            /price|fiyat|exorbitant|overpriced|maxprice|pricelimit|pricerange/i.test(r)
          );
          const prevErr = String(matchedProd.hepsiburada_last_error || "");
          const hadPriceErr = /yüksek fiyat|fiyat limiti|fahiş|aralığın dışında|tavan fiyat|pricevalidation/i.test(prevErr);

          if (hasPriceReason || hadPriceErr || (listing.priceIncreaseDisabled && allReasons.length === 0)) {
            hbErrorMsg = "Yüksek Fiyat";
            hbPriceAlert = true;
            hbErrorType = "HIGH_PRICE";
          } else if (allReasons.includes("BrandError")) {
            hbErrorMsg = "Marka Onayı";
            hbErrorType = "BRAND_ERROR";
          } else if (allReasons.includes("DesignViolation")) {
            hbErrorMsg = "İhlal Kısıtı";
            hbErrorType = "DESIGN_VIOLATION";
          } else if (allReasons.includes("ProvidedCounterfeitProduct")) {
            hbErrorMsg = "Belge Kısıtı";
            hbErrorType = "COUNTERFEIT_CHECK";
          } else if (allReasons.includes("SalesRestriction")) {
            hbErrorMsg = "Satış Kısıtı";
            hbErrorType = "SALES_RESTRICTION";
          } else if (allReasons.includes("ByHbAdmin")) {
            hbErrorMsg = "HB Kilitli";
            hbErrorType = "ADMIN_LOCKED";
          } else if (allReasons.length > 0) {
            hbErrorMsg = "Kilitli İlan";
            hbErrorType = "LOCKED";
          }
        }

        const newStatus = isValidForListing ? 'ACTIVE' : (listing.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'INACTIVE');
        const prevHb = mpData.hepsiburada || {};
        const needsDbWrite =
          Boolean(matchedProd.is_hepsiburada_active) !== Boolean(isValidForListing) ||
          (hbSku && matchedProd.hepsiburada_sku !== hbSku) ||
          (mSku && prevHb.merchantSku !== mSku) ||
          (resolvedPid && prevHb.productId !== resolvedPid) ||
          (resolvedUrl && prevHb.productUrl !== resolvedUrl) ||
          (resolvedUrl && matchedProd.hepsiburada_url !== resolvedUrl) ||
          (matchedProd.hepsiburada_last_error || null) !== (hbErrorMsg || null) ||
          prevHb.status !== newStatus ||
          Boolean(prevHb.priceAlert) !== Boolean(hbPriceAlert) ||
          Math.abs(Number(prevHb.price || 0) - Number(policyPrice || 0)) > 0.01;

        mpData.hepsiburada = {
          ...prevHb,
          hepsiburadaSku: hbSku || prevHb.hepsiburadaSku,
          merchantSku: mSku || prevHb.merchantSku,
          productId: resolvedPid,
          productUrl: resolvedUrl,
          price: policyPrice,
          priceAlert: hbPriceAlert,
          errorType: hbErrorType,
          lockReasons: allReasons,
          attributes: {
            ...(prevHb.attributes || {}),
            price: String(policyPrice),
          },
          matchedAt: prevHb.matchedAt || new Date().toISOString(),
          lastSync: new Date().toISOString(),
          status: newStatus
        };
        if (isValidForListing) {
          delete mpData.hepsiburada.manuallyUnpublished;
        } else if (isManuallyUnpublished) {
          mpData.hepsiburada.manuallyUnpublished = true;
        }

        matchedCount++;
        if (needsDbWrite) {
          updatedCount++;
        }
        matchResults.push({
          action: 'matched',
          productId: matchedProd.id,
          productName: matchedProd.name,
          barcode: matchedProd.barcode,
          hepsiburadaSku: hbSku || matchedProd.hepsiburada_sku,
          parentProductId: lPid || null,
          price: policyPrice || listing.price,
          stock: listing.availableStock,
          updateSql: needsDbWrite ? {
            text: `UPDATE products 
                   SET is_hepsiburada_active = $1,
                       hepsiburada_sku = COALESCE(NULLIF($2, ''), hepsiburada_sku),
                       hepsiburada_url = COALESCE(NULLIF($3, ''), hepsiburada_url),
                       hepsiburada_last_sync = NOW(),
                       hepsiburada_last_error = $4,
                       marketplace_data = $5
                   WHERE id = $6 AND store_id = $7`,
            values: [
              isValidForListing,
              hbSku || null,
              resolvedUrl || null,
              hbErrorMsg,
              JSON.stringify(mpData),
              matchedProd.id,
              this.storeId
            ]
          } : null
        });
      }
    }

    // Execute database operations in parallel batches ONLY for items that actually changed
    const itemsToUpdate = matchResults.filter((item) => item.updateSql);
    const BATCH_SIZE = 25;
    for (let i = 0; i < itemsToUpdate.length; i += BATCH_SIZE) {
      const chunk = itemsToUpdate.slice(i, i + BATCH_SIZE);
      await Promise.all(chunk.map(async (item) => {
        if (item.updateSql) {
          await pool.query(item.updateSql.text, item.updateSql.values);
        }
        // Clean up any duplicate/stale assignment of the same HB SKU or Parent Product ID on other products
        if (item.hepsiburadaSku) {
          await pool.query(
            `UPDATE products
             SET hepsiburada_sku = NULL,
                 is_hepsiburada_active = false
             WHERE store_id = $1
               AND id != $2
               AND (hepsiburada_sku = $3 OR ($4::text IS NOT NULL AND hepsiburada_sku = $4))`,
            [this.storeId, item.productId, item.hepsiburadaSku, item.parentProductId || null]
          ).catch(() => {});
        }
      }));
    }

    return {
      success: true,
      totalListings: listings.length,
      matchedCount,
      importedCount,
      updatedCount,
      message: `Hepsiburada'daki ${listings.length} ilandan ${matchedCount} tanesi paneldeki ürünlerle eşleştirildi, ${importedCount} yeni ürün içeri aktarıldı.`,
      items: matchResults
    };
  }
}

