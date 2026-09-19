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
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
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
  marketplaceKey: 'hepsiburada' | 'trendyol' | 'amazon' | 'n11' | 'pazarama' | 'ciceksepeti' | string,
  product: any,
  options: MarketplaceUrlOptions = {}
): string | null {
  if (!product) return null;
  const { fallbackToSearch = true } = options;
  const mpData = parseMarketplaceData(product);
  const slug = slugifyText(product.name || '');

  const barcode = isValidBarcode(product.barcode) ? String(product.barcode).trim() : null;
  const name = product.name && String(product.name).trim().length > 1 ? String(product.name).trim() : null;

  switch (marketplaceKey.toLowerCase()) {
    case 'hepsiburada': {
      const hb = mpData.hepsiburada || {};
      const directUrl = hb.productUrl || hb.url || product.hepsiburada_url;
      if (directUrl && String(directUrl).startsWith('http') && !directUrl.includes('/ara?')) {
        return directUrl;
      }

      // Check Catalog Product ID (starts with HBC or HBV)
      const hbProductId = hb.productId || hb.hepsiburadaSku || product.hepsiburada_sku;
      if (hbProductId && String(hbProductId).toUpperCase().startsWith('HB')) {
        const cleanPid = String(hbProductId).trim().toUpperCase();
        return slug 
          ? `https://www.hepsiburada.com/${slug}-pm-${cleanPid}` 
          : `https://www.hepsiburada.com/-pm-${cleanPid}`;
      }

      // Check direct catalog SKU in product.sku or product_code
      const directCatalogSku = (String(product.sku || '').toUpperCase().startsWith('HBC') ? product.sku : '') ||
                               (String(product.product_code || '').toUpperCase().startsWith('HBC') ? product.product_code : '');
      if (directCatalogSku) {
        const cleanPid = String(directCatalogSku).trim().toUpperCase();
        return slug 
          ? `https://www.hepsiburada.com/${slug}-pm-${cleanPid}` 
          : `https://www.hepsiburada.com/-pm-${cleanPid}`;
      }

      if (!fallbackToSearch) return null;

      // Search Fallback: Barcode -> Name (NEVER merchant SKU!)
      if (barcode) {
        return `https://www.hepsiburada.com/ara?q=${encodeURIComponent(barcode)}`;
      }
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
      const directUrl = amz.productUrl || amz.url || product.amazon_url;
      if (directUrl && String(directUrl).startsWith('http') && !directUrl.includes('/s?')) {
        return directUrl;
      }

      const asin = product.amazon_asin || amz.asin;
      if (asin && String(asin).trim().length >= 9) {
        const cleanAsin = String(asin).trim().toUpperCase();
        return `https://www.amazon.com.tr/dp/${cleanAsin}`;
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
      if (directUrl && String(directUrl).startsWith('http') && !directUrl.includes('/arama?')) {
        return directUrl;
      }

      const n11Id = product.n11_id || n11Data.productId || n11Data.id;
      if (n11Id && String(n11Id).trim().length >= 3) {
        const cleanN11Id = String(n11Id).trim();
        return slug 
          ? `https://www.n11.com/urun/${slug}-${cleanN11Id}` 
          : `https://www.n11.com/urun/${cleanN11Id}`;
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
  marketplaceKey: string,
  product: any
): string {
  const barcode = isValidBarcode(product?.barcode) ? String(product.barcode).trim() : '';
  const sku = product?.sku || product?.product_code ? String(product.sku || product.product_code).trim() : '';
  const searchVal = barcode || sku;

  switch (marketplaceKey.toLowerCase()) {
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
