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

  // Clothing / Apparel
  "beden": "size",
  "size": "size",
  "cinsiyet": "gender",
  "materyal": "material",

  // Camera & Security
  "kameracozunurluk": "camera_resolution",
  "cozunurluk": "camera_resolution",
  "kullanimalani": "usage_area",
  "gecegorus": "night_vision",
  "hareketalgilama": "motion_detection",
  "sesozelligi": "audio_support",
  "depolamadestegi": "storage_support"
};

/**
 * Normalizes any attribute ID or label to its canonical master key
 */
export function getCanonicalKey(rawKey: string): string {
  if (!rawKey) return "";
  const clean = String(rawKey).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return CANONICAL_ATTRIBUTE_ALIASES[clean] || clean;
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

  // 2. Extract from `marketplace_data` (Hepsiburada, Trendyol, Amazon, N11, Pazarama)
  let mpData = product.marketplace_data;
  if (typeof mpData === "string") {
    try {
      mpData = JSON.parse(mpData);
    } catch {
      mpData = {};
    }
  }

  if (mpData && typeof mpData === "object") {
    // Loop over each marketplace's stored attributes (hepsiburada, trendyol, amazon, n11, etc.)
    Object.keys(mpData).forEach((mpKey) => {
      const mpSlice = mpData[mpKey];
      const attrs = mpSlice?.attributes || (mpKey === "attributes" ? mpSlice : null);

      if (attrs && typeof attrs === "object") {
        Object.keys(attrs).forEach((attrId) => {
          const val = attrs[attrId];
          if (val && String(val).trim() !== "") {
            const canonicalKey = getCanonicalKey(attrId);
            const sourceLabel = mpKey === "hepsiburada" ? "Hepsiburada" 
              : mpKey === "trendyol" ? "Trendyol" 
              : mpKey === "amazon" ? "Amazon" 
              : mpKey === "n11" ? "N11" 
              : "Diğer Pazaryeri";

            // Save to pool if not present or replace with explicit marketplace entry
            pool[canonicalKey] = {
              value: String(val).trim(),
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
    const existingVal = hydratedAttributes[attrId];

    // If already explicitly filled for this marketplace, keep it
    if (existingVal && String(existingVal).trim() !== "") {
      return;
    }

    const canonicalKey = getCanonicalKey(attrId);
    const poolEntry = masterPool[canonicalKey];

    if (poolEntry && poolEntry.value) {
      hydratedAttributes[attrId] = poolEntry.value;
      autoFilledFields[attrId] = poolEntry.source;
    } else if (attr.defaultValue && typeof attr.defaultValue === "string") {
      // Dynamic $product template replacement if provided
      let def = attr.defaultValue;
      if (def.startsWith("$product.")) {
        const prop = def.replace("$product.", "");
        if (product && product[prop]) {
          hydratedAttributes[attrId] = String(product[prop]);
          autoFilledFields[attrId] = "Stok Kartı";
        }
      } else if (!def.startsWith("$")) {
        // Safe default value fallback
        hydratedAttributes[attrId] = def;
      }
    }
  });

  return { hydratedAttributes, autoFilledFields };
}
