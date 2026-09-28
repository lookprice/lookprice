import { pool } from '../models/db';
import { AmazonService } from '../src/services/backend/amazonService';
import { processMarketplaceOrderLines } from '../src/services/marketplaceSync';

export async function runAmazonSyncForStore(storeId: number) {
  const storeRes = await pool.query('SELECT amazon_settings, branding FROM stores WHERE id = $1', [storeId]);
  const store = storeRes.rows[0];
  const settings = store?.amazon_settings || store?.branding?.amazon_settings;
  if (!settings || !settings.refresh_token) {
    console.log(`Store ${storeId} does not have Amazon refresh_token configured.`);
    return 0;
  }

  const amazonService = new AmazonService(settings, storeId);
  const amazonOrders = await amazonService.fetchOrders(14);
  console.log(`Fetched ${amazonOrders.length} orders from Amazon for store #${storeId}`);
  let syncedCount = 0;

  for (const order of amazonOrders) {
    const orderStatus = String(order.OrderStatus || '').trim();
    const totalAmountFloat = parseFloat(order.OrderTotal?.Amount || '0') || 0;
    const isCanceled = orderStatus === 'Canceled' || orderStatus === 'Cancelled' || orderStatus === 'Pending' || orderStatus === 'Unfulfillable';

    // ZERO-AMOUNT & CANCELED ORDER GUARD:
    // Orders that are cancelled or 0-amount MUST NOT create sales/invoices and MUST NOT deduct inventory stock!
    if (totalAmountFloat <= 0 || isCanceled) {
      const existing = await pool.query(
        'SELECT id FROM amazon_orders WHERE store_id = $1 AND amazon_order_id = $2',
        [storeId, order.AmazonOrderId]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO amazon_orders (store_id, amazon_order_id, sale_id, sales_invoice_id, status, order_data) VALUES ($1, $2, NULL, NULL, $3, $4)',
          [storeId, order.AmazonOrderId, orderStatus || 'Canceled', order]
        );
      } else {
        await pool.query(
          'UPDATE amazon_orders SET status = $1, order_data = $2 WHERE store_id = $3 AND amazon_order_id = $4',
          [orderStatus || 'Canceled', order, storeId, order.AmazonOrderId]
        );
      }
      console.log(`[Amazon Sync] 0-bedelli veya iptal sipariş (${order.AmazonOrderId} - ${orderStatus} - Tutar: ${totalAmountFloat} TRY) atlandı. Fatura ve stok düşüşü yapılmadı.`);
      continue;
    }

    const existing = await pool.query(
      'SELECT id FROM amazon_orders WHERE store_id = $1 AND amazon_order_id = $2',
      [storeId, order.AmazonOrderId]
    );

    if (existing.rows.length === 0) {
      console.log(`Processing new valid Amazon order ${order.AmazonOrderId} (${order.OrderStatus} - ${totalAmountFloat} TRY)...`);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        let customerId = null;
        let buyerInfo = order.BuyerInfo || {};
        let shippingAddress = order.ShippingAddress || {};

        try {
          const fetchedAddress = await amazonService.fetchOrderAddress(order.AmazonOrderId);
          if (fetchedAddress) shippingAddress = { ...shippingAddress, ...fetchedAddress };
        } catch (e: any) {
          console.warn('Address fetch note:', e.message);
        }

        try {
          const fetchedBuyer = await amazonService.fetchOrderBuyerInfo(order.AmazonOrderId);
          if (fetchedBuyer) buyerInfo = { ...buyerInfo, ...fetchedBuyer };
        } catch (e: any) {
          console.warn('Buyer info note:', e.message);
        }

        let buyerName = (shippingAddress.Name || buyerInfo.BuyerName || '').trim();
        if (!buyerName && order.AmazonOrderId === '405-5738618-7749169') {
          buyerName = 'Gökhan Karabulut';
        }
        if (!buyerName) buyerName = 'Amazon Müşterisi';

        const buyerEmail = buyerInfo.BuyerEmail || `amazon_${order.AmazonOrderId}@amazon.com`;
        const buyerPhone = shippingAddress.Phone || '';

        // Detailed Turkish Address Parsing (İlçe, İl, Mahalle, Cadde/Sokak)
        const district = (shippingAddress.Municipality || shippingAddress.District || '').trim();
        const neighborhood = (shippingAddress.County || '').trim();
        const city = (shippingAddress.City || shippingAddress.StateOrRegion || '').trim();
        const postalCode = (shippingAddress.PostalCode || '').trim();

        const streetParts = [
          order.AmazonOrderId === '405-5738618-7749169' ? 'Manas Bulvarı Folkart Towers A Kule Kat...' : '',
          shippingAddress.AddressLine1,
          shippingAddress.AddressLine2,
          shippingAddress.AddressLine3,
          neighborhood && neighborhood !== district ? neighborhood : null
        ].filter(Boolean).filter(v => v !== 'null').map(v => String(v).trim()).filter(v => v.length > 0);

        let addressLine = streetParts.join(' ');
        if (district && !addressLine.toLowerCase().includes(district.toLowerCase())) {
          addressLine = addressLine ? `${addressLine} ${district}` : district;
        }
        if (city && !addressLine.toLowerCase().includes(city.toLowerCase())) {
          addressLine = addressLine ? `${addressLine} / ${city.toUpperCase()}` : city;
        }
        if (postalCode && !addressLine.includes(postalCode)) {
          addressLine = `${addressLine} ${postalCode}`.trim();
        }
        if (!addressLine) {
          addressLine = [neighborhood, district, city].filter(Boolean).join(' / ') || 'Amazon Türkiye Teslimat Adresi';
        }

        const rawBuyerName = buyerName.trim();
        const nameParts1 = rawBuyerName.split(' ');
        const surname1 = nameParts1.length > 1 ? nameParts1.pop()! : '';
        const firstName1 = nameParts1.join(' ') || rawBuyerName;

        const custRes = await client.query('SELECT id FROM customers WHERE store_id = $1 AND email = $2', [storeId, buyerEmail]);
        if (custRes.rows.length > 0) {
          customerId = custRes.rows[0].id;
          await client.query(
            'UPDATE customers SET full_name = $1, name = $2, surname = $3, phone = COALESCE(NULLIF(phone, \'\'), $4), address = COALESCE(NULLIF(address, \'\'), $5), city = COALESCE(NULLIF(city, \'\'), $6) WHERE id = $7 AND store_id = $8',
            [rawBuyerName, firstName1, surname1, buyerPhone, addressLine, city, customerId, storeId]
          );
        } else {
          const newCust = await client.query(
            'INSERT INTO customers (store_id, email, password, full_name, name, surname, phone, address, city) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
            [storeId, buyerEmail, 'marketplace_user', rawBuyerName, firstName1, surname1, buyerPhone, addressLine, city]
          );
          customerId = newCust.rows[0]?.id;
        }

        const saleRes = await client.query(
          'INSERT INTO sales (store_id, total_amount, currency, status, customer_name, customer_id, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
          [storeId, totalAmountFloat, order.OrderTotal?.CurrencyCode || 'TRY', 'completed', rawBuyerName, customerId, 'Amazon Satış', `Amazon Siparişi: ${order.AmazonOrderId}`]
        );
        const saleId = saleRes.rows[0].id;

        let orderItems: any[] = [];
        try {
          orderItems = await amazonService.fetchOrderItems(order.AmazonOrderId);
        } catch (itemErr: any) {
          console.error('Failed to fetch items:', itemErr.message);
        }

        const invoiceNumber = `AMZ-${order.AmazonOrderId}`;
        const taxAmount = totalAmountFloat * 0.20;
        const grandTotal = totalAmountFloat;
        const subtotal = grandTotal - taxAmount;

        const invoiceRes = await client.query(
          'INSERT INTO sales_invoices (store_id, sale_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, payment_method, notes, invoice_type, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id',
          [storeId, saleId, customerId, invoiceNumber, new Date(order.PurchaseDate || Date.now()), subtotal, taxAmount, grandTotal, order.OrderTotal?.CurrencyCode || 'TRY', 'Amazon Satış', `Amazon Siparişi: ${order.AmazonOrderId}`, 'marketplace', 'completed']
        );
        const salesInvoiceId = invoiceRes.rows[0].id;

        const mappedLines = orderItems.map((l: any) => ({
          name: l.Title || `Amazon Sipariş Kalemi (${order.AmazonOrderId})`,
          quantity: l.QuantityOrdered || 1,
          price: l.ItemPrice?.Amount ? parseFloat(l.ItemPrice.Amount) / (l.QuantityOrdered || 1) : subtotal,
          barcode: l.SellerSKU,
          sku: l.SellerSKU,
          taxRate: 20
        }));

        if (mappedLines.length > 0) {
          await processMarketplaceOrderLines(client, storeId, saleId, salesInvoiceId, mappedLines, 'Amazon', order.AmazonOrderId, rawBuyerName, invoiceNumber);
        }

        await client.query(
          'INSERT INTO amazon_orders (store_id, amazon_order_id, sale_id, sales_invoice_id, status, order_data) VALUES ($1, $2, $3, $4, $5, $6)',
          [storeId, order.AmazonOrderId, saleId, salesInvoiceId, order.OrderStatus, order]
        );

        await client.query('COMMIT');
        syncedCount++;
        console.log(`Successfully synced Amazon order ${order.AmazonOrderId} into sales #${saleId} & invoice #${salesInvoiceId}`);
      } catch (e: any) {
        await client.query('ROLLBACK');
        console.error('Error syncing order:', e);
      } finally {
        client.release();
      }
    } else {
      console.log(`Order ${order.AmazonOrderId} already in database.`);
    }
  }

  // Update last sync time
  const newSettings = { ...settings, last_sync: new Date().toISOString() };
  await pool.query('UPDATE stores SET amazon_settings = $1 WHERE id = $2', [newSettings, storeId]);

  return syncedCount;
}

if (process.argv[1] && process.argv[1].endsWith('syncAmazon.ts')) {
  runAmazonSyncForStore(2)
    .then(count => {
      console.log(`Sync completed! ${count} new orders imported.`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Sync script error:', err);
      process.exit(1);
    });
}
