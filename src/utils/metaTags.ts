import { pool } from "../../models/db";

function renderFaviconTags(customLogo?: string, host = "enrakipsiz.com", protocol = "https"): string {
  const domain = host || "enrakipsiz.com";
  const baseUrl = `${protocol}://${domain}`;

  // Static favicon URLs generated in /public
  const default48 = `${baseUrl}/favicon-48x48.png`;
  const default192 = `${baseUrl}/favicon-192x192.png`;
  const default512 = `${baseUrl}/favicon-512x512.png`;
  const defaultSvg = `${baseUrl}/favicon.svg`;
  const defaultIco = `${baseUrl}/favicon.ico`;
  const appleTouch = `${baseUrl}/apple-touch-icon.png`;

  let storeIconTags = "";
  if (customLogo && customLogo.startsWith("http")) {
    storeIconTags = `
      <link rel="icon" type="image/png" sizes="48x48" href="${customLogo}" />
      <link rel="icon" type="image/png" sizes="192x192" href="${customLogo}" />
      <link rel="shortcut icon" href="${customLogo}" />
      <link rel="apple-touch-icon" href="${customLogo}" />
    `;
  }

  return `
    <!-- Google Search & Universal Browser Favicon Tags -->
    ${storeIconTags}
    <link rel="icon" type="image/png" sizes="48x48" href="${default48}" />
    <link rel="icon" type="image/png" sizes="192x192" href="${default192}" />
    <link rel="icon" type="image/png" sizes="512x512" href="${default512}" />
    <link rel="icon" type="image/svg+xml" href="${defaultSvg}" />
    <link rel="shortcut icon" href="${defaultIco}" />
    <link rel="apple-touch-icon" sizes="180x180" href="${appleTouch}" />
    <link rel="manifest" href="${baseUrl}/site.webmanifest" />
  `;
}

export async function generateMetaTags(url: string, req: any): Promise<string> {
  const host = req.get('host') || "enrakipsiz.com";
  const normalizedHost = host.startsWith("www.") ? host.substring(4) : host;
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';

  // Extract clean path and handle trailing slashes for canonical tags
  let pathOnly = url.split("?")[0];
  if (pathOnly.length > 1 && pathOnly.endsWith("/")) {
    pathOnly = pathOnly.slice(0, -1);
  }

  // Advanced Route Matches
  const sMatch = url.match(/^\/s\/([^\/]+)/);
  const isProductS = url.match(/^\/s\/([^\/]+)\/p\/([^\/\?]+)/);
  const isProductP = url.match(/^\/p\/([^\/\?]+)/);
  const isStoreP = url.match(/^\/store\/([^\/]+)\/p\/([^\/\?]+)/);
  const isStoreMatch = url.match(/^\/store\/([^\/]+)/);

  let barcode = "";
  let storeSlug = "";

  if (isProductS) {
    storeSlug = isProductS[1];
    barcode = isProductS[2];
  } else if (isStoreP) {
    storeSlug = isStoreP[1];
    barcode = isStoreP[2];
  } else if (isProductP) {
    barcode = isProductP[1];
  } else if (sMatch) {
    storeSlug = sMatch[1];
  } else if (isStoreMatch) {
    storeSlug = isStoreMatch[1];
  }

  try {
    // --- 1. CASE: ITEM DETAIL PAGE (RE, VEHICLE, OR PRODUCT) ---
    if (barcode) {
      let cleanId = barcode;
      let isRealEstate = barcode.startsWith("re_");
      let isVehicle = barcode.startsWith("v_");

      if (isRealEstate) cleanId = barcode.substring(3);
      else if (isVehicle) cleanId = barcode.substring(2);

      const parsedId = parseInt(cleanId, 10);

      // A. Real Estate Property Details
      if (isRealEstate && !isNaN(parsedId)) {
        const reRes = await pool.query(
          "SELECT * FROM real_estate_properties WHERE id = $1 LIMIT 1",
          [parsedId]
        );
        if (reRes.rows.length > 0) {
          const prop = reRes.rows[0];
          // Get parent store details
          const storeRes = await pool.query(
            "SELECT id, name, slug, logo_url, default_currency, currency_rates FROM stores WHERE id = $1 LIMIT 1",
            [prop.store_id]
          );
          const store = storeRes.rows[0] || {};
          const storeName = store.name || "EnRakipsiz Emlak";
          const storeLogo = store.logo_url || "";

          const propUrl = `${protocol}://${host}${url}`;
          const propImage = prop.images && prop.images.length > 0 ? prop.images[0] : (store.logo_url || '');
          const propDesc = prop.description || `${prop.title} - ${prop.kktc_region || prop.location || 'Girne'}.`;
          const sqmStr = prop.square_meters ? `${prop.square_meters} m²` : '';
          const priceStr = `${prop.price ? prop.price.toLocaleString('tr-TR') : ''} ${prop.currency || 'GBP'}`;
          
          // Enticing click-friendly description
          const compoundDesc = `${prop.title} - ${prop.kktc_region || prop.location || ''} bölgesinde ${priceStr} fiyatıyla satılık/kiralık ${prop.room_count || 'gayrimenkul'}. Oda sayısı: ${prop.room_count || ''}, Net alan: ${sqmStr}. Güncel resimler ve konum bilgisi için hemen tıklayın.`;

          // Professional Schema structure (Satisfies Google Product & Breadcrumb Rich Snippet)
          const regionName = prop.kktc_region || prop.location || 'KKTC';
          const typeName = prop.property_type || 'Gayrimenkul';

          const richSchema = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Product",
                "name": prop.title,
                "description": propDesc,
                "image": prop.images || [],
                "brand": {
                  "@type": "Brand",
                  "name": storeName
                },
                "offers": {
                  "@type": "Offer",
                  "price": prop.price,
                  "priceCurrency": prop.currency || "GBP",
                  "availability": "https://schema.org/InStock",
                  "url": propUrl
                }
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Anasayfa",
                    "item": `${protocol}://${host}`
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": regionName,
                    "item": `${protocol}://${host}/?region=${encodeURIComponent(regionName)}`
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": typeName,
                    "item": `${protocol}://${host}/?type=${encodeURIComponent(typeName)}`
                  },
                  {
                    "@type": "ListItem",
                    "position": 4,
                    "name": prop.title,
                    "item": propUrl
                  }
                ]
              }
            ]
          };

          const canonicalUrl = `${protocol}://${host}${pathOnly}`;

          return `
            <title>${prop.title} | ${storeName}</title>
            <link rel="canonical" href="${canonicalUrl}" />
            <meta name="description" content="${compoundDesc.substring(0, 160)}" />
            <meta name="keywords" content="${prop.title}, kıbrıs emlak, kktc emlak, sahibinden satılık, ${prop.kktc_region || 'girne'}, ${storeName}" />
            <meta name="robots" content="index, follow" />
            <meta property="og:type" content="product" />
            <meta property="og:url" content="${propUrl}" />
            <meta property="og:title" content="${prop.title} | ${storeName}" />
            <meta property="og:description" content="${compoundDesc.substring(0, 160)}" />
            ${propImage ? `<meta property="og:image" content="${propImage}" />` : ''}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${prop.title} | ${storeName}" />
            <meta name="twitter:description" content="${compoundDesc.substring(0, 160)}" />
            ${propImage ? `<meta name="twitter:image" content="${propImage}" />` : ''}
            ${renderFaviconTags(storeLogo, host, protocol)}
            <script type="application/ld+json">
            ${JSON.stringify(richSchema)}
            </script>
          `;
        }
      }

      // B. Vehicle Details (Automated Smart SEO Engine)
      if (isVehicle && !isNaN(parsedId)) {
        const vRes = await pool.query(
          "SELECT * FROM vehicles WHERE id = $1 LIMIT 1",
          [parsedId]
        );
        if (vRes.rows.length > 0) {
          const vehicle = vRes.rows[0];
          // Get parent store details
          const storeRes = await pool.query(
            "SELECT id, name, slug, logo_url, address FROM stores WHERE id = $1 LIMIT 1",
            [vehicle.store_id]
          );
          const store = storeRes.rows[0] || {};
          const storeName = store.name || "EnRakipsiz Otomotiv";
          const storeLogo = store.logo_url || "";

          const vUrl = `${protocol}://${host}${url}`;
          
          // Image resolution
          let vImages: string[] = [];
          if (Array.isArray(vehicle.images) && vehicle.images.length > 0) {
            vImages = vehicle.images;
          } else if (vehicle.image_url) {
            vImages = [vehicle.image_url];
          } else if (storeLogo) {
            vImages = [storeLogo];
          }
          const primaryImage = vImages[0] || '';

          // Price & Stats Formatting
          const transMap: Record<string, string> = {
            'manual': 'Manuel',
            'automatic': 'Otomatik',
            'semi_automatic': 'Yarı Otomatik',
            'dual_clutch': 'Çift Kavrama'
          };
          const fuelMap: Record<string, string> = {
            'gasoline': 'Benzin',
            'diesel': 'Dizel',
            'gasoline_hybrid': 'Benzin / Hibrit',
            'diesel_hybrid': 'Dizel / Hibrit',
            'electric': 'Elektrik',
            'lpg': 'LPG'
          };

          const priceStr = vehicle.selling_price ? `${vehicle.selling_price.toLocaleString('tr-TR')} ${vehicle.currency || 'EUR'}` : 'Uyguna Satılık';
          const kmStr = vehicle.current_mileage ? `${vehicle.current_mileage.toLocaleString('tr-TR')} km` : 'Düşük KM';
          const pkgStr = vehicle.package_name ? ` ${vehicle.package_name}` : '';
          const transStr = transMap[vehicle.transmission?.toLowerCase()] || vehicle.transmission || 'Otomatik';
          const fuelStr = fuelMap[vehicle.fuel_type?.toLowerCase()] || vehicle.fuel_type || 'Benzin';
          const yearStr = vehicle.year ? `${vehicle.year} ` : '';

          // 1. DYNAMIC HIGH-CONVERTING TITLE TAG
          const vTitle = `Satılık ${yearStr}${vehicle.brand} ${vehicle.model}${pkgStr} (${transStr}, ${fuelStr}) | KKTC İkinci El Oto Galeri - ${storeName}`;

          // 2. AUTOMATED SEARCH-INTENT DESCRIPTION PARAGRAPH
          const tramerText = (vehicle.tramer_amount && Number(vehicle.tramer_amount) > 0)
            ? `Tramer Kaydı: ${Number(vehicle.tramer_amount).toLocaleString('tr-TR')} ${vehicle.tramer_currency || 'TRY'}.`
            : 'Hasarsız / Tramer Kayıtsız temiz kondisyonda.';

          const tradeInText = vehicle.is_trade_in_available ? 'Takas seçeneği mevcuttur.' : '';

          const autoDescription = `KKTC satılık ${yearStr}${vehicle.brand} ${vehicle.model}${pkgStr} (${transStr}, ${fuelStr}, ${kmStr}). ${tramerText} ${priceStr} cazip fiyatı ve ${storeName} güvencesiyle Girne / Lefkoşa galeri teslimi. ${tradeInText} Detaylı resimler ve ekspertiz için tıklayın.`;

          // 3. TARGETED LONG-TAIL KEYWORDS
          const keywordsArr = [
            `kktc satılık ${vehicle.brand} ${vehicle.model}`,
            `kıbrıs ${yearStr}${vehicle.brand} ${vehicle.model}`,
            `ikinci el ${vehicle.brand} ${vehicle.model} lefkoşa`,
            `girne satılık ${vehicle.brand}`,
            `kktc oto galeri ${vehicle.brand}`,
            `sahibinden ${vehicle.brand} ${vehicle.model} kıbrıs`,
            `satılık ${transStr.toLowerCase()} ${vehicle.brand}`,
            `${storeName} satılık araçlar`
          ];
          const vKeywords = keywordsArr.join(", ");

          // 4. SCHEMA.ORG "Car" STRUCTURED DATA
          const carSchema = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Car",
                "name": `${yearStr}${vehicle.brand} ${vehicle.model}${pkgStr}`,
                "description": autoDescription,
                "image": vImages,
                "brand": {
                  "@type": "Brand",
                  "name": vehicle.brand
                },
                "model": vehicle.model,
                "vehicleModelDate": `${vehicle.year || ''}`,
                "fuelType": fuelStr,
                "vehicleTransmission": transStr,
                "mileageFromOdometer": {
                  "@type": "QuantitativeValue",
                  "value": vehicle.current_mileage || 0,
                  "unitCode": "KMT"
                },
                "color": vehicle.color || undefined,
                "bodyType": vehicle.body_type || undefined,
                "offers": {
                  "@type": "Offer",
                  "price": vehicle.selling_price || 0,
                  "priceCurrency": vehicle.currency || "EUR",
                  "availability": "https://schema.org/InStock",
                  "url": vUrl
                }
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Anasayfa",
                    "item": `${protocol}://${host}`
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Oto Galeri & Satılık Araçlar",
                    "item": `${protocol}://${host}/?category=otomobil`
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": vehicle.brand,
                    "item": `${protocol}://${host}/?brand=${encodeURIComponent(vehicle.brand)}`
                  },
                  {
                    "@type": "ListItem",
                    "position": 4,
                    "name": `${vehicle.brand} ${vehicle.model}`,
                    "item": vUrl
                  }
                ]
              }
            ]
          };

          const canonicalUrl = `${protocol}://${host}${pathOnly}`;

          return `
            <title>${vTitle}</title>
            <link rel="canonical" href="${canonicalUrl}" />
            <meta name="description" content="${autoDescription.substring(0, 160)}" />
            <meta name="keywords" content="${vKeywords}" />
            <meta name="robots" content="index, follow" />
            <meta property="og:type" content="product" />
            <meta property="og:url" content="${vUrl}" />
            <meta property="og:title" content="${vTitle}" />
            <meta property="og:description" content="${autoDescription.substring(0, 160)}" />
            ${primaryImage ? `<meta property="og:image" content="${primaryImage}" />` : ''}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${vTitle}" />
            <meta name="twitter:description" content="${autoDescription.substring(0, 160)}" />
            ${primaryImage ? `<meta name="twitter:image" content="${primaryImage}" />` : ''}
            ${renderFaviconTags(storeLogo, host, protocol)}
            <script type="application/ld+json">
            ${JSON.stringify(carSchema)}
            </script>
          `;
        }
      }

      // C. Standard E-Commerce Product Details
      let store;
      if (storeSlug) {
        const storeRes = await pool.query(
          "SELECT id, name, slug, default_currency, currency_rates, meta_settings, logo_url FROM stores WHERE slug ILIKE $1",
          [storeSlug]
        );
        store = storeRes.rows[0];
      } else {
        const storeRes = await pool.query(
          "SELECT id, name, slug, default_currency, currency_rates, meta_settings, logo_url FROM stores WHERE custom_domain = $1 OR custom_domain = $2 LIMIT 1",
          [host, normalizedHost]
        );
        store = storeRes.rows[0];
      }

      if (store) {
        const prodRes = await pool.query(
          "SELECT * FROM products WHERE store_id = $1 AND (TRIM(LOWER(barcode)) = TRIM(LOWER($2)) OR id::text = TRIM($2)) LIMIT 1",
          [store.id, barcode]
        );
        if (prodRes.rows.length > 0) {
          const product = prodRes.rows[0];
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
          const productUrl = `${protocol}://${host}${url}`;
          const storeLogo = store.logo_url || "";
          
          const canonicalUrl = `${protocol}://${host}${pathOnly}`;

          return `
            <title>${product.name} | ${store.name}</title>
            <link rel="canonical" href="${canonicalUrl}" />
            <meta name="description" content="${(product.description || product.name).substring(0, 160)}" />
            <meta name="keywords" content="${product.name}, ${product.brand || store.name}, alışveriş, kıbrıs mağaza" />
            <meta name="robots" content="index, follow" />
            <meta property="og:type" content="product" />
            <meta property="og:url" content="${productUrl}" />
            <meta property="og:title" content="${product.name} | ${store.name}" />
            <meta property="og:description" content="${(product.description || product.name).substring(0, 160)}" />
            <meta property="og:image" content="${product.image_url || ''}" />
            <meta property="product:brand" content="${product.brand || store.name}" />
            <meta property="product:availability" content="${availabilityOG}" />
            <meta property="product:condition" content="new" />
            <meta property="product:price:amount" content="${convertedPrice.toFixed(2)}" />
            <meta property="product:price:currency" content="${catalogCurrency}" />
            <meta property="product:retailer_item_id" content="${product.barcode || product.id}" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${product.name} | ${store.name}" />
            <meta name="twitter:description" content="${(product.description || product.name).substring(0, 160)}" />
            <meta name="twitter:image" content="${product.image_url || ''}" />
            ${renderFaviconTags(storeLogo, host, protocol)}

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
    }

    // --- 2. CASE: PORTAL HOMEPAGE (enrakipsiz.com or portal routes) ---
    if (normalizedHost === "enrakipsiz.com" || normalizedHost.includes("enrakipsiz")) {
      const portalSettingsRes = await pool.query("SELECT * FROM enrakipsiz_settings WHERE id = 1");
      const portalSettings = portalSettingsRes.rows[0] || {};
      
      const title = portalSettings.seo_title || portalSettings.portal_title || "EnRakipsiz | KKTC'nin En Büyük Portföy Portalı";
      const desc = portalSettings.seo_description || portalSettings.portal_description || "KKTC'nin en geniş emlak, araç ve ürün portföyüne enrakipsiz.com ile ulaşın.";
      const keywords = portalSettings.seo_keywords || "kktc emlak, kktc oto galeri, emlak ilanları, satılık araba, enrakipsiz";
      const gaId = portalSettings.google_analytics_id;
      const gtmId = portalSettings.google_tag_manager_id;
      const gscId = portalSettings.google_search_console_id;
      const customPortalLogo = portalSettings.favicon_url || portalSettings.portal_logo_url || "";

      const canonicalUrl = `https://enrakipsiz.com${pathOnly}`;

      let tags = `
        <title>${title}</title>
        <link rel="canonical" href="${canonicalUrl}" />
        <meta name="description" content="${desc}" />
        <meta name="keywords" content="${keywords}" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${desc}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${canonicalUrl}" />
        <meta property="og:image" content="https://enrakipsiz.com/favicon-512x512.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${desc}" />
        <meta name="twitter:image" content="https://enrakipsiz.com/favicon-512x512.png" />
        ${renderFaviconTags(customPortalLogo, "enrakipsiz.com", protocol)}
      `;

      if (gscId) {
        tags += `\n        <meta name="google-site-verification" content="${gscId}" />`;
      }

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

      if (gtmId && gtmId !== "GTM-5PR778HH") {
        tags += `
        <!-- Google Tag Manager -->
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');</script>
        <!-- End Google Tag Manager -->
        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <!-- End Google Tag Manager (noscript) -->
        `;
      }

      return tags;
    }

    // --- 3. CASE: STOREFRONT HOME / PORTFOLIO PAGE ---
    let storeRes;
    if (storeSlug) {
      storeRes = await pool.query(
        "SELECT id, name, slug, default_currency, currency_rates, meta_settings, custom_domain, description, logo_url, address, hero_title FROM stores WHERE slug ILIKE $1",
        [storeSlug]
      );
    } else {
      storeRes = await pool.query(
        "SELECT id, name, slug, default_currency, currency_rates, meta_settings, custom_domain, description, logo_url, address, hero_title FROM stores WHERE custom_domain = $1 OR custom_domain = $2 LIMIT 1",
        [host, normalizedHost]
      );
    }

    // A. Fallback to platform-wide LookPrice landing page metadata if store is not found
    if (!storeRes || storeRes.rows.length === 0) {
      const title = "LookPrice | Seçkin Mağaza, Emlak ve Otomotiv Yönetim Platformu";
      const desc = "LookPrice, işletmeniz için akıllı e-ticaret, gayrimenkul (emlak) portföy yönetimi ve otomotiv galeri tescil çözümlerini tek bir çatı altında sunan bulut tabanlı modern yönetim platformudur.";
      const keywords = "lookprice, emlak yönetim paneli, oto galeri yazılımı, barkodlu satış sistemi, e-ticaret sitesi kur, kktc emlak, kıbrıs emlak portalı, bulut erp";
      
      const canonicalUrl = `https://${host}${pathOnly}`;

      const envVerificationId = process.env.GOOGLE_SITE_VERIFICATION || 
                                process.env.GOOGLE_SITE_VERIFICATION_ID || 
                                process.env.GSC_VERIFICATION_ID ||
                                process.env.GOOGLE_SEARCH_CONSOLE_ID;

      return `
        <title>${title}</title>
        <link rel="canonical" href="${canonicalUrl}" />
        <meta name="description" content="${desc}" />
        <meta name="keywords" content="${keywords}" />
        <meta name="robots" content="index, follow" />
        ${envVerificationId ? `<meta name="google-site-verification" content="${envVerificationId}" />` : ""}
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${desc}" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${desc}" />
        ${renderFaviconTags("", host, protocol)}
      `;
    }

    // B. Custom Storefront
    const store = storeRes.rows[0];
    const metaSettings = typeof store.meta_settings === 'string' ? JSON.parse(store.meta_settings) : (store.meta_settings || {});
    const gaId = metaSettings.ga_measurement_id;
    const gtmId = metaSettings.gtm_id;

    const sector = metaSettings.sector || 'general';
    const isRealEstate = store.name.toLowerCase().includes("emlak") || 
                         store.name.toLowerCase().includes("investment") || 
                         store.name.toLowerCase().includes("gayrimenkul") || 
                         store.name.toLowerCase().includes("portfolio") || 
                         sector === "real_estate";
    
    const isAutomotive = store.name.toLowerCase().includes("oto") || 
                         store.name.toLowerCase().includes("galeri") ||
                         sector === "automotive";

    let defaultTitle = `${store.name}`;
    let defaultDesc = store.description || `${store.name} hizmetleri.`;
    let defaultKeywords = `${store.name}, online store, kıbrıs mağaza`;
    const storeLogo = store.logo_url || "";
    const storeUrl = store.custom_domain 
      ? `${protocol}://${store.custom_domain}` 
      : `${protocol}://${host}/s/${store.slug}`;

    if (isRealEstate) {
      defaultTitle += ` | ${store.hero_title || 'KKTC Satılık Lüks Villalar, Daireler ve Arsalar'}`;
      defaultDesc = store.description || `${store.name} - Kuzey Kıbrıs genelinde seçkin emlak ilanları, lüks satılık villalar, daireler, arsalar ve yatırımlık gayrimenkuller. Profesyonel gayrimenkul danışmanlığı ile güvenli yatırım yapın.`;
      defaultKeywords = `${store.name}, kıbrıs emlak, kktc satılık villa, girne satılık daire, lefkoşa satılık arsa, kıbrıs gayrimenkul, emlak ilanları`;
    } else if (isAutomotive) {
      defaultTitle += ` | ${store.hero_title || 'KKTC Güvenilir Oto Galeri & Satılık Araçlar'}`;
      defaultDesc = store.description || `${store.name} - Kuzey Kıbrıs'ın lider araç galerisinden satılık güvenilir ikinci el araçlar, sıfır kilometre otomobiller ve ticari araçlar. Detaylı ekspertizli, garantili araç portföyümüzü inceleyin.`;
      defaultKeywords = `${store.name}, kktc satılık araba, kıbrıs oto galeri, ikinci el oto kıbrıs, satılık araç galeri`;
    } else {
      defaultTitle += ` | ${store.hero_title || 'Online Katalog & Alışveriş'}`;
      defaultDesc = store.description || `${store.name} - En kaliteli ürünler ve seçkin katalog seçenekleri. Geniş ürün yelpazemiz ve güvenilir alışveriş kalitemizle hizmetinizdeyiz.`;
      defaultKeywords = `${store.name}, online katalog, barkodlu satış, kıbrıs alışveriş`;
    }

    const storeSchema = {
      "@context": "https://schema.org",
      "@type": isRealEstate ? "RealEstateAgent" : (isAutomotive ? "AutomotiveBusiness" : "LocalBusiness"),
      "name": store.name,
      "description": defaultDesc,
      "url": storeUrl,
      "logo": storeLogo || undefined,
      "image": storeLogo || undefined,
      "address": store.address ? {
        "@type": "PostalAddress",
        "streetAddress": store.address,
        "addressCountry": "KKTC"
      } : undefined
    };

    const storeCanonicalUrl = store.custom_domain 
      ? `https://${store.custom_domain}${pathOnly}` 
      : `https://${host}${pathOnly}`;

    let tags = `
      <!-- Custom Storefront SEO Meta Tags -->
      <title>${defaultTitle}</title>
      <link rel="canonical" href="${storeCanonicalUrl}" />
      <meta name="description" content="${defaultDesc.substring(0, 160)}" />
      <meta name="keywords" content="${defaultKeywords}" />
      <meta name="robots" content="index, follow" />

      <!-- Open Graph / Meta Commerce -->
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${storeUrl}" />
      <meta property="og:title" content="${defaultTitle}" />
      <meta property="og:description" content="${defaultDesc.substring(0, 160)}" />
      ${storeLogo ? `<meta property="og:image" content="${storeLogo}" />` : ''}

      <!-- Twitter -->
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${defaultTitle}" />
      <meta name="twitter:description" content="${defaultDesc.substring(0, 160)}" />
      ${storeLogo ? `<meta name="twitter:image" content="${storeLogo}" />` : ''}
      ${renderFaviconTags(storeLogo, host, protocol)}

      <!-- Local Business Schema -->
      <script type="application/ld+json">
      ${JSON.stringify(storeSchema)}
      </script>
    `;

    // Analytics integrations if configured in settings
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
    }

    return tags;
  } catch (err) {
    console.error("OpenGraph dynamic injection error:", err);
    return "";
  }
}
