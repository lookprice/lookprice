import { pool, logAction, addStockMovement } from "../../models/db";
import axios, { AxiosError } from "axios";
import { parseStringPromise } from 'xml2js';

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  marketplace: string,
  storeId: number,
  retries = 3,
  delay = 2000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMessage = error.response?.data ? 
      (typeof error.response.data === 'object' ? JSON.stringify(error.response.data) : error.response.data) : 
      error.message;

    if (retries <= 1) {
      await logAction(storeId, null, "error", "marketplace_sync", null, `${marketplace} Sync Final Failure: ${errorMessage}`);
      throw error;
    }
    await logAction(storeId, null, "warning", "marketplace_sync", null, `${marketplace} Sync Retry (${4 - retries}): ${errorMessage}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fn, marketplace, storeId, retries - 1, delay * 2);
  }
}

export async function processMarketplaceOrderLines(
  client: any, 
  storeId: number, 
  saleId: number, 
  salesInvoiceId: number, 
  lines: any[], 
  marketplaceName: string, 
  orderId: string,
  customerName?: string,
  invoiceNumber?: string
) {
  for (const line of lines) {
    let productId = null;
    let currentStock = 0;
    
    const rawCandidates = [
      line.barcode,
      line.sku,
      line.merchantSku,
      line.hbSku,
      line.productCode,
      line.product_code,
      line.hepsiburadaSku,
      line.id,
      line.merchantSku && line.merchantSku.includes('_') ? line.merchantSku.split('_')[0] : null,
      line.sku && line.sku.includes('_') ? line.sku.split('_')[0] : null,
    ];

    const searchCandidates = Array.from(
      new Set(
        rawCandidates
          .map((c) => (c ? String(c).trim() : ""))
          .filter((c) => c.length > 0)
      )
    );

    let matchedBarcode = line.barcode || '';
    let matchedName = line.name || `${marketplaceName} Ürünü`;

    if (searchCandidates.length > 0) {
      try {
        const prodRes = await client.query(
          `SELECT id, name, barcode, stock_quantity FROM products 
           WHERE store_id = $1 AND (
             barcode = ANY($2) 
             OR sku = ANY($2) 
             OR product_code = ANY($2) 
             OR hepsiburada_sku = ANY($2)
             OR marketplace_data->'hepsiburada'->>'merchantSku' = ANY($2)
             OR marketplace_data->'hepsiburada'->>'hepsiburadaSku' = ANY($2)
             OR marketplace_data->'trendyol'->>'barcode' = ANY($2)
             OR marketplace_data->'trendyol'->>'stockCode' = ANY($2)
             OR marketplace_data->'n11'->>'sellerCode' = ANY($2)
           ) LIMIT 1`, 
          [storeId, searchCandidates]
        );
        if (prodRes.rows.length > 0) {
          productId = prodRes.rows[0].id;
          currentStock = prodRes.rows[0].stock_quantity;
          if (prodRes.rows[0].barcode && (!matchedBarcode || matchedBarcode.startsWith('HB'))) {
            matchedBarcode = prodRes.rows[0].barcode;
          }
        }
      } catch (findErr) {
        // Fallback to simpler query if JSONB or some column is missing
        try {
          const prodRes2 = await client.query(
            "SELECT id, name, barcode, stock_quantity FROM products WHERE store_id = $1 AND (barcode = ANY($2) OR sku = ANY($2) OR hepsiburada_sku = ANY($2)) LIMIT 1", 
            [storeId, searchCandidates]
          );
          if (prodRes2.rows.length > 0) {
            productId = prodRes2.rows[0].id;
            currentStock = prodRes2.rows[0].stock_quantity;
            if (prodRes2.rows[0].barcode && (!matchedBarcode || matchedBarcode.startsWith('HB'))) {
              matchedBarcode = prodRes2.rows[0].barcode;
            }
          }
        } catch (e) {
          // Continue without productId
        }
      }
    }

    // Secondary fallback: search by name keywords if not yet matched
    if (!productId && line.name && String(line.name).length > 4) {
      try {
        const nameKeywords = String(line.name).trim().split(/\s+/).slice(0, 3).join(' ');
        const nameMatchRes = await client.query(
          "SELECT id, name, barcode, stock_quantity FROM products WHERE store_id = $1 AND name ILIKE $2 LIMIT 1",
          [storeId, `%${nameKeywords}%`]
        );
        if (nameMatchRes.rows.length > 0) {
          productId = nameMatchRes.rows[0].id;
          currentStock = nameMatchRes.rows[0].stock_quantity;
          if (nameMatchRes.rows[0].barcode && !matchedBarcode) {
            matchedBarcode = nameMatchRes.rows[0].barcode;
          }
        }
      } catch (e) {
        // continue
      }
    }

    const quantity = line.quantity || 1;
    const price = line.price || 0;
    const taxRate = line.taxRate || 20;
    const total = price * quantity;
    const taxAmount = total * (taxRate / 100);
    const name = matchedName;
    const finalBarcode = matchedBarcode || line.barcode || '';
    
    await client.query(
      "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [saleId, productId, name, finalBarcode, quantity, price, total]
    );

    await client.query(
      "INSERT INTO sales_invoice_items (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [salesInvoiceId, productId, name, finalBarcode, quantity, price, taxRate, taxAmount, total]
    );

    if (productId) {
      // Robust stock update
      const updateRes = await client.query(
        "UPDATE products SET stock_quantity = COALESCE(stock_quantity, 0) - $1 WHERE id = $2 RETURNING stock_quantity",
        [quantity, productId]
      );
      
      const newStock = updateRes.rows[0]?.stock_quantity;
      if (newStock !== undefined && Number(newStock) <= 0) {
        await autoUnpublishIfZeroStock(productId, storeId, client);
      }

      // Always try to log movement with full transactional integrity (1 movement per sale/invoice)
      try {
        const resolvedInvoiceNumber = invoiceNumber || (marketplaceName.toLowerCase() === 'hepsiburada' ? `HB-${orderId}` : (marketplaceName.toLowerCase() === 'trendyol' ? `TY-${orderId}` : `${marketplaceName.toUpperCase()}-${orderId}`));
        const resolvedCustomer = customerName || 'Pazaryeri Müşterisi';
        await addStockMovement(
          client, 
          storeId, 
          productId, 
          'out', 
          quantity, 
          marketplaceName.toLowerCase(), 
          `Satış Faturası: ${resolvedInvoiceNumber}`, 
          price || 0, 
          resolvedCustomer,
          'TRY',
          saleId,
          salesInvoiceId,
          'marketplace',
          resolvedInvoiceNumber
        );
      } catch (moveErr) {
        console.error(`Stock movement logging failed for ${marketplaceName} order ${orderId}:`, moveErr);
      }
    }
  }
}

// N11 REST Implementation (Experimental - Fallback for SOAP 404)
export async function syncN11OrdersREST(client: any, storeId: number, settings: any) {
    const auth = Buffer.from(`${settings.appKey}:${settings.appSecret}`).toString('base64');
    const response = await fetchWithRetry(async () => {
        // Trying various headers and endpoints for N11 REST
        try {
            // Option 1: Standard Basic Auth
            return await axios.get("https://api.n11.com/rest/orders", {
                headers: { 'Authorization': `Basic ${auth}` },
                timeout: 30000
            });
        } catch (e: any) {
            // Option 2: Custom headers (N11 often uses this)
            if (e.response?.status === 401 || e.response?.status === 403) {
                 return await axios.get("https://api.n11.com/rest/orders", {
                    headers: { 'appKey': settings.appKey, 'appSecret': settings.appSecret },
                    timeout: 30000
                });
            }
            // Option 3: Fallback endpoint
            return await axios.get("https://api.n11.com/v1/orders", {
                headers: { 'Authorization': `Basic ${auth}` },
                timeout: 30000
            });
        }
    }, "N11-REST", storeId);
    
    await logAction(storeId, null, "sync_n11_rest", "marketplace_sync", null, "N11 REST Order Sync", null, response.data);
    return response.data?.orders || [];
}

export async function syncN11Orders(client: any, storeId: number, settings: any) {
    // Try SOAP first with corrected URL
    try {
        const soapEnvelope = `
          <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas/OrderService">
             <soapenv:Header/>
             <soapenv:Body>
                <sch:DetailedOrderListRequest>
                   <auth>
                      <appKey>${settings.appKey}</appKey>
                      <appSecret>${settings.appSecret}</appSecret>
                   </auth>
                   <searchData>
                      <status>New</status>
                   </searchData>
                </sch:DetailedOrderListRequest>
             </soapenv:Body>
          </soapenv:Envelope>
        `;

        const response = await fetchWithRetry(async () => {
            // Removing .wsdl and trying the main endpoint
            return await axios.post("https://api.n11.com/ws/OrderService", soapEnvelope, {
                headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
                timeout: 30000
            });
        }, "N11-SOAP", storeId);
        
        await logAction(storeId, null, "sync_n11", "marketplace_sync", null, "N11 Order Sync", null, response.data);

        const parsedResult = await parseStringPromise(response.data, { explicitArray: false, ignoreAttrs: true });
        
        if (parsedResult['SOAP-ENV:Envelope']['SOAP-ENV:Body']['SOAP-ENV:Fault']) {
            throw new Error(parsedResult['SOAP-ENV:Envelope']['SOAP-ENV:Body']['SOAP-ENV:Fault'].faultstring);
        }

        const orderListResponse = parsedResult['SOAP-ENV:Envelope']['SOAP-ENV:Body']['DetailedOrderListResponse'];
        if (orderListResponse.result.status === 'failure') throw new Error(orderListResponse.result.errorMessage);

        const n11OrdersRaw = orderListResponse.orderList?.order;
        return Array.isArray(n11OrdersRaw) ? n11OrdersRaw : (n11OrdersRaw ? [n11OrdersRaw] : []);
    } catch (e: any) {
        if (e.response?.status === 404 || e.message?.includes('404')) {
            console.log("N11 SOAP 404, falling back to REST...");
            return syncN11OrdersREST(client, storeId, settings);
        }
        throw e;
    }
}

export async function syncHepsiburadaOrders(client: any, storeId: number, settings: any) {
    const response = await fetchWithRetry(async () => {
        return await axios.get(`https://merchant.hepsiburada.com/api/orders/merchantid/${settings.merchantId}`, {
            auth: { username: settings.apiKey, password: settings.apiSecret },
            timeout: 30000
        });
    }, "Hepsiburada", storeId);
    
    await logAction(storeId, null, "sync_hepsiburada", "marketplace_sync", null, "Hepsiburada Order Sync", null, response.data);
    return response.data.orders || [];
}

export async function syncTrendyolOrders(client: any, storeId: number, settings: any) {
    const response = await fetchWithRetry(async () => {
        return await axios.get(`https://api.trendyol.com/sapigw/suppliers/${settings.merchantId}/orders`, {
            auth: { username: settings.apiKey, password: settings.apiSecret },
            timeout: 30000
        });
    }, "Trendyol", storeId);
    
    await logAction(storeId, null, "sync_trendyol", "marketplace_sync", null, "Trendyol Order Sync", null, response.data);
    return response.data.content || [];
}

// Helper to get Pazarama Access Token
async function getPazaramaToken(apiKey: string, apiSecret: string): Promise<string | null> {
    const tokenPaths = [
        "https://isortagimapi.pazarama.com/api/v1/Token",
        "https://isortagimapi.pazarama.com/Order/Token",
        "https://isortagimapi.pazarama.com/Token",
        "https://isortagimapi.pazarama.com/auth/token"
    ];

    for (const url of tokenPaths) {
        try {
            const res = await axios.post(url, {
                UserName: apiKey,
                Password: apiSecret
            }, { timeout: 10000 });
            
            if (res.data && res.data.isSuccess && res.data.data?.accessToken) {
                return res.data.data.accessToken;
            }
        } catch (error) {
            // Check next path
        }
    }
    return null;
}

export async function syncPazaramaOrders(client: any, storeId: number, settings: any) {
    const token = await getPazaramaToken(settings.apiKey, settings.apiSecret);
    const authHeader = token ? `Bearer ${token}` : `Basic ${Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64')}`;
    
    const endpoints = [
        "https://isortagimapi.pazarama.com/order/getOrdersForApi",
        "https://isortagimapi.pazarama.com/api/v1/product/getOrdersForApi",
        "https://isortagimapi.pazarama.com/order/api/getOrdersForApi",
        "https://isortagimapi.pazarama.com/api/v1/Order/GetOrders"
    ];

    let lastError: any = null;
    for (const url of endpoints) {
        try {
            const pzRes = await fetchWithRetry(async () => {
                return await axios.post(url, {
                    PageSize: 100, PageIndex: 1,
                }, {
                    headers: { 'Authorization': authHeader, 'MerchantId': settings.merchantId, 'Content-Type': 'application/json' },
                    timeout: 30000
                });
            }, `Pazarama-${url.split('/').pop()}`, storeId);
            
            await logAction(storeId, null, "sync_pazarama", "marketplace_sync", null, `Pazarama Order Sync: ${url}`, null, pzRes.data);
            
            if (pzRes.data && (pzRes.data.isSuccess || pzRes.data.success)) {
                const data = pzRes.data.data || pzRes.data.content || [];
                return Array.isArray(data) ? data : (data.items || []);
            }
        } catch (e: any) {
            lastError = e;
            if (e.response?.status === 404) continue;
            throw e;
        }
    }
    
    if (lastError) throw lastError;
    return [];
}


export async function testN11Connection(settings: any) {
  try {
    const soapEnvelope = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/service/genel/OrderService">
           <soapenv:Body>
              <sch:DetailedOrderListRequest>
                 <auth>
                    <appKey>${settings.appKey}</appKey>
                    <appSecret>${settings.appSecret}</appSecret>
                 </auth>
                 <searchData><status>New</status></searchData>
              </sch:DetailedOrderListRequest>
           </soapenv:Body>
        </soapenv:Envelope>
      `;
      const response = await axios.post("https://api.n11.com/ws/OrderService.wsdl", soapEnvelope, {
        headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
        timeout: 10000
      });
      const parsedResult = await parseStringPromise(response.data, { explicitArray: false, ignoreAttrs: true });
      return parsedResult['SOAP-ENV:Envelope']?.['SOAP-ENV:Body']?.['DetailedOrderListResponse']?.result?.status === 'success';
  } catch (e) {
      console.error("N11 Test Failure:", e);
      return false;
  }
}

export async function testHepsiburadaConnection(settings: any) {
    try {
      const response = await axios.get(`https://merchant.hepsiburada.com/api/orders/merchantid/${settings.merchantId}`, {
        auth: { username: settings.apiKey, password: settings.apiSecret },
        timeout: 10000
      });
      return response.status === 200;
    } catch (e) { return false; }
}

export async function testTrendyolConnection(settings: any) {
    try {
      const response = await axios.get(`https://api.trendyol.com/sapigw/suppliers/${settings.merchantId}/orders`, {
        auth: { username: settings.apiKey, password: settings.apiSecret },
        timeout: 10000
      });
      return response.status === 200;
    } catch (e) { return false; }
}

export async function testPazaramaConnection(settings: any) {
    try {
        const token = await getPazaramaToken(settings.apiKey, settings.apiSecret);
        const authHeader = token ? `Bearer ${token}` : `Basic ${Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64')}`;
        const pzRes = await axios.post("https://isortagimapi.pazarama.com/api/v1/Order/GetOrders", { PageSize: 1, PageIndex: 1 }, {
            headers: {
              'Authorization': authHeader,
              'MerchantId': settings.merchantId,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
        return pzRes.data.isSuccess === true;
    } catch (e) { return false; }
}

export async function autoUnpublishIfZeroStock(productId: number, storeId: number, dbClient?: any) {
  const queryRunner = dbClient ? dbClient.query.bind(dbClient) : pool.query.bind(pool);
  
  try {
    const res = await queryRunner(
      `SELECT id, name, barcode, stock_quantity, hepsiburada_sku, 
              is_hepsiburada_active, is_amazon_active, is_trendyol_active, is_n11_active, is_pazarama_active 
       FROM products WHERE id = $1 AND store_id = $2`,
      [productId, storeId]
    );

    if (res.rows.length === 0) return;
    const p = res.rows[0];
    const currentStock = Number(p.stock_quantity || 0);

    if (currentStock <= 0) {
      const isAnyActive = p.is_hepsiburada_active || p.is_amazon_active || p.is_trendyol_active || p.is_n11_active || p.is_pazarama_active;
      
      if (isAnyActive) {
        console.log(`[Auto-Unpublish Zero Stock] Product ID ${productId} ("${p.name}") stock is ${currentStock} <= 0. Auto closing active marketplace listings.`);
        
        await queryRunner(
          `UPDATE products 
           SET is_hepsiburada_active = false,
               is_amazon_active = false,
               is_trendyol_active = false,
               is_n11_active = false,
               is_pazarama_active = false,
               hepsiburada_last_sync = NOW()
           WHERE id = $1 AND store_id = $2`,
          [productId, storeId]
        );

        // Async trigger to marketplaces to set stock=0
        (async () => {
          try {
            const storeRes = await pool.query("SELECT hepsiburada_settings, amazon_settings, branding FROM stores WHERE id = $1", [storeId]);
            const st = storeRes.rows[0];
            
            // Hepsiburada Stock 0
            if (p.is_hepsiburada_active) {
              const hbSettings = st?.hepsiburada_settings || st?.branding?.hepsiburada_settings;
              if (hbSettings?.merchantId && hbSettings?.apiKey && hbSettings?.apiSecret) {
                const { HepsiburadaService } = await import("./backend/hepsiburadaService.js");
                const hbService = new HepsiburadaService(hbSettings, storeId);
                await hbService.updatePriceAndStock([{
                  MerchantSku: p.barcode || p.hepsiburada_sku,
                  HepsiburadaSku: p.hepsiburada_sku || "",
                  Price: 0,
                  AvailableStock: 0,
                  DispatchTime: 1
                }]);
              }
            }

            // Amazon Stock 0
            if (p.is_amazon_active) {
              const amzSettings = st?.amazon_settings || st?.branding?.amazon_settings;
              if (amzSettings?.sellerId && amzSettings?.clientId && amzSettings?.clientSecret && (amzSettings?.refresh_token || amzSettings?.refreshToken)) {
                const { AmazonService } = await import("./backend/amazonService.js");
                const amzService = new AmazonService(amzSettings, storeId);
                const sku = p.amazon_sku || p.barcode;
                if (sku) {
                  await amzService.updateListingsItem(String(sku).trim(), 0, 0);
                }
              }
            }
          } catch (e: any) {
            console.warn(`[Auto-Unpublish Marketplace Sync Error]: ${e.message}`);
          }
        })();
      }
    }
  } catch (err: any) {
    console.error(`[Auto-Unpublish Zero Stock Error]:`, err?.message || err);
  }
}

/**
 * Instant Real-Time Marketplace Stock Synchronizer
 * Automatically triggered whenever products stock changes:
 * - Sales Invoices (POST/PUT/DELETE)
 * - Purchase Invoices (POST/PUT/DELETE)
 * - POS Sales / Kasalar (Fast POS, Regular POS, Web Automation)
 * - Returns & Cancellations
 * - Direct Product Edits
 *
 * Runs non-blocking (async / fire-and-forget) to keep cashier / POS responses instant (<50ms).
 */
export async function syncProductStockToMarketplaces(
  productIds: (number | string)[],
  storeId: number,
  options?: { reason?: string }
): Promise<{ syncedCount: number; errorsCount: number }> {
  const validIds = Array.from(
    new Set(
      (productIds || [])
        .map(id => Number(id))
        .filter(id => !isNaN(id) && id > 0)
    )
  );

  if (validIds.length === 0 || !storeId) {
    return { syncedCount: 0, errorsCount: 0 };
  }

  try {
    const prodRes = await pool.query(
      `SELECT id, name, barcode, sku, price, currency, stock_quantity, category, sub_category,
              is_hepsiburada_active, hepsiburada_sku,
              is_amazon_active, amazon_asin, amazon_sku,
              is_trendyol_active, is_n11_active, is_pazarama_active,
              marketplace_data
       FROM products
       WHERE id = ANY($1) AND store_id = $2`,
      [validIds, storeId]
    );

    if (prodRes.rows.length === 0) {
      return { syncedCount: 0, errorsCount: 0 };
    }

    const products = prodRes.rows;

    const storeRes = await pool.query(
      "SELECT hepsiburada_settings, amazon_settings, currency_rates, branding FROM stores WHERE id = $1",
      [storeId]
    );
    const store = storeRes.rows[0] || {};
    const branding = store.branding || {};
    const rates = store.currency_rates || branding.currency_rates || {};

    const getPriceInTry = (p: any) => {
      let rawPrice = parseFloat(String(p.price || 0));
      const curr = String(p.currency || "TRY").toUpperCase();
      if (curr === "USD" && rates.USD) rawPrice *= Number(rates.USD);
      else if (curr === "EUR" && rates.EUR) rawPrice *= Number(rates.EUR);
      else if (curr === "GBP" && rates.GBP) rawPrice *= Number(rates.GBP);
      return rawPrice;
    };

    let syncedCount = 0;
    let errorsCount = 0;

    // 1. Zero-stock out-of-stock guard or restock auto-reactivation
    for (const p of products) {
      const currentStock = Number(p.stock_quantity || 0);
      if (currentStock <= 0) {
        await autoUnpublishIfZeroStock(p.id, storeId);
      } else {
        // If stock is positive (> 0) and product has marketplace skus, ensure it is activated if closed
        const shouldReactivateHb = !p.is_hepsiburada_active && Boolean(p.hepsiburada_sku);
        const shouldReactivateAmz = !p.is_amazon_active && Boolean(p.amazon_sku || p.amazon_asin);
        if (shouldReactivateHb || shouldReactivateAmz) {
          await pool.query(
            `UPDATE products 
             SET is_hepsiburada_active = CASE WHEN $1 THEN true ELSE is_hepsiburada_active END,
                 is_amazon_active = CASE WHEN $2 THEN true ELSE is_amazon_active END
             WHERE id = $3 AND store_id = $4`,
            [shouldReactivateHb, shouldReactivateAmz, p.id, storeId]
          );
          if (shouldReactivateHb) p.is_hepsiburada_active = true;
          if (shouldReactivateAmz) p.is_amazon_active = true;
        }
      }
    }

    // 2. Hepsiburada Real-Time Sync
    const hbSettings = store.hepsiburada_settings || branding.hepsiburada_settings;
    if (hbSettings?.merchantId && hbSettings?.apiKey && hbSettings?.apiSecret) {
      const hbProducts = products.filter(p => {
        let mpData = p.marketplace_data;
        if (typeof mpData === "string") {
          try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
        }
        return p.is_hepsiburada_active || Boolean(p.hepsiburada_sku) || mpData?.hepsiburada?.status === "ACTIVE";
      });

      if (hbProducts.length > 0) {
        try {
          const { HepsiburadaService } = await import("./backend/hepsiburadaService.js");
          const hbService = new HepsiburadaService(hbSettings, storeId);

          const hbItems = hbProducts.map(p => {
            let mpData = p.marketplace_data;
            if (typeof mpData === "string") {
              try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
            }
            const priceInTry = getPriceInTry(p);
            const effectivePrice = hbService.calculateMarketplacePrice(priceInTry, p.category, p.sub_category);
            const merchantSku = mpData?.hepsiburada?.merchantSku || p.barcode || p.sku || p.hepsiburada_sku;
            const currentStock = Math.max(0, parseInt(String(p.stock_quantity || 0), 10));

            return {
              MerchantSku: String(merchantSku).trim(),
              HepsiburadaSku: p.hepsiburada_sku || mpData?.hepsiburada?.hepsiburadaSku || "",
              Price: effectivePrice,
              AvailableStock: currentStock,
              DispatchTime: hbSettings.defaultDispatchTime || 1
            };
          });

          await hbService.updatePriceAndStock(hbItems);
          const hbIds = hbProducts.map(p => p.id);
          await pool.query(
            "UPDATE products SET hepsiburada_last_sync = NOW(), hepsiburada_last_error = NULL WHERE id = ANY($1)",
            [hbIds]
          );
          syncedCount += hbItems.length;
          console.log(`[Instant Marketplace Sync] Successfully pushed ${hbItems.length} products to Hepsiburada for store ${storeId} (Reason: ${options?.reason || "stock_change"}).`);
        } catch (hbErr: any) {
          errorsCount++;
          console.warn(`[Instant Marketplace Sync HB Error] Store ${storeId}:`, hbErr?.message || hbErr);
        }
      }
    }

    // 3. Amazon Real-Time Sync
    const amzSettings = store.amazon_settings || branding.amazon_settings;
    if (amzSettings?.sellerId && amzSettings?.clientId && amzSettings?.clientSecret && (amzSettings?.refresh_token || amzSettings?.refreshToken)) {
      const amzProducts = products.filter(p => {
        return p.is_amazon_active || Boolean(p.amazon_sku) || Boolean(p.amazon_asin);
      });

      if (amzProducts.length > 0) {
        try {
          const { AmazonService } = await import("./backend/amazonService.js");
          const amzService = new AmazonService(amzSettings, storeId);

          for (const p of amzProducts) {
            const sku = p.amazon_sku || p.sku || p.barcode;
            if (!sku) continue;
            const priceInTry = getPriceInTry(p);
            const currentStock = Math.max(0, parseInt(String(p.stock_quantity || 0), 10));

            const amzRes = await amzService.updateListingsItem(String(sku).trim(), priceInTry, currentStock);
            if (amzRes.success) {
              syncedCount++;
            } else {
              errorsCount++;
            }
          }
          const amzIds = amzProducts.map(p => p.id);
          await pool.query(
            "UPDATE products SET amazon_last_sync = NOW() WHERE id = ANY($1)",
            [amzIds]
          );
          console.log(`[Instant Marketplace Sync] Successfully pushed ${amzProducts.length} products to Amazon for store ${storeId} (Reason: ${options?.reason || "stock_change"}).`);
        } catch (amzErr: any) {
          errorsCount++;
          console.warn(`[Instant Marketplace Sync Amazon Error] Store ${storeId}:`, amzErr?.message || amzErr);
        }
      }
    }

    return { syncedCount, errorsCount };
  } catch (err: any) {
    console.error("[Instant Marketplace Sync Exception]:", err?.message || err);
    return { syncedCount: 0, errorsCount: 1 };
  }
}

