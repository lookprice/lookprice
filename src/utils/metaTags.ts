import { pool } from "../../models/db";

export async function generateMetaTags(url: string, req: any): Promise<string> {
  const sMatch = url.match(/^\/s\/([^\/]+)/);
  const isProductS = url.match(/^\/s\/([^\/]+)\/p\/([^\/\?]+)/);
  const isProductP = url.match(/^\/p\/([^\/\?]+)/);

  try {
    let storeRes;
    const host = req.get('host') || "";
    const normalizedHost = host.startsWith("www.") ? host.substring(4) : host;

    // Determine store based on URL slug or Custom Domain
    if (sMatch) {
      const slug = sMatch[1];
      storeRes = await pool.query("SELECT id, name, default_currency, currency_rates, meta_settings, custom_domain FROM stores WHERE slug ILIKE $1", [slug]);
    } else {
      storeRes = await pool.query("SELECT id, name, default_currency, currency_rates, meta_settings, custom_domain FROM stores WHERE custom_domain = $1 OR custom_domain = $2 LIMIT 1", [host, normalizedHost]);
    }

    if (!storeRes || storeRes.rows.length === 0) return "";
    const store = storeRes.rows[0];

    // Global Meta settings (GA & GTM)
    const metaSettings = typeof store.meta_settings === 'string' ? JSON.parse(store.meta_settings) : (store.meta_settings || {});
    const gaId = metaSettings.ga_measurement_id;
    const gtmId = metaSettings.gtm_id;

    let tags = '';

    if (gaId) {
      tags += `
      <!-- Google tag (gtag.js) -->
      <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gaId}');
      </script>
      `;
    }

    if (gtmId) {
      tags += `
      <!-- Google Tag Manager -->
      <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${gtmId}');</script>
      <!-- End Google Tag Manager -->
      `;
      // Usually noscript should be in body, but injecting it to head won't strictly break layout, although not ideal.
      // We will add it here, the browser will likely push it to body or ignore it if JS is enabled anyway.
      tags += `
      <!-- Google Tag Manager (noscript) -->
      <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
      <!-- End Google Tag Manager (noscript) -->
      `;
    }

    // Product specific OpenGraph & JSON-LD
    let barcode = "";
    if (isProductS) barcode = isProductS[2];
    else if (isProductP) barcode = isProductP[1];

    if (barcode) {
      const prodRes = await pool.query("SELECT * FROM products WHERE store_id = $1 AND (TRIM(LOWER(barcode)) = TRIM(LOWER($2)) OR id::text = TRIM($2)) LIMIT 1", [store.id, barcode]);
      if (prodRes.rows.length > 0) {
        const product = prodRes.rows[0];
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
        
        const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        const productUrl = `${protocol}://${host}${url}`;
        
        tags += `
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
      }
    }

    return tags;
  } catch (err) {
    console.error("OpenGraph injection error:", err);
    return "";
  }
}
