/**
 * Unified E-Marketplace URL Engine
 * 
 * Provides bulletproof, standardized URL generation and resolution for all e-marketplaces
 * (Hepsiburada, Trendyol, Amazon, N11, Pazarama, Çiçeksepeti).
 * 
 * Rules:
 * 1. Direct URLs or Catalog IDs ALWAYS take highest priority.
 * 2. Barcodes (GTIN/EAN/UPC) are used as Fallback #1 for public search URLs.
 * 3. Product Names are used as Fallback #2.
 * 4. NEVER use merchant internal stock codes (e.g. BS130157-S) in public search URLs 
 *    (like hepsiburada.com/ara, trendyol.com/sr, amazon.com.tr/s) because marketplace 
 *    search engines ignore seller-internal codes.
 * 5. Handles invalid/dummy barcodes (e.g. "00000000", "123456", "NONE", "TEST").
 */

export interface MarketplaceUrlOptions {
  fallbackToSearch?: boolean; // Default true
  formatForCustomer?: boolean; // Default true
  /** Optional explicit storefront/seller name belonging strictly to the current store (never hardcoded) */
  sellerName?: string;
}

export function slugifyText(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .replace(/Ğ/g, 'g')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/ş/g, 's')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/Ö/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'c')
    .replace(/ç/g, 'c')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidBarcode(barcode: any): boolean {
  if (!barcode) return false;
  const str = String(barcode).trim();
  if (str.length < 5) return false;
  const upper = str.toUpperCase();
  if (['NONE', 'NULL', 'UNDEFINED', '00000000', '12345678', '123456', 'TEST', 'BARCODE'].includes(upper)) {
    return false;
  }
  if (/^0+$/.test(str)) return false;
  return true;
}

export function cleanHepsiburadaMasterSku(sku: any): string {
  if (!sku) return '';
  let str = String(sku).trim().toLowerCase();
  // Strip trailing seller suffixes like -s, -v, -1, -2, -s1 attached to BS or HBC SKUs
  return str.replace(/-(s|v|1|2|3|s1|s2|m)$/i, '');
}

export function isHepsiburadaVariantSku(code: any): boolean {
  if (!code) return false;
  const upper = cleanHepsiburadaMasterSku(code).toUpperCase();
  return upper.startsWith('HBCV') || upper.startsWith('HBV');
}

export function isHepsiburadaMasterCatalogId(code: any): boolean {
  if (!code) return false;
  const str = cleanHepsiburadaMasterSku(code).toUpperCase();
  return str.startsWith('HBC') || str.startsWith('HB0') || str.startsWith('HB') || str.startsWith('BS');
}

export function isHepsiburadaValidProductUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http')) return false;
  if (trimmed.includes('/ara?')) return false;
  return trimmed.includes('hepsiburada.com');
}

/**
 * Strips any leaked/cross-tenant `?magaza=...` query parameter (such as legacy hardcoded
 * `magaza=Enrakipsiz`) unless the current store explicitly owns that seller name.
 */
export function sanitizeMarketplaceStoreParam(
  rawUrl: string,
  ownSellerName?: string | null
): string {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return '';
  const explicitSeller = String(ownSellerName || '').trim();
  try {
    const u = new URL(trimmed);
    const existingMagaza = u.searchParams.get('magaza');
    if (existingMagaza) {
      const existingNorm = existingMagaza.trim().toLowerCase();
      const ownNorm = explicitSeller.toLowerCase();
      // Remove legacy hardcoded 'enrakipsiz' unless this store explicitly configures it
      if (existingNorm === 'enrakipsiz' && ownNorm !== 'enrakipsiz') {
        u.searchParams.delete('magaza');
      } else if (ownNorm && existingNorm !== ownNorm) {
        u.searchParams.set('magaza', explicitSeller);
      }
    } else if (explicitSeller) {
      u.searchParams.set('magaza', explicitSeller);
    }
    return u.toString();
  } catch {
    // Fallback regex cleanup if URL parsing fails
    let cleaned = trimmed;
    if (!explicitSeller || explicitSeller.toLowerCase() !== 'enrakipsiz') {
      cleaned = cleaned
        .replace(/([?&])magaza=enrakipsiz(&|$)/i, (_m, sep, tail) => (sep === '?' && tail === '&' ? '?' : tail === '&' ? sep : ''))
        .replace(/[?&]$/, '');
    }
    return cleaned;
  }
}

/**
 * Builds the canonical, multi-tenant-isolated Hepsiburada product URL.
 * - Always prefers sellable Variant SKUs (HBCV... / HBV...) with `-p-UPPERCASE` (avoids 404 from parent `-pm-hbc0...`).
 * - Never hardcodes any store's `?magaza=` parameter (multi-tenant isolation).
 * - Only appends `?magaza=<ownSellerName>` when explicitly configured for the current store.
 */
export function buildHepsiburadaProductUrl(params: {
  name?: string | null;
  hepsiburadaSku?: string | null;
  productId?: string | null;
  directUrl?: string | null;
  fallbackSku?: string | null;
  barcode?: string | null;
  sellerName?: string | null;
  fallbackToSearch?: boolean;
}): string | null {
  const slug = slugifyText(params.name || '') || 'urun';
  const ownSeller = String(params.sellerName || '').trim();
  const sellerQuery = ownSeller ? `?magaza=${encodeURIComponent(ownSeller)}` : '';

  const candidateCodes = [
    params.hepsiburadaSku,
    params.productId,
  ]
    .map((c) => cleanHepsiburadaMasterSku(c).toUpperCase())
    .filter(Boolean);

  // Also check if directUrl already encodes a variant SKU (HBCV/HBV)
  const rawDirect = params.directUrl && isHepsiburadaValidProductUrl(params.directUrl)
    ? String(params.directUrl).trim()
    : null;
  const directVariantMatch = rawDirect ? rawDirect.match(/(?:-p-|\/)(HBCV[0-9A-Z]+|HBV[0-9A-Z]+)/i) : null;
  const variantSku =
    candidateCodes.find((c) => c.startsWith('HBCV') || c.startsWith('HBV')) ||
    (directVariantMatch ? directVariantMatch[1].toUpperCase() : null);

  // 1. Highest Priority: Live Variant SKU (HBCV... / HBV...) -> canonical `-p-HBCV...`
  //    Prevents 404 caused by legacy `-pm-hbc0...` parent IDs or cross-tenant `?magaza=Enrakipsiz` URLs.
  if (variantSku) {
    if (
      rawDirect &&
      new RegExp(`-p-${variantSku}(?:[/?#]|$)`, 'i').test(rawDirect) &&
      !/magaza=enrakipsiz/i.test(rawDirect)
    ) {
      return sanitizeMarketplaceStoreParam(rawDirect, ownSeller || null);
    }
    return `https://www.hepsiburada.com/${slug}-p-${variantSku}${sellerQuery}`;
  }

  // 2. Second Priority: Valid direct URL (sanitized against cross-tenant `?magaza=Enrakipsiz` and lowercase `-pm-`)
  if (rawDirect) {
    const pmMatch = rawDirect.match(/-pm-([a-z0-9]+)/i);
    if (pmMatch) {
      const upperPm = pmMatch[1].toUpperCase();
      if (upperPm.startsWith('HBCV') || upperPm.startsWith('HBV')) {
        return `https://www.hepsiburada.com/${slug}-p-${upperPm}${sellerQuery}`;
      }
      // If direct URL had broken lowercase -pm- or leaked magaza=Enrakipsiz, rebuild cleanly with uppercase -pm-
      if (/magaza=enrakipsiz/i.test(rawDirect) || pmMatch[1] !== upperPm) {
        return `https://www.hepsiburada.com/${slug}-pm-${upperPm}${sellerQuery}`;
      }
    }
    return sanitizeMarketplaceStoreParam(rawDirect, ownSeller || null);
  }

  // 3. Third Priority: Master Catalog ID (HBC..., HB0..., HB..., BS...) -> uppercase `-pm-`
  const masterSku = candidateCodes.find((c) => isHepsiburadaMasterCatalogId(c));
  if (masterSku) {
    return `https://www.hepsiburada.com/${slug}-pm-${masterSku}${sellerQuery}`;
  }

  // 4. Fourth Priority: BS Master SKU in product.sku or product_code
  const directBsSku = cleanHepsiburadaMasterSku(params.fallbackSku).toUpperCase();
  if (directBsSku && directBsSku.startsWith('BS')) {
    return `https://www.hepsiburada.com/${slug}-pm-${directBsSku}${sellerQuery}`;
  }

  if (params.fallbackToSearch === false) return null;

  // 5. Search Fallbacks: EAN Barcode -> Product Name
  if (isValidBarcode(params.barcode)) {
    return `https://www.hepsiburada.com/ara?q=${encodeURIComponent(String(params.barcode).trim())}`;
  }
  if (params.name && String(params.name).trim().length > 1) {
    return `https://www.hepsiburada.com/ara?q=${encodeURIComponent(String(params.name).trim())}`;
  }
  return null;
}

export function parseMarketplaceData(p: any): any {
  if (!p) return {};
  let mpData = p.marketplace_data;
  if (typeof mpData === 'string') {
    try {
      mpData = JSON.parse(mpData);
    } catch (e) {
      mpData = {};
    }
  }
  return (typeof mpData === 'object' && mpData !== null) ? mpData : {};
}

/**
 * Resolves the public customer listing URL for a product on a specific marketplace
 */
export function getMarketplaceListingUrl(
  arg1: any,
  arg2: any,
  options: MarketplaceUrlOptions = {}
): string | null {
  let marketplaceKey: string = '';
  let product: any = null;

  if (arg1 && typeof arg1 === 'object' && (arg2 === undefined || typeof arg2 === 'string')) {
    product = arg1;
    marketplaceKey = arg2 || 'hepsiburada';
  } else if (arg2 && typeof arg2 === 'object' && (typeof arg1 === 'string' || !arg1)) {
    marketplaceKey = arg1 || 'hepsiburada';
    product = arg2;
  } else {
    marketplaceKey = arg1;
    product = arg2;
  }

  if (!product) return null;
  const { fallbackToSearch = true, sellerName } = options;
  const mpData = parseMarketplaceData(product);
  const slug = slugifyText(product.name || '');

  const barcode = isValidBarcode(product.barcode) ? String(product.barcode).trim() : null;
  const name = product.name && String(product.name).trim().length > 1 ? String(product.name).trim() : null;

  const keyStr = String(marketplaceKey || '').toLowerCase();
  switch (keyStr) {
    case 'hepsiburada': {
      const hb = mpData.hepsiburada || {};
      const manualUrl = product.hepsiburada_url;
      const directUrl = hb.productUrl || hb.url;
      const effectiveDirectUrl = (manualUrl && isHepsiburadaValidProductUrl(manualUrl))
        ? manualUrl
        : (directUrl && isHepsiburadaValidProductUrl(directUrl) ? directUrl : null);

      const ownSeller = String(sellerName || hb.merchantName || hb.sellerName || '').trim();
      const safeOwnSeller = ownSeller && ownSeller.toLowerCase() !== 'enrakipsiz'
        ? ownSeller
        : (sellerName && String(sellerName).trim().toLowerCase() === 'enrakipsiz' ? String(sellerName).trim() : '');

      return buildHepsiburadaProductUrl({
        name: product.name,
        hepsiburadaSku: product.hepsiburada_sku || hb.hepsiburadaSku || hb.hbSku,
        productId: hb.productId,
        directUrl: effectiveDirectUrl,
        fallbackSku: product.sku || product.product_code,
        barcode: product.barcode,
        sellerName: safeOwnSeller || null,
        fallbackToSearch,
      });
    }

    case 'trendyol': {
      const ty = mpData.trendyol || {};
      if (
        !product.is_trendyol_active ||
        ty.status === 'PENDING_APPROVAL' ||
        ty.status === 'ERROR' ||
        ty.status === 'INACTIVE'
      ) {
        return null;
      }

      const directUrl = ty.productUrl || ty.url || product.trendyol_url;
      if (
        directUrl &&
        String(directUrl).startsWith('http') &&
        /-p-\d+/.test(String(directUrl)) &&
        !directUrl.includes('/sr?')
      ) {
        return String(directUrl).trim();
      }

      const tyId = product.trendyol_id || ty.contentId || ty.productCode;
      if (tyId && (String(tyId).match(/^\d+$/) || String(tyId).startsWith('p-'))) {
        const cleanId = String(tyId).replace(/^p-/, '');
        if (/^\d+$/.test(cleanId)) {
          return slug 
            ? `https://www.trendyol.com/${slug}-p-${cleanId}` 
            : `https://www.trendyol.com/-p-${cleanId}`;
        }
      }

      return null;
    }

    case 'amazon': {
      const amz = mpData.amazon || {};
      const rawDirectUrl = amz.productUrl || amz.url || product.amazon_url;
      const directUrl = (rawDirectUrl && String(rawDirectUrl).trim().toLowerCase() !== 'null' && String(rawDirectUrl).trim().toLowerCase() !== 'undefined') ? String(rawDirectUrl).trim() : null;
      if (directUrl && directUrl.startsWith('http') && directUrl.includes('amazon.') && !directUrl.includes('/s?')) {
        return directUrl;
      }

      const rawAsin = product.amazon_asin || amz.asin;
      if (rawAsin && String(rawAsin).trim().toLowerCase() !== 'null' && !String(rawAsin).startsWith('http')) {
        const cleanAsin = String(rawAsin).trim().toUpperCase();
        if (/^[A-Z0-9]{9,10}$/.test(cleanAsin)) {
          return `https://www.amazon.com.tr/dp/${cleanAsin}`;
        }
      }

      if (!fallbackToSearch) return null;

      if (barcode) {
        return `https://www.amazon.com.tr/s?k=${encodeURIComponent(barcode)}`;
      }
      if (name) {
        return `https://www.amazon.com.tr/s?k=${encodeURIComponent(name)}`;
      }
      return null;
    }

    case 'n11': {
      const n11Data = mpData.n11 || {};
      const explicitNick = String(sellerName || '').trim();
      const rawDataNick = String(n11Data.sellerNickname || '').trim();
      // Multi-tenant isolation: never fall back to hardcoded 'enrakipsiz' for other stores
      const sellerNick = explicitNick || (rawDataNick && rawDataNick.toLowerCase() !== 'enrakipsiz' ? rawDataNick : '');
      const sellerSuffix = sellerNick ? `?magaza=${encodeURIComponent(sellerNick)}` : '';

      if (
        !product.is_n11_active ||
        n11Data.status === 'PENDING' ||
        n11Data.status === 'PENDING_APPROVAL' ||
        n11Data.status === 'ERROR' ||
        n11Data.status === 'INACTIVE' ||
        String(n11Data.approvalStatus) === '5' ||
        String(n11Data.approvalStatus) === '8'
      ) {
        return null;
      }

      // N11 public /urun/{slug}-{id} URLs strictly require the N11 Catalog Group ID (groupId / n11CatalogGroupId / catalogId)
      const catalogGroupId = String(
        n11Data.n11CatalogGroupId ||
        n11Data.groupId ||
        n11Data.n11CatalogId ||
        n11Data.catalogId ||
        ''
      ).trim();

      if (catalogGroupId && /^\d+$/.test(catalogGroupId) && catalogGroupId !== '0') {
        const n11Slug = slugifyText(n11Data.title || product.name || '');
        return n11Slug
          ? `https://www.n11.com/urun/${n11Slug}-${catalogGroupId}${sellerSuffix}`
          : `https://www.n11.com/urun/${catalogGroupId}${sellerSuffix}`;
      }

      const directUrl = n11Data.productUrl || n11Data.url || product.n11_url;
      if (
        directUrl &&
        String(directUrl).startsWith('http') &&
        String(directUrl).includes('/urun/') &&
        !directUrl.includes('-PUBLISHED') &&
        !directUrl.endsWith('/PUBLISHED')
      ) {
        return sanitizeMarketplaceStoreParam(String(directUrl).trim(), sellerNick || null);
      }

      if (!fallbackToSearch) return null;

      if (barcode) {
        return `https://www.n11.com/arama?q=${encodeURIComponent(barcode)}`;
      }
      if (name) {
        return `https://www.n11.com/arama?q=${encodeURIComponent(name)}`;
      }
      return null;
    }

    case 'pazarama': {
      const pzr = mpData.pazarama || {};
      const directUrl = pzr.productUrl || pzr.url || product.pazarama_url;
      if (directUrl && String(directUrl).startsWith('http') && !directUrl.includes('/arama?')) {
        return directUrl;
      }

      const pzrId = product.pazarama_id || pzr.code || pzr.productId;
      if (pzrId && String(pzrId).trim().length >= 3) {
        return `https://www.pazarama.com/p-${String(pzrId).trim()}`;
      }

      if (!fallbackToSearch) return null;

      if (barcode) {
        return `https://www.pazarama.com/arama?q=${encodeURIComponent(barcode)}`;
      }
      if (name) {
        return `https://www.pazarama.com/arama?q=${encodeURIComponent(name)}`;
      }
      return null;
    }

    case 'ciceksepeti': {
      const cs = mpData.ciceksepeti || {};
      const directUrl = cs.productUrl || cs.url || product.ciceksepeti_url;
      if (directUrl && String(directUrl).startsWith('http') && !directUrl.includes('/arama?')) {
        return directUrl;
      }

      const csId = product.ciceksepeti_id || cs.productCode || cs.productId;
      if (csId && String(csId).trim().length >= 3) {
        return `https://www.ciceksepeti.com/p-${String(csId).trim()}`;
      }

      if (!fallbackToSearch) return null;

      if (barcode) {
        return `https://www.ciceksepeti.com/arama?query=${encodeURIComponent(barcode)}`;
      }
      if (name) {
        return `https://www.ciceksepeti.com/arama?query=${encodeURIComponent(name)}`;
      }
      return null;
    }

    default:
      return null;
  }
}

/**
 * Resolves the seller panel (Merchant Portal) URL for managing a product on a specific marketplace
 */
export function getMarketplaceMerchantPortalUrl(
  marketplaceKey: any,
  product: any
): string {
  const keyStr = String(marketplaceKey || '').toLowerCase();
  const barcode = isValidBarcode(product?.barcode) ? String(product.barcode).trim() : '';
  const sku = product?.sku || product?.product_code ? String(product.sku || product.product_code).trim() : '';
  const searchVal = barcode || sku;

  switch (keyStr) {
    case 'hepsiburada':
      return `https://merchant.hepsiburada.com/listing-management?merchantSku=${encodeURIComponent(searchVal)}`;
    case 'trendyol':
      return `https://partner.trendyol.com/products/inventory?barcode=${encodeURIComponent(searchVal)}`;
    case 'amazon':
      return `https://sellercentral.amazon.com.tr/inventory?q=${encodeURIComponent(searchVal)}`;
    case 'n11':
      return `https://so.n11.com/product/index?query=${encodeURIComponent(searchVal)}`;
    case 'pazarama':
      return `https://satici.pazarama.com/urun-yonetimi?q=${encodeURIComponent(searchVal)}`;
    case 'ciceksepeti':
      return `https://supplier.ciceksepeti.com/products?q=${encodeURIComponent(searchVal)}`;
    default:
      return '#';
  }
}
