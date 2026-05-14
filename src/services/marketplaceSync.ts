import { pool } from "../../models/db";
import { logAction } from "../../models/db";
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
  } catch (error) {
    if (retries <= 1) {
      await logAction(storeId, null, "error", "marketplace_sync", null, `${marketplace} Sync Final Failure: ${(error as AxiosError).message}`);
      throw error;
    }
    await logAction(storeId, null, "warning", "marketplace_sync", null, `${marketplace} Sync Retry (${4 - retries}): ${(error as AxiosError).message}`);
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
  orderId: string
) {
  for (const line of lines) {
    let productId = null;
    let currentStock = 0;
    
    if (line.barcode) {
      const cleanBarcode = (line.barcode || "").trim();
      const prodRes = await client.query("SELECT id, stock_quantity FROM products WHERE store_id = $1 AND (barcode = $2 OR sku = $2)", [storeId, cleanBarcode]);
      if (prodRes.rows.length > 0) {
        productId = prodRes.rows[0].id;
        currentStock = prodRes.rows[0].stock_quantity;
      }
    }
    
    if (!productId && line.sku) {
      const cleanSku = (line.sku || "").trim();
      const prodRes = await client.query("SELECT id, stock_quantity FROM products WHERE store_id = $1 AND (sku = $2 OR barcode = $2)", [storeId, cleanSku]);
      if (prodRes.rows.length > 0) {
        productId = prodRes.rows[0].id;
        currentStock = prodRes.rows[0].stock_quantity;
      }
    }

    const quantity = line.quantity || 1;
    const price = line.price || 0;
    const taxRate = line.taxRate || 20;
    const total = price * quantity;
    const taxAmount = total * (taxRate / 100);
    const name = line.name || `${marketplaceName} Ürünü`;
    
    await client.query(
      "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [saleId, productId, name, line.barcode || '', quantity, price, total]
    );

    await client.query(
      "INSERT INTO sales_invoice_items (sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [salesInvoiceId, name, quantity, price, taxRate, taxAmount, total]
    );

    if (productId) {
      await client.query(
        "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
        [quantity, productId]
      );

      await client.query(
        "INSERT INTO stock_movements (store_id, product_id, type, quantity, notes, previous_stock, new_stock) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [storeId, productId, 'out', quantity, `${marketplaceName} Satışı: ${orderId}`, currentStock, currentStock - quantity]
      );
    }
  }
}

// N11 REST Implementation (Experimental - Fallback for SOAP 404)
export async function syncN11OrdersREST(client: any, storeId: number, settings: any) {
    const auth = Buffer.from(`${settings.appKey}:${settings.appSecret}`).toString('base64');
    const response = await fetchWithRetry(async () => {
        // Trying /rest/orders as well as /v1/orders fallback
        try {
            return await axios.get("https://api.n11.com/rest/orders", {
                headers: { 'Authorization': `Basic ${auth}` },
                timeout: 30000
            });
        } catch (e: any) {
            if (e.response?.status === 404) {
                return await axios.get("https://api.n11.com/v1/orders", {
                    headers: { 'Authorization': `Basic ${auth}` },
                    timeout: 30000
                });
            }
            throw e;
        }
    }, "N11-REST", storeId);
    
    await logAction(storeId, null, "sync_n11_rest", "marketplace_sync", null, "N11 REST Order Sync", null, response.data);
    return response.data?.orders || [];
}

export async function syncN11Orders(client: any, storeId: number, settings: any) {
    // Try SOAP first with corrected URL
    try {
        const soapEnvelope = `
          <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/service/genel/OrderService">
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
            // Removing .wsdl and trying both with and without slash
            return await axios.post("https://api.n11.com/ws/OrderService", soapEnvelope, {
                headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
                timeout: 30000
            });
        }, "N11", storeId);
        
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

export async function syncPazaramaOrders(client: any, storeId: number, settings: any) {
    const authHeader = `Basic ${Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64')}`;
    
    const pzRes = await fetchWithRetry(async () => {
        // Trying alternate Pazarama URL if 404 happens
        try {
            return await axios.post("https://isortagimapi.pazarama.com/api/v1/Order/GetOrders", {
                PageSize: 100, Index: 1, // Note: some docs say Index instead of PageIndex
            }, {
                headers: { 'Authorization': authHeader, 'MerchantId': settings.merchantId, 'Content-Type': 'application/json' },
                timeout: 30000
            });
        } catch (e: any) {
            if (e.response?.status === 404) {
                 return await axios.post("https://api.pazarama.com/isortagim/api/v1/Order/GetOrders", {
                    PageSize: 100, PageIndex: 1,
                }, {
                    headers: { 'Authorization': authHeader, 'MerchantId': settings.merchantId, 'Content-Type': 'application/json' },
                    timeout: 30000
                });
            }
            throw e;
        }
    }, "Pazarama", storeId);
    
    await logAction(storeId, null, "sync_pazarama", "marketplace_sync", null, "Pazarama Order Sync", null, pzRes.data);
      
      if (pzRes.data && pzRes.data.isSuccess && pzRes.data.data && Array.isArray(pzRes.data.data.items)) {
        return pzRes.data.data.items;
      }
      return [];
}


export async function testN11Connection(settings: any) {
  const soapEnvelope = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/service/genel/OrderService">
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
    const response = await axios.post("https://api.n11.com/ws/OrderService.wsdl", soapEnvelope, {
      headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
      timeout: 10000
    });
    const parsedResult = await parseStringPromise(response.data, { explicitArray: false, ignoreAttrs: true });
    return parsedResult['SOAP-ENV:Envelope']['SOAP-ENV:Body']['DetailedOrderListResponse'].result.status === 'success';
}

export async function testHepsiburadaConnection(settings: any) {
    const response = await axios.get(`https://merchant.hepsiburada.com/api/orders/merchantid/${settings.merchantId}`, {
      auth: { username: settings.apiKey, password: settings.apiSecret },
      timeout: 10000
    });
    return response.status === 200;
}

export async function testTrendyolConnection(settings: any) {
    const response = await axios.get(`https://api.trendyol.com/sapigw/suppliers/${settings.merchantId}/orders`, {
      auth: { username: settings.apiKey, password: settings.apiSecret },
      timeout: 10000
    });
    return response.status === 200;
}

export async function testPazaramaConnection(settings: any) {
    const authHeader = `Basic ${Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64')}`;
    const pzRes = await axios.post("https://isortagimapi.pazarama.com/api/v1/Order/GetOrders", { PageSize: 1, PageIndex: 1 }, {
        headers: {
          'Authorization': authHeader,
          'MerchantId': settings.merchantId,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
    return pzRes.data.isSuccess === true;
}
