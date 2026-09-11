/**
 * Marketplace & E-Stores Connection Utilities
 * 
 * Determines whether e-marketplaces (Hepsiburada, Trendyol, Amazon, Pazarama, N11)
 * are configured and connected ("xxx Hesabı Bağlı").
 * 
 * Strict rule: If an e-marketplace account is not connected, its features
 * must remain hidden in shopLP and across products.
 */

export interface ConnectedMarketplaces {
  hepsiburada: boolean;
  trendyol: boolean;
  amazon: boolean;
  pazarama: boolean;
  n11: boolean;
  hasAnyConnected: boolean;
}

export function getConnectedMarketplaces(branding: any): ConnectedMarketplaces {
  if (!branding) {
    return {
      hepsiburada: false,
      trendyol: false,
      amazon: false,
      pazarama: false,
      n11: false,
      hasAnyConnected: false,
    };
  }

  // 1. Hepsiburada ("HB Hesabı Bağlı")
  const hb = branding.hepsiburada_settings || {};
  const hepsiburada = Boolean(
    hb.connected === true ||
    (hb.merchantId && String(hb.merchantId).trim() !== "" && hb.apiSecret && String(hb.apiSecret).trim() !== "")
  );

  // 2. Trendyol ("Trendyol Hesabı Bağlı")
  const ty = branding.trendyol_settings || {};
  const trendyol = Boolean(
    ty.connected === true ||
    (ty.merchantId && String(ty.merchantId).trim() !== "" && ty.apiKey && String(ty.apiKey).trim() !== "" && ty.apiSecret && String(ty.apiSecret).trim() !== "")
  );

  // 3. Amazon ("Amazon Hesabı Bağlı")
  const amz = branding.amazon_settings || {};
  const amazon = Boolean(
    amz.connected === true ||
    (amz.refresh_token && String(amz.refresh_token).trim() !== "") ||
    (amz.clientId && String(amz.clientId).trim() !== "" && amz.sellerId && String(amz.sellerId).trim() !== "")
  );

  // 4. Pazarama ("Pazarama Hesabı Bağlı")
  const pz = branding.pazarama_settings || {};
  const pazarama = Boolean(
    pz.connected === true ||
    (pz.apiKey && String(pz.apiKey).trim() !== "" && pz.apiSecret && String(pz.apiSecret).trim() !== "")
  );

  // 5. N11 ("N11 Hesabı Bağlı")
  const n11 = branding.n11_settings || {};
  const n11Connected = Boolean(
    n11.connected === true ||
    (n11.appKey && String(n11.appKey).trim() !== "" && n11.appSecret && String(n11.appSecret).trim() !== "")
  );

  return {
    hepsiburada,
    trendyol,
    amazon,
    pazarama,
    n11: n11Connected,
    hasAnyConnected: hepsiburada || trendyol || amazon || pazarama || n11Connected,
  };
}
