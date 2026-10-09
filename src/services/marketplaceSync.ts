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
      line.n11ProductId,
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
             OR n11_id = ANY($2)
             OR marketplace_data->'hepsiburada'->>'merchantSku' = ANY($2)
             OR marketplace_data->'hepsiburada'->>'hepsiburadaSku' = ANY($2)
             OR marketplace_data->'trendyol'->>'barcode' = ANY($2)
             OR marketplace_data->'trendyol'->>'stockCode' = ANY($2)
             OR marketplace_data->'n11'->>'sellerCode' = ANY($2)
             OR marketplace_data->'n11'->>'n11Id' = ANY($2)
             OR marketplace_data->'n11'->>'productId' = ANY($2)
           ) LIMIT 1`, 
          [storeId, searchCandidates]
        );
        if (prodRes.rows.length > 0) {
          productId = prodRes.rows[0].id;
          currentStock = prodRes.rows[0].stock_quantity;
          if (prodRes.rows[0].barcode && (!matchedBarcode || matchedBarcode.startsWith('HB') || !/^\d{8,14}$/.test(matchedBarcode))) {
            matchedBarcode = prodRes.rows[0].barcode;
          }
        }
      } catch (findErr) {
        // Fallback to simpler query if JSONB or some column is missing
        try {
          const prodRes2 = await client.query(
            "SELECT id, name, barcode, stock_quantity FROM products WHERE store_id = $1 AND (barcode = ANY($2) OR sku = ANY($2) OR hepsiburada_sku = ANY($2) OR n11_id = ANY($2)) LIMIT 1", 
            [storeId, searchCandidates]
          );
          if (prodRes2.rows.length > 0) {
            productId = prodRes2.rows[0].id;
            currentStock = prodRes2.rows[0].stock_quantity;
            if (prodRes2.rows[0].barcode && (!matchedBarcode || matchedBarcode.startsWith('HB') || !/^\d{8,14}$/.test(matchedBarcode))) {
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
          if (nameMatchRes.rows[0].barcode) {
            matchedBarcode = nameMatchRes.rows[0].barcode;
          }
        } else {
          // Multi-token AND match (handles reordered words like "Dexim Venio Dxbp12" vs "Dexim Dxbp12 Venio")
          const tokens = String(line.name)
            .replace(/[,.'"()/-]/g, ' ')
            .trim()
            .split(/\s+/)
            .filter(t => t.length >= 3)
            .slice(0, 3);
          if (tokens.length >= 2) {
            const conds = tokens.map((_, idx) => `name ILIKE $${idx + 2}`).join(' AND ');
            const params = [storeId, ...tokens.map(t => `%${t}%`)];
            const tokenMatchRes = await client.query(
              `SELECT id, name, barcode, stock_quantity FROM products WHERE store_id = $1 AND ${conds} LIMIT 1`,
              params
            );
            if (tokenMatchRes.rows.length > 0) {
              productId = tokenMatchRes.rows[0].id;
              currentStock = tokenMatchRes.rows[0].stock_quantity;
              if (tokenMatchRes.rows[0].barcode) {
                matchedBarcode = tokenMatchRes.rows[0].barcode;
              }
            }
          }
        }
      } catch (e) {
        // continue
      }
    }

    const quantity = line.quantity || 1;
    const price = line.price || 0;
    const taxRate = line.taxRate !== undefined ? Number(line.taxRate) : 20;
    const total = Math.round(price * quantity * 100) / 100;
    const subtotal = Math.round((total / (1 + taxRate / 100)) * 100) / 100;
    const taxAmount = Math.round((total - subtotal) * 100) / 100;
    const name = matchedName;
    const finalBarcode = matchedBarcode || line.barcode || '';
    
    await client.query(
      "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [saleId, productId, name, finalBarcode, quantity, price, total]
    );

    await client.query(
      "INSERT INTO sales_invoice_items (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
      [salesInvoiceId, productId, name, finalBarcode, quantity, price, taxRate, taxAmount, subtotal]
    );

    if (productId) {
      const resolvedInvoiceNumber = invoiceNumber || (marketplaceName.toLowerCase() === 'hepsiburada' ? `HB-${orderId}` : (marketplaceName.toLowerCase() === 'trendyol' ? `TY-${orderId}` : `${marketplaceName.toUpperCase()}-${orderId}`));
      const resolvedCustomer = customerName || 'Pazaryeri Müşterisi';

      // Guard against duplicate stock deduction if this order/invoice was already processed (e.g. during order reconciliation/backfill)
      const existingMovRes = await client.query(
        `SELECT id FROM stock_movements 
         WHERE store_id = $1 AND product_id = $2 
           AND (
             (invoice_id IS NOT NULL AND invoice_id = $3)
             OR (sale_id IS NOT NULL AND sale_id = $4)
             OR (invoice_number IS NOT NULL AND invoice_number = $5)
             OR description LIKE '%' || $5 || '%'
           )
         LIMIT 1`,
        [storeId, productId, salesInvoiceId || -1, saleId || -1, resolvedInvoiceNumber]
      );

      if (existingMovRes.rows.length === 0) {
        // Log movement with full transactional integrity (1 movement per sale/invoice)
        try {
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

        // Always sync products.stock_quantity directly from stock_movements net sum to prevent formula drift
        const updateRes = await client.query(
          `UPDATE products 
           SET stock_quantity = (
             SELECT COALESCE(SUM(CASE WHEN type = 'in' THEN quantity ELSE -quantity END), 0)
             FROM stock_movements
             WHERE product_id = $1
           )
           WHERE id = $1 RETURNING stock_quantity`,
          [productId]
        );
        
        const newStock = updateRes.rows[0]?.stock_quantity;
        if (newStock !== undefined && Number(newStock) <= 0) {
          await autoUnpublishIfZeroStock(productId, storeId, client);
        }
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

export async function syncN11Orders(client: any, storeId: number, settings: any, days?: number) {
    try {
        const { N11Service } = await import("./backend/n11Service");
        const lookbackDays = days && days > 0 ? days : 30;
        const today = new Date();
        // Add +1 day buffer for endDate to handle timezone differences safely
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const startDate = new Date(today.getTime() - lookbackDays * 24 * 60 * 60 * 1000);

        const formatDateN11 = (d: Date) => {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        const summaryOrders: any[] = [];
        let currentPage = 0;
        let totalPages = 1;

        while (currentPage < totalPages && currentPage < 20) {
            const listRes = await N11Service.getOrderList(settings, {
                startDate: formatDateN11(startDate),
                endDate: formatDateN11(tomorrow),
                currentPage,
                pageSize: 100
            });
            if (Array.isArray(listRes?.orders)) {
                summaryOrders.push(...listRes.orders);
            }
            const pageCount = parseInt(String(listRes?.pagingData?.pageCount || 1), 10);
            totalPages = !isNaN(pageCount) && pageCount > 0 ? pageCount : 1;
            currentPage++;
        }

        // Fallback: if date filter returned empty, check the last page of unfiltered OrderList
        if (summaryOrders.length === 0) {
            try {
                const firstPage = await N11Service.getOrderList(settings, { currentPage: 0, pageSize: 100 });
                const pageCount = parseInt(String(firstPage?.pagingData?.pageCount || 1), 10);
                if (pageCount > 1) {
                    const lastPage = await N11Service.getOrderList(settings, { currentPage: pageCount - 1, pageSize: 100 });
                    if (Array.isArray(lastPage?.orders)) {
                        summaryOrders.push(...lastPage.orders.slice(-25));
                    }
                } else if (Array.isArray(firstPage?.orders)) {
                    summaryOrders.push(...firstPage.orders.slice(-25));
                }
            } catch (fbErr) {
                // ignore fallback error
            }
        }

        // Deduplicate summary orders by id
        const uniqueSummaries = new Map<string, any>();
        for (const s of summaryOrders) {
            const oId = String(s.id || s.orderNumber || "").trim();
            // Skip OrderStatus 3 (Rejected) or 4 (Cancelled) at order level
            if (!oId || String(s.status) === "3" || String(s.status) === "4") continue;
            if (!uniqueSummaries.has(oId)) {
                uniqueSummaries.set(oId, s);
            }
        }

        const detailedOrders: any[] = [];
        for (const [oId, summary] of uniqueSummaries.entries()) {
            try {
                const detail = await N11Service.getOrderDetail(settings, oId);
                if (!detail) continue;

                // Extract order items and filter out cancelled/rejected items (status 7=?, wait: in N11 OrderItem status:
                // 1: Process, 2: New, 3: Rejected, 4: Cancelled, 5: Approved, 6: Shipped, 7: Delivered, 8: Cancelled/Rejected, 9: Returned, 10: Completed)
                let rawItems: any[] = [];
                if (detail.itemList?.item) {
                    rawItems = Array.isArray(detail.itemList.item) ? detail.itemList.item : [detail.itemList.item];
                } else if (detail.orderItemList?.orderItem) {
                    rawItems = Array.isArray(detail.orderItemList.orderItem) ? detail.orderItemList.orderItem : [detail.orderItemList.orderItem];
                }

                // Filter out items where quantity is 0 or status is 3 (Reddedildi), 4 (İptal Edildi), 8 (İptal), 9 (İade)
                const validItems = rawItems.filter((it: any) => {
                    const qty = parseInt(String(it.quantity || 0), 10);
                    const st = String(it.status || "");
                    const invoiceAmt = parseFloat(String(it.sellerInvoiceAmount ?? it.price ?? 0));
                    if (qty <= 0 || invoiceAmt <= 0) return false;
                    if (st === "3" || st === "4" || st === "8" || st === "9") return false;
                    return true;
                });

                if (validItems.length === 0) {
                    continue;
                }

                // Normalize itemList with only valid items
                detail.itemList = { item: validItems };
                if (!detail.id) detail.id = oId;
                if (!detail.createDate && summary.createDate) detail.createDate = summary.createDate;
                if (!detail.orderNumber && summary.orderNumber) detail.orderNumber = summary.orderNumber;
                if (!detail.status && summary.status) detail.status = summary.status;

                detailedOrders.push(detail);
            } catch (detailErr: any) {
                console.warn(`[N11 OrderDetail Fetch Warning] Order ${oId}:`, detailErr?.message || detailErr);
            }
        }

        return detailedOrders;
    } catch (e: any) {
        console.warn("[N11 Sync Error / Fallback]:", e?.message || e);
        if (e?.response?.status === 404 || e?.message?.includes('404')) {
            return syncN11OrdersREST(client, storeId, settings);
        }
        throw new Error(e?.message || "N11 sipariş servisine erişilemedi.");
    }
}

function parseN11OrderDate(rawDateStr: any): Date {
    if (!rawDateStr) return new Date();
    if (rawDateStr instanceof Date) return rawDateStr;
    const str = String(rawDateStr).trim();
    if (!str) return new Date();
    const trMatch = str.match(/^(\d{2})[\/\.](\d{2})[\/\.](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (trMatch) {
        const day = parseInt(trMatch[1], 10);
        const month = parseInt(trMatch[2], 10) - 1;
        const year = parseInt(trMatch[3], 10);
        const hour = trMatch[4] ? parseInt(trMatch[4], 10) : 0;
        const min = trMatch[5] ? parseInt(trMatch[5], 10) : 0;
        const sec = trMatch[6] ? parseInt(trMatch[6], 10) : 0;
        const parsed = new Date(year, month, day, hour, min, sec);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    const parsedIso = new Date(str);
    if (!isNaN(parsedIso.getTime())) return parsedIso;
    return new Date();
}

export async function syncStoreN11OrdersToDatabase(storeId: number, settings: any, days?: number): Promise<{ syncedCount: number; newOrdersCount: number }> {
    const n11Orders = await syncN11Orders(pool, storeId, settings, days);
    let syncedCount = 0;
    let newOrdersCount = 0;

    for (const order of n11Orders) {
        const orderId = String(order.id || order.orderNumber || "").trim();
        if (!orderId) continue;

        const existing = await pool.query(
            "SELECT id, sale_id, sales_invoice_id FROM n11_orders WHERE store_id = $1 AND n11_order_id = $2",
            [storeId, orderId]
        );

        const buyer = order.buyer || {};
        const billing = order.billingAddress || order.billing || {};
        const shipping = order.shippingAddress || order.shipping || {};

        const isCorporateOrder =
            (buyer.taxId && String(buyer.taxId).trim().length === 10) ||
            (billing.taxId && String(billing.taxId).trim().length === 10) ||
            order.invoiceType === "2" ||
            order.invoiceType === 2 ||
            /(a\.?ş|ltd|şti|tic|san|aş)/i.test(buyer.fullName || "") ||
            /(a\.?ş|ltd|şti|tic|san|aş)/i.test(billing.companyTitle || "");

        const companyTitle = (
            billing.companyTitle ||
            buyer.companyTitle ||
            (isCorporateOrder ? (buyer.fullName || billing.fullName) : "")
        ).trim();

        const fullCustomerName = (
            companyTitle ||
            buyer.fullName ||
            billing.fullName ||
            shipping.fullName ||
            "N11 Müşterisi"
        ).trim();
        const customerEmail = buyer.email || `${orderId}@n11.com`;

        const taxNumber = String(billing.taxId || buyer.taxId || billing.tcId || buyer.tcId || order.citizenshipId || "").trim();
        const taxOffice = String(billing.taxHouse || billing.taxOffice || buyer.taxOffice || buyer.taxHouse || "").trim();
        const tcId = String(billing.tcId || buyer.tcId || order.citizenshipId || "").trim();

        const billingParts = [
            billing.address || "",
            billing.neighborhood || "",
            billing.district || "",
            billing.city || "",
            billing.postalCode || ""
        ].map(s => String(s).trim()).filter(Boolean);
        const fullBillingAddressStr = billingParts.join(" / ") || "Fatura Adresi";

        const shippingParts = [
            shipping.address || billing.address || "",
            shipping.neighborhood || billing.neighborhood || "",
            shipping.district || billing.district || "",
            shipping.city || billing.city || "",
            shipping.postalCode || billing.postalCode || ""
        ].map(s => String(s).trim()).filter(Boolean);
        const fullShippingAddressStr = shippingParts.join(" / ") || fullBillingAddressStr;

        const shippingName = (shipping.fullName || shipping.recipient || fullCustomerName).trim();
        const customerPhone = String(shipping.gsm || billing.gsm || shipping.phone || billing.phone || buyer.mobilePhone || buyer.phone || "").trim();

        const nameParts = fullCustomerName.split(' ');
        const surname = nameParts.length > 1 ? nameParts.pop()! : '';
        const firstName = nameParts.join(' ') || fullCustomerName;
        const isCorporate = taxNumber.length === 10 || !!companyTitle;

        const rawN11Date = order.createDate || order.orderDate || order.orderDetail?.createDate || order.createDateString;
        const n11OrderDate = parseN11OrderDate(rawN11Date);

        let rawItems: any[] = [];
        if (order.orderItemList?.orderItem) {
            rawItems = Array.isArray(order.orderItemList.orderItem) ? order.orderItemList.orderItem : [order.orderItemList.orderItem];
        } else if (order.itemList?.item) {
            rawItems = Array.isArray(order.itemList.item) ? order.itemList.item : [order.itemList.item];
        } else if (order.itemList?.orderItem) {
            rawItems = Array.isArray(order.itemList.orderItem) ? order.itemList.orderItem : [order.itemList.orderItem];
        } else if (order.orderDetail?.orderItemList?.orderItem) {
            const detailItems = order.orderDetail.orderItemList.orderItem;
            rawItems = Array.isArray(detailItems) ? detailItems : [detailItems];
        } else if (Array.isArray(order.items)) {
            rawItems = order.items;
        } else if (order.orderItemList && typeof order.orderItemList === 'object') {
            rawItems = Array.isArray(order.orderItemList) ? order.orderItemList : [order.orderItemList];
        }

        const shipmentInfo = (rawItems[0] && rawItems[0].shipmentInfo) || order.shipmentInfo || {};
        const shippingCarrier = shipmentInfo.shipmentCompany?.name || shipmentInfo.shipmentCompany?.shortName || "Aras Kargo";
        const shippingTrackingNumber = shipmentInfo.trackingNumber || "";
        const campaignNumber = shipmentInfo.campaignNumber || shipmentInfo.shipmenCompanyCampaignNumber || "";

        const mappedLines = rawItems.map((l: any) => {
            const qty = parseInt(l.quantity || l.itemCount || 1, 10) || 1;
            const sellerInvoiceAmount = parseFloat(l.sellerInvoiceAmount || 0);
            let unitPrice = 0;
            if (sellerInvoiceAmount > 0) {
                unitPrice = sellerInvoiceAmount / qty;
            } else {
                const rawPrice = parseFloat(l.price || l.dueAmount || l.unitPrice || 0) || 0;
                const sellerDiscount = parseFloat(l.sellerDiscount || 0) || 0;
                unitPrice = Math.max(0, (rawPrice - (sellerDiscount / qty)) || rawPrice);
            }
            const taxRate = parseFloat(l.vatRate || l.kdv || l.taxRate || 20) || 20;
            const prodName = (l.productName || l.productTitle || l.title || l.productSellerCode || l.sellerStockCode || `N11 Sipariş Kalemi (${orderId})`).trim();
            const code = String(l.sellerStockCode || l.productSellerCode || l.productId || '').trim();

            return {
                name: prodName,
                quantity: qty,
                price: Math.round(unitPrice * 100) / 100,
                barcode: code,
                sku: code,
                n11ProductId: String(l.productId || '').trim(),
                taxRate: taxRate
            };
        });

        let grandTotal = parseFloat(order.totalAmount || order.dueAmount || order.sellerInvoiceAmount || 0);
        if (mappedLines.length > 0) {
            const linesSum = mappedLines.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
            if (linesSum > 0) {
                grandTotal = linesSum;
            }
        }
        grandTotal = Math.round(grandTotal * 100) / 100;

        let subtotal = 0;
        let taxAmount = 0;
        if (mappedLines.length > 0) {
            for (const item of mappedLines) {
                const lineTotal = item.price * item.quantity;
                const lineSubtotal = lineTotal / (1 + item.taxRate / 100);
                const lineTax = lineTotal - lineSubtotal;
                subtotal += lineSubtotal;
                taxAmount += lineTax;
            }
            subtotal = Math.round(subtotal * 100) / 100;
            taxAmount = Math.round(taxAmount * 100) / 100;
        } else {
            subtotal = Math.round((grandTotal / 1.20) * 100) / 100;
            taxAmount = Math.round((grandTotal - subtotal) * 100) / 100;
        }

        const invoiceNumber = `N11-${orderId}`;
        const orderNotes = [
            `N11 Sipariş No: ${order.orderNumber || orderId} (Paket No: ${orderId})`,
            `Fatura Ünvanı: ${fullCustomerName} ${taxNumber ? `(VKN/TCKN: ${taxNumber}${taxOffice ? ` - VD: ${taxOffice}` : ''})` : ''}`,
            `Fatura Adresi: ${fullBillingAddressStr}`,
            `Teslimat Alıcısı: ${shippingName} ${customerPhone ? `(Tel: ${customerPhone})` : ''}`,
            `Teslimat / Sevkiyat Adresi: ${fullShippingAddressStr}`,
            shippingTrackingNumber ? `Kargo / Sevkiyat: ${shippingCarrier} - Takip No: ${shippingTrackingNumber} ${campaignNumber ? `(Kampanya No: ${campaignNumber})` : ''}` : ''
        ].filter(Boolean).join('\n');

        if (existing.rows.length > 0) {
            const existingRow = existing.rows[0];
            const client = await pool.connect();
            try {
                await client.query("BEGIN");

                const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, customerEmail]);
                let customerId = custRes.rows[0]?.id || null;

                if (customerId) {
                    await client.query(
                        `UPDATE customers SET 
                           full_name = COALESCE(NULLIF($1, ''), full_name),
                           company_title = COALESCE(NULLIF($1, ''), company_title),
                           name = COALESCE(NULLIF($2, ''), name),
                           surname = COALESCE(NULLIF($3, ''), surname),
                           address = COALESCE(NULLIF($4, ''), address),
                           city = COALESCE(NULLIF($5, ''), city),
                           tax_number = COALESCE(NULLIF($6, ''), tax_number),
                           tax_office = COALESCE(NULLIF($7, ''), tax_office),
                           tc_id = COALESCE(NULLIF($8, ''), tc_id),
                           phone = COALESCE(NULLIF($9, ''), phone),
                           is_corporate = $10
                         WHERE id = $11`,
                        [fullCustomerName, firstName, surname, fullBillingAddressStr, billing.city || shipping.city || "", taxNumber, taxOffice, tcId, customerPhone, isCorporate, customerId]
                    );
                } else {
                    const newCust = await client.query(
                        `INSERT INTO customers (store_id, email, password, full_name, company_title, name, surname, phone, address, city, tax_number, tax_office, tc_id, is_corporate) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
                         ON CONFLICT (store_id, email) DO UPDATE SET 
                           full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), customers.full_name),
                           company_title = COALESCE(NULLIF(EXCLUDED.company_title, ''), customers.company_title),
                           name = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
                           surname = COALESCE(NULLIF(EXCLUDED.surname, ''), customers.surname),
                           phone = COALESCE(NULLIF(EXCLUDED.phone, ''), customers.phone),
                           address = COALESCE(NULLIF(EXCLUDED.address, ''), customers.address),
                           city = COALESCE(NULLIF(EXCLUDED.city, ''), customers.city),
                           tax_number = COALESCE(NULLIF(EXCLUDED.tax_number, ''), customers.tax_number),
                           tax_office = COALESCE(NULLIF(EXCLUDED.tax_office, ''), customers.tax_office),
                           tc_id = COALESCE(NULLIF(EXCLUDED.tc_id, ''), customers.tc_id),
                           is_corporate = EXCLUDED.is_corporate
                         RETURNING id`,
                        [storeId, customerEmail, 'marketplace_user', fullCustomerName, fullCustomerName, firstName, surname, customerPhone, fullBillingAddressStr, billing.city || shipping.city || "", taxNumber, taxOffice, tcId, isCorporate]
                    );
                    customerId = newCust.rows[0]?.id;
                }

                const saleId = existingRow.sale_id;
                const salesInvoiceId = existingRow.sales_invoice_id;

                if (saleId) {
                    await client.query(
                        `UPDATE sales SET 
                           total_amount = $1, 
                           customer_name = $2, 
                           customer_id = COALESCE($3, customer_id), 
                           customer_phone = $4,
                           customer_address = $5,
                           shipping_carrier = $6,
                           tracking_number = $7,
                           notes = $8, 
                           created_at = $9 
                         WHERE id = $10`,
                        [grandTotal, fullCustomerName, customerId, customerPhone, fullShippingAddressStr, shippingCarrier, shippingTrackingNumber, orderNotes, n11OrderDate, saleId]
                    );
                }

                if (salesInvoiceId) {
                    await client.query(
                        `UPDATE sales_invoices SET 
                           customer_id = COALESCE($1, customer_id), 
                           customer_name = $2,
                           company_title = $2,
                           tax_number = $3,
                           tax_office = $4,
                           address = $5,
                           customer_email = $6,
                           invoice_date = $7, 
                           total_amount = $8, 
                           tax_amount = $9, 
                           grand_total = $10, 
                           notes = $11, 
                           waybill_carrier_name = $12,
                           waybill_tracking_number = $13,
                           created_at = $7 
                         WHERE id = $14`,
                        [customerId, fullCustomerName, taxNumber, taxOffice, fullBillingAddressStr, customerEmail, n11OrderDate, subtotal, taxAmount, grandTotal, orderNotes, shippingCarrier, shippingTrackingNumber, salesInvoiceId]
                    );

                    const existingItemsCheck = await client.query(
                        "SELECT COUNT(*) as total, COUNT(product_id) as linked FROM sales_invoice_items WHERE sales_invoice_id = $1",
                        [salesInvoiceId]
                    );
                    const totalItems = parseInt(String(existingItemsCheck.rows[0]?.total || 0), 10);
                    const linkedItems = parseInt(String(existingItemsCheck.rows[0]?.linked || 0), 10);

                    if (totalItems === 0 || linkedItems < totalItems) {
                        await client.query("DELETE FROM sales_invoice_items WHERE sales_invoice_id = $1", [salesInvoiceId]);
                        if (saleId) {
                            await client.query("DELETE FROM sale_items WHERE sale_id = $1", [saleId]);
                        }
                        if (mappedLines.length > 0 && saleId) {
                            await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'N11', orderId, fullCustomerName, invoiceNumber);
                        }
                    }
                }

                await client.query(
                    "UPDATE n11_orders SET created_at = $1, order_data = $2 WHERE id = $3",
                    [n11OrderDate, order, existingRow.id]
                );

                await client.query("COMMIT");
                syncedCount++;
            } catch (e) {
                await client.query("ROLLBACK");
                console.error("N11 Order Backfill Error:", e);
            } finally {
                client.release();
            }
        } else {
            const client = await pool.connect();
            try {
                await client.query("BEGIN");

                let customerId = null;
                const custRes = await client.query("SELECT id FROM customers WHERE store_id = $1 AND email = $2", [storeId, customerEmail]);
                if (custRes.rows.length > 0) {
                    customerId = custRes.rows[0].id;
                    await client.query(
                        `UPDATE customers SET 
                           full_name = COALESCE(NULLIF($1, ''), full_name),
                           company_title = COALESCE(NULLIF($1, ''), company_title),
                           name = COALESCE(NULLIF($2, ''), name),
                           surname = COALESCE(NULLIF($3, ''), surname),
                           address = COALESCE(NULLIF($4, ''), address),
                           city = COALESCE(NULLIF($5, ''), city),
                           tax_number = COALESCE(NULLIF($6, ''), tax_number),
                           tax_office = COALESCE(NULLIF($7, ''), tax_office),
                           tc_id = COALESCE(NULLIF($8, ''), tc_id),
                           phone = COALESCE(NULLIF($9, ''), phone),
                           is_corporate = $10
                         WHERE id = $11`,
                        [fullCustomerName, firstName, surname, fullBillingAddressStr, billing.city || shipping.city || "", taxNumber, taxOffice, tcId, customerPhone, isCorporate, customerId]
                    );
                } else {
                    const newCust = await client.query(
                        `INSERT INTO customers (store_id, email, password, full_name, company_title, name, surname, phone, address, city, tax_number, tax_office, tc_id, is_corporate) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
                         ON CONFLICT (store_id, email) DO UPDATE SET 
                           full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), customers.full_name),
                           company_title = COALESCE(NULLIF(EXCLUDED.company_title, ''), customers.company_title),
                           name = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
                           surname = COALESCE(NULLIF(EXCLUDED.surname, ''), customers.surname),
                           phone = COALESCE(NULLIF(EXCLUDED.phone, ''), customers.phone),
                           address = COALESCE(NULLIF(EXCLUDED.address, ''), customers.address),
                           city = COALESCE(NULLIF(EXCLUDED.city, ''), customers.city),
                           tax_number = COALESCE(NULLIF(EXCLUDED.tax_number, ''), customers.tax_number),
                           tax_office = COALESCE(NULLIF(EXCLUDED.tax_office, ''), customers.tax_office),
                           tc_id = COALESCE(NULLIF(EXCLUDED.tc_id, ''), customers.tc_id),
                           is_corporate = EXCLUDED.is_corporate
                         RETURNING id`,
                        [storeId, customerEmail, 'marketplace_user', fullCustomerName, fullCustomerName, firstName, surname, customerPhone, fullBillingAddressStr, billing.city || shipping.city || "", taxNumber, taxOffice, tcId, isCorporate]
                    );
                    customerId = newCust.rows[0]?.id;
                }

                const saleRes = await client.query(
                    "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, customer_phone, customer_address, shipping_carrier, tracking_number, payment_method, notes, created_at, source) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id",
                    [storeId, grandTotal, 'TRY', 'completed', fullCustomerName, customerId, customerPhone, fullShippingAddressStr, shippingCarrier, shippingTrackingNumber, 'N11 Satış', orderNotes, n11OrderDate, 'n11']
                );
                const saleId = saleRes.rows[0].id;

                const invoiceRes = await client.query(
                    "INSERT INTO sales_invoices (store_id, sale_id, customer_id, customer_name, company_title, tax_number, tax_office, address, customer_email, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status, waybill_carrier_name, waybill_tracking_number, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING id",
                    [storeId, saleId, customerId, fullCustomerName, fullCustomerName, taxNumber, taxOffice, fullBillingAddressStr, customerEmail, invoiceNumber, n11OrderDate, subtotal, taxAmount, grandTotal, 'TRY', 'N11 Satış', orderNotes, 'marketplace', 'completed', shippingCarrier, shippingTrackingNumber, n11OrderDate]
                );
                const salesInvoiceId = invoiceRes.rows[0].id;

                if (mappedLines.length > 0) {
                    await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'N11', orderId, fullCustomerName, invoiceNumber);
                }

                const orderStatus = String(order.status || order.statusName || 'New');
                await client.query(
                    "INSERT INTO n11_orders (store_id, n11_order_id, sale_id, sales_invoice_id, status, order_data, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                    [storeId, orderId, saleId, salesInvoiceId, orderStatus, order, n11OrderDate]
                );

                await client.query("COMMIT");
                syncedCount++;
                newOrdersCount++;
            } catch (e) {
                await client.query("ROLLBACK");
                console.error("N11 Order Sync Error:", e);
            } finally {
                client.release();
            }
        }
    }

    const newSettings = { ...settings, last_sync: new Date().toISOString() };
    await pool.query("UPDATE stores SET n11_settings = $1 WHERE id = $2", [newSettings, storeId]);

    return { syncedCount, newOrdersCount };
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
        return await axios.get(`https://apigw.trendyol.com/integration/order/sellers/${settings.merchantId}/orders`, {
            auth: { username: settings.apiKey, password: settings.apiSecret },
            headers: {
                "User-Agent": `${settings.merchantId} - SelfIntegration`,
                "Accept": "application/json"
            },
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
      const response = await axios.get(`https://apigw.trendyol.com/integration/order/sellers/${settings.merchantId}/orders?size=1`, {
        auth: { username: settings.apiKey, password: settings.apiSecret },
        headers: {
          "User-Agent": `${settings.merchantId} - SelfIntegration`,
          "Accept": "application/json"
        },
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
              if (amzSettings?.sellerId && (amzSettings?.refresh_token || amzSettings?.refreshToken)) {
                const { AmazonService } = await import("./backend/amazonService.js");
                const amzService = new AmazonService(amzSettings, storeId);
                let mpData: any = p.marketplace_data;
                if (typeof mpData === "string") {
                  try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
                }
                const sku = p.amazon_sku || mpData?.amazon?.sku || p.sku || p.barcode;
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

    // 1. Zero-stock out-of-stock guard
    for (const p of products) {
      const currentStock = Number(p.stock_quantity || 0);
      if (currentStock <= 0) {
        await autoUnpublishIfZeroStock(p.id, storeId);
      }
    }

    // 2. Hepsiburada Real-Time Sync
    const hbSettings = store.hepsiburada_settings || branding.hepsiburada_settings;
    if (hbSettings?.merchantId && hbSettings?.apiKey && hbSettings?.apiSecret) {
      const hbProducts = products.filter(p => {
        const cleanHbSku = p.hepsiburada_sku && String(p.hepsiburada_sku).trim().toLowerCase() !== 'null' ? String(p.hepsiburada_sku).trim() : null;
        return Boolean(p.is_hepsiburada_active) && Boolean(cleanHbSku);
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
    if (amzSettings?.sellerId && (amzSettings?.refresh_token || amzSettings?.refreshToken)) {
      const amzProducts = products.filter(p => {
        const cleanAsin = p.amazon_asin && String(p.amazon_asin).trim().toLowerCase() !== 'null' && !String(p.amazon_asin).startsWith('http') ? String(p.amazon_asin).trim().toUpperCase() : null;
        return Boolean(p.is_amazon_active) && Boolean(cleanAsin && cleanAsin.length >= 9);
      });

      if (amzProducts.length > 0) {
        try {
          const { AmazonService } = await import("./backend/amazonService.js");
          const amzService = new AmazonService(amzSettings, storeId);

          for (const p of amzProducts) {
            let mpData: any = p.marketplace_data;
            if (typeof mpData === "string") {
              try { mpData = JSON.parse(mpData); } catch (e) { mpData = {}; }
            }
            const sku = p.amazon_sku || mpData?.amazon?.sku || p.sku || p.barcode;
            if (!sku) continue;
            const priceInTry = getPriceInTry(p);
            const effectiveAmzPrice = amzService.calculateMarketplacePrice(priceInTry, p.category, p.sub_category);
            const currentStock = Math.max(0, parseInt(String(p.stock_quantity || 0), 10));

            const amzRes = await amzService.updateListingsItem(String(sku).trim(), effectiveAmzPrice, currentStock);
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

