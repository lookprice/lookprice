/**
 * Universal Cross-Marketplace Attribute Mapper Service (CTO Standard)
 * Enables "Define Once, Auto-Populate Across All Marketplaces" (Hepsiburada, Trendyol, Amazon, N11, Pazarama).
 */

// Synonym dictionary mapping marketplace specific field IDs/names to canonical keys
const CANONICAL_ATTRIBUTE_ALIASES: Record<string, string> = {
  // Brand
  "marka": "brand",
  "brand": "brand",
  "brand_name": "brand",
  "manufacturer": "brand",
  "uretici": "brand",

  // Model
  "model": "model",
  "model_kodu": "model",
  "modelkodu": "model",

  // Color
  "renk": "color",
  "color": "color",
  "kasa_rengi": "color",
  "kordon_rengi": "color",

  // Power / Wattage
  "gucwatt": "power_watt",
  "guc_watt": "power_watt",
  "güç (w)": "power_watt",
  "guc": "power_watt",
  "wattage": "power_watt",
  "watt": "power_watt",

  // Voltage
  "voltajv": "voltage_v",
  "voltaj": "voltage_v",
  "cikis_voltaji": "voltage_v",

  // Amperage
  "akımamper": "amperage",
  "akim_amper": "amperage",
  "amper": "amperage",

  // Warranty
  "garantisuresi": "warranty_months",
  "garanti_suresi": "warranty_months",
  "garanti süresi": "warranty_months",
  "warranty_length": "warranty_months",

  // VAT Rate
  "tax_vat_rate": "vat_rate",
  "kdv_orani": "vat_rate",
  "kdv oranı (%)": "vat_rate",
  "vat_rate": "vat_rate",

  // Origin Country
  "mensei": "origin_country",
  "mensei_ulke": "origin_country",
  "menşei ülke": "origin_country",
  "origin_country": "origin_country",

  // Compatible Brand / Model
  "uyumlumarka": "compatible_brand",
  "uyumlu_marka": "compatible_brand",
  "uyumlu_telefon_markasi": "compatible_brand",
  "uyumlu_arac_markasi": "compatible_brand",
  "uyumlumodel": "compatible_model",
  "uyumlu_model": "compatible_model",

  // Connection / Interface
  "baglantitipi": "connection_type",
  "baglanti": "connection_type",
  "girisarabirimi": "input_interface",
  "cikisportlari": "output_ports",
  "portsayisi": "port_count",

  // Screen Size & Storage
  "ekranboyutu": "screen_size",
  "dahilihafiza": "storage_capacity",
  "ramkapasitesi": "ram_capacity",
  "isletimsistemi": "operating_system",

  // Clothing / Apparel & Common Attributes
  "beden": "size",
  "size": "size",
  "cinsiyet": "gender",
  "materyal": "material",
  "garantitipi": "warranty_type",
  "garanti_tipi": "warranty_type",
  "yasgrubu": "age_group",
  "yas_grubu": "age_group",
  "ortam": "occasion",
  "desen": "pattern",
  "kumasozelligi": "fabric_feature",
  "kalip": "fit",
  "koltipi": "sleeve_type",
  "yakatipi": "collar_type",
  "kapatma": "closure_type",
  "sezon": "season",

  // Camera & Security
  "kameracozunurluk": "camera_resolution",
  "cozunurluk": "camera_resolution",
  "kullanimalani": "usage_area",
  "gecegorus": "night_vision",
  "hareketalgilama": "motion_detection",
  "sesozelligi": "audio_support",
  "depolamadestegi": "storage_support",

  // Home Decoration & Textile & Storage & Organizers
  "uruntipi": "product_type",
  "urun_tipi": "product_type",
  "tekstiltipi": "textile_type",
  "tekstil_tipi": "textile_type",
  "kumasturu": "fabric_type",
  "kumas_turu": "fabric_type",
  "kumastipi": "fabric_type",
  "kumas": "fabric_type",
  "ebatboyut": "dimensions",
  "ebat_boyut": "dimensions",
  "ebat": "dimensions",
  "boyut": "dimensions",
  "boyutebat": "dimensions",
  "boyut_ebat": "dimensions",
  "organizertipi": "organizer_type",
  "organizer_tipi": "organizer_type",
  "bolmesayisi": "compartments_count",
  "bolme_sayisi": "compartments_count",
  "saklamatipi": "storage_type",
  "saklama_tipi": "storage_type",
  "hacimkapasite": "capacity_volume",
  "hacim_kapasite": "capacity_volume",
  "kapakozelligi": "lid_type",
  "kapak_ozelligi": "lid_type",
  "malzeme": "material",
  "tema": "theme_style",
  "stil": "theme_style"
};

function transliterateTurkish(str: string): string {
  return String(str)
    .replace(/Ğ/g, "g").replace(/ğ/g, "g")
    .replace(/Ü/g, "u").replace(/ü/g, "u")
    .replace(/Ş/g, "s").replace(/ş/g, "s")
    .replace(/İ/g, "i").replace(/I/g, "i").replace(/ı/g, "i")
    .replace(/Ö/g, "o").replace(/ö/g, "o")
    .replace(/Ç/g, "c").replace(/ç/g, "c");
}

/**
 * Normalizes any attribute ID or label to its canonical master key
 */
export function getCanonicalKey(rawKey: string): string {
  if (!rawKey) return "";
  const transliterated = transliterateTurkish(String(rawKey).trim()).toLowerCase();
  const clean = transliterated.replace(/[^a-z0-9]/g, "");
  return CANONICAL_ATTRIBUTE_ALIASES[clean] || clean;
}

/**
 * Unwraps stored attribute entries whether plain scalar or { mode, value } objects
 */
export function unwrapMarketplaceAttrValue(raw: any): string {
  if (raw === undefined || raw === null) return "";
  if (typeof raw === "object") {
    if (Array.isArray(raw)) return raw.filter(Boolean).join(", ");
    const v = raw.value !== undefined ? raw.value : raw.label;
    if (v === undefined || v === null) return "";
    const str = String(v).trim();
    if (str.startsWith("$product.")) return "";
    return str;
  }
  const str = String(raw).trim();
  if (str.startsWith("$product.")) return "";
  return str;
}

/**
 * Removes sibling keys that map to the same canonical attribute key as keepKey
 */
export function pruneCanonicalAliases(attrs: Record<string, any> | undefined | null, keepKey: string): Record<string, any> {
  if (!attrs || typeof attrs !== "object") return {};
  const result: Record<string, any> = { ...attrs };
  const targetCanonical = getCanonicalKey(keepKey);
  if (!targetCanonical) return result;
  const isPureNumericTarget = /^\d+$/.test(String(keepKey).trim());

  Object.keys(result).forEach((k) => {
    if (k === keepKey) return;
    if (k.toLowerCase() === keepKey.toLowerCase()) {
      delete result[k];
      return;
    }
    if (!isPureNumericTarget && !/^\d+$/.test(k.trim()) && getCanonicalKey(k) === targetCanonical) {
      delete result[k];
    }
  });
  return result;
}

/**
 * Extracts a Master Attribute Pool from all existing marketplace data & base product attributes
 */
export function extractMasterAttributePool(product: any): Record<string, { value: string; source: string }> {
  const pool: Record<string, { value: string; source: string }> = {};

  if (!product) return pool;

  // 1. Base Product Attributes (Highest Baseline Priority)
  if (product.brand) {
    pool["brand"] = { value: String(product.brand).trim(), source: "Stok Kartı (Marka)" };
  }
  if (product.model) {
    pool["model"] = { value: String(product.model).trim(), source: "Stok Kartı (Model)" };
  }
  if (product.vat_rate !== undefined && product.vat_rate !== null) {
    pool["vat_rate"] = { value: `${product.vat_rate}`, source: "Stok Kartı (KDV)" };
  }
  if (product.color) {
    pool["color"] = { value: String(product.color).trim(), source: "Stok Kartı (Renk)" };
  }
  if (product.origin_country) {
    pool["origin_country"] = { value: String(product.origin_country).trim(), source: "Stok Kartı (Menşei)" };
  }

  // 2. Extract from `marketplace_data` in strict lowest-to-highest priority order
  // so primary explicit attributes ('attributes', 'hepsiburada') are never overwritten by stale secondary slices.
  let mpData = product.marketplace_data;
  if (typeof mpData === "string") {
    try {
      mpData = JSON.parse(mpData);
    } catch {
      mpData = {};
    }
  }

  if (mpData && typeof mpData === "object") {
    const orderedKeys = ["pazarama", "amazon", "n11", "trendyol", "hepsiburada", "attributes"];
    const remainingKeys = Object.keys(mpData).filter((k) => !orderedKeys.includes(k));
    const scanOrder = [...remainingKeys, ...orderedKeys.filter((k) => k in mpData)];

    scanOrder.forEach((mpKey) => {
      const mpSlice = mpData[mpKey];
      const attrs = mpSlice?.attributes || (mpKey === "attributes" ? mpSlice : null);

      if (attrs && typeof attrs === "object") {
        Object.keys(attrs).forEach((attrId) => {
          const cleanVal = unwrapMarketplaceAttrValue(attrs[attrId]);
          if (cleanVal !== "") {
            const canonicalKey = getCanonicalKey(attrId);
            const sourceLabel = mpKey === "hepsiburada" ? "Hepsiburada"
              : mpKey === "trendyol" ? "Trendyol"
              : mpKey === "amazon" ? "Amazon"
              : mpKey === "n11" ? "N11"
              : mpKey === "pazarama" ? "Pazarama"
              : "Ürün Nitelikleri";

            pool[canonicalKey] = {
              value: cleanVal,
              source: `${sourceLabel} (${attrId})`
            };
          }
        });
      }
    });
  }

  return pool;
}

/**
 * Auto-hydrates target marketplace attributes using Master Pool & Smart Fallbacks
 */
export function autoHydrateTargetAttributes(
  targetMarketplace: string,
  targetSchemaAttributes: any[],
  existingTargetAttributes: Record<string, any>,
  product: any
): {
  hydratedAttributes: Record<string, any>;
  autoFilledFields: Record<string, string>; // Maps attrId to Source Name for UI Badge rendering
} {
  const masterPool = extractMasterAttributePool(product);
  const hydratedAttributes: Record<string, any> = { ...existingTargetAttributes };
  const autoFilledFields: Record<string, string> = {};

  if (!Array.isArray(targetSchemaAttributes)) {
    return { hydratedAttributes, autoFilledFields };
  }

  targetSchemaAttributes.forEach((attr) => {
    const attrId = attr.id || attr.name;
    const rawExisting = hydratedAttributes[attrId];

    // Respect deliberate empty clear ("") as an explicit user override
    if (rawExisting === "") {
      return;
    }

    const existingVal = unwrapMarketplaceAttrValue(rawExisting);
    if (existingVal !== "") {
      hydratedAttributes[attrId] = existingVal;
      return;
    }

    const canonicalKey = getCanonicalKey(attrId);
    const poolEntry = masterPool[canonicalKey];

    if (poolEntry && poolEntry.value) {
      hydratedAttributes[attrId] = poolEntry.value;
      autoFilledFields[attrId] = poolEntry.source;
    } else if (attr.defaultValue && typeof attr.defaultValue === "string") {
      let def = attr.defaultValue;
      if (def.startsWith("$product.")) {
        const prop = def.replace("$product.", "");
        if (product && product[prop]) {
          hydratedAttributes[attrId] = String(product[prop]);
          autoFilledFields[attrId] = "Stok Kartı";
        }
      } else if (!def.startsWith("$")) {
        hydratedAttributes[attrId] = def;
      }
    }
  });

  return { hydratedAttributes, autoFilledFields };
}
