import { pool } from "../../models/db";

export async function generateMetaTags(url: string, req: any): Promise<string> {
  const host = req.get('host') || "";
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

          // Professional Schema structure (Satisfies Google Product Rich Snippet for pricing!)
          const richSchema = {
            "@context": "https://schema.org",
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
            ${storeLogo ? `
            <link rel="icon" href="${storeLogo}" />
            <link rel="apple-touch-icon" href="${storeLogo}" />` : `
            <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23ea580c' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Cpath d='M9 22V12h6v10'/%3E%3C/svg%3E" />`}
            <script type="application/ld+json">
            ${JSON.stringify(richSchema)}
            </script>
          `;
        }
      }

      // B. Vehicle Details
      if (isVehicle && !isNaN(parsedId)) {
        const vRes = await pool.query(
          "SELECT * FROM vehicles WHERE id = $1 LIMIT 1",
          [parsedId]
        );
        if (vRes.rows.length > 0) {
          const vehicle = vRes.rows[0];
          // Get parent store details
          const storeRes = await pool.query(
            "SELECT id, name, slug, logo_url FROM stores WHERE id = $1 LIMIT 1",
            [vehicle.store_id]
          );
          const store = storeRes.rows[0] || {};
          const storeName = store.name || "EnRakipsiz Otomotiv";
          const storeLogo = store.logo_url || "";

          const vUrl = `${protocol}://${host}${url}`;
          const vImage = vehicle.image_url || store.logo_url || '';
          const vTitle = `${vehicle.brand} ${vehicle.model} (${vehicle.year}) | ${storeName}`;
          const priceStr = `${vehicle.selling_price ? vehicle.selling_price.toLocaleString('tr-TR') : ''} ${vehicle.currency || 'EUR'}`;
          
          const vDesc = `${vehicle.brand} ${vehicle.model} (${vehicle.year}) - ${priceStr} fiyatıyla satılık. Kilometre: ${vehicle.current_mileage ? vehicle.current_mileage.toLocaleString('tr-TR') : '0'} km, Vites: ${vehicle.transmission || ''}, Yakıt: ${vehicle.fuel_type || ''}. Detaylar ve galeri için tıklayın.`;

          const carSchema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": `${vehicle.brand} ${vehicle.model}`,
            "description": vDesc,
            "image": vImage ? [vImage] : [],
            "brand": {
              "@type": "Brand",
              "name": vehicle.brand
            },
            "offers": {
              "@type": "Offer",
              "price": vehicle.selling_price || 0,
              "priceCurrency": vehicle.currency || "EUR",
              "availability": "https://schema.org/InStock",
              "url": vUrl
            }
          };

          const canonicalUrl = `${protocol}://${host}${pathOnly}`;

          return `
            <title>${vTitle}</title>
            <link rel="canonical" href="${canonicalUrl}" />
            <meta name="description" content="${vDesc.substring(0, 160)}" />
            <meta name="keywords" content="${vehicle.brand} ${vehicle.model}, kktc satılık araba, kıbrıs oto galeri, sahibinden ikinci el, ${storeName}" />
            <meta name="robots" content="index, follow" />
            <meta property="og:type" content="product" />
            <meta property="og:url" content="${vUrl}" />
            <meta property="og:title" content="${vTitle}" />
            <meta property="og:description" content="${vDesc.substring(0, 160)}" />
            ${vImage ? `<meta property="og:image" content="${vImage}" />` : ''}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${vTitle}" />
            <meta name="twitter:description" content="${vDesc.substring(0, 160)}" />
            ${vImage ? `<meta name="twitter:image" content="${vImage}" />` : ''}
            ${storeLogo ? `
            <link rel="icon" href="${storeLogo}" />
            <link rel="apple-touch-icon" href="${storeLogo}" />` : `
            <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%23ea580c' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Cpath d='M9 22V12h6v10'/%3E%3C/svg%3E" />`}
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
            ${storeLogo ? `
            <link rel="icon" href="${storeLogo}" />
            <link rel="apple-touch-icon" href="${storeLogo}" />` : `
            <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 7V5a2 2 0 0 1 2-2h2'/%3E%3Cpath d='M17 3h2a2 2 0 0 1 2 2v2'/%3E%3Cpath d='M21 17v2a2 2 0 0 1-2 2h-2'/%3E%3Cpath d='M7 21H5a2 2 0 0 1-2-2v-2'/%3E%3Cpath d='M7 12h10'/%3E%3C/svg%3E" />`}

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

    // --- 2. CASE: PORTAL HOMEPAGE (enrakipsiz.com) ---
    if (normalizedHost === "enrakipsiz.com") {
      const portalSettingsRes = await pool.query("SELECT * FROM enrakipsiz_settings WHERE id = 1");
      const portalSettings = portalSettingsRes.rows[0] || {};
      
      const title = portalSettings.seo_title || portalSettings.portal_title || "EnRakipsiz | KKTC'nin En Büyük Portföy Portalı";
      const desc = portalSettings.seo_description || portalSettings.portal_description || "KKTC'nin en geniş emlak, araç ve ürün portföyüne enrakipsiz.com ile ulaşın.";
      const keywords = portalSettings.seo_keywords || "kktc emlak, kktc oto galeri, emlak ilanları, satılık araba, enrakipsiz";
      const gaId = portalSettings.google_analytics_id;
      const gtmId = portalSettings.google_tag_manager_id;
      const gscId = portalSettings.google_search_console_id;

      const primaryColor = portalSettings.primary_color || "#ea580c";
      const escColor = encodeURIComponent(primaryColor);

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
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${desc}" />
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='${escColor}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Ccircle cx='12' cy='13' r='4' fill='${escColor}' fill-opacity='0.2'/%3E%3C/svg%3E" />
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
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 7V5a2 2 0 0 1 2-2h2'/%3E%3Cpath d='M17 3h2a2 2 0 0 1 2 2v2'/%3E%3Cpath d='M21 17v2a2 2 0 0 1-2 2h-2'/%3E%3Cpath d='M7 21H5a2 2 0 0 1-2-2v-2'/%3E%3Cpath d='M7 12h10'/%3E%3C/svg%3E" />
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
      ${storeLogo ? `
      <link rel="icon" href="${storeLogo}" />
      <link rel="apple-touch-icon" href="${storeLogo}" />` : `
      <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 7V5a2 2 0 0 1 2-2h2'/%3E%3Cpath d='M17 3h2a2 2 0 0 1 2 2v2'/%3E%3Cpath d='M21 17v2a2 2 0 0 1-2 2h-2'/%3E%3Cpath d='M7 21H5a2 2 0 0 1-2-2v-2'/%3E%3Cpath d='M7 12h10'/%3E%3C/svg%3E" />`}

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
