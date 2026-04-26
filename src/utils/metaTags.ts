import { pool } from "../../models/db";

export async function generateMetaTags(url: string, req: any): Promise<string> {
  const match = url.match(/^\/s\/([^\/]+)\/p\/([^\/\?]+)/);
  if (!match) return "";

  const slug = match[1];
  const barcode = match[2];

  try {
    const storeRes = await pool.query("SELECT id, name, default_currency, currency_rates, meta_settings, custom_domain FROM stores WHERE slug = $1", [slug]);
    if (storeRes.rows.length === 0) return "";
    const store = storeRes.rows[0];

    const prodRes = await pool.query("SELECT * FROM products WHERE store_id = $1 AND (barcode = $2 OR id::text = $2) LIMIT 1", [store.id, barcode]);
    if (prodRes.rows.length === 0) return "";
    const product = prodRes.rows[0];

    // Currency calculation
    const metaSettings = typeof store.meta_settings === 'string' ? JSON.parse(store.meta_settings) : (store.meta_settings || {});
    const catalogCurrency = metaSettings.catalog_currency || store.default_currency || 'TRY';
    const rates = typeof store.currency_rates === 'string' ? JSON.parse(store.currency_rates) : (store.currency_rates || { "USD": 1, "EUR": 1, "GBP": 1 });

    let convertedPrice = product.price;
    const fromCurrency = product.currency || 'TRY';
    if (fromCurrency !== catalogCurrency) {
      if (catalogCurrency === 'TRY') {
        const rate = rates[fromCurrency] || 1;
        convertedPrice = product.price * rate;
      } else if (fromCurrency === 'TRY') {
        const rate = rates[catalogCurrency] || 1;
        convertedPrice = product.price / rate;
      } else {
        const fromRate = rates[fromCurrency] || 1;
        const toRate = rates[catalogCurrency] || 1;
        convertedPrice = (product.price * fromRate) / toRate;
      }
    }

    const availabilityOG = (product.stock_quantity > 0) ? 'in stock' : 'out of stock';
    const availabilityLD = (product.stock_quantity > 0) ? 'InStock' : 'OutOfStock';
    
    // Domain building
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = store.custom_domain || req.get('host');
    const productUrl = `${protocol}://${host}${url}`;
    
    return `
      <!-- Open Graph / Meta Commerce -->
      <meta property="og:type" content="product" />
      <meta property="og:url" content="${productUrl}" />
      <meta property="og:title" content="${product.name}" />
      <meta property="og:description" content="${product.description || product.name}" />
      <meta property="og:image" content="${product.image_url || ''}" />
      <meta property="product:brand" content="${product.brand || store.name}" />
      <meta property="product:availability" content="${availabilityOG}" />
      <meta property="product:condition" content="new" />
      <meta property="product:price:amount" content="${convertedPrice.toFixed(2)}" />
      <meta property="product:price:currency" content="${catalogCurrency}" />
      <meta property="product:retailer_item_id" content="${product.barcode || product.id}" />
      <meta property="product:item_group_id" content="${product.category || 'all'}" />

      <!-- JSON-LD for Schema.org -->
      <script type="application/ld+json">
      {
        "@context": "https://schema.org/",
        "@type": "Product",
        "productID": "${product.barcode || product.id}",
        "sku": "${product.barcode || product.id}",
        "name": "${product.name}",
        "description": "${product.description || product.name}",
        "image": "${product.image_url || ''}",
        "url": "${productUrl}",
        "brand": {
          "@type": "Brand",
          "name": "${product.brand || store.name}"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "${catalogCurrency}",
          "price": "${convertedPrice.toFixed(2)}",
          "availability": "https://schema.org/${availabilityLD}",
          "itemCondition": "https://schema.org/NewCondition",
          "url": "${productUrl}"
        }
      }
      </script>
    `;
  } catch (err) {
    console.error("OpenGraph injection error:", err);
    return "";
  }
}
