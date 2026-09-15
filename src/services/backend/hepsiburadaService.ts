import axios, { AxiosInstance } from "axios";
import FormData from "form-data";
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

  // Generate Base64 Auth header and mandatory User-Agent
  private getHeaders(customUsername?: string, customUserAgent?: string): Record<string, string> {
    const apiKey = (this.config.apiKey || "").trim();
    const apiSecret = (this.config.apiSecret || "").trim();
    const merchantId = (this.config.merchantId || "").trim();

    const username = (customUsername || merchantId || apiKey || "lookprice_dev").trim();
    const rawCredentials = `${username}:${apiSecret}`;
    const base64Auth = Buffer.from(rawCredentials).toString("base64");
    const userAgent = customUserAgent || this.config.userAgent || "lookprice_dev";

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
    const apiKey = (this.config.apiKey || "lookprice_dev").trim();
    const apiSecret = (this.config.apiSecret || "").trim();
    const merchantId = (this.config.merchantId || "").trim();

    if (!merchantId || !apiSecret) {
      return {
        success: false,
        message: "Hepsiburada API bilgileri eksik (Merchant ID veya API Secret şifresi girilmemiş).",
        error: "Merchant ID veya API Secret şifresi eksik."
      };
    }

    // Standard candidate auth options used by Hepsiburada integrations
    const candidates = [
      { username: merchantId, userAgent: "lookprice_dev" },
      { username: apiKey, userAgent: "lookprice_dev" },
      { username: merchantId, userAgent: `lookprice_dev - ${merchantId}` },
      { username: apiKey, userAgent: `lookprice_dev - ${merchantId}` },
      { username: merchantId, userAgent: `${merchantId} - lookprice_dev` },
    ];

    let workingCandidate: { username: string; userAgent: string } | null = null;
    let omsOk = false;
    let listingOk = false;
    let lastError = "";

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
          break;
        }
      } catch (e: any) {
        if (e.response?.status === 401 || e.response?.status === 403) {
          lastError = "Hepsiburada Yetkilendirme Hatası (401/403): Merchant ID veya Servis Anahtarı Hepsiburada tarafından henüz onaylanmamış veya geçersiz.";
        } else {
          lastError = e.response?.data?.message || e.response?.data?.error || e.message || "OMS API Bağlantı hatası";
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
            lastError = "";
            break;
          }
        } catch (err2: any) {}
      }
    }

    if (workingCandidate) {
      this.config.apiKey = workingCandidate.username;
      this.config.userAgent = workingCandidate.userAgent;
    }

    // Test Listing endpoint using working candidate or default
    const testHeaders = workingCandidate
      ? this.getHeaders(workingCandidate.username, workingCandidate.userAgent)
      : this.getHeaders();

    try {
      const res = await axios.get(
        `${this.listingBaseUrl}/inventory/import/status/${merchantId}/task/test-ping`,
        { headers: testHeaders, timeout: 8000 }
      );
      if (res.status === 200) listingOk = true;
    } catch (e: any) {
      if (e.response?.status === 404 || e.response?.status === 400) {
        if (!lastError.includes("401") && !lastError.includes("403")) {
          listingOk = true;
        }
      } else if (e.response?.status === 401 || e.response?.status === 403) {
        if (!omsOk) {
          lastError = "Listing API yetkilendirme hatası (401/403): API Key veya Secret geçersiz.";
        }
      }
    }

    const hasAuthError = lastError.includes("401") || lastError.includes("403");
    const success = (omsOk || listingOk) && !hasAuthError;
    const errMsg = lastError || (success ? undefined : "Hepsiburada API sunucusu istek yetkisini reddetti.");

    return {
      success,
      message: success
        ? "Hepsiburada API bağlantısı başarılı."
        : `Bağlantı başarısız: ${errMsg}`,
      error: success ? undefined : errMsg,
      details: { omsOk, listingOk, workingCandidate, isTestMode: this.config.isTestMode, error: lastError },
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

    const allOrdersMap = new Map<string, any>();
    let lastError: any = null;
    const headers = this.getHeaders();

    // Helper to safely extract and insert orders/packages into map
    const processRawItems = (items: any[]) => {
      if (!Array.isArray(items)) return;
      for (const item of items) {
        const id = String(
          item.id ||
          item.orderNumber ||
          item.orderId ||
          item.packageNumber ||
          item.deliveryListNumber ||
          item.trackingNumber ||
          ""
        ).trim();
        if (id && !allOrdersMap.has(id)) {
          allOrdersMap.set(id, item);
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

    for (const url of queryUrls) {
      try {
        const response = await axios.get(url, { headers, timeout: 8000 });
        const rawData = response.data;
        const items = rawData?.items || rawData?.orders || rawData?.packages || (Array.isArray(rawData) ? rawData : []);
        if (Array.isArray(items) && items.length > 0) {
          processRawItems(items);
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    const finalOrders = Array.from(allOrdersMap.values());
    if (finalOrders.length > 0) {
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
        `SELECT id FROM hepsiburada_orders 
         WHERE store_id = $1 AND (
           hepsiburada_order_id = $2 
           OR ($3 != '' AND (
             order_data->>'orderNumber' = $3 
             OR order_data->'items'->0->>'orderNumber' = $3
           ))
         )`,
        [this.storeId, orderId, orderNumber]
      );

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

            const newCust = await client.query(
              `INSERT INTO customers 
                (store_id, email, password, full_name, name, surname, phone, address, tax_number, tax_office, company_title, is_corporate, tc_id) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
              [
                this.storeId,
                customerEmail,
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
            customerId = newCust.rows[0].id;
          }

          // Financial calculations
          const orderTotal =
            parseFloat(
              order.total ||
                order.totalPrice?.amount ||
                order.grossAmount ||
                order.totalAmount ||
                0
            ) || 0;
          const taxAmount = Number((orderTotal * (20 / 120)).toFixed(2));
          const subtotal = Number((orderTotal - taxAmount).toFixed(2));
          const grandTotal = orderTotal;

          // Create Sale
          const saleRes = await client.query(
            `INSERT INTO sales 
              (store_id, total_amount, currency, status, customer_name, customer_id, customer_phone, customer_address, payment_method, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
            [
              this.storeId,
              grandTotal,
              order.currency || "TRY",
              "completed",
              customerName,
              customerId,
              customerPhone,
              fullAddress,
              "Hepsiburada Satış",
              `Hepsiburada Siparişi: #${orderNumber || orderId}`,
            ]
          );
          const saleId = saleRes.rows[0].id;

          // Standardized, compact invoice number (e.g. HB-4741507589)
          const invoiceNumber = orderNumber
            ? `HB-${orderNumber}`
            : `HB-${String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}`;

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
              "completed",
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

          // Extract and map order lines accurately
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

            let netUnitPrice = 0;
            if (rawGross > 0 && qty > 0) {
              const grossUnit = rawGross / qty;
              netUnitPrice = Number((grossUnit / (1 + vatRate / 100)).toFixed(4));
            } else {
              netUnitPrice = Number((subtotal / (qty || 1)).toFixed(4));
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

          if (mappedLines.length > 0) {
            await processMarketplaceOrderLines(
              client,
              this.storeId,
              saleId,
              salesInvoiceId,
              mappedLines,
              "Hepsiburada",
              orderNumber || orderId,
              resolvedCustomerName,
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
    const merchantId = this.config.merchantId;

    const payloadV1 = items.map((item) => {
      const entry: any = {
        merchantSku: String(item.MerchantSku).trim(),
        price: Number(item.Price),
        availableStock: Number(item.AvailableStock),
        dispatchTime: Number(item.DispatchTime || this.config.defaultDispatchTime || 1),
        maximumPurchasableQuantity: Number(item.MaximumPurchasableQuantity || 10),
      };
      if (item.HepsiburadaSku && item.HepsiburadaSku.trim()) {
        entry.hepsiburadaSku = item.HepsiburadaSku.trim();
      }
      return entry;
    });

    const payloadV2 = items.map((item) => {
      const entry: any = {
        MerchantSku: String(item.MerchantSku).trim(),
        Price: Number(item.Price),
        AvailableStock: Number(item.AvailableStock),
        DispatchTime: Number(item.DispatchTime || this.config.defaultDispatchTime || 1),
        MaximumPurchasableQuantity: Number(item.MaximumPurchasableQuantity || 10),
      };
      if (item.HepsiburadaSku && item.HepsiburadaSku.trim()) {
        entry.HepsiburadaSku = item.HepsiburadaSku.trim();
      }
      return entry;
    });

    const listingDirectUrl = this.config.isTestMode
      ? "https://listing-external-sit.hepsiburada.com"
      : "https://listing-external.hepsiburada.com";

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

    let lastError: any = null;
    for (const ep of endpoints) {
      try {
        const response = await axios.post(ep.url, ep.data, { headers, timeout: 30000 });
        const trackingId =
          response.data?.trackingId ||
          response.data?.id ||
          response.data?.taskId ||
          response.data?.data?.trackingId;

        return {
          success: true,
          trackingId,
          message: `${items.length} adet ürün fiyat/stok güncellemesi Hepsiburada (${ep.name}) kuyruğuna iletildi.`,
          details: response.data,
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[HB updatePriceAndStock] ${ep.name} denemesi başarısız oldu:`, err.response?.data || err.message);
      }
    }

    // If bulk endpoints failed, try single-SKU PUT fallback
    if (payloadV2.length > 0) {
      try {
        const singleResults = [];
        for (const item of payloadV2) {
          const singleUrl = `${this.listingBaseUrl}/listings/merchantid/${merchantId}/sku/${encodeURIComponent(item.MerchantSku)}`;
          const singleRes = await axios.put(
            singleUrl,
            {
              price: item.Price,
              availableStock: item.AvailableStock,
              dispatchTime: item.DispatchTime,
            },
            { headers, timeout: 15000 }
          );
          singleResults.push(singleRes.data);
        }

        return {
          success: true,
          message: `${payloadV2.length} adet ürün tekil SKU güncellemesiyle Hepsiburada'ya iletildi.`,
          details: singleResults,
        };
      } catch (putErr: any) {
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

    // Protection against division by zero or negative divisor
    if (commissionRate >= 100) {
      commissionRate = 99.9;
    }

    const divisor = 1 - (commissionRate / 100);
    const calculatedPrice = (rawPrice + fixedFee) / divisor;

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
    const prodRes = await pool.query(
      `SELECT id, name, category, sub_category, barcode, price, currency, stock_quantity, hepsiburada_sku, is_hepsiburada_active, marketplace_data 
       FROM products 
       WHERE store_id = $1 AND (is_hepsiburada_active = true OR barcode IS NOT NULL) AND barcode != ''`,
      [this.storeId]
    );

    const products = prodRes.rows;
    if (products.length === 0) {
      return { total: 0, successCount: 0, failedCount: 0 };
    }

    const storeRes = await pool.query("SELECT currency_rates, branding FROM stores WHERE id = $1", [this.storeId]);
    const storeRow = storeRes.rows[0];
    const rates = storeRow?.currency_rates || storeRow?.branding?.currency_rates || {};

    const inventoryItems: HepsiburadaInventoryItem[] = products.map((p) => {
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
      const hbMerchantSku = mpData?.hepsiburada?.merchantSku || p.barcode;

      return {
        MerchantSku: hbMerchantSku,
        HepsiburadaSku: p.hepsiburada_sku || "",
        Price: effectivePrice,
        AvailableStock: parseInt(p.stock_quantity || "0", 10),
        DispatchTime: this.config.defaultDispatchTime || 1,
      };
    });

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

  async getCategoryAttributeValues(categoryId: number | string, attributeId: string): Promise<any[]> {
    const headers = this.getHeaders();
    try {
      const url = `${this.catalogBaseUrl}/categories/${categoryId}/attribute/${attributeId}/values?page=0&size=100`;
      const response = await axios.get(url, { headers, timeout: 15000 });
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data?.data || [];
    } catch (error: any) {
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

    const form = new FormData();
    form.append("file", Buffer.from(JSON.stringify(payload)), {
      filename: "products.json",
      contentType: "application/json"
    });

    const headers = {
      ...this.getHeaders(),
      ...form.getHeaders()
    };

    const url = `${this.catalogBaseUrl}/products/import`;
    try {
      const response = await axios.post(url, form, { headers, timeout: 30000 });
      const trackingId = response.data?.data?.trackingId || response.data?.trackingId;
      return {
        success: true,
        trackingId,
        message: trackingId ? `Katalog içe aktarımı başlatıldı (Takip No: ${trackingId})` : "Katalog aktarıldı"
      };
    } catch (error: any) {
      const detail = error.response?.data?.message || error.response?.data?.description || error.message;
      throw new Error(`Hepsiburada katalog aktarımı başarısız: ${detail}`);
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

  /**
   * 8. Fetch All Active Merchant Listings from Hepsiburada
   * Queries Hepsiburada Listing API endpoints to retrieve all live/existing products of this merchant
   */
  async fetchMerchantListings(options?: { limit?: number; offset?: number }): Promise<any[]> {
    const merchantId = (this.config.merchantId || "").trim();
    if (!merchantId) {
      throw new Error("Merchant ID bulunamadı.");
    }

    const listingDirectUrl = this.config.isTestMode
      ? "https://listing-external-sit.hepsiburada.com"
      : "https://listing-external.hepsiburada.com";

    const allListingsMap = new Map<string, any>();
    const headers = this.getHeaders();
    let offset = 0;
    const limit = options?.limit || 100;
    let totalCount = 0;

    // Direct paginated fetch from official Listing API
    try {
      while (true) {
        const url = `${listingDirectUrl}/listings/merchantid/${merchantId}?limit=${limit}&offset=${offset}`;
        const res = await axios.get(url, { headers, timeout: 12000 });
        const rawItems = res.data?.listings || res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        totalCount = res.data?.totalCount || rawItems.length;

        if (Array.isArray(rawItems) && rawItems.length > 0) {
          for (const item of rawItems) {
            const hbSku = String(item.hepsiburadaSku || item.HepsiburadaSku || item.sku || item.hbSku || "").trim();
            const merchantSku = String(item.merchantSku || item.MerchantSku || item.barcode || item.Barcode || item.stockCode || "").trim();
            const key = hbSku || merchantSku;
            if (key && !allListingsMap.has(key)) {
              allListingsMap.set(key, {
                hepsiburadaSku: hbSku,
                merchantSku: merchantSku,
                barcode: merchantSku || item.barcode || item.Barcode || hbSku,
                productName: item.productName || item.name || item.title || item.UrunAdi || "",
                price: parseFloat(item.price || item.Price || item.salePrice || 0) || 0,
                availableStock: parseInt(item.availableStock ?? item.AvailableStock ?? item.stock ?? item.salableStock ?? 0, 10),
                dispatchTime: item.dispatchTime || item.DispatchTime || 1,
                cargoCompany: item.cargoCompany1 || item.cargoCompany || "",
                status: item.status || (item.isSalable ? "ACTIVE" : (item.isSuspended ? "SUSPENDED" : "LOCKED")),
                isSalable: Boolean(item.isSalable),
                isSuspended: Boolean(item.isSuspended),
                raw: item
              });
            }
          }
        }

        if (rawItems.length < limit || allListingsMap.size >= totalCount) {
          break;
        }
        offset += limit;
      }
    } catch (err: any) {
      console.warn("[HB-Listings] Error during paginated fetch:", err.response?.data || err.message);
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

    const prodRes = await pool.query(
      "SELECT id, name, barcode, sku, price, stock_quantity, hepsiburada_sku, is_hepsiburada_active, marketplace_data FROM products WHERE store_id = $1",
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

    for (const listing of listings) {
      const hbSku = (listing.hepsiburadaSku || "").trim();
      const mSku = (listing.merchantSku || "").trim();
      const barcode = (listing.barcode || "").trim();
      const pName = (listing.productName || "").trim();
      const cleanMSku = mSku.replace(/_\d+$/, "").replace(/-s$/i, "").trim();

      // Find local product
      let matchedProd = storeProducts.find((p) => {
        const pBarcode = (p.barcode || "").trim();
        const pSku = (p.sku || "").trim();
        const pHbSku = (p.hepsiburada_sku || "").trim();
        const pNameStr = (p.name || "").trim();

        // 1. Direct HB-SKU / Barcode / SKU exact match
        if (hbSku && pHbSku && pHbSku.toLowerCase() === hbSku.toLowerCase()) return true;
        if (mSku && pBarcode && pBarcode.toLowerCase() === mSku.toLowerCase()) return true;
        if (barcode && pBarcode && pBarcode.toLowerCase() === barcode.toLowerCase()) return true;
        if (mSku && pSku && pSku.toLowerCase() === mSku.toLowerCase()) return true;
        if (hbSku && pBarcode && pBarcode.toLowerCase() === hbSku.toLowerCase()) return true;
        if (pName && pNameStr && pNameStr.toLowerCase() === pName.toLowerCase()) return true;

        // 2. Smart Model / Part Number in Name or Barcode (e.g. M90, EAP787, DA-70167)
        if (cleanMSku && cleanMSku.length >= 3 && !cleanMSku.startsWith("HBCV") && !cleanMSku.startsWith("20025")) {
          const normClean = normalizeStr(cleanMSku);
          const normName = normalizeStr(pNameStr);
          const normBarcode = normalizeStr(pBarcode);
          const normSku = normalizeStr(pSku);

          if (normName.includes(normClean)) return true;
          if (normBarcode === normClean || (normBarcode.length >= 6 && normBarcode.includes(normClean))) return true;
          if (normSku === normClean) return true;

          // 3. Sub-tokens (e.g. HS-SSD-C100/120G -> C100 and 120G, ATEN-UC232A -> UC232A, L32656-005 -> L32656)
          const tokens = cleanMSku.split(/[-_/ ]+/).filter(t => t.length >= 3 && !["SSD", "USB", "KABLO", "GIGABIT"].includes(t.toUpperCase()));
          if (tokens.length > 0) {
            const allTokensInName = tokens.every(t => normName.includes(normalizeStr(t)));
            if (allTokensInName) return true;
          }

          // 4. Significant alphanumeric token (e.g. UC232A, L32656)
          for (const token of tokens) {
            if (token.length >= 5 && (normName.includes(normalizeStr(token)) || (pBarcode && pBarcode.includes(token)))) {
              return true;
            }
          }

          // 5. Number part in barcode (e.g. TRU16977 -> 16977 in barcode 8713439169775)
          const numPart = cleanMSku.replace(/^[a-zA-Z]+/, "");
          if (numPart && numPart.length >= 4) {
            if (pBarcode && pBarcode.includes(numPart)) return true;
            if (pNameStr && pNameStr.includes(numPart)) return true;
          }
        }

        return false;
      });

      if (matchedProd) {
        // Update matched product in database
        let mpData: any = matchedProd.marketplace_data;
        if (typeof mpData === "string") {
          try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
        }
        mpData = mpData || {};
        mpData.hepsiburada = {
          ...(mpData.hepsiburada || {}),
          hepsiburadaSku: hbSku || mpData.hepsiburada?.hepsiburadaSku,
          merchantSku: mSku || mpData.hepsiburada?.merchantSku,
          matchedAt: new Date().toISOString(),
          lastSync: new Date().toISOString(),
          status: listing.status || 'ACTIVE'
        };

        await pool.query(
          `UPDATE products 
           SET is_hepsiburada_active = true,
               hepsiburada_sku = COALESCE(NULLIF($1, ''), hepsiburada_sku),
               hepsiburada_last_sync = NOW(),
               hepsiburada_last_error = NULL,
               marketplace_data = $2
           WHERE id = $3 AND store_id = $4`,
          [hbSku || null, JSON.stringify(mpData), matchedProd.id, this.storeId]
        );

        matchedCount++;
        updatedCount++;
        matchResults.push({
          action: 'matched',
          productId: matchedProd.id,
          productName: matchedProd.name,
          barcode: matchedProd.barcode,
          hepsiburadaSku: hbSku || matchedProd.hepsiburada_sku,
          price: listing.price,
          stock: listing.availableStock
        });
      } else if (importMissing) {
        // Auto import unmatched product
        const newName = pName || `Hepsiburada Ürünü (${hbSku || mSku || barcode})`;
        const newBarcode = mSku || barcode || hbSku || `HB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newPrice = listing.price || 0;
        const newStock = listing.availableStock || 0;

        const mpData = {
          hepsiburada: {
            hepsiburadaSku: hbSku,
            merchantSku: mSku,
            importedFromHB: true,
            matchedAt: new Date().toISOString(),
            lastSync: new Date().toISOString(),
            status: listing.status || 'ACTIVE'
          }
        };

        const insertRes = await pool.query(
          `INSERT INTO products 
            (store_id, name, barcode, price, stock_quantity, is_hepsiburada_active, hepsiburada_sku, category, hepsiburada_last_sync, marketplace_data)
           VALUES ($1, $2, $3, $4, $5, true, $6, 'Genel', NOW(), $7)
           ON CONFLICT (store_id, barcode) DO UPDATE 
             SET is_hepsiburada_active = true,
                 hepsiburada_sku = COALESCE(NULLIF(EXCLUDED.hepsiburada_sku, ''), products.hepsiburada_sku),
                 hepsiburada_last_sync = NOW(),
                 hepsiburada_last_error = NULL,
                 marketplace_data = EXCLUDED.marketplace_data
           RETURNING id, name, barcode, hepsiburada_sku`,
          [this.storeId, newName, newBarcode, newPrice, newStock, hbSku || null, JSON.stringify(mpData)]
        );

        const insertedRow = insertRes.rows[0];
        if (insertedRow) {
          storeProducts.push({
            id: insertedRow.id,
            name: insertedRow.name,
            barcode: insertedRow.barcode,
            sku: newBarcode,
            hepsiburada_sku: insertedRow.hepsiburada_sku || hbSku,
            is_hepsiburada_active: true,
            marketplace_data: mpData
          });
        }

        importedCount++;
        matchResults.push({
          action: 'imported',
          productId: insertedRow?.id,
          productName: newName,
          barcode: newBarcode,
          hepsiburadaSku: hbSku,
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
      message: `Hepsiburada'daki ${listings.length} ilandan ${matchedCount} tanesi paneldeki ürünlerle eşleştirildi, ${importedCount} yeni ürün içeri aktarıldı.`,
      items: matchResults
    };
  }
}

