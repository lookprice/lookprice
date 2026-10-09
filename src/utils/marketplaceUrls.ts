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
    .replace(/-+/g, '-');
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
  const { fallbackToSearch = true } = options;
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
      const sellerParam = '?magaza=Enrakipsiz';

      // 1. Highest Priority: Direct full URL (explicitly set by operator or synced from HB)
      const effectiveDirectUrl = (manualUrl && isHepsiburadaValidProductUrl(manualUrl))
        ? manualUrl
        : (directUrl && isHepsiburadaValidProductUrl(directUrl) ? directUrl : null);

      if (effectiveDirectUrl) {
        let clean = effectiveDirectUrl.trim();
        if (!clean.includes('magaza=') && clean.includes('hepsiburada.com')) {
          clean = clean.includes('?') ? `${clean}&magaza=Enrakipsiz` : `${clean}${sellerParam}`;
        }
        return clean;
      }

      // 2. Second Priority: Explicit Hepsiburada SKU / Product ID (locked by operator or catalog)
      const hbProductId = product.hepsiburada_sku || hb.productId || hb.hepsiburadaSku;
      const cleanPid = cleanHepsiburadaMasterSku(hbProductId);

      if (cleanPid) {
        const upperPid = cleanPid.toUpperCase();
        // Variant SKUs start with HBCV or HBV -> use -p-
        if (upperPid.startsWith('HBCV') || upperPid.startsWith('HBV')) {
          return `https://www.hepsiburada.com/${slug || 'urun'}-p-${upperPid}${sellerParam}`;
        }
        // Master Catalog IDs (HBC..., HB..., BS...) -> use -pm-
        return `https://www.hepsiburada.com/${slug || 'urun'}-pm-${upperPid}${sellerParam}`;
      }

      // 3. Third Priority: BS Master SKU in product.sku or product_code
      const directBsSku = cleanHepsiburadaMasterSku(product.sku || product.product_code);
      if (directBsSku && directBsSku.toUpperCase().startsWith('BS')) {
        return `https://www.hepsiburada.com/${slug || 'urun'}-pm-${directBsSku.toUpperCase()}${sellerParam}`;
      }

      if (!fallbackToSearch) return null;

      // 4. Search Fallback: EAN Barcode (ONLY if no direct URL or HB SKU exists)
      if (barcode) {
        return `https://www.hepsiburada.com/ara?q=${encodeURIComponent(barcode)}`;
      }

      // 5. Final Search Fallback: Product Name
      if (name) {
        return `https://www.hepsiburada.com/ara?q=${encodeURIComponent(name)}`;
      }
      return null;
    }

    case 'trendyol': {
      const ty = mpData.trendyol || {};
      const directUrl = ty.productUrl || ty.url || product.trendyol_url;
      if (directUrl && String(directUrl).startsWith('http') && !directUrl.includes('/sr?')) {
        return directUrl;
      }

      const tyId = product.trendyol_id || ty.contentId || ty.pimCategoryId || ty.productCode;
      if (tyId && (String(tyId).match(/^\d+$/) || String(tyId).startsWith('p-'))) {
        const cleanId = String(tyId).replace(/^p-/, '');
        return slug 
          ? `https://www.trendyol.com/${slug}-p-${cleanId}` 
          : `https://www.trendyol.com/-p-${cleanId}`;
      }

      if (!fallbackToSearch) return null;

      if (barcode) {
        return `https://www.trendyol.com/sr?q=${encodeURIComponent(barcode)}`;
      }
      if (name) {
        return `https://www.trendyol.com/sr?q=${encodeURIComponent(name)}`;
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
      const directUrl = n11Data.productUrl || n11Data.url || product.n11_url;
      if (directUrl && String(directUrl).startsWith('http') && String(directUrl).includes('/urun/') && !directUrl.includes('-PUBLISHED') && !directUrl.endsWith('/PUBLISHED')) {
        let finalUrl = String(directUrl).trim();
        if (!finalUrl.includes('?magaza=') && !finalUrl.includes('&magaza=')) {
          finalUrl = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}magaza=enrakipsiz`;
        }
        return finalUrl;
      }

      const catalogId = n11Data.n11CatalogId || n11Data.catalogId || n11Data.n11CatalogGroupId;
      const n11Id = catalogId || product.n11_id || n11Data.productId || n11Data.id || n11Data.n11Id;
      if (n11Id && /^\d+$/.test(String(n11Id).trim()) && String(n11Id).trim() !== '0') {
        const cleanN11Id = String(n11Id).trim();
        const n11Slug = slugifyText(n11Data.title || product.name || '');
        return n11Slug 
          ? `https://www.n11.com/urun/${n11Slug}-${cleanN11Id}?magaza=enrakipsiz` 
          : `https://www.n11.com/urun/${cleanN11Id}?magaza=enrakipsiz`;
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
