import { pool } from "../../models/db";

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function stripHtmlTags(str: any): string {
  if (!str) return "";
  return String(str)
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeJsonLd(data: any): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function toAbsoluteUrl(urlOrPath: string | undefined | null, baseUrl: string): string {
  if (!urlOrPath) return "";
  const trimmed = String(urlOrPath).trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("data:")) return "";
  return `${baseUrl.replace(/\/$/, "")}/${trimmed.replace(/^\//, "")}`;
}

function renderFaviconTags(customLogo?: string, host = "enrakipsiz.com", protocol = "https"): string {
  const domain = host || "enrakipsiz.com";
  const baseUrl = `${protocol}://${domain}`;

  if (customLogo && (customLogo.startsWith("http") || customLogo.startsWith("/"))) {
    const iconUrl = customLogo.startsWith("http") ? customLogo : `${baseUrl}${customLogo}`;
    return `
      <!-- Google Search & Universal Browser Custom Favicon Tags -->
      <link rel="icon" type="image/png" sizes="48x48" href="${escapeHtml(iconUrl)}" />
      <link rel="icon" type="image/png" sizes="192x192" href="${escapeHtml(iconUrl)}" />
      <link rel="icon" type="image/png" sizes="512x512" href="${escapeHtml(iconUrl)}" />
      <link rel="shortcut icon" href="${escapeHtml(iconUrl)}" />
      <link rel="apple-touch-icon" href="${escapeHtml(iconUrl)}" />
      <link rel="manifest" href="${escapeHtml(baseUrl)}/site.webmanifest" />
    `;
  }

  const default48 = `${baseUrl}/favicon-48x48.png`;
  const default192 = `${baseUrl}/favicon-192x192.png`;
  const default512 = `${baseUrl}/favicon-512x512.png`;
  const defaultSvg = `${baseUrl}/favicon.svg`;
  const defaultIco = `${baseUrl}/favicon.ico`;
  const appleTouch = `${baseUrl}/apple-touch-icon.png`;

  return `
    <!-- Google Search & Universal Browser Default Favicon Tags -->
    <link rel="icon" type="image/png" sizes="48x48" href="${escapeHtml(default48)}" />
    <link rel="icon" type="image/png" sizes="192x192" href="${escapeHtml(default192)}" />
    <link rel="icon" type="image/png" sizes="512x512" href="${escapeHtml(default512)}" />
    <link rel="icon" type="image/svg+xml" href="${escapeHtml(defaultSvg)}" />
    <link rel="shortcut icon" href="${escapeHtml(defaultIco)}" />
    <link rel="apple-touch-icon" sizes="180x180" href="${escapeHtml(appleTouch)}" />
    <link rel="manifest" href="${escapeHtml(baseUrl)}/site.webmanifest" />
  `;
}

function detectStoreEcosystem(store: any, brandingObj: any, metaSettings: any): {
  ecosystem: "restatelp" | "autolp" | "hotellp" | "horecalp" | "booklp" | "shoplp";
  isRealEstate: boolean;
  isAutomotive: boolean;
  isHotel: boolean;
  isHoreca: boolean;
  isBookstore: boolean;
} {
  const rawName = String(brandingObj?.store_name || brandingObj?.name || store?.name || "").toLowerCase();
  const rawSlug = String(store?.slug || "").toLowerCase();
  const storeType = String(store?.store_type || brandingObj?.store_type || "").toLowerCase();
  const sector = String(metaSettings?.sector || brandingObj?.page_layout_settings?.sector || store?.page_layout_settings?.sector || "").toLowerCase();
  const isHotelActive = Boolean(store?.hotel_module_enabled || brandingObj?.hotel_module_enabled);

  const isRealEstate =
    storeType === "real_estate" ||
    sector === "real_estate" ||
    rawName.includes("emlak") ||
    rawName.includes("gayrimenkul") ||
    rawName.includes("estate") ||
    rawName.includes("investment");

  const isAutomotive =
    storeType === "automotive" ||
    storeType === "motor_vehicle" ||
    storeType === "vehicle" ||
    sector === "automotive" ||
    rawName.includes("oto ") ||
    rawName.includes("otomotiv") ||
    rawName.includes("galeri") ||
    rawName.includes("motors");

  const isHorecaBase =
    storeType === "cafe_restaurant" ||
    storeType === "horeca" ||
    storeType === "hotel" ||
    sector === "cafe_restaurant" ||
    sector === "horeca" ||
    sector === "hotel" ||
    isHotelActive ||
    rawName.includes("restoran") ||
    rawName.includes("restaurant") ||
    rawName.includes("cafe") ||
    rawName.includes("kafe") ||
    rawName.includes("bistro") ||
    rawName.includes("hotel") ||
    rawName.includes("otel") ||
    rawName.includes("resort");

  const isHotel = isHotelActive || storeType === "hotel" || sector === "hotel" || rawName.includes("hotel") || rawName.includes("otel") || rawName.includes("resort");

  const isBookstore =
    storeType === "bookstore" ||
    sector === "bookstore" ||
    rawName.includes("kitap") ||
    rawName.includes("kitabevi") ||
    rawName.includes("yayınevi") ||
    rawName.includes("sahaf") ||
    rawSlug.includes("kitap") ||
    rawSlug.includes("book");

  if (isRealEstate) return { ecosystem: "restatelp", isRealEstate: true, isAutomotive: false, isHotel: false, isHoreca: false, isBookstore: false };
  if (isAutomotive) return { ecosystem: "autolp", isRealEstate: false, isAutomotive: true, isHotel: false, isHoreca: false, isBookstore: false };
  if (isHotel) return { ecosystem: "hotellp", isRealEstate: false, isAutomotive: false, isHotel: true, isHoreca: true, isBookstore: false };
  if (isHorecaBase) return { ecosystem: "horecalp", isRealEstate: false, isAutomotive: false, isHotel: false, isHoreca: true, isBookstore: false };
  if (isBookstore) return { ecosystem: "booklp", isRealEstate: false, isAutomotive: false, isHotel: false, isHoreca: false, isBookstore: true };
  return { ecosystem: "shoplp", isRealEstate: false, isAutomotive: false, isHotel: false, isHoreca: false, isBookstore: false };
}

function resolveDisplayStoreName(store: any, brandingObj: any, fallback = "Seçkin Mağaza"): string {
  if (brandingObj?.store_name && !/^lookprice$/i.test(String(brandingObj.store_name).trim())) {
    return String(brandingObj.store_name).trim();
  }
  if (brandingObj?.name && !/^lookprice$/i.test(String(brandingObj.name).trim())) {
    return String(brandingObj.name).trim();
  }
  if (store?.name && !/^lookprice$/i.test(String(store.name).trim())) {
    return String(store.name).trim();
  }
  return fallback;
}

async function findStoreBySlugOrHost(storeSlug: string, host: string): Promise<any | null> {
  if (storeSlug) {
    const storeRes = await pool.query(
      "SELECT * FROM stores WHERE LOWER(slug) = LOWER($1) LIMIT 1",
      [storeSlug]
    );
    if (storeRes.rows.length > 0) return storeRes.rows[0];
  }

  const cleanHost = host.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").trim();
  const isPlatformHost =
    cleanHost === "lookprice.net" ||
    cleanHost === "enrakipsiz.com" ||
    cleanHost.includes("localhost") ||
    cleanHost.includes(".run.app") ||
    cleanHost.includes("0.0.0.0");

  if (!isPlatformHost) {
    const allStores = await pool.query(
      "SELECT * FROM stores WHERE custom_domain IS NOT NULL AND custom_domain != ''"
    );
    for (const row of allStores.rows) {
      const dbDom = (row.custom_domain || "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "").trim();
      if (dbDom === cleanHost || dbDom === `www.${cleanHost}` || `www.${dbDom}` === cleanHost) {
        return row;
      }
    }
  }
  return null;
}

function convertProductPrice(product: any, store: any): { price: number; currency: string } {
  const metaSettings = typeof store?.meta_settings === "string" ? JSON.parse(store.meta_settings) : (store?.meta_settings || {});
  const catalogCurrency = metaSettings.catalog_currency || store?.default_currency || product?.currency || "TRY";
  const rates = typeof store?.currency_rates === "string" ? JSON.parse(store.currency_rates) : (store?.currency_rates || { USD: 1, EUR: 1, GBP: 1 });
  let convertedPrice = Number(product?.price) || 0;
  const fromCurrency = product?.currency || "TRY";

  if (fromCurrency !== catalogCurrency) {
    if (catalogCurrency === "TRY") {
      const rate = Number(rates[fromCurrency]) || 1;
      convertedPrice = convertedPrice * rate;
    } else if (fromCurrency === "TRY") {
      const rate = Number(rates[catalogCurrency]) || 1;
      convertedPrice = rate > 0 ? convertedPrice / rate : convertedPrice;
    } else {
      const fromRate = Number(rates[fromCurrency]) || 1;
      const toRate = Number(rates[catalogCurrency]) || 1;
      convertedPrice = toRate > 0 ? (convertedPrice * fromRate) / toRate : convertedPrice;
    }
  }
  return { price: convertedPrice, currency: catalogCurrency };
}

export async function generateMetaTags(url: string, req: any): Promise<string> {
  const host = req.get("host") || "enrakipsiz.com";
  const normalizedHost = host.startsWith("www.") ? host.substring(4) : host;
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  let pathOnly = url.split("?")[0];
  if (pathOnly.length > 1 && pathOnly.endsWith("/")) {
    pathOnly = pathOnly.slice(0, -1);
  }

  const queryString = url.includes("?") ? url.split("?")[1] : "";
  const urlParams = new URLSearchParams(queryString);

  const sMatch = pathOnly.match(/^\/s\/([^\/]+)/);
  const isProductS = pathOnly.match(/^\/s\/([^\/]+)\/p\/([^\/\?]+)/);
  const isProductP = pathOnly.match(/^\/p\/([^\/\?]+)/);
  const isStoreP = pathOnly.match(/^\/store\/([^\/]+)\/p\/([^\/\?]+)/);
  const isStoreMatch = pathOnly.match(/^\/store\/([^\/]+)/);
  const isDigitalMenu = pathOnly.match(/^\/digital-menu\/([^\/]+)/);

  let barcode = "";
  let storeSlug = "";

  if (isProductS) {
    storeSlug = decodeURIComponent(isProductS[1]);
    barcode = decodeURIComponent(isProductS[2]);
  } else if (isStoreP) {
    storeSlug = decodeURIComponent(isStoreP[1]);
    barcode = decodeURIComponent(isStoreP[2]);
  } else if (isProductP) {
    barcode = decodeURIComponent(isProductP[1]);
  } else if (sMatch) {
    storeSlug = decodeURIComponent(sMatch[1]);
  } else if (isStoreMatch) {
    storeSlug = decodeURIComponent(isStoreMatch[1]);
  }

  // Also support ?product=ID query param deep-links
  if (!barcode && urlParams.get("product")) {
    barcode = String(urlParams.get("product") || "").trim();
  }

  try {
    // --- 0. CASE: SECTOR LANDING PAGES ON LOOKPRICE.NET ---
    const sectorLandingMap: Record<string, { title: string; desc: string; keywords: string; appCategory: string }> = {
      "/shop-landing": {
        title: "shopLP | Akıllı E-Ticaret, Barkodlu Hızlı POS ve Çok Kanallı Pazaryeri Platformu",
        desc: "shopLP ile e-ticaret vitrininizi dakikalar içinde kurun. Trendyol, Hepsiburada, N11, Amazon ve Pazarama çift yönlü stok/fiyat entegrasyonu, barkodlu hızlı POS ve e-Fatura tek ekranda.",
        keywords: "shoplp, e-ticaret paketi, pazaryeri entegrasyonu, barkodlu satış sistemi, hızlı pos, trendyol entegrasyonu, n11 entegrasyonu, hepsiburada entegrasyonu, lookprice",
        appCategory: "BusinessApplication"
      },
      "/restate-landing": {
        title: "restateLP | Gayrimenkul & Emlak Portföy, İnteraktif Harita ve Emlak CRM Sistemi",
        desc: "restateLP; emlak ofisleri ve gayrimenkul danışmanları için interaktif harita (IDX), koçan/imar filtreleri, tek tıkla A4 vitrin afişi, müşteri eşleştirme ve dijital sözleşme platformudur.",
        keywords: "restatelp, emlak yazılımı, gayrimenkul portföy yönetimi, emlak crm, kktc emlak programı, emlak sitesi kur, dijital yer gösterme belgesi, lookprice",
        appCategory: "BusinessApplication"
      },
      "/auto-landing": {
        title: "autoLP | Oto Galeri, Motorlu Araç Portföy, Ekspertiz ve Sözleşme Yönetim Sistemi",
        desc: "autoLP ile oto galeri envanterinizi profesyonelce yönetin. İnteraktif kaporta ekspertiz şeması, tramer takibi, konsinye araç yönetimi, senet/vade hesaplama ve otomatik satış sözleşmeleri.",
        keywords: "autolp, oto galeri yazılımı, araç portföy yönetimi, galeri programı, ekspertiz şeması, oto galeri web sitesi, araç satış sözleşmesi, lookprice",
        appCategory: "BusinessApplication"
      },
      "/horeca-landing": {
        title: "horecaLP & hotelLP | Restoran Adisyon, QR Dijital Menü ve Otel Konaklama Sistemi",
        desc: "horecaLP ve hotelLP ile restoran, kafe ve otel operasyonlarınızı hızlandırın. Masa/adisyon takibi, QR dijital menü, mutfak ekranı (KDS), otel oda rezervasyon ve панsiyon fiyatlandırma sistemi.",
        keywords: "horecalp, hotellp, restoran adisyon programı, qr menü sistemi, kafe otomasyonu, otel yönetim yazılımı, otel rezervasyon sistemi, lookprice",
        appCategory: "BusinessApplication"
      }
    };

    if (sectorLandingMap[pathOnly]) {
      const info = sectorLandingMap[pathOnly];
      const canonicalUrl = `${baseUrl}${pathOnly}`;
      const schema = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "SoftwareApplication",
            "name": info.title.split("|")[0].trim(),
            "applicationCategory": info.appCategory,
            "operatingSystem": "Web, iOS, Android, Windows, macOS",
            "description": info.desc,
            "url": canonicalUrl,
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "TRY",
              "description": "Ücretsiz Demo ve Kurumsal Bulut Başlangıç"
            },
            "provider": {
              "@type": "Organization",
              "name": "LookPrice",
              "url": "https://lookprice.net"
            }
          },
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "LookPrice", "item": `${baseUrl}/` },
              { "@type": "ListItem", "position": 2, "name": info.title.split("|")[0].trim(), "item": canonicalUrl }
            ]
          }
        ]
      };

      return `
        <title>${escapeHtml(info.title)}</title>
        <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
        <meta name="description" content="${escapeHtml(info.desc)}" />
        <meta name="keywords" content="${escapeHtml(info.keywords)}" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
        <meta property="og:title" content="${escapeHtml(info.title)}" />
        <meta property="og:description" content="${escapeHtml(info.desc)}" />
        <meta property="og:site_name" content="LookPrice" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapeHtml(info.title)}" />
        <meta name="twitter:description" content="${escapeHtml(info.desc)}" />
        ${renderFaviconTags("", host, protocol)}
        <script type="application/ld+json">${safeJsonLd(schema)}</script>
      `;
    }

    // --- 0B. CASE: DIGITAL MENU (/digital-menu/:storeId) ---
    if (isDigitalMenu) {
      const storeIdOrSlug = decodeURIComponent(isDigitalMenu[1]);
      const storeRes = await pool.query(
        "SELECT * FROM stores WHERE id::text = $1 OR LOWER(slug) = LOWER($1) LIMIT 1",
        [storeIdOrSlug]
      );
      if (storeRes.rows.length > 0) {
        const store = storeRes.rows[0];
        const brandingObj = typeof store.branding === "string" ? JSON.parse(store.branding) : (store.branding || {});
        const storeName = resolveDisplayStoreName(store, brandingObj, "Restoran & Kafe");
        const storeLogo = toAbsoluteUrl(store.logo_url || brandingObj.logo_url, baseUrl);
        const canonicalUrl = `${baseUrl}${pathOnly}`;
        const prodsRes = await pool.query(
          "SELECT id, name, description, price, currency, category, image_url FROM products WHERE store_id = $1 AND (is_web_sale = true OR is_web_sale IS NULL) LIMIT 60",
          [store.id]
        );
        const menuItems = prodsRes.rows.map((p: any) => ({
          "@type": "MenuItem",
          "name": p.name,
          "description": stripHtmlTags(p.description || p.name),
          "offers": {
            "@type": "Offer",
            "price": Number(p.price || 0).toFixed(2),
            "priceCurrency": p.currency || store.default_currency || "TRY"
          }
        }));
        const menuSchema = {
          "@context": "https://schema.org",
          "@type": "Restaurant",
          "name": storeName,
          "url": canonicalUrl,
          "image": storeLogo || undefined,
          "hasMenu": {
            "@type": "Menu",
            "name": `${storeName} Dijital QR Menü`,
            "url": canonicalUrl,
            "hasMenuItem": menuItems
          }
        };
        const title = `${storeName} | Dijital QR Menü & Fiyat Listesi`;
        const desc = `${storeName} güncel dijital menüsü, yemek ve içecek fiyatları, alerjen bilgileri ve hızlı sipariş ekranı.`;
        return `
          <title>${escapeHtml(title)}</title>
          <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
          <meta name="description" content="${escapeHtml(desc)}" />
          <meta name="robots" content="index, follow, max-image-preview:large" />
          <meta property="og:type" content="restaurant.menu" />
          <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
          <meta property="og:title" content="${escapeHtml(title)}" />
          <meta property="og:description" content="${escapeHtml(desc)}" />
          ${storeLogo ? `<meta property="og:image" content="${escapeHtml(storeLogo)}" />` : ""}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${escapeHtml(title)}" />
          <meta name="twitter:description" content="${escapeHtml(desc)}" />
          ${renderFaviconTags(store.logo_url, host, protocol)}
          <script type="application/ld+json">${safeJsonLd(menuSchema)}</script>
        `;
      }
    }

    // --- 1. CASE: ITEM DETAIL PAGE (RE, VEHICLE, HOTEL ROOM, BOOK, OR PRODUCT) ---
    if (barcode) {
      let cleanId = barcode;
      const isRealEstate = barcode.startsWith("re_");
      const isVehicle = barcode.startsWith("v_");
      const isHotelRoom = barcode.startsWith("room_") || barcode.startsWith("room-");

      if (isRealEstate) cleanId = barcode.substring(3);
      else if (isVehicle) cleanId = barcode.substring(2);
      else if (barcode.startsWith("room_")) cleanId = barcode.substring(5);

      const parsedId = parseInt(cleanId, 10);

      // A. Real Estate Property Details (restatelp & enrakipsiz.com)
      if (isRealEstate && !isNaN(parsedId)) {
        const reRes = await pool.query(
          "SELECT * FROM real_estate_properties WHERE id = $1 LIMIT 1",
          [parsedId]
        );
        if (reRes.rows.length > 0) {
          const prop = reRes.rows[0];
          const storeRes = await pool.query(
            "SELECT id, name, slug, logo_url, custom_domain, default_currency, currency_rates, branding, address, phone FROM stores WHERE id = $1 LIMIT 1",
            [prop.store_id]
          );
          const store = storeRes.rows[0] || {};
          const brandingObj = typeof store.branding === "string" ? JSON.parse(store.branding) : (store.branding || {});
          const storeName = resolveDisplayStoreName(store, brandingObj, "EnRakipsiz Emlak");
          const storeLogo = store.logo_url || brandingObj.logo_url || "";

          const canonicalUrl = `${protocol}://${host}${pathOnly}`;
          const propImages: string[] = Array.isArray(prop.images)
            ? prop.images.map((img: string) => toAbsoluteUrl(img, baseUrl)).filter(Boolean)
            : [];
          const propImage = propImages[0] || toAbsoluteUrl(storeLogo, baseUrl);
          const propDesc = stripHtmlTags(prop.description) || `${prop.title} - ${prop.kktc_region || prop.location || "Girne"}.`;
          const sqmStr = prop.square_meters ? `${prop.square_meters} m²` : "";
          const priceStr = `${prop.price ? Number(prop.price).toLocaleString("tr-TR") : ""} ${prop.currency || "GBP"}`.trim();
          const regionName = prop.kktc_region || prop.location || "KKTC";
          const typeName = prop.property_type || prop.type || "Gayrimenkul";

          const compoundDesc = `${prop.title} - ${regionName} bölgesinde ${priceStr} fiyatıyla ${prop.room_count ? `${prop.room_count} ` : ""}${typeName}. ${sqmStr ? `Alan: ${sqmStr}. ` : ""}${propDesc}`.substring(0, 160);
          const pageTitle = `${prop.title} - ${regionName} (${priceStr}) | ${storeName}`;

          const richSchema = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": ["Product", "RealEstateListing"],
                "name": prop.title,
                "description": propDesc,
                "sku": `re_${prop.id}`,
                "productID": `re_${prop.id}`,
                "image": propImages.length > 0 ? propImages : (propImage ? [propImage] : undefined),
                "url": canonicalUrl,
                "brand": {
                  "@type": "Brand",
                  "name": storeName
                },
                "offers": {
                  "@type": "Offer",
                  "price": Number(prop.price) || 0,
                  "priceCurrency": prop.currency || "GBP",
                  "availability": "https://schema.org/InStock",
                  "url": canonicalUrl,
                  "seller": {
                    "@type": "RealEstateAgent",
                    "name": storeName,
                    "telephone": store.phone || brandingObj.phone || undefined
                  }
                }
              },
              {
                "@type": "SingleFamilyResidence",
                "name": prop.title,
                "description": propDesc,
                "numberOfRooms": prop.room_count || undefined,
                "floorSize": prop.square_meters ? {
                  "@type": "QuantitativeValue",
                  "value": Number(prop.square_meters),
                  "unitCode": "MTK"
                } : undefined,
                "address": {
                  "@type": "PostalAddress",
                  "addressLocality": regionName,
                  "addressCountry": "KKTC"
                }
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": storeName, "item": `${protocol}://${host}` },
                  { "@type": "ListItem", "position": 2, "name": regionName, "item": `${protocol}://${host}/?region=${encodeURIComponent(regionName)}` },
                  { "@type": "ListItem", "position": 3, "name": typeName, "item": `${protocol}://${host}/?type=${encodeURIComponent(typeName)}` },
                  { "@type": "ListItem", "position": 4, "name": prop.title, "item": canonicalUrl }
                ]
              }
            ]
          };

          return `
            <title>${escapeHtml(pageTitle)}</title>
            <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
            <meta name="description" content="${escapeHtml(compoundDesc)}" />
            <meta name="keywords" content="${escapeHtml(`${prop.title}, ${regionName} satılık, ${regionName} kiralık, kktc emlak, kıbrıs emlak, ${typeName}, ${storeName}`)}" />
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
            <meta property="og:type" content="product" />
            <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
            <meta property="og:title" content="${escapeHtml(pageTitle)}" />
            <meta property="og:description" content="${escapeHtml(compoundDesc)}" />
            <meta property="og:site_name" content="${escapeHtml(storeName)}" />
            <meta property="product:price:amount" content="${Number(prop.price) || 0}" />
            <meta property="product:price:currency" content="${escapeHtml(prop.currency || "GBP")}" />
            <meta property="product:availability" content="in stock" />
            ${propImage ? `<meta property="og:image" content="${escapeHtml(propImage)}" />` : ""}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
            <meta name="twitter:description" content="${escapeHtml(compoundDesc)}" />
            ${propImage ? `<meta name="twitter:image" content="${escapeHtml(propImage)}" />` : ""}
            ${renderFaviconTags(storeLogo, host, protocol)}
            <script type="application/ld+json">${safeJsonLd(richSchema)}</script>
          `;
        }
      }

      // B. Vehicle Details (autolp & enrakipsiz.com)
      if (isVehicle && !isNaN(parsedId)) {
        const vRes = await pool.query(
          "SELECT * FROM vehicles WHERE id = $1 LIMIT 1",
          [parsedId]
        );
        if (vRes.rows.length > 0) {
          const vehicle = vRes.rows[0];
          const storeRes = await pool.query(
            "SELECT id, name, slug, logo_url, address, phone, branding FROM stores WHERE id = $1 LIMIT 1",
            [vehicle.store_id]
          );
          const store = storeRes.rows[0] || {};
          const brandingObj = typeof store.branding === "string" ? JSON.parse(store.branding) : (store.branding || {});
          const storeName = resolveDisplayStoreName(store, brandingObj, "EnRakipsiz Otomotiv");
          const storeLogo = store.logo_url || brandingObj.logo_url || "";

          const canonicalUrl = `${protocol}://${host}${pathOnly}`;
          let vImages: string[] = [];
          if (Array.isArray(vehicle.images) && vehicle.images.length > 0) {
            vImages = vehicle.images.map((img: string) => toAbsoluteUrl(img, baseUrl)).filter(Boolean);
          } else if (vehicle.image_url) {
            vImages = [toAbsoluteUrl(vehicle.image_url, baseUrl)].filter(Boolean);
          } else if (storeLogo) {
            vImages = [toAbsoluteUrl(storeLogo, baseUrl)].filter(Boolean);
          }
          const primaryImage = vImages[0] || "";

          const transMap: Record<string, string> = {
            manual: "Manuel",
            automatic: "Otomatik",
            semi_automatic: "Yarı Otomatik",
            dual_clutch: "Çift Kavrama"
          };
          const fuelMap: Record<string, string> = {
            gasoline: "Benzin",
            diesel: "Dizel",
            gasoline_hybrid: "Benzin / Hibrit",
            diesel_hybrid: "Dizel / Hibrit",
            electric: "Elektrik",
            lpg: "LPG"
          };

          const priceStr = vehicle.selling_price ? `${Number(vehicle.selling_price).toLocaleString("tr-TR")} ${vehicle.currency || "EUR"}` : "Fiyat Sorunuz";
          const kmStr = vehicle.current_mileage ? `${Number(vehicle.current_mileage).toLocaleString("tr-TR")} km` : "Düşük KM";
          const pkgStr = vehicle.package_name ? ` ${vehicle.package_name}` : "";
          const transStr = transMap[vehicle.transmission?.toLowerCase()] || vehicle.transmission || "Otomatik";
          const fuelStr = fuelMap[vehicle.fuel_type?.toLowerCase()] || vehicle.fuel_type || "Benzin";
          const yearStr = vehicle.year ? `${vehicle.year} ` : "";

          const vTitle = `Satılık ${yearStr}${vehicle.brand} ${vehicle.model}${pkgStr} (${transStr}, ${fuelStr}) - ${priceStr} | ${storeName}`;
          const tramerText = vehicle.tramer_amount && Number(vehicle.tramer_amount) > 0
            ? `Tramer: ${Number(vehicle.tramer_amount).toLocaleString("tr-TR")} ${vehicle.tramer_currency || "TRY"}.`
            : "Ekspertizli, temiz kondisyonda.";
          const autoDescription = `Satılık ${yearStr}${vehicle.brand} ${vehicle.model}${pkgStr} (${transStr}, ${fuelStr}, ${kmStr}) - ${priceStr}. ${tramerText} ${storeName} güvencesiyle detaylı teknik özellikler için tıklayın.`.substring(0, 160);

          const vKeywords = [
            `satılık ${vehicle.brand} ${vehicle.model}`,
            `ikinci el ${vehicle.brand} ${vehicle.model}`,
            `${yearStr}${vehicle.brand} ${vehicle.model} fiyat`,
            `oto galeri ${vehicle.brand}`,
            `${storeName} satılık araçlar`
          ].join(", ");

          const carSchema = {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": ["Product", "Car"],
                "name": `${yearStr}${vehicle.brand} ${vehicle.model}${pkgStr}`,
                "description": stripHtmlTags(vehicle.description || vehicle.market_story || autoDescription),
                "sku": `v_${vehicle.id}`,
                "productID": `v_${vehicle.id}`,
                "image": vImages.length > 0 ? vImages : undefined,
                "url": canonicalUrl,
                "brand": {
                  "@type": "Brand",
                  "name": vehicle.brand || storeName
                },
                "model": vehicle.model,
                "vehicleModelDate": `${vehicle.year || ""}`,
                "fuelType": fuelStr,
                "vehicleTransmission": transStr,
                "mileageFromOdometer": {
                  "@type": "QuantitativeValue",
                  "value": Number(vehicle.current_mileage) || 0,
                  "unitCode": "KMT"
                },
                "color": vehicle.color || undefined,
                "bodyType": vehicle.body_type || undefined,
                "offers": {
                  "@type": "Offer",
                  "price": Number(vehicle.selling_price) || 0,
                  "priceCurrency": vehicle.currency || "EUR",
                  "availability": "https://schema.org/InStock",
                  "itemCondition": Number(vehicle.current_mileage) === 0 ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
                  "url": canonicalUrl,
                  "seller": {
                    "@type": "AutoDealer",
                    "name": storeName,
                    "telephone": store.phone || brandingObj.phone || undefined
                  }
                }
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": storeName, "item": `${protocol}://${host}` },
                  { "@type": "ListItem", "position": 2, "name": vehicle.brand || "Vasıta", "item": `${protocol}://${host}/?brand=${encodeURIComponent(vehicle.brand || "")}` },
                  { "@type": "ListItem", "position": 3, "name": `${yearStr}${vehicle.brand} ${vehicle.model}`, "item": canonicalUrl }
                ]
              }
            ]
          };

          return `
            <title>${escapeHtml(vTitle)}</title>
            <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
            <meta name="description" content="${escapeHtml(autoDescription)}" />
            <meta name="keywords" content="${escapeHtml(vKeywords)}" />
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
            <meta property="og:type" content="product" />
            <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
            <meta property="og:title" content="${escapeHtml(vTitle)}" />
            <meta property="og:description" content="${escapeHtml(autoDescription)}" />
            <meta property="og:site_name" content="${escapeHtml(storeName)}" />
            <meta property="product:price:amount" content="${Number(vehicle.selling_price) || 0}" />
            <meta property="product:price:currency" content="${escapeHtml(vehicle.currency || "EUR")}" />
            <meta property="product:availability" content="in stock" />
            ${primaryImage ? `<meta property="og:image" content="${escapeHtml(primaryImage)}" />` : ""}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${escapeHtml(vTitle)}" />
            <meta name="twitter:description" content="${escapeHtml(autoDescription)}" />
            ${primaryImage ? `<meta name="twitter:image" content="${escapeHtml(primaryImage)}" />` : ""}
            ${renderFaviconTags(storeLogo, host, protocol)}
            <script type="application/ld+json">${safeJsonLd(carSchema)}</script>
          `;
        }
      }

      // C. Hotel Room Details (hotellp)
      if (isHotelRoom) {
        const store = await findStoreBySlugOrHost(storeSlug, host);
        if (store) {
          const brandingObj = typeof store.branding === "string" ? JSON.parse(store.branding) : (store.branding || {});
          const storeName = resolveDisplayStoreName(store, brandingObj, "Seçkin Otel & Konaklama");
          const storeLogo = store.logo_url || brandingObj.logo_url || "";
          const rooms: any[] = Array.isArray((store as any).hotel_rooms)
            ? (store as any).hotel_rooms
            : (Array.isArray(brandingObj.hotel_rooms) ? brandingObj.hotel_rooms : []);
          const room = rooms.find((r: any) => String(r.id) === barcode || String(r.id) === cleanId || String(r.room_number) === cleanId);
          if (room) {
            const canonicalUrl = `${protocol}://${host}${pathOnly}`;
            const roomImg = toAbsoluteUrl((Array.isArray(room.images) && room.images[0]) || room.image_url || storeLogo, baseUrl);
            const roomPrice = Number(room.price_per_night) || 0;
            const currency = store.default_currency || "TRY";
            const roomTitle = `${room.room_type || `Oda ${room.room_number}`} - Gecelik ${roomPrice.toLocaleString("tr-TR")} ${currency} | ${storeName}`;
            const roomDesc = `${storeName} - ${room.room_type} (${room.capacity || 2} Kişilik, ${room.bed_info || "Konforlu Yatak"}). Online rezervasyon ve müsaitlik için hemen inceleyin.`.substring(0, 160);
            const hotelRoomSchema = {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": ["Product", "HotelRoom"],
                  "name": `${room.room_type} - ${storeName}`,
                  "description": stripHtmlTags(room.description || roomDesc),
                  "image": roomImg ? [roomImg] : undefined,
                  "url": canonicalUrl,
                  "occupancy": {
                    "@type": "QuantitativeValue",
                    "maxValue": Number(room.capacity) || 2
                  },
                  "offers": {
                    "@type": "Offer",
                    "price": roomPrice.toFixed(2),
                    "priceCurrency": currency,
                    "availability": "https://schema.org/InStock",
                    "url": canonicalUrl
                  }
                }
              ]
            };
            return `
              <title>${escapeHtml(roomTitle)}</title>
              <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
              <meta name="description" content="${escapeHtml(roomDesc)}" />
              <meta name="robots" content="index, follow, max-image-preview:large" />
              <meta property="og:type" content="product" />
              <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
              <meta property="og:title" content="${escapeHtml(roomTitle)}" />
              <meta property="og:description" content="${escapeHtml(roomDesc)}" />
              ${roomImg ? `<meta property="og:image" content="${escapeHtml(roomImg)}" />` : ""}
              ${renderFaviconTags(storeLogo, host, protocol)}
              <script type="application/ld+json">${safeJsonLd(hotelRoomSchema)}</script>
            `;
          }
        }
      }

      // D. Standard E-Commerce Product / Book / HoReCa Menu Item (shoplp, booklp, horecalp)
      let store = await findStoreBySlugOrHost(storeSlug, host);
      let product: any = null;

      if (store) {
        const prodRes = await pool.query(
          "SELECT * FROM products WHERE store_id = $1 AND (TRIM(LOWER(barcode)) = TRIM(LOWER($2)) OR id::text = TRIM($2)) LIMIT 1",
          [store.id, barcode]
        );
        product = prodRes.rows[0] || null;
      }

      // Fallback: if accessed via /p/:barcode without storeSlug on platform domain, locate the product & its store
      if (!product) {
        const globalProdRes = await pool.query(
          "SELECT * FROM products WHERE (TRIM(LOWER(barcode)) = TRIM(LOWER($1)) OR id::text = TRIM($1)) AND (is_web_sale = true OR is_web_sale IS NULL) ORDER BY updated_at DESC NULLS LAST LIMIT 1",
          [barcode]
        );
        if (globalProdRes.rows.length > 0) {
          product = globalProdRes.rows[0];
          const parentStoreRes = await pool.query("SELECT * FROM stores WHERE id = $1 LIMIT 1", [product.store_id]);
          if (parentStoreRes.rows.length > 0) {
            store = parentStoreRes.rows[0];
          }
        }
      }

      if (product && store) {
        const brandingObj = typeof store.branding === "string" ? JSON.parse(store.branding) : (store.branding || {});
        const metaSettings = typeof store.meta_settings === "string" ? JSON.parse(store.meta_settings) : (store.meta_settings || {});
        const storeName = resolveDisplayStoreName(store, brandingObj, "Seçkin Mağaza");
        const { isBookstore, isHoreca } = detectStoreEcosystem(store, brandingObj, metaSettings);

        const { price: convertedPrice, currency: catalogCurrency } = convertProductPrice(product, store);
        const inStock = Number(product.stock_quantity) > 0 || isHoreca;
        const availabilityOG = inStock ? "in stock" : "out of stock";
        const availabilityLD = inStock ? "InStock" : "OutOfStock";

        const canonicalUrl = `${protocol}://${host}${pathOnly}`;
        const storeHomeUrl = store.custom_domain
          ? `${protocol}://${store.custom_domain}`
          : `${protocol}://${host}/s/${store.slug}`;
        const storeLogo = store.logo_url || brandingObj.logo_url || "";

        const prodImages: string[] = [];
        if (product.image_url) {
          const abs = toAbsoluteUrl(product.image_url, baseUrl);
          if (abs) prodImages.push(abs);
        }
        if (Array.isArray(product.images)) {
          product.images.forEach((img: string) => {
            const abs = toAbsoluteUrl(img, baseUrl);
            if (abs && !prodImages.includes(abs)) prodImages.push(abs);
          });
        }
        const primaryImage = prodImages[0] || toAbsoluteUrl(storeLogo, baseUrl);

        const cleanDesc = stripHtmlTags(product.description);
        const formattedPriceStr = `${convertedPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${catalogCurrency}`;
        const brandName = product.brand || storeName;
        const categoryName = product.category || (isBookstore ? "Kitap" : "Genel");

        const pageTitle = `${product.name}${product.brand ? ` (${product.brand})` : ""} - ${formattedPriceStr} | ${storeName}`;
        const metaDesc = (
          cleanDesc
            ? `${product.name} (${formattedPriceStr}) - ${cleanDesc}`
            : `${product.name} ürünü ${formattedPriceStr} avantajlı fiyatıyla ${storeName} stoklarında! Barkod/SKU: ${product.barcode || product.id}. Hemen inceleyin ve güvenle sipariş verin.`
        ).substring(0, 160);

        const rawBarcode = String(product.barcode || "").trim();
        const isValidGtin = /^\d{8}$|^\d{12,14}$/.test(rawBarcode);
        const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        const productNode: any = {
          "@type": isBookstore ? ["Product", "Book"] : (isHoreca ? ["Product", "MenuItem"] : "Product"),
          "productID": String(product.barcode || product.id),
          "sku": String(product.barcode || product.id),
          "mpn": String(product.barcode || product.id),
          ...(isValidGtin ? { "gtin": rawBarcode, ...(rawBarcode.length === 13 ? { "gtin13": rawBarcode } : {}) } : {}),
          ...(isBookstore && isValidGtin ? { "isbn": rawBarcode } : {}),
          "name": product.name,
          "description": cleanDesc || metaDesc,
          "category": categoryName,
          "image": prodImages.length > 0 ? prodImages : (primaryImage ? [primaryImage] : undefined),
          "url": canonicalUrl,
          "brand": {
            "@type": "Brand",
            "name": brandName
          },
          "offers": {
            "@type": "Offer",
            "url": canonicalUrl,
            "priceCurrency": catalogCurrency,
            "price": convertedPrice.toFixed(2),
            "priceValidUntil": nextYear,
            "availability": `https://schema.org/${availabilityLD}`,
            "itemCondition": "https://schema.org/NewCondition",
            "seller": {
              "@type": "Organization",
              "name": storeName,
              "url": storeHomeUrl
            }
          }
        };

        if (isBookstore) {
          const secData = typeof product.sector_data === "string" ? JSON.parse(product.sector_data || "{}") : (product.sector_data || {});
          if (secData.author || product.sub_category) {
            productNode.author = {
              "@type": "Person",
              "name": secData.author || product.sub_category
            };
          }
          if (product.brand) {
            productNode.publisher = {
              "@type": "Organization",
              "name": product.brand
            };
          }
          productNode.inLanguage = "tr";
        }

        const productGraphSchema = {
          "@context": "https://schema.org",
          "@graph": [
            productNode,
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": storeName, "item": storeHomeUrl },
                { "@type": "ListItem", "position": 2, "name": categoryName, "item": `${storeHomeUrl}?category=${encodeURIComponent(categoryName)}` },
                { "@type": "ListItem", "position": 3, "name": product.name, "item": canonicalUrl }
              ]
            }
          ]
        };

        return `
          <title>${escapeHtml(pageTitle)}</title>
          <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
          <meta name="description" content="${escapeHtml(metaDesc)}" />
          <meta name="keywords" content="${escapeHtml(`${product.name}, ${brandName}, ${categoryName}, ${product.barcode || ""}, ${storeName}, fiyat, satın al`)}" />
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
          <meta property="og:type" content="product" />
          <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
          <meta property="og:title" content="${escapeHtml(pageTitle)}" />
          <meta property="og:description" content="${escapeHtml(metaDesc)}" />
          <meta property="og:site_name" content="${escapeHtml(storeName)}" />
          ${primaryImage ? `<meta property="og:image" content="${escapeHtml(primaryImage)}" />` : ""}
          <meta property="product:brand" content="${escapeHtml(brandName)}" />
          <meta property="product:category" content="${escapeHtml(categoryName)}" />
          <meta property="product:availability" content="${availabilityOG}" />
          <meta property="product:condition" content="new" />
          <meta property="product:price:amount" content="${convertedPrice.toFixed(2)}" />
          <meta property="product:price:currency" content="${escapeHtml(catalogCurrency)}" />
          <meta property="product:retailer_item_id" content="${escapeHtml(String(product.barcode || product.id))}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${escapeHtml(pageTitle)}" />
          <meta name="twitter:description" content="${escapeHtml(metaDesc)}" />
          ${primaryImage ? `<meta name="twitter:image" content="${escapeHtml(primaryImage)}" />` : ""}
          ${renderFaviconTags(storeLogo, host, protocol)}
          <script type="application/ld+json">${safeJsonLd(productGraphSchema)}</script>
        `;
      }
    }

    // --- 2. CASE: PORTAL HOMEPAGE & REGIONAL/BRAND HUBS (enrakipsiz.com or /portal) ---
    if (normalizedHost === "enrakipsiz.com" || normalizedHost.includes("enrakipsiz") || pathOnly === "/portal") {
      const portalSettingsRes = await pool.query("SELECT * FROM enrakipsiz_settings WHERE id = 1");
      const portalSettings = portalSettingsRes.rows[0] || {};

      const regionFilter = urlParams.get("region");
      const brandFilter = urlParams.get("brand");
      const tabFilter = urlParams.get("tab");
      const typeFilter = urlParams.get("type");

      let title = portalSettings.seo_title || portalSettings.portal_title || "EnRakipsiz | Doğrulanmış Gayrimenkul (Emlak) ve Otomotiv Portföy Pazaryeri";
      let desc = portalSettings.seo_description || portalSettings.portal_description || "EnRakipsiz; seçkin emlak ofisleri ve oto galerilerin doğrulanmış satılık/kiralık daire, villa, arsa ve ikinci el araç portföylerini doğrudan ilan linkleriyle sunan pazaryeri platformudur.";
      let keywords = portalSettings.seo_keywords || "enrakipsiz, kktc emlak, kıbrıs satılık daire, girne satılık villa, kıbrıs oto galeri, ikinci el araç, doğrulanmış portföy";

      let canonicalQuery = "";
      if (regionFilter) {
        title = `${regionFilter} Satılık & Kiralık Emlak İlanları - Villa, Daire ve Arsa | EnRakipsiz`;
        desc = `${regionFilter} bölgesindeki doğrulanmış emlak ofislerinden en güncel satılık ve kiralık daire, lüks villa, müstakil ev ve yatırım arsası ilanlarını doğrudan inceleyin.`;
        canonicalQuery = `?region=${encodeURIComponent(regionFilter)}`;
      } else if (brandFilter) {
        title = `Satılık ${brandFilter} İkinci El & Sıfır Araç İlanları ve Fiyatları | EnRakipsiz`;
        desc = `Doğrulanmış oto galerilerden satılık ${brandFilter} modelleri, güncel fiyatları, ekspertiz raporları ve teknik özellikleriyle EnRakipsiz vasıta portföyünde.`;
        canonicalQuery = `?brand=${encodeURIComponent(brandFilter)}`;
      } else if (tabFilter === "arac") {
        title = `Doğrulanmış Oto Galeri & Satılık Araç İlanları | EnRakipsiz Vasıta`;
        desc = `Ekspertizli ikinci el otomobil, SUV, pick-up ve ticari araç ilanlarını yetkili oto galerilerden doğrudan inceleyin.`;
        canonicalQuery = `?tab=arac`;
      } else if (tabFilter === "emlak") {
        title = `Doğrulanmış Satılık & Kiralık Gayrimenkul Portföyü | EnRakipsiz Emlak`;
        desc = `Yetkili emlak ofislerinden doğrulanmış satılık villa, daire, arsa ve kiralık konut ilanlarını harita ve koçan filtreleriyle keşfedin.`;
        canonicalQuery = `?tab=emlak`;
      }

      const gaId = portalSettings.google_analytics_id;
      const gtmId = portalSettings.google_tag_manager_id;
      const gscId = portalSettings.google_search_console_id;
      const customPortalLogo = portalSettings.favicon_url || portalSettings.portal_logo_url || "";
      const portalBase = normalizedHost.includes("enrakipsiz") ? "https://enrakipsiz.com" : `${baseUrl}${pathOnly}`;
      const canonicalUrl = `${portalBase}${canonicalQuery}`;

      // Fetch top active listings for ItemList Schema (Direct Product Links in Google Search & AI)
      const [reTopRes, vehTopRes] = await Promise.all([
        pool.query("SELECT id, title, price, currency, images, kktc_region, location FROM real_estate_properties WHERE is_on_enrakipsiz = true AND status <> 'sold' ORDER BY created_at DESC NULLS LAST LIMIT 15").catch(() => ({ rows: [] })),
        pool.query("SELECT id, brand, model, year, selling_price, currency, images FROM vehicles WHERE is_on_enrakipsiz = true AND status <> 'sold' ORDER BY id DESC LIMIT 15").catch(() => ({ rows: [] }))
      ]);

      const itemListElements: any[] = [];
      let pos = 1;
      reTopRes.rows.forEach((r: any) => {
        const itemUrl = `https://enrakipsiz.com/p/re_${r.id}`;
        const img = Array.isArray(r.images) && r.images[0] ? toAbsoluteUrl(r.images[0], "https://enrakipsiz.com") : undefined;
        itemListElements.push({
          "@type": "ListItem",
          "position": pos++,
          "url": itemUrl,
          "item": {
            "@type": "Product",
            "name": r.title,
            "url": itemUrl,
            "image": img,
            "offers": {
              "@type": "Offer",
              "price": Number(r.price) || 0,
              "priceCurrency": r.currency || "GBP",
              "availability": "https://schema.org/InStock",
              "url": itemUrl
            }
          }
        });
      });

      vehTopRes.rows.forEach((v: any) => {
        const itemUrl = `https://enrakipsiz.com/p/v_${v.id}`;
        const vTitle = `${v.year ? `${v.year} ` : ""}${v.brand || ""} ${v.model || ""}`.trim();
        const img = Array.isArray(v.images) && v.images[0] ? toAbsoluteUrl(v.images[0], "https://enrakipsiz.com") : undefined;
        itemListElements.push({
          "@type": "ListItem",
          "position": pos++,
          "url": itemUrl,
          "item": {
            "@type": "Product",
            "name": vTitle,
            "url": itemUrl,
            "image": img,
            "offers": {
              "@type": "Offer",
              "price": Number(v.selling_price) || 0,
              "priceCurrency": v.currency || "EUR",
              "availability": "https://schema.org/InStock",
              "url": itemUrl
            }
          }
        });
      });

      const portalGraphSchema = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "name": "EnRakipsiz",
            "url": "https://enrakipsiz.com",
            "description": desc,
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://enrakipsiz.com/?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@type": "Organization",
            "name": "EnRakipsiz Portföy Pazaryeri",
            "url": "https://enrakipsiz.com",
            "logo": "https://enrakipsiz.com/favicon-512x512.png"
          },
          ...(itemListElements.length > 0 ? [{
            "@type": "ItemList",
            "name": "EnRakipsiz Güncel Emlak ve Vasıta Vitrin İlanları",
            "numberOfItems": itemListElements.length,
            "itemListElement": itemListElements
          }] : [])
        ]
      };

      let tags = `
        <title>${escapeHtml(title)}</title>
        <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
        <meta name="description" content="${escapeHtml(desc)}" />
        <meta name="keywords" content="${escapeHtml(keywords)}" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta property="og:title" content="${escapeHtml(title)}" />
        <meta property="og:description" content="${escapeHtml(desc)}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
        <meta property="og:site_name" content="EnRakipsiz" />
        <meta property="og:image" content="https://enrakipsiz.com/favicon-512x512.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapeHtml(title)}" />
        <meta name="twitter:description" content="${escapeHtml(desc)}" />
        <meta name="twitter:image" content="https://enrakipsiz.com/favicon-512x512.png" />
        ${renderFaviconTags(customPortalLogo, "enrakipsiz.com", protocol)}
        <script type="application/ld+json">${safeJsonLd(portalGraphSchema)}</script>
      `;

      if (gscId) {
        tags += `\n        <meta name="google-site-verification" content="${escapeHtml(gscId)}" />`;
      }
      if (gaId) {
        tags += `
        <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(gaId)}"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${escapeHtml(gaId)}');
        </script>`;
      }
      if (gtmId && gtmId !== "GTM-5PR778HH") {
        tags += `
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${escapeHtml(gtmId)}');</script>`;
      }
      return tags;
    }

    // --- 3. CASE: STOREFRONT HOME / PORTFOLIO PAGE (shoplp, restatelp, hotellp, autolp, booklp, horecalp) ---
    const store = await findStoreBySlugOrHost(storeSlug, host);

    // A. Fallback to platform-wide LookPrice landing page metadata if store is not found
    if (!store) {
      const title = "LookPrice | shopLP, restateLP, autoLP, hotelLP, bookLP & horecaLP Bulut Yönetim Platformu";
      const desc = "LookPrice; e-ticaret ve pazaryeri entegrasyonu (shopLP), emlak portföy yönetimi (restateLP), oto galeri sistemi (autoLP), otel konaklama (hotelLP), kitabevi (bookLP) ve restoran QR/POS (horecaLP) çözümlerini tek çatıda sunar.";
      const keywords = "lookprice, shoplp, restatelp, autolp, hotellp, booklp, horecalp, e-ticaret paketi, pazaryeri entegrasyonu, emlak yazılımı, oto galeri yazılımı, hızlı pos, e-fatura";
      const canonicalUrl = `https://${host}${pathOnly}`;
      const envVerificationId =
        process.env.GOOGLE_SITE_VERIFICATION ||
        process.env.GOOGLE_SITE_VERIFICATION_ID ||
        process.env.GSC_VERIFICATION_ID ||
        process.env.GOOGLE_SEARCH_CONSOLE_ID;

      const platformSchema = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "name": "LookPrice",
            "url": "https://lookprice.net",
            "logo": "https://lookprice.net/favicon-512x512.png",
            "sameAs": ["https://enrakipsiz.com"]
          },
          {
            "@type": "WebSite",
            "name": "LookPrice Ekosistemi",
            "url": "https://lookprice.net",
            "description": desc,
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://lookprice.net/portal?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@type": "ItemList",
            "name": "LookPrice Sektörel Yazılım Çözümleri",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "shopLP - E-Ticaret, Barkodlu POS & Pazaryeri Entegrasyonu", "url": "https://lookprice.net/shop-landing" },
              { "@type": "ListItem", "position": 2, "name": "restateLP - Gayrimenkul & Emlak Portföy Yönetimi", "url": "https://lookprice.net/restate-landing" },
              { "@type": "ListItem", "position": 3, "name": "autoLP - Oto Galeri & Motorlu Araç Portföy Yönetimi", "url": "https://lookprice.net/auto-landing" },
              { "@type": "ListItem", "position": 4, "name": "horecaLP & hotelLP - Restoran POS, QR Menü & Otel Konaklama", "url": "https://lookprice.net/horeca-landing" },
              { "@type": "ListItem", "position": 5, "name": "EnRakipsiz - Doğrulanmış Emlak & Otomotiv Pazaryeri", "url": "https://enrakipsiz.com" }
            ]
          }
        ]
      };

      return `
        <title>${escapeHtml(title)}</title>
        <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
        <meta name="description" content="${escapeHtml(desc)}" />
        <meta name="keywords" content="${escapeHtml(keywords)}" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
        ${envVerificationId ? `<meta name="google-site-verification" content="${escapeHtml(envVerificationId)}" />` : ""}
        <meta property="og:title" content="${escapeHtml(title)}" />
        <meta property="og:description" content="${escapeHtml(desc)}" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
        <meta property="og:site_name" content="LookPrice" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapeHtml(title)}" />
        <meta name="twitter:description" content="${escapeHtml(desc)}" />
        ${renderFaviconTags("", host, protocol)}
        <script type="application/ld+json">${safeJsonLd(platformSchema)}</script>
      `;
    }

    // B. Custom Storefront (shoplp, restatelp, hotellp, autolp, booklp, horecalp)
    const brandingObj = typeof store.branding === "string" ? JSON.parse(store.branding) : (store.branding || {});
    const metaSettings = typeof store.meta_settings === "string" ? JSON.parse(store.meta_settings) : (store.meta_settings || {});
    const gaId = metaSettings.ga_measurement_id;
    const gtmId = metaSettings.gtm_id;

    const resolvedName = resolveDisplayStoreName(store, brandingObj, "Seçkin Mağaza");
    const { ecosystem, isRealEstate, isAutomotive, isHotel, isHoreca, isBookstore } = detectStoreEcosystem(store, brandingObj, metaSettings);

    const storeLogo = toAbsoluteUrl(store.logo_url || brandingObj.logo_url || brandingObj.logo || "", baseUrl);
    const storeUrl = store.custom_domain
      ? `${protocol}://${store.custom_domain}`
      : `${protocol}://${host}/s/${store.slug}`;

    const categoryParam = urlParams.get("category");
    let defaultTitle = `${resolvedName}`;
    let defaultDesc = stripHtmlTags(store.description) || `${resolvedName} resmi online vitrini ve güncel ürün kataloğu.`;
    let defaultKeywords = `${resolvedName}, online mağaza, güncel fiyatlar`;
    let schemaOrgType = "OnlineStore";

    if (isRealEstate) {
      schemaOrgType = "RealEstateAgent";
      defaultTitle = `${resolvedName} | ${store.hero_title || "Seçkin Gayrimenkul & Yatırım Portföyü"}`;
      defaultDesc = stripHtmlTags(store.description) || `${resolvedName} - Doğrulanmış satılık ve kiralık daire, lüks villa, arsa ve ticari gayrimenkul portföyü. Güncel fiyatlar ve harita konumuyla doğrudan inceleyin.`;
      defaultKeywords = `${resolvedName}, gayrimenkul portföyü, satılık villa, satılık daire, kiralık daire, arsa yatırımı, emlak ilanları`;
    } else if (isAutomotive) {
      schemaOrgType = "AutoDealer";
      defaultTitle = `${resolvedName} | ${store.hero_title || "Güvenilir Otomotiv & Araç Portföyü"}`;
      defaultDesc = stripHtmlTags(store.description) || `${resolvedName} - Ekspertiz garantili ikinci el otomobil, SUV ve ticari araç portföyü. Güncel araç fiyatları ve detaylı teknik özellikler.`;
      defaultKeywords = `${resolvedName}, satılık araba, oto galeri, ikinci el araç, araç fiyatları, ekspertizli araçlar`;
    } else if (isHotel) {
      schemaOrgType = "Hotel";
      defaultTitle = `${resolvedName} | ${store.hero_title || "Otel Konaklama, Oda Fiyatları & Online Rezervasyon"}`;
      defaultDesc = stripHtmlTags(store.description) || `${resolvedName} - Konforlu oda seçenekleri, gecelik konaklama fiyatları, restoran menüsü ve doğrudan online rezervasyon avantajları.`;
      defaultKeywords = `${resolvedName}, otel rezervasyon, oda fiyatları, konaklama, butik otel, restoran menü`;
    } else if (isHoreca) {
      schemaOrgType = "Restaurant";
      defaultTitle = `${resolvedName} | ${store.hero_title || "Restoran & Kafe Dijital Menü ve Lezzet Kataloğu"}`;
      defaultDesc = stripHtmlTags(store.description) || `${resolvedName} - Güncel yemek, içecek ve tatlı menüsü, fiyat listesi ve masa rezervasyon bilgileri.`;
      defaultKeywords = `${resolvedName}, restoran menü, kafe menü, yemek fiyatları, dijital menü`;
    } else if (isBookstore) {
      schemaOrgType = "BookStore";
      defaultTitle = `${resolvedName} | ${store.hero_title || "Kitabevi, Kültür & Online Kitap Kataloğu"}`;
      defaultDesc = stripHtmlTags(store.description) || `${resolvedName} - En çok satan kitaplar, yeni çıkan yayınlar, edebiyat, eğitim ve kültür eserleri doğrudan sipariş imkanıyla.`;
      defaultKeywords = `${resolvedName}, kitabevi, online kitap al, çok satan kitaplar, yayınevi, isbn`;
    } else {
      schemaOrgType = "OnlineStore";
      defaultTitle = `${resolvedName} | ${store.hero_title || "Resmi Online Mağaza & Ürün Kataloğu"}`;
      defaultDesc = stripHtmlTags(store.description) || `${resolvedName} - Orijinal ürünler, güncel stok ve avantajlı fiyatlarla resmi online alışveriş kataloğu.`;
      defaultKeywords = `${resolvedName}, online alışveriş, ürün kataloğu, fiyat listesi, mağaza`;
    }

    if (categoryParam) {
      defaultTitle = `${categoryParam} Ürünleri ve Fiyatları | ${resolvedName}`;
      defaultDesc = `${resolvedName} mağazasındaki tüm ${categoryParam} modelleri, güncel stok ve fiyatları. Doğrudan ürün linkleriyle hemen inceleyin.`;
    }

    // Fetch top items for this store to embed in Schema.org ItemList (Direct Product Discovery for Google & AI)
    const itemListElements: any[] = [];
    if (isRealEstate) {
      const reRes = await pool.query(
        "SELECT id, title, price, currency, images FROM real_estate_properties WHERE store_id = $1 AND status = 'active' ORDER BY created_at DESC NULLS LAST LIMIT 20",
        [store.id]
      ).catch(() => ({ rows: [] }));
      reRes.rows.forEach((r: any, idx: number) => {
        const itemUrl = `${storeUrl}/p/re_${r.id}`;
        const img = Array.isArray(r.images) && r.images[0] ? toAbsoluteUrl(r.images[0], storeUrl) : undefined;
        itemListElements.push({
          "@type": "ListItem",
          "position": idx + 1,
          "url": itemUrl,
          "item": {
            "@type": "Product",
            "name": r.title,
            "url": itemUrl,
            "image": img,
            "offers": {
              "@type": "Offer",
              "price": Number(r.price) || 0,
              "priceCurrency": r.currency || "GBP",
              "availability": "https://schema.org/InStock",
              "url": itemUrl
            }
          }
        });
      });
    } else if (isAutomotive) {
      const vRes = await pool.query(
        "SELECT id, brand, model, year, selling_price, currency, images FROM vehicles WHERE store_id = $1 AND status IN ('active', 'for_sale') ORDER BY id DESC LIMIT 20",
        [store.id]
      ).catch(() => ({ rows: [] }));
      vRes.rows.forEach((v: any, idx: number) => {
        const itemUrl = `${storeUrl}/p/v_${v.id}`;
        const vName = `${v.year ? `${v.year} ` : ""}${v.brand || ""} ${v.model || ""}`.trim();
        const img = Array.isArray(v.images) && v.images[0] ? toAbsoluteUrl(v.images[0], storeUrl) : undefined;
        itemListElements.push({
          "@type": "ListItem",
          "position": idx + 1,
          "url": itemUrl,
          "item": {
            "@type": "Product",
            "name": vName,
            "url": itemUrl,
            "image": img,
            "offers": {
              "@type": "Offer",
              "price": Number(v.selling_price) || 0,
              "priceCurrency": v.currency || "EUR",
              "availability": "https://schema.org/InStock",
              "url": itemUrl
            }
          }
        });
      });
    } else {
      const prodRes = await pool.query(
        "SELECT id, name, barcode, price, currency, stock_quantity, image_url, brand FROM products WHERE store_id = $1 AND (is_web_sale = true OR is_web_sale IS NULL) AND COALESCE(type, '') <> 'service' ORDER BY updated_at DESC NULLS LAST, id DESC LIMIT 24",
        [store.id]
      ).catch(() => ({ rows: [] }));
      prodRes.rows.forEach((p: any, idx: number) => {
        const itemUrl = `${storeUrl}/p/${encodeURIComponent(p.barcode || p.id)}`;
        const { price: convPrice, currency: convCurr } = convertProductPrice(p, store);
        const img = p.image_url ? toAbsoluteUrl(p.image_url, storeUrl) : undefined;
        itemListElements.push({
          "@type": "ListItem",
          "position": idx + 1,
          "url": itemUrl,
          "item": {
            "@type": isBookstore ? ["Product", "Book"] : "Product",
            "name": p.name,
            "sku": String(p.barcode || p.id),
            "url": itemUrl,
            "image": img,
            "brand": p.brand ? { "@type": "Brand", "name": p.brand } : undefined,
            "offers": {
              "@type": "Offer",
              "price": convPrice.toFixed(2),
              "priceCurrency": convCurr,
              "availability": Number(p.stock_quantity) > 0 || isHoreca ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "url": itemUrl
            }
          }
        });
      });
    }

    const storeCanonicalUrl = store.custom_domain
      ? `https://${store.custom_domain}${pathOnly === `/s/${store.slug}` ? "/" : pathOnly}`
      : `https://${host}${pathOnly}`;

    const storeGraphSchema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": schemaOrgType,
          "name": resolvedName,
          "description": defaultDesc,
          "url": storeUrl,
          "logo": storeLogo || undefined,
          "image": storeLogo || undefined,
          "telephone": store.phone || brandingObj.phone || undefined,
          "address": store.address ? {
            "@type": "PostalAddress",
            "streetAddress": store.address,
            "addressCountry": "KKTC"
          } : undefined
        },
        {
          "@type": "WebSite",
          "name": resolvedName,
          "url": storeUrl,
          "potentialAction": {
            "@type": "SearchAction",
            "target": `${storeUrl}?q={search_term_string}`,
            "query-input": "required name=search_term_string"
          }
        },
        ...(itemListElements.length > 0 ? [{
          "@type": "ItemList",
          "name": `${resolvedName} Ürün ve Portföy Kataloğu`,
          "numberOfItems": itemListElements.length,
          "itemListElement": itemListElements
        }] : [])
      ]
    };

    let tags = `
      <!-- Custom Storefront SEO Meta Tags (${ecosystem}) -->
      <title>${escapeHtml(defaultTitle)}</title>
      <link rel="canonical" href="${escapeHtml(storeCanonicalUrl)}" />
      <meta name="description" content="${escapeHtml(defaultDesc.substring(0, 160))}" />
      <meta name="keywords" content="${escapeHtml(defaultKeywords)}" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />

      <!-- Open Graph / Meta Commerce -->
      <meta property="og:type" content="website" />
      <meta property="og:url" content="${escapeHtml(storeUrl)}" />
      <meta property="og:title" content="${escapeHtml(defaultTitle)}" />
      <meta property="og:description" content="${escapeHtml(defaultDesc.substring(0, 160))}" />
      <meta property="og:site_name" content="${escapeHtml(resolvedName)}" />
      ${storeLogo ? `<meta property="og:image" content="${escapeHtml(storeLogo)}" />` : ""}

      <!-- Twitter -->
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${escapeHtml(defaultTitle)}" />
      <meta name="twitter:description" content="${escapeHtml(defaultDesc.substring(0, 160))}" />
      ${storeLogo ? `<meta name="twitter:image" content="${escapeHtml(storeLogo)}" />` : ""}
      ${renderFaviconTags(store.logo_url || brandingObj.logo_url, host, protocol)}

      <!-- Storefront + Direct Product ItemList Schema -->
      <script type="application/ld+json">${safeJsonLd(storeGraphSchema)}</script>
    `;

    if (metaSettings.gsc_id) {
      tags += `\n      <meta name="google-site-verification" content="${escapeHtml(metaSettings.gsc_id)}" />`;
    }
    if (gaId) {
      tags += `
      <script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(gaId)}"></script>
      <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${escapeHtml(gaId)}');
      </script>`;
    }
    if (gtmId) {
      tags += `
      <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${escapeHtml(gtmId)}');</script>`;
    }

    return tags;
  } catch (err) {
    console.error("OpenGraph dynamic injection error:", err);
    return "";
  }
}

/**
 * Generates Server-Side Rendered (SSR) semantic HTML snapshot injected inside <div id="root">
 * before React hydrates/mounts. Ensures Googlebot Wave-1, Google AI (Gemini/Vertex),
 * ChatGPT (OAI-SearchBot), Perplexity, and Claude immediately see all product details
 * and crawlable <a href="/p/..."> product links without waiting for client JS!
 */
export async function generateSeoBodySnapshot(url: string, req: any): Promise<string> {
  try {
    const host = req.get("host") || "enrakipsiz.com";
    const normalizedHost = host.startsWith("www.") ? host.substring(4) : host;
    const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    let pathOnly = url.split("?")[0];
    if (pathOnly.length > 1 && pathOnly.endsWith("/")) {
      pathOnly = pathOnly.slice(0, -1);
    }

    // Skip private/admin/dashboard routes
    if (
      pathOnly.startsWith("/admin") ||
      pathOnly.startsWith("/dashboard") ||
      pathOnly.startsWith("/login") ||
      pathOnly.startsWith("/checkout")
    ) {
      return "";
    }

    const sMatch = pathOnly.match(/^\/s\/([^\/]+)/);
    const isProductS = pathOnly.match(/^\/s\/([^\/]+)\/p\/([^\/\?]+)/);
    const isProductP = pathOnly.match(/^\/p\/([^\/\?]+)/);
    const isStoreP = pathOnly.match(/^\/store\/([^\/]+)\/p\/([^\/\?]+)/);
    const isStoreMatch = pathOnly.match(/^\/store\/([^\/]+)/);

    let barcode = "";
    let storeSlug = "";

    if (isProductS) {
      storeSlug = decodeURIComponent(isProductS[1]);
      barcode = decodeURIComponent(isProductS[2]);
    } else if (isStoreP) {
      storeSlug = decodeURIComponent(isStoreP[1]);
      barcode = decodeURIComponent(isStoreP[2]);
    } else if (isProductP) {
      barcode = decodeURIComponent(isProductP[1]);
    } else if (sMatch) {
      storeSlug = decodeURIComponent(sMatch[1]);
    } else if (isStoreMatch) {
      storeSlug = decodeURIComponent(isStoreMatch[1]);
    }

    const srStyle = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";

    // 1. Direct Product / Property / Vehicle Page Snapshot
    if (barcode) {
      if (barcode.startsWith("re_")) {
        const parsedId = parseInt(barcode.substring(3), 10);
        if (!isNaN(parsedId)) {
          const reRes = await pool.query("SELECT * FROM real_estate_properties WHERE id = $1 LIMIT 1", [parsedId]);
          if (reRes.rows.length > 0) {
            const p = reRes.rows[0];
            const storeRes = await pool.query("SELECT name, slug, custom_domain, phone, branding FROM stores WHERE id = $1 LIMIT 1", [p.store_id]);
            const st = storeRes.rows[0] || {};
            const stName = resolveDisplayStoreName(st, st.branding, "EnRakipsiz Emlak");
            const stUrl = st.custom_domain ? `${protocol}://${st.custom_domain}` : `${baseUrl}/s/${st.slug}`;
            return `<main style="${srStyle}" data-seo-prerender="real-estate-detail">
              <article>
                <h1>${escapeHtml(p.title)}</h1>
                <p><strong>Fiyat:</strong> ${escapeHtml(Number(p.price || 0).toLocaleString("tr-TR"))} ${escapeHtml(p.currency || "GBP")}</p>
                <p><strong>Bölge / Konum:</strong> ${escapeHtml(p.kktc_region || p.location || "KKTC")}</p>
                <p><strong>Oda Sayısı:</strong> ${escapeHtml(p.room_count || "-")} | <strong>Metrekare:</strong> ${escapeHtml(p.square_meters || "-")} m²</p>
                <p><strong>Gayrimenkul Ofisi:</strong> <a href="${escapeHtml(stUrl)}">${escapeHtml(stName)}</a></p>
                <div>${escapeHtml(stripHtmlTags(p.description))}</div>
              </article>
            </main>`;
          }
        }
      } else if (barcode.startsWith("v_")) {
        const parsedId = parseInt(barcode.substring(2), 10);
        if (!isNaN(parsedId)) {
          const vRes = await pool.query("SELECT * FROM vehicles WHERE id = $1 LIMIT 1", [parsedId]);
          if (vRes.rows.length > 0) {
            const v = vRes.rows[0];
            const storeRes = await pool.query("SELECT name, slug, custom_domain, phone, branding FROM stores WHERE id = $1 LIMIT 1", [v.store_id]);
            const st = storeRes.rows[0] || {};
            const stName = resolveDisplayStoreName(st, st.branding, "EnRakipsiz Otomotiv");
            const stUrl = st.custom_domain ? `${protocol}://${st.custom_domain}` : `${baseUrl}/s/${st.slug}`;
            const title = `${v.year || ""} ${v.brand || ""} ${v.model || ""} ${v.package_name || ""}`.trim();
            return `<main style="${srStyle}" data-seo-prerender="vehicle-detail">
              <article>
                <h1>Satılık ${escapeHtml(title)}</h1>
                <p><strong>Fiyat:</strong> ${escapeHtml(Number(v.selling_price || 0).toLocaleString("tr-TR"))} ${escapeHtml(v.currency || "EUR")}</p>
                <p><strong>Marka / Model:</strong> ${escapeHtml(v.brand)} ${escapeHtml(v.model)} (${escapeHtml(v.year)})</p>
                <p><strong>Kilometre:</strong> ${escapeHtml(v.current_mileage || 0)} km | <strong>Yakıt:</strong> ${escapeHtml(v.fuel_type)} | <strong>Vites:</strong> ${escapeHtml(v.transmission)}</p>
                <p><strong>Oto Galeri:</strong> <a href="${escapeHtml(stUrl)}">${escapeHtml(stName)}</a></p>
                <div>${escapeHtml(stripHtmlTags(v.description || v.market_story))}</div>
              </article>
            </main>`;
          }
        }
      } else {
        const store = await findStoreBySlugOrHost(storeSlug, host);
        const prodRes = store
          ? await pool.query("SELECT * FROM products WHERE store_id = $1 AND (TRIM(LOWER(barcode)) = TRIM(LOWER($2)) OR id::text = TRIM($2)) LIMIT 1", [store.id, barcode])
          : await pool.query("SELECT * FROM products WHERE (TRIM(LOWER(barcode)) = TRIM(LOWER($1)) OR id::text = TRIM($1)) LIMIT 1", [barcode]);
        if (prodRes.rows.length > 0) {
          const prod = prodRes.rows[0];
          const st = store || (await pool.query("SELECT * FROM stores WHERE id = $1 LIMIT 1", [prod.store_id])).rows[0] || {};
          const stName = resolveDisplayStoreName(st, st.branding, "Seçkin Mağaza");
          const stUrl = st.custom_domain ? `${protocol}://${st.custom_domain}` : `${baseUrl}/s/${st.slug}`;
          const { price: convPrice, currency: convCurr } = convertProductPrice(prod, st);
          return `<main style="${srStyle}" data-seo-prerender="product-detail">
            <article>
              <nav aria-label="Breadcrumb">
                <a href="${escapeHtml(stUrl)}">${escapeHtml(stName)}</a> &gt;
                <a href="${escapeHtml(`${stUrl}?category=${encodeURIComponent(prod.category || "Genel")}`)}">${escapeHtml(prod.category || "Genel")}</a> &gt;
                <span>${escapeHtml(prod.name)}</span>
              </nav>
              <h1>${escapeHtml(prod.name)}</h1>
              <p><strong>Fiyat:</strong> ${escapeHtml(convPrice.toFixed(2))} ${escapeHtml(convCurr)}</p>
              <p><strong>Marka:</strong> ${escapeHtml(prod.brand || stName)} | <strong>Kategori:</strong> ${escapeHtml(prod.category || "Genel")}</p>
              <p><strong>Barkod / SKU:</strong> ${escapeHtml(prod.barcode || prod.id)} | <strong>Stok Durumu:</strong> ${Number(prod.stock_quantity) > 0 ? "Stokta Var" : "Tükendi"}</p>
              <p><strong>Mağaza:</strong> <a href="${escapeHtml(stUrl)}">${escapeHtml(stName)}</a></p>
              <div>${escapeHtml(stripHtmlTags(prod.description || prod.name))}</div>
            </article>
          </main>`;
        }
      }
    }

    // 2. EnRakipsiz.com Portal Snapshot with Direct Links to Listings & Stores
    if (normalizedHost === "enrakipsiz.com" || normalizedHost.includes("enrakipsiz") || pathOnly === "/portal") {
      const [reRes, vehRes, storesRes] = await Promise.all([
        pool.query("SELECT id, title, price, currency, kktc_region, location, room_count, square_meters FROM real_estate_properties WHERE is_on_enrakipsiz = true AND status <> 'sold' ORDER BY created_at DESC NULLS LAST LIMIT 40").catch(() => ({ rows: [] })),
        pool.query("SELECT id, brand, model, year, selling_price, currency, current_mileage FROM vehicles WHERE is_on_enrakipsiz = true AND status <> 'sold' ORDER BY id DESC LIMIT 40").catch(() => ({ rows: [] })),
        pool.query("SELECT name, slug, custom_domain FROM stores WHERE status = 'active' OR status IS NULL LIMIT 30").catch(() => ({ rows: [] }))
      ]);

      const reLinks = reRes.rows.map((r: any) =>
        `<li><a href="https://enrakipsiz.com/p/re_${r.id}">${escapeHtml(r.title)} - ${escapeHtml(r.kktc_region || r.location || "KKTC")} (${escapeHtml(Number(r.price || 0).toLocaleString("tr-TR"))} ${escapeHtml(r.currency || "GBP")})</a></li>`
      ).join("");

      const vehLinks = vehRes.rows.map((v: any) =>
        `<li><a href="https://enrakipsiz.com/p/v_${v.id}">Satılık ${escapeHtml(`${v.year || ""} ${v.brand || ""} ${v.model || ""}`.trim())} (${escapeHtml(Number(v.selling_price || 0).toLocaleString("tr-TR"))} ${escapeHtml(v.currency || "EUR")})</a></li>`
      ).join("");

      const storeLinks = storesRes.rows.map((s: any) => {
        const sUrl = s.custom_domain ? `https://${s.custom_domain}` : `https://enrakipsiz.com/s/${s.slug}`;
        return `<li><a href="${escapeHtml(sUrl)}">${escapeHtml(s.name)}</a></li>`;
      }).join("");

      return `<main style="${srStyle}" data-seo-prerender="enrakipsiz-portal">
        <h1>EnRakipsiz | Doğrulanmış Emlak ve Otomotiv Portföy Pazaryeri</h1>
        <section>
          <h2>Bölgesel Emlak Vitrinleri</h2>
          <ul>
            <li><a href="https://enrakipsiz.com/?region=Girne">Girne Satılık &amp; Kiralık Emlak İlanları</a></li>
            <li><a href="https://enrakipsiz.com/?region=Lefko%C5%9Fa">Lefkoşa Satılık &amp; Kiralık Emlak İlanları</a></li>
            <li><a href="https://enrakipsiz.com/?region=%C4%B0skele">İskele Satılık &amp; Kiralık Emlak İlanları</a></li>
            <li><a href="https://enrakipsiz.com/?region=Gazima%C4%9Fusa">Gazimağusa Satılık &amp; Kiralık Emlak İlanları</a></li>
          </ul>
        </section>
        <section>
          <h2>Doğrulanmış Gayrimenkul İlanları</h2>
          <ul>${reLinks}</ul>
        </section>
        <section>
          <h2>Doğrulanmış Vasıta &amp; Otomotiv İlanları</h2>
          <ul>${vehLinks}</ul>
        </section>
        <section>
          <h2>Üye Mağazalar</h2>
          <ul>${storeLinks}</ul>
        </section>
      </main>`;
    }

    // 3. Storefront Snapshot with Direct Product Links (/p/:barcode, /p/re_:id, /p/v_:id)
    const store = await findStoreBySlugOrHost(storeSlug, host);
    if (store) {
      const brandingObj = typeof store.branding === "string" ? JSON.parse(store.branding) : (store.branding || {});
      const metaSettings = typeof store.meta_settings === "string" ? JSON.parse(store.meta_settings) : (store.meta_settings || {});
      const resolvedName = resolveDisplayStoreName(store, brandingObj, "Seçkin Mağaza");
      const { isRealEstate, isAutomotive } = detectStoreEcosystem(store, brandingObj, metaSettings);
      const storeUrl = store.custom_domain ? `${protocol}://${store.custom_domain}` : `${baseUrl}/s/${store.slug}`;

      let itemsHtml = "";
      if (isRealEstate) {
        const reRes = await pool.query(
          "SELECT id, title, price, currency, kktc_region, location, room_count, square_meters FROM real_estate_properties WHERE store_id = $1 AND status = 'active' ORDER BY created_at DESC NULLS LAST LIMIT 80",
          [store.id]
        ).catch(() => ({ rows: [] }));
        itemsHtml = reRes.rows.map((r: any) =>
          `<li><a href="${escapeHtml(`${storeUrl}/p/re_${r.id}`)}">${escapeHtml(r.title)} - ${escapeHtml(r.kktc_region || r.location || "")} (${escapeHtml(Number(r.price || 0).toLocaleString("tr-TR"))} ${escapeHtml(r.currency || "GBP")})</a></li>`
        ).join("");
      } else if (isAutomotive) {
        const vRes = await pool.query(
          "SELECT id, brand, model, year, selling_price, currency, current_mileage FROM vehicles WHERE store_id = $1 AND status IN ('active', 'for_sale') ORDER BY id DESC LIMIT 80",
          [store.id]
        ).catch(() => ({ rows: [] }));
        itemsHtml = vRes.rows.map((v: any) =>
          `<li><a href="${escapeHtml(`${storeUrl}/p/v_${v.id}`)}">Satılık ${escapeHtml(`${v.year || ""} ${v.brand || ""} ${v.model || ""}`.trim())} - ${escapeHtml(Number(v.selling_price || 0).toLocaleString("tr-TR"))} ${escapeHtml(v.currency || "EUR")}</a></li>`
        ).join("");
      } else {
        const prodRes = await pool.query(
          "SELECT id, name, barcode, price, currency, category, brand FROM products WHERE store_id = $1 AND (is_web_sale = true OR is_web_sale IS NULL) AND COALESCE(type, '') <> 'service' ORDER BY updated_at DESC NULLS LAST, id DESC LIMIT 100",
          [store.id]
        ).catch(() => ({ rows: [] }));
        itemsHtml = prodRes.rows.map((p: any) => {
          const { price: convPrice, currency: convCurr } = convertProductPrice(p, store);
          const pUrl = `${storeUrl}/p/${encodeURIComponent(p.barcode || p.id)}`;
          return `<li><a href="${escapeHtml(pUrl)}">${escapeHtml(p.name)}${p.brand ? ` (${escapeHtml(p.brand)})` : ""} - ${escapeHtml(convPrice.toFixed(2))} ${escapeHtml(convCurr)}</a></li>`;
        }).join("");
      }

      return `<main style="${srStyle}" data-seo-prerender="store-catalog">
        <h1>${escapeHtml(resolvedName)}</h1>
        <p>${escapeHtml(stripHtmlTags(store.description || `${resolvedName} resmi online vitrini ve güncel ürün kataloğu.`))}</p>
        <section aria-label="Ürün ve Portföy Kataloğu">
          <h2>Güncel Ürünler ve Portföy Linkleri</h2>
          <ul>${itemsHtml}</ul>
        </section>
      </main>`;
    }

    // 4. Platform Homepage (lookprice.net) Snapshot with Ecosystem & Store Links
    const storesRes = await pool.query("SELECT name, slug, custom_domain FROM stores WHERE status = 'active' OR status IS NULL LIMIT 40").catch(() => ({ rows: [] }));
    const storeDirectoryHtml = storesRes.rows.map((s: any) => {
      const sUrl = s.custom_domain ? `https://${s.custom_domain}` : `${baseUrl}/s/${s.slug}`;
      return `<li><a href="${escapeHtml(sUrl)}">${escapeHtml(s.name)}</a></li>`;
    }).join("");

    return `<main style="${srStyle}" data-seo-prerender="lookprice-platform">
      <h1>LookPrice | shopLP, restateLP, autoLP, hotelLP, bookLP &amp; horecaLP Bulut Yönetim Platformu</h1>
      <nav aria-label="LookPrice Sektörel Ekosistemler">
        <ul>
          <li><a href="${escapeHtml(baseUrl)}/shop-landing">shopLP - Akıllı E-Ticaret, Barkodlu Hızlı POS ve Pazaryeri Entegrasyonu</a></li>
          <li><a href="${escapeHtml(baseUrl)}/restate-landing">restateLP - Gayrimenkul &amp; Emlak Portföy ve Harita Yönetim Sistemi</a></li>
          <li><a href="${escapeHtml(baseUrl)}/auto-landing">autoLP - Oto Galeri, Vasıta Portföy ve Ekspertiz Yönetim Sistemi</a></li>
          <li><a href="${escapeHtml(baseUrl)}/horeca-landing">horecaLP &amp; hotelLP - Restoran POS, QR Menü ve Otel Konaklama Sistemi</a></li>
          <li><a href="https://enrakipsiz.com">EnRakipsiz - Doğrulanmış Emlak ve Otomotiv Portföy Pazaryeri</a></li>
        </ul>
      </nav>
      <section aria-label="Seçkin Mağazalar Dizini">
        <h2>LookPrice Altyapısını Kullanan Seçkin Mağazalar</h2>
        <ul>${storeDirectoryHtml}</ul>
      </section>
    </main>`;
  } catch (e) {
    return "";
  }
}

/**
 * Generates dynamic, live database-backed llms.txt Markdown index for AI Search Engines
 * (Google AI / Gemini, ChatGPT Search, Perplexity, Claude) with direct product links!
 */
export async function generateDynamicLlmsTxt(req: any, storeSlugParam?: string): Promise<string> {
  const host = req.get("host") || "lookprice.net";
  const normalizedHost = host.startsWith("www.") ? host.substring(4) : host;
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  try {
    // 1. Check if request is for a specific store (custom domain or /s/:storeSlug/llms.txt)
    const store = await findStoreBySlugOrHost(storeSlugParam || "", host);
    if (store) {
      const brandingObj = typeof store.branding === "string" ? JSON.parse(store.branding) : (store.branding || {});
      const metaSettings = typeof store.meta_settings === "string" ? JSON.parse(store.meta_settings) : (store.meta_settings || {});
      const resolvedName = resolveDisplayStoreName(store, brandingObj, "Seçkin Mağaza");
      const { ecosystem, isRealEstate, isAutomotive } = detectStoreEcosystem(store, brandingObj, metaSettings);
      const storeUrl = store.custom_domain ? `${protocol}://${store.custom_domain}` : `${baseUrl}/s/${store.slug}`;

      let md = `# ${resolvedName} (${ecosystem.toUpperCase()})\n\n`;
      md += `> ${stripHtmlTags(store.description || `${resolvedName} resmi dijital mağaza ve güncel ürün/portföy kataloğu.`)}\n\n`;
      md += `- Resmi Web Sitesi: ${storeUrl}\n`;
      md += `- Sitemap XML: ${storeUrl}/sitemap.xml\n`;
      if (store.address) md += `- Adres: ${store.address}\n`;
      if (store.phone || brandingObj.phone) md += `- Telefon: ${store.phone || brandingObj.phone}\n`;
      md += `\n## Doğrudan Ürün ve Portföy Linkleri\n\n`;

      if (isRealEstate) {
        const reRes = await pool.query(
          "SELECT id, title, price, currency, kktc_region, location, room_count, square_meters FROM real_estate_properties WHERE store_id = $1 AND status = 'active' ORDER BY created_at DESC NULLS LAST LIMIT 150",
          [store.id]
        ).catch(() => ({ rows: [] }));
        reRes.rows.forEach((r: any) => {
          md += `- [${r.title}](${storeUrl}/p/re_${r.id}): ${Number(r.price || 0).toLocaleString("tr-TR")} ${r.currency || "GBP"} | Bölge: ${r.kktc_region || r.location || "KKTC"} | Oda: ${r.room_count || "-"} | ${r.square_meters || "-"} m²\n`;
        });
      } else if (isAutomotive) {
        const vRes = await pool.query(
          "SELECT id, brand, model, year, selling_price, currency, current_mileage, fuel_type, transmission FROM vehicles WHERE store_id = $1 AND status IN ('active', 'for_sale') ORDER BY id DESC LIMIT 150",
          [store.id]
        ).catch(() => ({ rows: [] }));
        vRes.rows.forEach((v: any) => {
          const title = `${v.year || ""} ${v.brand || ""} ${v.model || ""}`.trim();
          md += `- [Satılık ${title}](${storeUrl}/p/v_${v.id}): ${Number(v.selling_price || 0).toLocaleString("tr-TR")} ${v.currency || "EUR"} | ${v.current_mileage || 0} km | ${v.fuel_type || ""} | ${v.transmission || ""}\n`;
        });
      } else {
        const prodRes = await pool.query(
          "SELECT id, name, barcode, price, currency, category, brand, stock_quantity FROM products WHERE store_id = $1 AND (is_web_sale = true OR is_web_sale IS NULL) AND COALESCE(type, '') <> 'service' ORDER BY updated_at DESC NULLS LAST, id DESC LIMIT 200",
          [store.id]
        ).catch(() => ({ rows: [] }));
        prodRes.rows.forEach((p: any) => {
          const { price: convPrice, currency: convCurr } = convertProductPrice(p, store);
          const pUrl = `${storeUrl}/p/${encodeURIComponent(p.barcode || p.id)}`;
          md += `- [${p.name}](${pUrl}): ${convPrice.toFixed(2)} ${convCurr} | Marka: ${p.brand || resolvedName} | Kategori: ${p.category || "Genel"} | Barkod: ${p.barcode || p.id}\n`;
        });
      }
      return md;
    }

    // 2. EnRakipsiz.com Portal LLMS.txt
    if (normalizedHost === "enrakipsiz.com" || normalizedHost.includes("enrakipsiz")) {
      let md = `# EnRakipsiz (enrakipsiz.com)\n\n`;
      md += `> Doğrulanmış Gayrimenkul (restateLP) ve Otomotiv (autoLP) Portföy Pazaryeri Platformu. Tüm ilanlar yetkili emlak ofisleri ve oto galeriler tarafından doğrulanmış olup doğrudan ilan detay linklerine (/p/re_ID ve /p/v_ID) sahiptir.\n\n`;
      md += `## Bölgesel Gayrimenkul Merkezleri\n`;
      md += `- [Girne Satılık & Kiralık Emlak İlanları](https://enrakipsiz.com/?region=Girne)\n`;
      md += `- [Lefkoşa Satılık & Kiralık Emlak İlanları](https://enrakipsiz.com/?region=Lefko%C5%9Fa)\n`;
      md += `- [İskele Satılık & Kiralık Emlak İlanları](https://enrakipsiz.com/?region=%C4%B0skele)\n`;
      md += `- [Gazimağusa Satılık & Kiralık Emlak İlanları](https://enrakipsiz.com/?region=Gazima%C4%9Fusa)\n\n`;

      const [reRes, vehRes] = await Promise.all([
        pool.query("SELECT id, title, price, currency, kktc_region, location, room_count, square_meters FROM real_estate_properties WHERE is_on_enrakipsiz = true AND status <> 'sold' ORDER BY created_at DESC NULLS LAST LIMIT 80").catch(() => ({ rows: [] })),
        pool.query("SELECT id, brand, model, year, selling_price, currency, current_mileage FROM vehicles WHERE is_on_enrakipsiz = true AND status <> 'sold' ORDER BY id DESC LIMIT 80").catch(() => ({ rows: [] }))
      ]);

      md += `## Güncel Gayrimenkul İlanları (Doğrudan Linkler)\n`;
      reRes.rows.forEach((r: any) => {
        md += `- [${r.title}](https://enrakipsiz.com/p/re_${r.id}): ${Number(r.price || 0).toLocaleString("tr-TR")} ${r.currency || "GBP"} - ${r.kktc_region || r.location || "KKTC"} (${r.room_count || ""}, ${r.square_meters || ""} m²)\n`;
      });

      md += `\n## Güncel Vasıta & Otomotiv İlanları (Doğrudan Linkler)\n`;
      vehRes.rows.forEach((v: any) => {
        md += `- [Satılık ${v.year || ""} ${v.brand || ""} ${v.model || ""}](https://enrakipsiz.com/p/v_${v.id}): ${Number(v.selling_price || 0).toLocaleString("tr-TR")} ${v.currency || "EUR"} (${v.current_mileage || 0} km)\n`;
      });

      return md;
    }

    // 3. LookPrice.net Multi-Ecosystem LLMS.txt
    let md = `# LookPrice Ekosistemi (lookprice.net)\n\n`;
    md += `> LookPrice; perakende e-ticaret (shopLP), gayrimenkul (restateLP), otomotiv (autoLP), otel konaklama (hotelLP), kitabevi (bookLP) ve restoran/kafe (horecaLP) işletmeleri için bulut tabanlı yönetim, POS, e-Fatura ve dijital vitrin platformudur.\n\n`;
    md += `## Sektörel Çözümler\n`;
    md += `- [shopLP - E-Ticaret, Barkodlu POS ve Pazaryeri Entegrasyonu](${baseUrl}/shop-landing)\n`;
    md += `- [restateLP - Gayrimenkul & Emlak Portföy Yönetim Sistemi](${baseUrl}/restate-landing)\n`;
    md += `- [autoLP - Oto Galeri & Motorlu Araç Portföy Sistemi](${baseUrl}/auto-landing)\n`;
    md += `- [horecaLP & hotelLP - Restoran POS, QR Menü ve Otel Konaklama](${baseUrl}/horeca-landing)\n`;
    md += `- [EnRakipsiz - Emlak & Otomotiv Pazaryeri Portalı](https://enrakipsiz.com)\n\n`;

    const storesRes = await pool.query("SELECT id, name, slug, custom_domain FROM stores WHERE status = 'active' OR status IS NULL LIMIT 50").catch(() => ({ rows: [] }));
    md += `## Aktif Mağaza Vitrinleri ve Katalogları\n`;
    for (const s of storesRes.rows) {
      const sUrl = s.custom_domain ? `https://${s.custom_domain}` : `${baseUrl}/s/${s.slug}`;
      md += `- [${s.name}](${sUrl}) (Sitemap: ${sUrl}/sitemap.xml)\n`;
    }

    return md;
  } catch (e) {
    return `# LookPrice & EnRakipsiz AI Index\n> Doğrulanmış E-Ticaret, Emlak, Otomotiv ve HoReCa Dijital Vitrin Platformu`;
  }
}

/**
 * Generates Google Merchant Center / Google Shopping RSS 2.0 XML Product Feed
 * Strictly for shopLP and bookLP retail products (excludes service items and non-retail sectors per Rule 0).
 */
export async function generateGoogleMerchantFeed(req: any, storeSlugParam?: string): Promise<string> {
  const host = req.get("host") || "lookprice.net";
  const protocol = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const baseUrl = `${protocol}://${host}`;

  const store = await findStoreBySlugOrHost(storeSlugParam || "", host);
  if (!store) {
    return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>LookPrice Product Feed</title><link>${escapeHtml(baseUrl)}</link><description>Store not specified</description></channel></rss>`;
  }

  const brandingObj = typeof store.branding === "string" ? JSON.parse(store.branding) : (store.branding || {});
  const metaSettings = typeof store.meta_settings === "string" ? JSON.parse(store.meta_settings) : (store.meta_settings || {});
  const resolvedName = resolveDisplayStoreName(store, brandingObj, "Seçkin Mağaza");
  const { isRealEstate, isAutomotive, isHoreca } = detectStoreEcosystem(store, brandingObj, metaSettings);

  const storeUrl = store.custom_domain ? `${protocol}://${store.custom_domain}` : `${baseUrl}/s/${store.slug}`;

  // Rule 0: Google Merchant Feed is strictly for shopLP / bookLP retail stores
  if (isRealEstate || isAutomotive || isHoreca) {
    return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>${escapeHtml(resolvedName)}</title><link>${escapeHtml(storeUrl)}</link><description>Sectoral portfolio store</description></channel></rss>`;
  }

  const prodRes = await pool.query(
    "SELECT * FROM products WHERE store_id = $1 AND (is_web_sale = true OR is_web_sale IS NULL) AND COALESCE(type, '') <> 'service' ORDER BY updated_at DESC NULLS LAST, id DESC LIMIT 2000",
    [store.id]
  );

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n  <channel>\n    <title>${escapeHtml(resolvedName)} - Google Shopping Feed</title>\n    <link>${escapeHtml(storeUrl)}</link>\n    <description>${escapeHtml(stripHtmlTags(store.description || `${resolvedName} Resmi Ürün Kataloğu`))}</description>\n`;

  for (const p of prodRes.rows) {
    if (String(p.product_type || p.type || "").toLowerCase() === "service") continue;
    const { price: convPrice, currency: convCurr } = convertProductPrice(p, store);
    if (convPrice <= 0) continue;

    const itemUrl = `${storeUrl}/p/${encodeURIComponent(p.barcode || p.id)}`;
    const imgUrl = toAbsoluteUrl(p.image_url || store.logo_url, storeUrl);
    const rawBarcode = String(p.barcode || "").trim();
    const isValidGtin = /^\d{8}$|^\d{12,14}$/.test(rawBarcode);
    const availability = Number(p.stock_quantity) > 0 ? "in_stock" : "out_of_stock";

    xml += `    <item>\n`;
    xml += `      <g:id>${escapeHtml(String(p.barcode || p.id))}</g:id>\n`;
    xml += `      <g:title>${escapeHtml(p.name)}</g:title>\n`;
    xml += `      <g:description>${escapeHtml(stripHtmlTags(p.description || p.name))}</g:description>\n`;
    xml += `      <g:link>${escapeHtml(itemUrl)}</g:link>\n`;
    if (imgUrl) xml += `      <g:image_link>${escapeHtml(imgUrl)}</g:image_link>\n`;
    xml += `      <g:condition>new</g:condition>\n`;
    xml += `      <g:availability>${availability}</g:availability>\n`;
    xml += `      <g:price>${convPrice.toFixed(2)} ${escapeHtml(convCurr)}</g:price>\n`;
    xml += `      <g:brand>${escapeHtml(p.brand || resolvedName)}</g:brand>\n`;
    if (isValidGtin) {
      xml += `      <g:gtin>${escapeHtml(rawBarcode)}</g:gtin>\n`;
    } else {
      xml += `      <g:mpn>${escapeHtml(String(p.barcode || p.id))}</g:mpn>\n`;
      xml += `      <g:identifier_exists>no</g:identifier_exists>\n`;
    }
    if (p.category) {
      xml += `      <g:product_type>${escapeHtml(p.category)}</g:product_type>\n`;
    }
    xml += `    </item>\n`;
  }

  xml += `  </channel>\n</rss>`;
  return xml;
}
