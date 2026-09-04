import axios, { AxiosInstance } from "axios";
import { pool, logAction } from "../../../models/db";
import { IntegrationService } from "../IntegrationService";
import { processMarketplaceOrderLines } from "../marketplaceSync";

export interface HepsiburadaConfig {
  merchantId: string;
  apiKey: string;
  apiSecret: string;
  isTestMode?: boolean;
  userAgent?: string;
  defaultDispatchTime?: number;
  defaultCargoCompany?: string;
  autoSyncOrders?: boolean;
  autoStockSync?: boolean;
  webhookSecret?: string;
  last_sync?: string | null;
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

  constructor(config: HepsiburadaConfig, storeId: number) {
    this.config = {
      ...config,
      isTestMode: !!config.isTestMode,
      defaultDispatchTime: config.defaultDispatchTime || 1,
    };
    this.storeId = storeId;
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
      : "https://listing-external-v2-gw-prod.hepsiburada.com";
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

  // Generate Base64 Auth header and mandatory User-Agent
  private getHeaders(): Record<string, string> {
    const rawCredentials = `${this.config.apiKey.trim()}:${this.config.apiSecret.trim()}`;
    const base64Auth = Buffer.from(rawCredentials).toString("base64");
    const userAgent =
      this.config.userAgent ||
      `${this.config.merchantId} - LookPrice Marketplace Manager`;

    return {
      Authorization: `Basic ${base64Auth}`,
      "User-Agent": userAgent,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * 1. Test Connection:
   * Verifies credentials against both OMS and Listing endpoints
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    const headers = this.getHeaders();
    let omsOk = false;
    let listingOk = false;
    let lastError = "";

    // Test OMS endpoint
    try {
      const res = await axios.get(
        `${this.omsBaseUrl}/orders/merchantid/${this.config.merchantId}?limit=1`,
        { headers, timeout: 10000 }
      );
      if (res.status === 200) omsOk = true;
    } catch (e: any) {
      // Fallback test with legacy merchant api if OMS fails
      try {
        const legacyRes = await axios.get(
          `https://merchant.hepsiburada.com/api/orders/merchantid/${this.config.merchantId}`,
          {
            auth: { username: this.config.apiKey, password: this.config.apiSecret },
            timeout: 10000,
          }
        );
        if (legacyRes.status === 200) omsOk = true;
      } catch (err2: any) {
        lastError = e.response?.data?.message || e.message || "OMS Bağlantı hatası";
      }
    }

    // Test Listing endpoint
    try {
      const res = await axios.get(
        `${this.listingBaseUrl}/inventory/import/status/${this.config.merchantId}/task/test-ping`,
        { headers, timeout: 10000 }
      );
      // Even a 404 for a dummy task indicates auth succeeded
      if (res.status === 200 || res.status === 404) listingOk = true;
    } catch (e: any) {
      if (e.response?.status === 404 || e.response?.status === 400) {
        listingOk = true; // Authorized, but resource not found
      } else if (e.response?.status === 401 || e.response?.status === 403) {
        lastError = "Listing API yetkilendirme hatası (API Key veya Secret geçersiz).";
      }
    }

    const success = omsOk || listingOk;
    return {
      success,
      message: success
        ? "Hepsiburada API bağlantısı başarılı."
        : `Bağlantı başarısız: ${lastError || "Kimlik doğrulama reddedildi"}`,
      details: { omsOk, listingOk, isTestMode: this.config.isTestMode },
    };
  }

  /**
   * 2. Sipariş Servisi (Order / OMS Service)
   * Fetches orders from Hepsiburada with support for filters and statuses
   */
  async fetchOrders(options?: {
    status?: "open" | "unpacked" | "ready_to_ship" | "in_transit" | "delivered" | "cancelled" | "all";
    offset?: number;
    limit?: number;
    beginDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    const headers = this.getHeaders();
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    let url = `${this.omsBaseUrl}/orders/merchantid/${this.config.merchantId}?limit=${limit}&offset=${offset}`;

    if (options?.status && options.status !== "all") {
      url += `&status=${options.status}`;
    }
    if (options?.beginDate) {
      url += `&begindate=${encodeURIComponent(options.beginDate)}`;
    }
    if (options?.endDate) {
      url += `&enddate=${encodeURIComponent(options.endDate)}`;
    }

    try {
      const response = await axios.get(url, { headers, timeout: 30000 });
      const orders = response.data?.items || response.data?.orders || response.data || [];
      return Array.isArray(orders) ? orders : [];
    } catch (error: any) {
      // Try fallback to legacy merchant endpoint if OMS endpoint returns 404/500
      try {
        const legacyRes = await axios.get(
          `https://merchant.hepsiburada.com/api/orders/merchantid/${this.config.merchantId}`,
          {
            auth: { username: this.config.apiKey, password: this.config.apiSecret },
            timeout: 30000,
          }
        );
        return legacyRes.data?.orders || legacyRes.data || [];
      } catch (legacyErr: any) {
        throw new Error(
          `Hepsiburada siparişleri alınamadı: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  }

  /**
   * Sync Hepsiburada Orders to Local Database:
   * Creates customers, sales, sales invoices, stock movements, and hepsiburada_orders rows.
   */
  async syncOrdersToDatabase(): Promise<{ syncedCount: number; errors: any[] }> {
    const rawOrders = await this.fetchOrders({ limit: 50 });
    let syncedCount = 0;
    const errors: any[] = [];

    for (const order of rawOrders) {
      const orderId = String(order.id || order.orderNumber || order.orderId);
      if (!orderId) continue;

      const existing = await pool.query(
        "SELECT id FROM hepsiburada_orders WHERE store_id = $1 AND hepsiburada_order_id = $2",
        [this.storeId, orderId]
      );

      if (existing.rows.length === 0) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");

          // Extract Customer Info
          const customerName =
            order.customer ||
            order.recipientName ||
            order.deliveryAddress?.recipientName ||
            order.shippingAddress?.fullName ||
            "Hepsiburada Müşterisi";
          const customerEmail =
            order.email ||
            order.customerEmail ||
            `hb_${orderId}@hepsiburada.local`;
          const customerPhone =
            order.phone ||
            order.deliveryAddress?.phoneNumber ||
            order.shippingAddress?.phoneNumber ||
            "";

          // Find or create customer
          let customerId = null;
          const custRes = await client.query(
            "SELECT id FROM customers WHERE store_id = $1 AND (email = $2 OR (phone = $3 AND phone != ''))",
            [this.storeId, customerEmail, customerPhone]
          );

          if (custRes.rows.length > 0) {
            customerId = custRes.rows[0].id;
          } else {
            const rawCustName = (customerName || '').trim();
            const nameParts = rawCustName.split(' ');
            const surnameVal = nameParts.length > 1 ? nameParts.pop()! : '';
            const firstNameVal = nameParts.join(' ') || rawCustName;

            const newCust = await client.query(
              "INSERT INTO customers (store_id, email, password, full_name, name, surname, phone, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
              [
                this.storeId,
                customerEmail,
                "marketplace_user",
                rawCustName,
                firstNameVal,
                surnameVal,
                customerPhone,
                order.deliveryAddress?.address || order.shippingAddress?.address || "",
              ]
            );
            customerId = newCust.rows[0].id;
          }

          // Calculate Financials
          const orderTotal =
            parseFloat(
              order.total ||
                order.totalPrice?.amount ||
                order.grossAmount ||
                order.totalAmount ||
                0
            ) || 0;
          const taxAmount = orderTotal * (20 / 120); // standard 20% VAT
          const subtotal = orderTotal - taxAmount;
          const grandTotal = orderTotal;

          // Create Sale
          const saleRes = await client.query(
            `INSERT INTO sales 
              (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [
              this.storeId,
              grandTotal,
              order.currency || "TRY",
              "completed",
              customerName,
              customerId,
              "Hepsiburada Satış",
              `Hepsiburada Siparişi: #${orderId}`,
            ]
          );
          const saleId = saleRes.rows[0].id;

          // Create Sales Invoice
          const invoiceNumber = `HB-${orderId}`;
          const invoiceRes = await client.query(
            `INSERT INTO sales_invoices 
              (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
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
              `Hepsiburada Siparişi: #${orderId}`,
              "marketplace",
              "completed",
            ]
          );
          const salesInvoiceId = invoiceRes.rows[0].id;

          // Extract and map order lines
          const items =
            order.items ||
            order.lines ||
            order.orderItems ||
            order.lineItems ||
            [];
          const mappedLines = items.map((l: any) => ({
            name:
              l.productName ||
              l.name ||
              l.merchantSku ||
              `Hepsiburada Sipariş Kalemi (${orderId})`,
            quantity: Number(l.quantity || l.qty || 1),
            price:
              parseFloat(
                l.price?.amount || l.unitPrice || l.price || l.totalPrice || 0
              ) || subtotal,
            barcode: l.merchantSku || l.barcode || l.hbSku || l.sku,
            sku: l.merchantSku || l.sku,
            taxRate: Number(l.vatRate || 20),
          }));

          if (mappedLines.length > 0) {
            await processMarketplaceOrderLines(
              client,
              this.storeId,
              saleId,
              salesInvoiceId,
              mappedLines,
              "Hepsiburada",
              orderId
            );
          } else {
            await client.query(
              `INSERT INTO sales_invoice_items 
                (sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) 
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                salesInvoiceId,
                `Hepsiburada Sipariş Kalemi (#${orderId})`,
                1,
                subtotal,
                20,
                taxAmount,
                grandTotal,
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
          syncedCount++;
        } catch (err: any) {
          await client.query("ROLLBACK");
          console.error(`HB Order ${orderId} sync error:`, err);
          errors.push({ orderId, error: err.message });
        } finally {
          client.release();
        }
      }
    }

    // Update last sync time
    const updatedSettings = {
      ...this.config,
      last_sync: new Date().toISOString(),
    };
    await pool.query(
      "UPDATE stores SET hepsiburada_settings = $1 WHERE id = $2",
      [updatedSettings, this.storeId]
    );

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

    const headers = this.getHeaders();
    const payload = items.map((item) => ({
      HepsiburadaSku: item.HepsiburadaSku || "",
      MerchantSku: item.MerchantSku,
      Price: Number(item.Price),
      AvailableStock: Number(item.AvailableStock),
      DispatchTime: Number(item.DispatchTime || this.config.defaultDispatchTime || 1),
      MaximumPurchasableQuantity: item.MaximumPurchasableQuantity || 10,
    }));

    try {
      const url = `${this.listingBaseUrl}/inventory/import/${this.config.merchantId}`;
      const response = await axios.post(url, payload, { headers, timeout: 30000 });
      const trackingId = response.data?.trackingId || response.data?.id || response.data?.taskId;

      return {
        success: true,
        trackingId,
        message: `${items.length} adet ürün fiyat/stok güncellemesi Hepsiburada kuyruğuna iletildi.`,
        details: response.data,
      };
    } catch (error: any) {
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Fiyat/Stok güncelleme başarısız.";
      throw new Error(errMsg);
    }
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
    const prodRes = await pool.query(
      `SELECT id, barcode, price, stock_quantity, hepsiburada_sku, is_hepsiburada_active 
       FROM products 
       WHERE store_id = $1 AND (is_hepsiburada_active = true OR barcode IS NOT NULL) AND barcode != ''`,
      [this.storeId]
    );

    const products = prodRes.rows;
    if (products.length === 0) {
      return { total: 0, successCount: 0, failedCount: 0 };
    }

    const inventoryItems: HepsiburadaInventoryItem[] = products.map((p) => ({
      MerchantSku: p.barcode,
      HepsiburadaSku: p.hepsiburada_sku || "",
      Price: parseFloat(p.price || "0"),
      AvailableStock: parseInt(p.stock_quantity || "0", 10),
      DispatchTime: this.config.defaultDispatchTime || 1,
    }));

    try {
      const res = await this.updatePriceAndStock(inventoryItems);
      // Mark products as active and record sync timestamp
      await pool.query(
        `UPDATE products 
         SET is_hepsiburada_active = true, 
             hepsiburada_last_sync = NOW(), 
             hepsiburada_last_error = NULL 
         WHERE store_id = $1 AND barcode = ANY($2)`,
        [this.storeId, inventoryItems.map((i) => i.MerchantSku)]
      );

      return {
        total: products.length,
        successCount: products.length,
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
    const headers = this.getHeaders();
    const url = `${this.listingBaseUrl}/inventory/import/status/${this.config.merchantId}/task/${taskId}`;
    const response = await axios.get(url, { headers, timeout: 15000 });
    return response.data;
  }

  /**
   * 5. Katalog & Kategori Servisi (Catalog & Categories)
   */
  async getAllCategories(): Promise<any[]> {
    const headers = this.getHeaders();
    try {
      const url = `${this.catalogBaseUrl}/categories/get-all-categories`;
      const response = await axios.get(url, { headers, timeout: 30000 });
      return response.data?.data || response.data?.categories || response.data || [];
    } catch (error: any) {
      // Fallback category endpoint
      try {
        const fallbackUrl = `https://catalog-external.hepsiburada.com/categories`;
        const res = await axios.get(fallbackUrl, { headers, timeout: 20000 });
        return res.data?.data || res.data || [];
      } catch (err2: any) {
        throw new Error(`Kategori listesi alınamadı: ${error.message}`);
      }
    }
  }

  async getCategoryAttributes(categoryId: number | string): Promise<any> {
    const headers = this.getHeaders();
    try {
      const url = `${this.catalogBaseUrl}/categories/${categoryId}/attributes`;
      const response = await axios.get(url, { headers, timeout: 20000 });
      return response.data?.data || response.data || {};
    } catch (error: any) {
      throw new Error(`Kategori özellikleri alınamadı: ${error.message}`);
    }
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
    const headers = this.getHeaders();
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
      const response = await axios.post(url, payload, { headers, timeout: 20000 });
      await pool.query(
        `UPDATE hepsiburada_orders 
         SET invoice_sent = true, invoice_sent_at = NOW() 
         WHERE store_id = $1 AND (hepsiburada_order_id = $2 OR package_number = $2)`,
        [this.storeId, orderNumberOrPackageNumber]
      );
      return response.data;
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
              AvailableStock: parseInt(p.stock_quantity),
            },
          ]);
          return { handled: true, action: "stock_updated", details: { barcode: p.barcode } };
        }
      }
    }

    return { handled: true, action: "event_logged", details: { event_type } };
  }
}

