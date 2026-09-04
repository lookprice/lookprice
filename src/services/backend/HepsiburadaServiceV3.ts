import axios from "axios";
import { pool } from "../../../models/db";
import PQueue from 'p-queue';
import { processMarketplaceOrderLines } from "../marketplaceSync";

export class HepsiburadaServiceV3 {
  private queue = new PQueue({ concurrency: 5, interval: 1000, intervalCap: 100 });
  private env: 'sit' | 'production';

  constructor(env: 'sit' | 'production' = 'sit') {
    this.env = env;
  }

  private get listingBaseUrl(): string {
    return this.env === 'sit'
      ? 'https://listing-external-v2-gw-sit.hepsiburada.com'
      : 'https://listing-external-v2-gw-prod.hepsiburada.com';
  }

  private get omsBaseUrl(): string {
    return this.env === 'sit'
      ? 'https://oms-external-sit.hepsiburada.com'
      : 'https://oms-external-prod.hepsiburada.com';
  }

  private get catalogBaseUrl(): string {
    return this.env === 'sit'
      ? 'https://mpop-sit.hepsiburada.com/product/api'
      : 'https://mpop.hepsiburada.com/product/api';
  }

  private async getCredentials(): Promise<{ merchantId: string; headers: Record<string, string> }> {
    let merchantId = "";
    let secretKey = "";
    let userAgent = "";

    // 1. First check centralized integrator_configs
    const { rows } = await pool.query(
      'SELECT client_id, client_secret, config FROM integrator_configs WHERE marketplace = $1 AND env = $2',
      ['hepsiburada', this.env]
    );

    if (rows.length > 0 && rows[0].client_id && rows[0].client_secret) {
      merchantId = String(rows[0].client_id).trim();
      secretKey = String(rows[0].client_secret).trim();
      userAgent = rows[0].config?.user_agent || "";
    } else {
      // 2. Fallback check stores.hepsiburada_settings
      const storeRes = await pool.query(
        "SELECT hepsiburada_settings FROM stores WHERE hepsiburada_settings IS NOT NULL AND hepsiburada_settings != '{}' ORDER BY id ASC LIMIT 1"
      );
      if (storeRes.rows.length > 0 && storeRes.rows[0].hepsiburada_settings) {
        const s = typeof storeRes.rows[0].hepsiburada_settings === 'string' 
          ? JSON.parse(storeRes.rows[0].hepsiburada_settings) 
          : storeRes.rows[0].hepsiburada_settings;
        if (s.merchantId && (s.apiSecret || s.apiKey)) {
          merchantId = String(s.merchantId).trim();
          secretKey = String(s.apiSecret || s.apiKey).trim();
          userAgent = s.userAgent || "";
        }
      }
    }

    if (!merchantId || !secretKey) {
      throw new Error('Hepsiburada entegratör konfigürasyonu (Merchant ID ve Secret Key) bulunamadı. Lütfen "Entegratör Hub > Yeni Konfigürasyon" butonundan bilgilerinizi kaydedin.');
    }

    const rawCredentials = `${merchantId}:${secretKey}`;
    const base64Auth = Buffer.from(rawCredentials).toString('base64');
    const finalUserAgent = userAgent || (userAgent.includes(merchantId) ? userAgent : `${merchantId} - enrakipsiz_dev`);

    const headers = {
      Authorization: `Basic ${base64Auth}`,
      'User-Agent': finalUserAgent,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    return { merchantId, headers };
  }

  /**
   * Import listings / Update inventory (Price & Stock)
   * Attempts Listing V2 Gateway and cascades to Listing V1 / Direct endpoints
   */
  async importListings(products: any[]) {
    return this.queue.add(async () => {
      const { merchantId, headers } = await this.getCredentials();

      // Normalize products to Hepsiburada Inventory format (both PascalCase and camelCase)
      const payloadV2 = (products || []).map((p: any) => ({
        HepsiburadaSku: p.HepsiburadaSku || p.hepsiburada_sku || p.hepsiburadaSku || p.sku || "",
        MerchantSku: p.MerchantSku || p.merchantSku || p.barcode || p.sku || `HB-${Date.now()}`,
        Price: Number(p.Price || p.price || 100),
        AvailableStock: Number(p.AvailableStock !== undefined ? p.AvailableStock : (p.stock !== undefined ? p.stock : (p.stock_quantity !== undefined ? p.stock_quantity : 10))),
        DispatchTime: Number(p.DispatchTime || p.dispatchTime || 1),
        MaximumPurchasableQuantity: Number(p.MaximumPurchasableQuantity || p.maximumPurchasableQuantity || 10),
      }));

      const payloadV1 = (products || []).map((p: any) => ({
        hepsiburadaSku: p.HepsiburadaSku || p.hepsiburada_sku || p.hepsiburadaSku || p.sku || "",
        merchantSku: p.MerchantSku || p.merchantSku || p.barcode || p.sku || `HB-${Date.now()}`,
        price: Number(p.Price || p.price || 100),
        availableStock: Number(p.AvailableStock !== undefined ? p.AvailableStock : (p.stock !== undefined ? p.stock : (p.stock_quantity !== undefined ? p.stock_quantity : 10))),
        dispatchTime: Number(p.DispatchTime || p.dispatchTime || 1),
        maximumPurchasableQuantity: Number(p.MaximumPurchasableQuantity || p.maximumPurchasableQuantity || 10),
      }));

      const listingDirectUrl = this.env === 'sit' 
        ? 'https://listing-external-sit.hepsiburada.com' 
        : 'https://listing-external.hepsiburada.com';

      const endpoints = [
        {
          name: "Listing V1 Inventory-Uploads",
          url: `${listingDirectUrl}/listings/merchantid/${merchantId}/inventory-uploads`,
          data: payloadV1
        },
        {
          name: "Listing V2 GW",
          url: `${this.listingBaseUrl}/inventory/import/${merchantId}`,
          data: payloadV2
        },
        {
          name: "Listing V1 Direct",
          url: `${listingDirectUrl}/listings/merchantid/${merchantId}`,
          data: payloadV1
        }
      ];

      let lastError: any = null;
      for (const ep of endpoints) {
        try {
          console.log(`[HB V3] Attempting ${ep.name} import to ${ep.url}`);
          const res = await axios.post(ep.url, ep.data, { headers, timeout: 30000 });
          const trackingId = res.data?.trackingId || res.data?.id || res.data?.taskId || res.data?.data?.trackingId;

          return {
            success: true,
            trackingId,
            total: payloadV2.length,
            itemsSent: payloadV2,
            message: `${payloadV2.length} adet ürün Hepsiburada (${this.env.toUpperCase()} - ${ep.name}) kuyruğuna iletildi.`,
            data: res.data
          };
        } catch (err: any) {
          lastError = err.response?.data || err.message;
          console.warn(`[HB V3] ${ep.name} failed:`, lastError);
        }
      }

      // If bulk endpoints failed, try single item update (PUT /listings/merchantid/{merchantId}/sku/{merchantSku})
      if (payloadV2.length > 0) {
        try {
          const results = [];
          for (const item of payloadV2) {
            const singleUrl = `https://listing-external-sit.hepsiburada.com/listings/merchantid/${merchantId}/sku/${item.MerchantSku}`;
            const singleRes = await axios.put(singleUrl, {
              price: item.Price,
              availableStock: item.AvailableStock,
              dispatchTime: item.DispatchTime
            }, { headers, timeout: 15000 });
            results.push(singleRes.data);
          }
          return {
            success: true,
            total: payloadV2.length,
            itemsSent: payloadV2,
            message: `${payloadV2.length} adet ürün tekil SKU olarak Hepsiburada'ya başarıyla güncellendi.`,
            data: results
          };
        } catch (putErr: any) {
          console.warn(`[HB V3] Single SKU PUT fallback failed:`, putErr.response?.data || putErr.message);
        }
      }

      const errMsg = typeof lastError === 'object' ? (lastError.message || lastError.error_description || JSON.stringify(lastError)) : lastError;
      throw new Error(`Hepsiburada Listeleme API Hatası: ${errMsg}`);
    });
  }

  /**
   * Check task tracking status (Inventory / Listing V2 & Catalog fallback)
   */
  async checkTaskStatus(trackingId: string) {
    return this.queue.add(async () => {
      const { merchantId, headers } = await this.getCredentials();
      const listingDirectUrl = this.env === 'sit' 
        ? 'https://listing-external-sit.hepsiburada.com' 
        : 'https://listing-external.hepsiburada.com';

      const urls = [
        `${listingDirectUrl}/listings/merchantid/${merchantId}/inventory-uploads/id/${trackingId}`,
        `${this.listingBaseUrl}/inventory/import/status/${merchantId}/task/${trackingId}`,
        `${listingDirectUrl}/listings/merchantid/${merchantId}/inventory-uploads/${trackingId}`,
        `${this.catalogBaseUrl}/products/status/${trackingId}`
      ];

      for (const url of urls) {
        try {
          const res = await axios.get(url, { headers, timeout: 15000 });
          if (res.data) {
            return res.data;
          }
        } catch (err) {
          // try next url
        }
      }
      throw new Error(`Durum sorgulaması başarısız oldu (Tracking ID: ${trackingId})`);
    });
  }

  /**
   * Fetch All Categories (Catalog API)
   * Prioritizes active leaf categories (leaf: true & available: true) that Hepsiburada allows products to be assigned to.
   */
  async getCategories(page: number = 0, size: number = 100) {
    return this.queue.add(async () => {
      const { headers } = await this.getCredentials();
      const verifiedSitLeafs = [
        { categoryId: 26012174, name: "Tansiyon Aletleri", displayName: "Tansiyon Aletleri", paths: ["Kozmetik Kişisel Bakım", "Sağlık / Kişisel Bakım", "Sağlık Ürünleri", "Tansiyon Aletleri"], leaf: true, available: true, status: "ACTIVE" },
        { categoryId: 60003858, name: "Günlük Ayakkabı", displayName: "Kadın Günlük Ayakkabı", paths: ["Giyim / Ayakkabı", "Kadın", "Ayakkabı", "Günlük Ayakkabı"], leaf: true, available: true, status: "ACTIVE" },
        { categoryId: 18021948, name: "Duş Bataryası", displayName: "Duş Bataryası", paths: ["Ev Dekorasyon", "Banyo & Mutfak", "Batarya & Musluk", "Duş Bataryası"], leaf: true, available: true, status: "ACTIVE" },
        { categoryId: 12101943, name: "Büyük Beden Kaban", displayName: "Kadın Büyük Beden Kaban", paths: ["Giyim / Ayakkabı", "Kadın", "Büyük Beden", "Büyük Beden Kaban"], leaf: true, available: true, status: "ACTIVE" },
        { categoryId: 60002524, name: "Konsept Hediyelikler", displayName: "Konsept Hediyelikler", paths: ["Kitap Film Müzik", "Müzik & Müzik Aletleri", "Konsept Hediyelikler"], leaf: true, available: true, status: "ACTIVE" },
        { categoryId: 60003857, name: "Espadril", displayName: "Kadın Espadril", paths: ["Giyim / Ayakkabı", "Kadın", "Ayakkabı", "Espadril"], leaf: true, available: true, status: "ACTIVE" },
        { categoryId: 60003859, name: "Loafer", displayName: "Kadın Loafer", paths: ["Giyim / Ayakkabı", "Kadın", "Ayakkabı", "Loafer"], leaf: true, available: true, status: "ACTIVE" },
        { categoryId: 60003861, name: "Ev Ayakkabısı", displayName: "Kadın Ev Ayakkabısı", paths: ["Giyim / Ayakkabı", "Kadın", "Ayakkabı", "Ev Ayakkabısı"], leaf: true, available: true, status: "ACTIVE" },
        { categoryId: 60003862, name: "Panduf", displayName: "Kadın Panduf", paths: ["Giyim / Ayakkabı", "Kadın", "Ayakkabı", "Panduf"], leaf: true, available: true, status: "ACTIVE" },
        { categoryId: 18021982, name: "Duş Teknesi", displayName: "Duş Teknesi", paths: ["Ev Dekorasyon", "Banyo & Mutfak", "Duş Sistemleri", "Duş Teknesi"], leaf: true, available: true, status: "ACTIVE" }
      ];

      try {
        const url = `${this.catalogBaseUrl}/categories/get-all-categories?page=${page}&size=${size}`;
        const res = await axios.get(url, { headers, timeout: 25000 });
        const rawList = res.data?.data || res.data?.categories || res.data || [];
        
        // Filter for leaf categories that are available
        const leafList = Array.isArray(rawList)
          ? rawList.filter((c: any) => c.leaf === true && c.available !== false && c.status !== "INACTIVE")
          : [];

        // If current page didn't yield leaf categories, scan up to 3 pages
        let combined = [...leafList];
        if (combined.length < 15 && page === 0) {
          for (let p = 1; p <= 4; p++) {
            try {
              const nextRes = await axios.get(`${this.catalogBaseUrl}/categories/get-all-categories?page=${p}&size=200`, { headers, timeout: 15000 });
              const nextList = nextRes.data?.data || [];
              const nextLeafs = nextList.filter((c: any) => c.leaf === true && c.available !== false && c.status !== "INACTIVE");
              combined.push(...nextLeafs);
              if (combined.length >= 30) break;
            } catch (e) {
              break;
            }
          }
        }

        // Merge verified categories ensuring no duplicates
        const existingIds = new Set(combined.map((c: any) => c.categoryId));
        for (const v of verifiedSitLeafs) {
          if (!existingIds.has(v.categoryId)) {
            combined.unshift(v);
            existingIds.add(v.categoryId);
          }
        }

        return {
          success: true,
          data: combined,
          total: combined.length,
          raw: res.data
        };
      } catch (err: any) {
        console.warn("[HB V3] Categories fetch failed, returning verified SIT leaf list:", err.message);
        return {
          success: true,
          data: verifiedSitLeafs,
          total: verifiedSitLeafs.length,
          warning: "Canlı kategori servisine ulaşılamadı, doğrulanmış SIT yaprak kategorileri yüklendi."
        };
      }
    });
  }

  /**
   * Fetch Attributes for a specific category (Catalog API)
   */
  async getCategoryAttributes(categoryId: string | number) {
    return this.queue.add(async () => {
      const { headers } = await this.getCredentials();
      const url = `${this.catalogBaseUrl}/categories/${categoryId}/attributes`;
      try {
        const res = await axios.get(url, { headers, timeout: 25000 });
        return {
          success: true,
          categoryId,
          data: res.data?.data || res.data?.attributes || res.data || [],
          raw: res.data
        };
      } catch (err: any) {
        const errorDetail = err.response?.data || err.message;
        throw new Error(`Hepsiburada Kategori Özellik Hatası: ${typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail}`);
      }
    });
  }

  /**
   * Import New Products to Catalog (Catalog API - /products/import)
   * Sends the products structured in Hepsiburada's multipart/form-data JSON format with automatic fallbacks.
   */
  async importCatalogProducts(products: any[]) {
    return this.queue.add(async () => {
      const { merchantId, headers } = await this.getCredentials();
      const url = `${this.catalogBaseUrl}/products/import`;

      // Format products to Hepsiburada's official structure
      const formattedProducts = (products || []).map((p: any) => {
        const catId = Number(p.categoryId || 1000282);
        const sku = String(p.merchantItemCode || p.barcode || p.merchantSku || p.sku || `SKU-${Date.now()}`);
        const brand = String(p.brand || "Lopard");
        const name = String(p.name || p.productName || "Test Ürünü");
        const description = String(p.description || "<p>LookPrice Hepsiburada Test Ürünü</p>");
        const price = String(p.price || 100);
        const stock = String(p.stock !== undefined ? p.stock : 10);
        const variantGroupId = p.variantGroupID || p.variantGroupId || p.item_group_id || `GRP-${sku}`;

        // Extract image URLs
        let img1 = "";
        let img2 = "";
        if (Array.isArray(p.images) && p.images.length > 0) {
          img1 = typeof p.images[0] === 'string' ? p.images[0] : (p.images[0]?.url || "");
          if (p.images.length > 1) {
            img2 = typeof p.images[1] === 'string' ? p.images[1] : (p.images[1]?.url || "");
          }
        } else if (p.image) {
          img1 = typeof p.image === 'string' ? p.image : (p.image?.url || "");
        }

        const attrMap: Record<string, any> = {
          merchantSku: sku,
          VaryantGroupID: variantGroupId,
          Barcode: p.barcode || sku,
          UrunAdi: name,
          UrunAciklamasi: description,
          Marka: brand,
          GarantiSuresi: "24",
          tax_vat_rate: "20",
          price: price,
          stock: stock,
          kg: "1",
          ...(p.attributes || {})
        };

        if (img1) attrMap.Image1 = img1;
        if (img2) attrMap.Image2 = img2;

        return {
          categoryId: catId,
          merchant: merchantId,
          attributes: attrMap
        };
      });

      // 1. Try sending via multipart/form-data with file: products.json (Official HB specification)
      try {
        const formData = new FormData();
        const jsonBlob = new Blob([JSON.stringify(formattedProducts)], { type: "application/json" });
        formData.append("file", jsonBlob, "products.json");

        const multiHeaders = {
          Authorization: headers.Authorization,
          "User-Agent": headers["User-Agent"],
          Accept: "application/json",
        };

        console.log(`[HB V3] Sending multipart catalog import to ${url} with ${formattedProducts.length} items`);
        const res = await axios.post(url, formData, {
          headers: multiHeaders,
          timeout: 45000,
        });

        const trackingId = res.data?.trackingId || res.data?.id || res.data?.data?.trackingId;
        return {
          success: true,
          trackingId,
          total: formattedProducts.length,
          data: res.data,
          message: `${formattedProducts.length} adet ürün Hepsiburada Katalog servisine iletildi. Tracking ID: ${trackingId}`
        };
      } catch (multiErr: any) {
        console.warn(`[HB V3] Multipart catalog import failed, trying raw JSON fallback:`, multiErr.response?.data || multiErr.message);

        // 2. Fallback: Try raw JSON POST
        try {
          const res = await axios.post(url, formattedProducts, { headers, timeout: 35000 });
          const trackingId = res.data?.trackingId || res.data?.id || res.data?.data?.trackingId;
          return {
            success: true,
            trackingId,
            total: formattedProducts.length,
            data: res.data,
            message: `${formattedProducts.length} adet ürün Hepsiburada Katalog servisine iletildi.`
          };
        } catch (rawErr: any) {
          const errorDetail = multiErr.response?.data || rawErr.response?.data || rawErr.message;
          console.error(`[HB V3] importCatalogProducts Error:`, errorDetail);
          let msg = "";
          if (typeof errorDetail === 'object') {
            if (errorDetail.errors && Array.isArray(errorDetail.errors)) {
              msg = errorDetail.errors.map((e: any) => typeof e === 'object' ? (e.message || e.errorMessage || JSON.stringify(e)) : e).join(' | ');
            } else if (errorDetail.issues && Array.isArray(errorDetail.issues)) {
              msg = errorDetail.issues.map((e: any) => e.message || JSON.stringify(e)).join(' | ');
            } else {
              msg = errorDetail.message || errorDetail.error_description || errorDetail.error || JSON.stringify(errorDetail);
            }
          } else {
            msg = String(errorDetail);
          }
          throw new Error(`Hepsiburada Katalog Gönderim Hatası: ${msg}`);
        }
      }
    });
  }

  /**
   * Check Catalog Import Task Status (/products/status/{trackingId})
   */
  async checkCatalogTaskStatus(trackingId: string) {
    return this.queue.add(async () => {
      const { headers } = await this.getCredentials();
      const url = `${this.catalogBaseUrl}/products/status/${trackingId}`;
      try {
        const res = await axios.get(url, { headers, timeout: 15000 });
        return res.data;
      } catch (err: any) {
        const errorDetail = err.response?.data || err.message;
        throw new Error(`Katalog Durum Sorgulama Hatası: ${typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail}`);
      }
    });
  }

  /**
   * Fetch Orders / Packages from Hepsiburada OMS
   */
  async fetchOrders(options?: { status?: string; limit?: number; offset?: number }) {
    return this.queue.add(async () => {
      const { merchantId, headers } = await this.getCredentials();
      const limit = options?.limit || 20;
      const offset = options?.offset || 0;
      const status = options?.status || 'all';

      let url = `${this.omsBaseUrl}/orders/merchantid/${merchantId}?limit=${limit}&offset=${offset}`;
      if (status && status !== 'all') {
        url += `&status=${status}`;
      }

      try {
        const res = await axios.get(url, { headers, timeout: 25000 });
        const orders = res.data?.items || res.data?.orders || res.data || [];
        return {
          success: true,
          env: this.env,
          total: Array.isArray(orders) ? orders.length : 0,
          orders: Array.isArray(orders) ? orders : [],
          raw: res.data,
        };
      } catch (err: any) {
        // Also attempt package endpoint if /orders is not supported by current OMS version
        try {
          const pkgUrl = `${this.omsBaseUrl}/packages/merchantid/${merchantId}?limit=${limit}`;
          const pkgRes = await axios.get(pkgUrl, { headers, timeout: 25000 });
          const packages = pkgRes.data?.items || pkgRes.data?.packages || pkgRes.data || [];
          return {
            success: true,
            env: this.env,
            total: Array.isArray(packages) ? packages.length : 0,
            orders: Array.isArray(packages) ? packages : [],
            isPackageEndpoint: true,
            raw: pkgRes.data,
          };
        } catch (pkgErr: any) {
          throw new Error(
            `Hepsiburada OMS siparişleri sorgulanamadı (${this.env.toUpperCase()}): ${
              err.response?.data?.message || err.message
            }`
          );
        }
      }
    });
  }

  /**
   * Simulate a Test Order: creates a mock or sandbox order in Hepsiburada OMS format
   * and saves it to a store's sales, sales_invoices, customers, and hepsiburada_orders tables.
   */
  async simulateTestOrder(params: {
    storeId?: number;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    sku?: string;
    productName?: string;
    quantity?: number;
    price?: number;
  }) {
    // Generate a 9-digit numeric order ID (e.g. 701234567) matching Hepsiburada standard
    const numericOrderId = Math.floor(700000000 + Math.random() * 99999999);
    const testOrderId = String(numericOrderId);
    const customerName = params.customerName || "LookPrice Test Alıcısı";
    const customerEmail = params.customerEmail || `test_${Date.now()}@lookprice.net`;
    const customerPhone = params.customerPhone || "+90 548 888 0000";
    const price = Number(params.price || 250);
    const quantity = Number(params.quantity || 1);
    const orderTotal = price * quantity;
    const sku = params.sku || "8681892240266";
    const productName = params.productName || "Otom Audi A6 Özel Dikim Koltuk Kılıfı (Siyah)";

    // Find default store if not specified
    let targetStoreId = params.storeId;
    if (!targetStoreId) {
      const storeRes = await pool.query("SELECT id FROM stores ORDER BY id ASC LIMIT 1");
      if (storeRes.rows.length > 0) {
        targetStoreId = storeRes.rows[0].id;
      } else {
        throw new Error("Siparişin aktarılacağı aktif bir mağaza bulunamadı.");
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Customer
      let customerId = null;
      const custRes = await client.query(
        "SELECT id FROM customers WHERE store_id = $1 AND (email = $2 OR phone = $3) LIMIT 1",
        [targetStoreId, customerEmail, customerPhone]
      );
      if (custRes.rows.length > 0) {
        customerId = custRes.rows[0].id;
      } else {
        try {
          const rawCustName = (customerName || '').trim();
          const nameParts = rawCustName.split(' ');
          const surnameVal = nameParts.length > 1 ? nameParts.pop()! : '';
          const firstNameVal = nameParts.join(' ') || rawCustName;

          const newCust = await client.query(
            `INSERT INTO customers (store_id, email, password, full_name, name, surname, phone, address) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             ON CONFLICT (store_id, email) DO UPDATE SET full_name = EXCLUDED.full_name, surname = EXCLUDED.surname 
             RETURNING id`,
            [targetStoreId, customerEmail, "marketplace_user", rawCustName, firstNameVal, surnameVal, customerPhone, "Hepsiburada SIT Test Adresi, Kadıköy / İstanbul"]
          );
          customerId = newCust.rows[0]?.id;
        } catch (cErr) {
          // If conflict or constraint, fetch existing or leave null
          const fallbackCust = await client.query("SELECT id FROM customers WHERE store_id = $1 LIMIT 1", [targetStoreId]);
          customerId = fallbackCust.rows[0]?.id || null;
        }
      }

      // 2. Financials
      const taxAmount = Number((orderTotal * (20 / 120)).toFixed(2));
      const subtotal = Number((orderTotal - taxAmount).toFixed(2));
      const grandTotal = orderTotal;

      // 3. Sale
      const saleRes = await client.query(
        `INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_phone, customer_address, payment_method, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [targetStoreId, grandTotal, "TRY", "completed", customerName, customerPhone, "Hepsiburada SIT Test Adresi, Kadıköy / İstanbul", "Hepsiburada SIT Test", `Hepsiburada Test Siparişi: #${testOrderId}`]
      );
      const saleId = saleRes.rows[0].id;

      // 4. Sales Invoice
      const invoiceNumber = `HB-SIT-${testOrderId}`;
      const invoiceRes = await client.query(
        `INSERT INTO sales_invoices (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [targetStoreId, saleId, customerId, invoiceNumber, new Date(), subtotal, taxAmount, grandTotal, "TRY", "Hepsiburada SIT", `Hepsiburada Test Siparişi: #${testOrderId}`, "marketplace", "completed"]
      );
      const salesInvoiceId = invoiceRes.rows[0].id;

      // 5. Order Lines & Stock processing
      const mappedLines = [{
        name: productName,
        quantity: quantity,
        price: price,
        barcode: sku,
        sku: sku,
        taxRate: 20,
      }];

      await processMarketplaceOrderLines(
        client,
        targetStoreId,
        saleId,
        salesInvoiceId,
        mappedLines,
        "Hepsiburada",
        testOrderId
      );

      // 6. Record to hepsiburada_orders with full standard schema
      await client.query(
        `INSERT INTO hepsiburada_orders (store_id, hepsiburada_order_id, sale_id, sales_invoice_id, package_number, cargo_barcode, cargo_tracking_number, cargo_provider_name, status, order_data) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         ON CONFLICT (store_id, hepsiburada_order_id) DO UPDATE SET 
           status = EXCLUDED.status, 
           sale_id = EXCLUDED.sale_id, 
           sales_invoice_id = EXCLUDED.sales_invoice_id,
           package_number = EXCLUDED.package_number`,
        [
          targetStoreId, 
          numericOrderId, 
          saleId, 
          salesInvoiceId, 
          `PKG-${numericOrderId}`, 
          `627${numericOrderId}`, 
          `627${numericOrderId}`, 
          'HepsiJET', 
          'completed', 
          JSON.stringify({ 
            orderId: numericOrderId, 
            customerName, 
            customerPhone,
            grandTotal, 
            items: mappedLines, 
            orderDate: new Date().toISOString() 
          })
        ]
      );

      await client.query("COMMIT");

      return {
        success: true,
        testOrderId,
        invoiceNumber,
        storeId: targetStoreId,
        customerName,
        grandTotal,
        message: `Hepsiburada Test Siparişi (#${testOrderId}) başarıyla simüle edildi ve Mağaza #${targetStoreId} paneline işlendi.`,
      };
    } catch (err: any) {
      await client.query("ROLLBACK");
      console.error("[HB V3] simulateTestOrder failure:", err);
      throw new Error(`Test siparişi oluşturma hatası: ${err.message}`);
    } finally {
      client.release();
    }
  }
}
