import { pool } from "../../models/db";

export async function generateMetaTags(url: string, req: any): Promise<string> {
  const sMatch = url.match(/^\/s\/([^\/]+)/);
  const isProductS = url.match(/^\/s\/([^\/]+)\/p\/([^\/\?]+)/);
  const isProductP = url.match(/^\/p\/([^\/\?]+)/);

  try {
    let storeRes;
    const host = req.get('host') || "";
    const normalizedHost = host.startsWith("www.") ? host.substring(4) : host;

    // Portal SEO Handling
    if (normalizedHost === "enrakipsiz.com") {
      return `
        <title>EnRakipsiz | KKTC'nin En Büyük Portföy Portalı</title>
        <meta name="description" content="KKTC'nin en geniş emlak, araç ve ürün portföyüne enrakipsiz.com ile ulaşın." />
        <meta property="og:title" content="EnRakipsiz | KKTC'nin En Büyük Portföy Portalı" />
        <meta property="og:description" content="KKTC'nin en geniş emlak, araç ve ürün portföyüne enrakipsiz.com ile ulaşın." />
      `;
    }

    // Determine store based on URL slug or Custom Domain
    if (sMatch) {
      const slug = sMatch[1];
      storeRes = await pool.query(
        "SELECT id, name, slug, default_currency, currency_rates, meta_settings, custom_domain, description, logo_url, address, hero_title FROM stores WHERE slug ILIKE $1",
        [slug]
      );
    } else {
      storeRes = await pool.query(
        "SELECT id, name, slug, default_currency, currency_rates, meta_settings, custom_domain, description, logo_url, address, hero_title FROM stores WHERE custom_domain = $1 OR custom_domain = $2 LIMIT 1",
        [host, normalizedHost]
      );
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
      tags += `
      <!-- Google Tag Manager (noscript) -->
      <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
      <!-- End Google Tag Manager (noscript) -->
      `;
    }

    // Dynamic resolution based on page type
    let barcode = "";
    if (isProductS) barcode = isProductS[2];
    else if (isProductP) barcode = isProductP[1];

    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const storeUrl = `${protocol}://${host}/s/${store.slug}`;

    if (barcode) {
      // 1. Try resolving as standard product
      const prodRes = await pool.query(
        "SELECT * FROM products WHERE store_id = $1 AND (TRIM(LOWER(barcode)) = TRIM(LOWER($2)) OR id::text = TRIM($2)) LIMIT 1",
        [store.id, barcode]
      );
      
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
        const productUrl = `${protocol}://${host}${url}`;
        
        tags += `
          <!-- Open Graph / Meta Commerce -->
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
          <meta property="product:item_group_id" content="${product.category || 'all'}" />

          <!-- Twitter -->
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${product.name}" />
          <meta name="twitter:description" content="${(product.description || product.name).substring(0, 160)}" />
          <meta name="twitter:image" content="${product.image_url || ''}" />

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
      } else {
        // 2. Try resolving as real estate property
        let cleanId = barcode;
        if (barcode.startsWith("re_")) cleanId = barcode.substring(3);
        
        const testId = parseInt(cleanId, 10);
        if (!isNaN(testId)) {
          const reRes = await pool.query("SELECT * FROM real_estate_properties WHERE store_id = $1 AND id = $2 LIMIT 1", [store.id, testId]);
          if (reRes.rows.length > 0) {
            const prop = reRes.rows[0];
            const propUrl = `${protocol}://${host}${url}`;
            const propImage = prop.images && prop.images.length > 0 ? prop.images[0] : (store.logo_url || '');
            const propDesc = prop.description || `${prop.title} - ${prop.kktc_region || prop.location || 'Girne'}.`;
            const sqmStr = prop.square_meters ? `${prop.square_meters} m² Net` : '';
            const compoundDesc = `${propDesc} | ${prop.room_count || 'Villa'} | ${sqmStr} | ${prop.price} ${prop.currency || 'GBP'}`;

            const listingSchema = {
              "@context": "https://schema.org",
              "@type": "SingleFamilyResidence",
              "name": prop.title,
              "description": propDesc,
              "image": prop.images || [],
              "address": {
                "@type": "PostalAddress",
                "addressLocality": prop.kktc_region || prop.location || "Girne",
                "addressCountry": prop.country || "KKTC"
              },
              "numberOfRooms": prop.room_count,
              "floorSize": prop.square_meters ? {
                "@type": "QuantitativeValue",
                "value": prop.square_meters,
                "unitCode": "MTK"
              } : undefined,
              "offers": {
                "@type": "Offer",
                "price": prop.price,
                "priceCurrency": prop.currency || "GBP",
                "url": propUrl
              }
            };

            tags += `
              <!-- Real Estate Meta Tags -->
              <title>${prop.title} | ${store.name}</title>
              <meta name="description" content="${compoundDesc.substring(0, 160)}" />
              <meta name="keywords" content="${prop.title}, kıbrıs emlak, rodel investment, rodel emlak, kıbrıs satılık villa, ${prop.kktc_region || 'girne'}" />

              <!-- Open Graph -->
              <meta property="og:type" content="place" />
              <meta property="og:url" content="${propUrl}" />
              <meta property="og:title" content="${prop.title}" />
              <meta property="og:description" content="${compoundDesc.substring(0, 160)}" />
              ${propImage ? `<meta property="og:image" content="${propImage}" />` : ''}

              <!-- Twitter -->
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content="${prop.title}" />
              <meta name="twitter:description" content="${compoundDesc.substring(0, 160)}" />
              ${propImage ? `<meta name="twitter:image" content="${propImage}" />` : ''}

              <!-- Schema JSON-LD -->
              <script type="application/ld+json">
              ${JSON.stringify(listingSchema)}
              </script>
            `;
          } else {
            // 3. Try resolving as vehicle
            let cleanVId = barcode;
            if (barcode.startsWith("v_")) cleanVId = barcode.substring(2);
            
            const testVId = parseInt(cleanVId, 10);
            if (!isNaN(testVId)) {
              const vRes = await pool.query("SELECT * FROM vehicles WHERE store_id = $1 AND id = $2 LIMIT 1", [store.id, testVId]);
              if (vRes.rows.length > 0) {
                const vehicle = vRes.rows[0];
                const vUrl = `${protocol}://${host}${url}`;
                const vImage = vehicle.image_url || store.logo_url || '';
                const vTitle = `${vehicle.brand} ${vehicle.model} (${vehicle.year}) | ${store.name}`;
                const vDesc = `Brand: ${vehicle.brand}, Model: ${vehicle.model}, Year: ${vehicle.year}, Mileage: ${vehicle.current_mileage} km. Price: ${vehicle.selling_price || 0} ${vehicle.currency || 'EUR'}`;

                const carSchema = {
                  "@context": "https://schema.org",
                  "@type": "Car",
                  "name": `${vehicle.brand} ${vehicle.model}`,
                  "description": vDesc,
                  "vehicleModelDate": vehicle.year,
                  "brand": {
                    "@type": "Brand",
                    "name": vehicle.brand
                  },
                  "offers": {
                    "@type": "Offer",
                    "price": vehicle.selling_price || 0,
                    "priceCurrency": vehicle.currency || "EUR",
                    "url": vUrl
                  }
                };

                tags += `
                  <!-- Vehicle Meta Tags -->
                  <title>${vTitle}</title>
                  <meta name="description" content="${vDesc.substring(0, 160)}" />
                  <meta name="keywords" content="${vehicle.brand} ${vehicle.model}, kktc satılık araba, ${store.name}" />

                  <!-- Open Graph -->
                  <meta property="og:type" content="website" />
                  <meta property="og:url" content="${vUrl}" />
                  <meta property="og:title" content="${vehicle.brand} ${vehicle.model}" />
                  <meta property="og:description" content="${vDesc.substring(0, 160)}" />
                  ${vImage ? `<meta property="og:image" content="${vImage}" />` : ''}

                  <!-- Twitter -->
                  <meta name="twitter:card" content="summary_large_image" />
                  <meta name="twitter:title" content="${vehicle.brand} ${vehicle.model}" />
                  <meta name="twitter:description" content="${vDesc.substring(0, 160)}" />
                  ${vImage ? `<meta name="twitter:image" content="${vImage}" />` : ''}

                  <script type="application/ld+json">
                  ${JSON.stringify(carSchema)}
                  </script>
                `;
              }
            }
          }
        }
      }
    } else {
      // 4. Default Store Homepage / Portfolio Meta Tags
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
      let defaultKeywords = `${store.name}, ecommerce, online store`;

      if (isRealEstate) {
        defaultTitle += ` | ${store.hero_title || 'KKTC Real Estate & Properties'}`;
        defaultDesc = store.description || `${store.name} - Professional Real Estate and investment services in Northern Cyprus. Find luxury villas, apartments, and land for sale in Girne, Lefkoşa and İskele.`;
        defaultKeywords = `${store.name}, rodel investment, rodel emlak, kıbrıs emlak, kıbrıs satılık villa, kıbrıs kiralık daire, girne emlak, kktc satılık ev, girne satılık villa, kktc investment, kıbrıs gayrimenkul`;
      } else if (isAutomotive) {
        defaultTitle += ` | ${store.hero_title || 'KKTC Automotive & Vehicles'}`;
        defaultDesc = store.description || `${store.name} - Professional automotive services in Northern Cyprus. Find reliable cars, vehicles for sale, and automotive solutions.`;
        defaultKeywords = `${store.name}, kıbrıs oto, kktc araba, satılık araba kıbrıs, ikinci el araba, oto galeri, kıbrıs araç`;
      } else {
        defaultTitle += ` | ${store.hero_title || 'Online Store'}`;
        defaultDesc = store.description || `${store.name} - Quality products and shopping services.`;
        defaultKeywords = `${store.name}, ecommerce, online shop, quality products, alışveriş`;
      }

      const storeSchema = {
        "@context": "https://schema.org",
        "@type": isRealEstate ? "RealEstateAgent" : (isAutomotive ? "AutomotiveBusiness" : "LocalBusiness"),
        "name": store.name,
        "description": defaultDesc,
        "url": storeUrl,
        "logo": store.logo_url || undefined,
        "image": store.logo_url || undefined,
        "address": store.address ? {
          "@type": "PostalAddress",
          "streetAddress": store.address,
          "addressCountry": "KKTC"
        } : undefined
      };

      tags += `
        <!-- Custom Storefront SEO Meta Tags -->
        <title>${defaultTitle}</title>
        <meta name="description" content="${defaultDesc.substring(0, 160)}" />
        <meta name="keywords" content="${defaultKeywords}" />
        <meta name="robots" content="index, follow" />

        <!-- Open Graph / Meta Commerce -->
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${storeUrl}" />
        <meta property="og:title" content="${defaultTitle}" />
        <meta property="og:description" content="${defaultDesc.substring(0, 160)}" />
        ${store.logo_url ? `<meta property="og:image" content="${store.logo_url}" />` : ''}

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${defaultTitle}" />
        <meta name="twitter:description" content="${defaultDesc.substring(0, 160)}" />
        ${store.logo_url ? `<meta name="twitter:image" content="${store.logo_url}" />` : ''}

        <!-- Local Business Schema -->
        <script type="application/ld+json">
        ${JSON.stringify(storeSchema)}
        </script>
      `;
    }

    return tags;

    return tags;
  } catch (err) {
    console.error("OpenGraph injection error:", err);
    return "";
  }
}
