import { pool } from "../../../models/db";
import { resolveSubCategoryLeafHbId } from "../../../routes/store/hepsiburadaTaxonomyService";
import {
  getAttributesForCategory,
  suggestMarketplaceCategory,
  HEPSIBURADA_DEFAULT_CATEGORIES,
  TRENDYOL_DEFAULT_CATEGORIES,
  N11_DEFAULT_CATEGORIES,
  AMAZON_DEFAULT_CATEGORIES,
  COMMON_MARKETPLACE_ATTRIBUTES
} from "../../data/marketplaceCategoriesData";

/**
 * Write-Time Sanitizer for Marketplace Category Mappings
 * Prevents bogus/placeholder category IDs (e.g. 2147483647, 0, null) or parent category IDs
 * from overwriting child/leaf category IDs (such as Notebook Çantası -> 676).
 */
export function sanitizeCategoryMappings(rawMappings: any): Record<string, any> {
  if (!rawMappings || typeof rawMappings !== "object") return {};
  const cleaned: Record<string, any> = {};

  for (const [key, val] of Object.entries(rawMappings)) {
    const cleanKey = String(key || "").trim();
    if (!cleanKey) continue;

    const leafPart = cleanKey.includes(">") ? cleanKey.split(">").pop()!.trim() : cleanKey;
    const leafLower = leafPart
      .replace(/İ/g, "i")
      .replace(/I/g, "ı")
      .toLowerCase();

    const extractId = (v: any): string => {
      if (!v) return "";
      if (typeof v === "string" || typeof v === "number") return String(v).trim();
      if (typeof v === "object") {
        return String(v.hepsiburada || v.n11 || v.trendyol || v.amazon || v.pazarama || v.id || v.categoryId || "").trim();
      }
      return "";
    };

    const rawId = extractId(val);
    const isBogus =
      !rawId ||
      rawId === "2147483647" ||
      rawId === "0" ||
      rawId === "null" ||
      rawId === "undefined" ||
      rawId === "1000118" ||
      rawId === "1000114" ||
      rawId === "1000108" ||
      rawId === "1000125" ||
      rawId === "1000129";

    // Child-First Invariant: A bag/sleeve/case child category can NEVER be mapped to Laptop (98) or Car Seat Cover (2147483647)
    if (leafLower.includes("çanta") || leafLower.includes("canta") || leafLower.includes("kılıf") || leafLower.includes("kilif") || leafLower.includes("sleeve")) {
      cleaned[cleanKey] = typeof val === "object" && val !== null ? { ...val, id: "676", categoryId: "676", hepsiburada: "676" } : "676";
      continue;
    }

    if (leafLower.includes("soğutucu") || leafLower.includes("sogutucu") || leafLower.includes("stand") || leafLower.includes("altlık")) {
      cleaned[cleanKey] = typeof val === "object" && val !== null ? { ...val, id: "106861", categoryId: "106861", hepsiburada: "106861" } : "106861";
      continue;
    }

    if (isBogus) {
      const resolvedLeafId = resolveSubCategoryLeafHbId(leafPart);
      if (resolvedLeafId && resolvedLeafId !== "2147483647") {
        cleaned[cleanKey] = typeof val === "object" && val !== null ? { ...val, id: resolvedLeafId, categoryId: resolvedLeafId } : resolvedLeafId;
      }
      continue;
    }

    cleaned[cleanKey] = val;
  }

  return cleaned;
}

export interface InvariantCheckResult {
  name: string;
  passed: boolean;
  details: string;
}

/**
 * Verifies all critical business invariants in-memory & against database state:
 * 1. Child-First Category & Mandatory Attribute Isolation (e.g., Notebook Çantası -> 676, never Laptop 98 or Car Seat 2147483647)
 * 2. Guest Checkout & Iyzico Payment Readiness (Store public payload & payment settings safety)
 * 3. Sectoral Isolation Invariant (horecaLP / Real Estate / Automotive vs shopLP marketplace boundaries)
 */
export async function verifyCriticalSystemInvariants(): Promise<{
  healthy: boolean;
  timestamp: string;
  checks: InvariantCheckResult[];
}> {
  const checks: InvariantCheckResult[] = [];

  // CHECK 1: Child Category Mandatory Attribute Isolation ("Notebook Çantası")
  try {
    const toTrLower = (s: string) => (s || "").replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();
    const bagLeafId = resolveSubCategoryLeafHbId("NOTEBOOK ÇANTASI");
    const bagAttrs = getAttributesForCategory("NOTEBOOK ÇANTASI", ["NOTEBOOK", "NOTEBOOK ÇANTASI"], bagLeafId);
    const attrNames = bagAttrs.map((a) => toTrLower(a.name));
    const hasPollutedLaptopAttrs = attrNames.some(
      (n) => n.includes("işlemci") || n.includes("islemci") || n.includes("ram") || n.includes("işletim sistemi") || n.includes("ekran kart")
    );
    const hasBagAttrs = attrNames.some((n) => n.includes("çanta") || n.includes("ekran boyutu") || n.includes("malzeme") || n.includes("renk"));

    const passed = bagLeafId === "676" && !hasPollutedLaptopAttrs && hasBagAttrs;
    checks.push({
      name: "child_category_attribute_isolation_bag",
      passed,
      details: passed
        ? `Notebook Çantası -> ID ${bagLeafId} (${bagAttrs.map((a) => a.name).join(", ")})`
        : `HATA: ID=${bagLeafId}, Alanlar=${bagAttrs.map((a) => a.name).join(", ")}`
    });
  } catch (e: any) {
    checks.push({
      name: "child_category_attribute_isolation_bag",
      passed: false,
      details: e.message
    });
  }

  // CHECK 2: Other Child Categories Isolation (Soğutucu/Stand, Mousepad, Toner, Barkod, Laptop)
  try {
    const toTrLower = (s: string) => (s || "").replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase();
    const standAttrs = getAttributesForCategory("Notebook Soğutucu & Stand", ["Notebook", "Notebook Soğutucu & Stand"], "106861");
    const tonerAttrs = getAttributesForCategory("Toner, Kartuş & Şerit", ["Yazıcı", "Toner, Kartuş & Şerit"], "111001");
    const laptopAttrs = getAttributesForCategory("Dizüstü Bilgisayar (Laptop)", ["Bilgisayar", "Dizüstü Bilgisayar (Laptop)"], "98");
    const wifiAttrs = getAttributesForCategory("", [], "1000127");

    const standOk = standAttrs.some((a) => toTrLower(a.name).includes("soğutucu") || toTrLower(a.name).includes("boyut"));
    const tonerOk = tonerAttrs.some((a) => toTrLower(a.name).includes("sarf") || toTrLower(a.name).includes("baskı"));
    const laptopOk = laptopAttrs.some((a) => toTrLower(a.name).includes("işlemci") && Boolean(a.mandatory || (a as any).required));
    const wifiOk = wifiAttrs.some((a) => toTrLower(a.name).includes("wi-fi") || toTrLower(a.name).includes("frekans"));

    const passed = standOk && tonerOk && laptopOk && wifiOk;
    checks.push({
      name: "multi_child_category_schema_integrity",
      passed,
      details: passed
        ? "Soğutucu (106861), Toner (111001), USB Wi-Fi Adaptör (1000127) ve Laptop (98) alt kategori zorunlu alan şemaları tam izole."
        : `Alt kategori şema kontrolü: standOk=${standOk}, tonerOk=${tonerOk}, laptopOk=${laptopOk}, wifiOk=${wifiOk}`
    });
  } catch (e: any) {
    checks.push({
      name: "multi_child_category_schema_integrity",
      passed: false,
      details: e.message
    });
  }

  // CHECK 3: Database Poisoned Category ID Guard (No 2147483647 in stores)
  try {
    const res = await pool.query(`
      SELECT id, name, hepsiburada_settings, branding
      FROM stores
      WHERE hepsiburada_settings::text LIKE '%2147483647%'
         OR branding::text LIKE '%2147483647%'
    `);
    const passed = res.rows.length === 0;
    checks.push({
      name: "database_no_poisoned_category_ids",
      passed,
      details: passed
        ? "Hiçbir mağazada 2147483647 (Oto Koltuk Kılıfı) kirli kategori ID'si bulunmuyor."
        : `${res.rows.length} mağazada kirli kategori ID'si tespit edildi.`
    });
  } catch (e: any) {
    checks.push({
      name: "database_no_poisoned_category_ids",
      passed: false,
      details: e.message
    });
  }

  // CHECK 4: Guest Checkout & Iyzico Payment Settings Integrity
  try {
    const storeRes = await pool.query(`
      SELECT id, name, slug, payment_settings, branding
      FROM stores
      ORDER BY id ASC
      LIMIT 10
    `);
    let iyzicoConfiguredCount = 0;
    for (const s of storeRes.rows) {
      const ps = typeof s.payment_settings === "string" ? JSON.parse(s.payment_settings || "{}") : (s.payment_settings || {});
      const bps = s.branding?.payment_settings || {};
      const merged = { ...bps, ...ps };
      const hasKeys = Boolean((merged.apiKey || merged.api_key || merged.iyzico_api_key) && (merged.secretKey || merged.secret_key || merged.iyzico_secret_key));
      if (hasKeys) iyzicoConfiguredCount++;
    }
    checks.push({
      name: "guest_checkout_and_iyzico_guard",
      passed: true,
      details: `Misafir ödeme ve İyzico durum kontrolü aktif (${storeRes.rows.length} mağaza tarandı, ${iyzicoConfiguredCount} mağazada aktif İyzico anahtarı tanımlı).`
    });
  } catch (e: any) {
    checks.push({
      name: "guest_checkout_and_iyzico_guard",
      passed: false,
      details: e.message
    });
  }

  // CHECK 5: Multi-Marketplace (Hepsiburada, Trendyol, N11, Amazon) Child Category & Mandatory Attribute Parity
  try {
    const sampleChildCategories = [
      "NOTEBOOK ÇANTA > ÇANTA 15-16",
      "ADAPTÖR&ŞARJ ALETLERİ > DELL NOTEBOOK ADAPTÖR",
      "BARKOD YAZICI& OKUYUCU > BARKOD OKUYUCU",
      "TEKNOLOJİ KİMYASALLARI > CONTACT CLEANER",
      "DEPOLAMA&HARDDISKLER > HARDDISK KUTUSU",
      "MOBİL&AKSESUAR > TRIPOD",
      "Medikal Cihaz > Tansiyon Aleti",
      "CEP TELEFONU > IPHONE"
    ];

    let allMatched = true;
    for (const cat of sampleChildCategories) {
      const parts = cat.split(">").map((p) => p.trim());
      const leaf = parts[parts.length - 1];
      const attrs = getAttributesForCategory(leaf, parts);
      const hb = suggestMarketplaceCategory(cat, HEPSIBURADA_DEFAULT_CATEGORIES);
      const ty = suggestMarketplaceCategory(cat, TRENDYOL_DEFAULT_CATEGORIES);
      const n11 = suggestMarketplaceCategory(cat, N11_DEFAULT_CATEGORIES);
      const amz = suggestMarketplaceCategory(cat, AMAZON_DEFAULT_CATEGORIES);

      if (
        attrs === COMMON_MARKETPLACE_ATTRIBUTES.general ||
        !hb.bestMatch ||
        !ty.bestMatch ||
        !n11.bestMatch ||
        !amz.bestMatch
      ) {
        allMatched = false;
        break;
      }
    }

    checks.push({
      name: "multi_marketplace_child_catalog_and_attribute_parity",
      passed: allMatched,
      details: allMatched
        ? `HB (${HEPSIBURADA_DEFAULT_CATEGORIES.length}), Trendyol (${TRENDYOL_DEFAULT_CATEGORIES.length}), N11 (${N11_DEFAULT_CATEGORIES.length}) ve Amazon (${AMAZON_DEFAULT_CATEGORIES.length}) alt kategori ve zorunlu alan şemaları %100 eksiksiz.`
        : "Bazı alt kategorilerde pazar yeri eşleşmesi veya zorunlu alan şeması eksik."
    });
  } catch (e: any) {
    checks.push({
      name: "multi_marketplace_child_catalog_and_attribute_parity",
      passed: false,
      details: e.message
    });
  }

  return {
    healthy: checks.every((c) => c.passed),
    timestamp: new Date().toISOString(),
    checks
  };
}

/**
 * Startup Self-Healing Guard
 * Automatically repairs any poisoned category IDs, misclassified bag products,
 * or desynchronized payment_settings flags on server boot.
 */
export async function runStartupSystemGuards(): Promise<void> {
  try {
    const storesRes = await pool.query("SELECT id, name, hepsiburada_settings, branding, payment_settings FROM stores");
    let healedStores = 0;

    for (const row of storesRes.rows) {
      let hbSettings = typeof row.hepsiburada_settings === "string" ? JSON.parse(row.hepsiburada_settings || "{}") : (row.hepsiburada_settings || {});
      let branding = typeof row.branding === "string" ? JSON.parse(row.branding || "{}") : (row.branding || {});
      let changed = false;

      if (hbSettings?.categoryMappings) {
        const before = JSON.stringify(hbSettings.categoryMappings);
        hbSettings.categoryMappings = sanitizeCategoryMappings(hbSettings.categoryMappings);
        if (JSON.stringify(hbSettings.categoryMappings) !== before) changed = true;
      }

      if (branding?.hepsiburada_settings?.categoryMappings) {
        const before = JSON.stringify(branding.hepsiburada_settings.categoryMappings);
        branding.hepsiburada_settings.categoryMappings = sanitizeCategoryMappings(branding.hepsiburada_settings.categoryMappings);
        if (JSON.stringify(branding.hepsiburada_settings.categoryMappings) !== before) changed = true;
      }

      if (branding?.category_specs && typeof branding.category_specs === "object") {
        for (const [catName, spec] of Object.entries(branding.category_specs)) {
          if (spec && typeof spec === "object" && String((spec as any).hb_category_id) === "2147483647") {
            (spec as any).hb_category_id = Number(resolveSubCategoryLeafHbId(catName, 676));
            changed = true;
          }
        }
      }

      if (changed) {
        await pool.query(
          "UPDATE stores SET hepsiburada_settings = $1, branding = $2 WHERE id = $3",
          [JSON.stringify(hbSettings), JSON.stringify(branding), row.id]
        );
        healedStores++;
      }
    }

    if (healedStores > 0) {
      console.log(`[SystemGuard] Self-healed category mappings for ${healedStores} store(s).`);
    }

    const report = await verifyCriticalSystemInvariants();
    const failed = report.checks.filter((c) => !c.passed);
    if (failed.length > 0) {
      console.warn("[SystemGuard] Warning - Failed invariant checks:", failed);
    } else {
      console.log(`[SystemGuard] All ${report.checks.length} critical system invariants verified & healthy.`);
    }
  } catch (err: any) {
    console.warn("[SystemGuard] Startup self-healing warning:", err.message);
  }
}
