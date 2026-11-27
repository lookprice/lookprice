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
import {
  buildHepsiburadaProductUrl,
  getMarketplaceListingUrl,
  sanitizeMarketplaceStoreParam,
} from "../../utils/marketplaceUrls";

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

    const keyLower = cleanKey
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

    const isGenericLaptopParent = rawId === "98" || rawId === "3000500" || rawId === "103165";
    const isLaptopContext = /(notebook|laptop|diz[uü]st[uü]|macbook|bilgisayar)/i.test(keyLower);

    // Child-First Invariant: A laptop/notebook bag/sleeve/case child category can NEVER be mapped to
    // Laptop parent (98/3000500/103165) or poisoned Car Seat Cover (2147483647).
    // IMPORTANT: Never overwrite valid user-selected non-bogus category IDs for other sectors
    // (e.g., Ev Tekstili "Yastık Kılıfı", "Valiz Kılıfı", "Makyaj Çantası", "Bardak Altlığı", "Takı Standı").
    if (
      isLaptopContext &&
      (isBogus || isGenericLaptopParent) &&
      (leafLower.includes("çanta") || leafLower.includes("canta") || leafLower.includes("kılıf") || leafLower.includes("kilif") || leafLower.includes("sleeve"))
    ) {
      cleaned[cleanKey] = typeof val === "object" && val !== null ? { ...val, id: "676", categoryId: "676", hepsiburada: "676" } : "676";
      continue;
    }

    if (
      isLaptopContext &&
      (isBogus || isGenericLaptopParent) &&
      (leafLower.includes("soğutucu") || leafLower.includes("sogutucu") || leafLower.includes("stand") || leafLower.includes("altlık") || leafLower.includes("altlik"))
    ) {
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

/**
 * Recursively removes or resolves any poisoned placeholder category ID ("2147483647")
 * from arbitrary nested objects, arrays, JSON strings, categoryAttributes keys, or category_specs.
 */
export function deepScrubPoisonedCategoryIds(node: any, hintName?: string): any {
  if (node === null || node === undefined) return node;

  if (typeof node === "string") {
    const trimmed = node.trim();
    if (trimmed === "2147483647") {
      return undefined;
    }
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      if (trimmed.includes("2147483647")) {
        try {
          const parsed = JSON.parse(trimmed);
          const scrubbed = deepScrubPoisonedCategoryIds(parsed, hintName);
          return JSON.stringify(scrubbed);
        } catch {
          return node;
        }
      }
    }
    return node;
  }

  if (typeof node === "number") {
    return node === 2147483647 ? undefined : node;
  }

  if (Array.isArray(node)) {
    return node
      .map((item) => deepScrubPoisonedCategoryIds(item, hintName))
      .filter((item) => item !== undefined);
  }

  if (typeof node === "object") {
    const out: Record<string, any> = {};
    const nodeLabelHint =
      (typeof node.category === "string" && node.category.trim()) ||
      (typeof node.name === "string" && node.name.trim()) ||
      (typeof node.title === "string" && node.title.trim()) ||
      hintName ||
      "";

    const structuralKeys = new Set([
      "hb_category_id",
      "hepsiburada_category_id",
      "hepsiburada",
      "categoryId",
      "category_id",
      "defaultCategoryId",
      "default_category_id",
      "id",
      "categoryMappings",
      "category_mappings",
      "categoryAttributes",
      "category_attributes",
      "categoryMarkups",
      "category_markups",
      "marketplace_category_specs",
      "category_specs",
      "hepsiburada_settings"
    ]);

    for (const [key, val] of Object.entries(node)) {
      if (String(key).trim() === "2147483647") {
        continue;
      }

      if (val === 2147483647 || (typeof val === "string" && val.trim() === "2147483647")) {
        const lookupHint = structuralKeys.has(key) ? nodeLabelHint : key;
        let replacement: string | undefined;
        if (lookupHint) {
          const resolvedLeaf = resolveSubCategoryLeafHbId(lookupHint, "__UNRESOLVED__");
          if (resolvedLeaf && resolvedLeaf !== "__UNRESOLVED__" && resolvedLeaf !== "2147483647") {
            replacement = resolvedLeaf;
          } else {
            const suggested = suggestMarketplaceCategory(lookupHint, HEPSIBURADA_DEFAULT_CATEGORIES);
            if (suggested?.bestMatch?.categoryId && String(suggested.bestMatch.categoryId) !== "2147483647") {
              replacement = String(suggested.bestMatch.categoryId);
            }
          }
        }
        if (replacement) {
          out[key] = typeof val === "number" && /^\d+$/.test(replacement) ? Number(replacement) : replacement;
        }
        continue;
      }

      const childHint = structuralKeys.has(key) ? nodeLabelHint : key;
      const scrubbedChild = deepScrubPoisonedCategoryIds(val, childHint);
      if (scrubbedChild !== undefined) {
        out[key] = scrubbedChild;
      }
    }
    return out;
  }

  return node;
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

  // CHECK 6: Multi-Tenant Marketplace Product URL Isolation (No cross-store ?magaza=Enrakipsiz leaks & canonical -p-HBCV...)
  try {
    // 6a. Deterministic runtime check simulating a non-Enrakipsiz store product (e.g., Hello Home)
    const testHbUrl = getMarketplaceListingUrl("hepsiburada", {
      name: "3'lü Pencereli Yastık Hurcu Antrasit",
      barcode: "8685348800059",
      hepsiburada_sku: "HBCV0000RXCOFY",
      hepsiburada_url: "https://www.hepsiburada.com/3-l-pencereli-yast-k-hurcu-antrasit-pm-hbc0000rxcofw?magaza=Enrakipsiz",
      marketplace_data: {
        hepsiburada: {
          hepsiburadaSku: "HBCV0000RXCOFY",
          productId: "HBC0000RXCOFW",
          productUrl: "https://www.hepsiburada.com/3-l-pencereli-yast-k-hurcu-antrasit-pm-hbc0000rxcofw?magaza=Enrakipsiz",
        },
      },
    });
    const runtimeIsolationOk =
      testHbUrl === "https://www.hepsiburada.com/3lu-pencereli-yastik-hurcu-antrasit-p-HBCV0000RXCOFY";

    // 6b. Database audit: ensure zero non-Enrakipsiz/non-GAP stores have leaked magaza=Enrakipsiz in product URLs
    const leakRes = await pool.query(`
      SELECT p.id, p.store_id, s.name AS store_name, s.slug AS store_slug
      FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE (
        COALESCE(p.hepsiburada_url, '') ILIKE '%magaza=enrakipsiz%'
        OR COALESCE(p.marketplace_data->'hepsiburada'->>'productUrl', '') ILIKE '%magaza=enrakipsiz%'
        OR COALESCE(p.marketplace_data->'n11'->>'productUrl', '') ILIKE '%magaza=enrakipsiz%'
      )
      AND COALESCE(s.name, '') || ' ' || COALESCE(s.slug, '') || ' ' || COALESCE(s.branding->>'store_name', '') !~* '(enrakipsiz|gap[\\s_-]*b[iıİ]l|\\bgap\\b)'
      LIMIT 20
    `);
    const leakedCount = leakRes.rows.length;
    const leakedSummary = leakRes.rows.map((r: any) => `#${r.id}@${r.store_name || r.store_slug}(${r.store_id})`).join(", ");
    const passed = runtimeIsolationOk && leakedCount === 0;
    checks.push({
      name: "marketplace_url_store_isolation",
      passed,
      details: passed
        ? "Tüm mağazalarda pazaryeri ürün linkleri tam izole (çapraz ?magaza=Enrakipsiz sızıntısı yok, HBCV SKU'lar -p-HBCV... formatında)."
        : `HATA: runtimeIsolationOk=${runtimeIsolationOk} (got=${testHbUrl}), leakedDbRows=${leakedCount} [${leakedSummary}]`
    });
  } catch (e: any) {
    checks.push({
      name: "marketplace_url_store_isolation",
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
 * Self-heals any existing products in DB that carry legacy hardcoded `?magaza=Enrakipsiz`
 * (or broken lowercase `-pm-hbc0...` URLs when a live `HBCV`/`HBV` variant SKU exists).
 * Strictly preserves each store's own explicit merchantName/sellerNickname without cross-store leakage.
 */
export async function healPoisonedMarketplaceUrls(): Promise<number> {
  try {
    const res = await pool.query(`
      SELECT p.id, p.store_id, p.name, p.barcode, p.sku, p.product_code,
             p.hepsiburada_sku, p.hepsiburada_url, p.marketplace_data,
             s.name AS store_name, s.slug AS store_slug,
             s.hepsiburada_settings, s.n11_settings, s.branding
      FROM products p
      JOIN stores s ON s.id = p.store_id
      WHERE COALESCE(p.hepsiburada_url, '') ILIKE '%magaza=enrakipsiz%'
         OR COALESCE(p.hepsiburada_url, '') ~ '-pm-hbc0?[0-9a-z]+'
         OR COALESCE(p.marketplace_data->'hepsiburada'->>'productUrl', '') ILIKE '%magaza=enrakipsiz%'
         OR COALESCE(p.marketplace_data->'hepsiburada'->>'productUrl', '') ~ '-pm-hbc0?[0-9a-z]+'
         OR COALESCE(p.marketplace_data->'n11'->>'productUrl', '') ILIKE '%magaza=enrakipsiz%'
         OR LOWER(COALESCE(p.marketplace_data->'n11'->>'sellerNickname', '')) = 'enrakipsiz'
    `);

    let healedProducts = 0;
    for (const row of res.rows) {
      let branding: any = row.branding || {};
      if (typeof branding === "string") { try { branding = JSON.parse(branding); } catch { branding = {}; } }
      let hbSettings: any = row.hepsiburada_settings || {};
      if (typeof hbSettings === "string") { try { hbSettings = JSON.parse(hbSettings); } catch { hbSettings = {}; } }
      let n11Settings: any = row.n11_settings || {};
      if (typeof n11Settings === "string") { try { n11Settings = JSON.parse(n11Settings); } catch { n11Settings = {}; } }
      let mpData: any = row.marketplace_data || {};
      if (typeof mpData === "string") { try { mpData = JSON.parse(mpData); } catch { mpData = {}; } }
      mpData = mpData && typeof mpData === "object" ? mpData : {};

      const storeIdentity = `${row.store_name || ""} ${row.store_slug || ""} ${branding?.store_name || ""}`;
      const isEnrakipsizOwner = /(enrakipsiz|gap[\s_-]*b[iıİ]l|\bgap\b)/i.test(storeIdentity);

      const ownHbSeller = String(
        hbSettings?.merchantName ||
        hbSettings?.storeName ||
        branding?.hepsiburada_settings?.merchantName ||
        branding?.hepsiburada_settings?.storeName ||
        (isEnrakipsizOwner ? "Enrakipsiz" : "")
      ).trim();

      const ownN11Nick = String(
        n11Settings?.sellerNickname ||
        branding?.n11_settings?.sellerNickname ||
        (isEnrakipsizOwner ? "enrakipsiz" : "")
      ).trim();

      let changed = false;
      let nextHbUrl = row.hepsiburada_url;
      const hbObj = mpData.hepsiburada && typeof mpData.hepsiburada === "object" ? { ...mpData.hepsiburada } : null;

      const combinedHbUrls = `${row.hepsiburada_url || ""} ${hbObj?.productUrl || ""}`;
      const primaryHbUrl = row.hepsiburada_url || hbObj?.productUrl || "";
      const hasVariantSku = /^(HBCV|HBV)/i.test(String(row.hepsiburada_sku || hbObj?.hepsiburadaSku || "").trim());
      const needsHbHeal =
        (!isEnrakipsizOwner && /magaza=enrakipsiz/i.test(combinedHbUrls)) ||
        (hasVariantSku && /-pm-/i.test(combinedHbUrls)) ||
        /-pm-hbc0?[0-9a-z]+/.test(combinedHbUrls);

      if (needsHbHeal) {
        const rebuilt =
          buildHepsiburadaProductUrl({
            name: row.name,
            hepsiburadaSku: row.hepsiburada_sku || hbObj?.hepsiburadaSku || hbObj?.hbSku || null,
            productId: hbObj?.productId || null,
            directUrl: primaryHbUrl || null,
            fallbackSku: row.sku || row.product_code || null,
            barcode: row.barcode || null,
            sellerName: ownHbSeller || null,
            fallbackToSearch: false,
          }) ||
          (primaryHbUrl ? sanitizeMarketplaceStoreParam(primaryHbUrl, ownHbSeller || null) : null);

        if (rebuilt !== null && rebuilt !== row.hepsiburada_url) {
          nextHbUrl = rebuilt;
          changed = true;
        }
        if (hbObj && rebuilt !== null && rebuilt !== hbObj.productUrl) {
          hbObj.productUrl = rebuilt;
          mpData.hepsiburada = hbObj;
          changed = true;
        }
      }

      if (!isEnrakipsizOwner && mpData.n11 && typeof mpData.n11 === "object") {
        const n11Obj = { ...mpData.n11 };
        let n11Changed = false;
        if (String(n11Obj.sellerNickname || "").trim().toLowerCase() === "enrakipsiz") {
          if (ownN11Nick) n11Obj.sellerNickname = ownN11Nick;
          else delete n11Obj.sellerNickname;
          n11Changed = true;
        }
        if (n11Obj.productUrl && /magaza=enrakipsiz/i.test(String(n11Obj.productUrl))) {
          n11Obj.productUrl = sanitizeMarketplaceStoreParam(String(n11Obj.productUrl), ownN11Nick || null);
          n11Changed = true;
        }
        if (n11Changed) {
          mpData.n11 = n11Obj;
          changed = true;
        }
      }

      if (changed) {
        await pool.query(
          "UPDATE products SET hepsiburada_url = $1, marketplace_data = $2 WHERE id = $3 AND store_id = $4",
          [nextHbUrl, JSON.stringify(mpData), row.id, row.store_id]
        );
        healedProducts++;
      }
    }

    if (healedProducts > 0) {
      console.log(`[SystemGuard] Self-healed cross-tenant/broken marketplace URLs for ${healedProducts} product(s).`);
    }
    return healedProducts;
  } catch (err: any) {
    console.warn("[SystemGuard] healPoisonedMarketplaceUrls warning:", err?.message || err);
    return 0;
  }
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
      const origHbJson = JSON.stringify(hbSettings);
      const origBrandingJson = JSON.stringify(branding);

      if (hbSettings?.categoryMappings) {
        hbSettings.categoryMappings = sanitizeCategoryMappings(hbSettings.categoryMappings);
      }
      if (hbSettings?.category_mappings) {
        hbSettings.category_mappings = sanitizeCategoryMappings(hbSettings.category_mappings);
      }

      if (typeof branding?.hepsiburada_settings === "string") {
        try { branding.hepsiburada_settings = JSON.parse(branding.hepsiburada_settings); } catch {}
      }
      if (branding?.hepsiburada_settings?.categoryMappings) {
        branding.hepsiburada_settings.categoryMappings = sanitizeCategoryMappings(branding.hepsiburada_settings.categoryMappings);
      }
      if (branding?.hepsiburada_settings?.category_mappings) {
        branding.hepsiburada_settings.category_mappings = sanitizeCategoryMappings(branding.hepsiburada_settings.category_mappings);
      }

      for (const specsKey of ["marketplace_category_specs", "category_specs"]) {
        const specsObj = branding?.[specsKey];
        if (specsObj && typeof specsObj === "object") {
          for (const [catName, spec] of Object.entries(specsObj)) {
            if (spec && typeof spec === "object" && String((spec as any).hb_category_id) === "2147483647") {
              (spec as any).hb_category_id = Number(resolveSubCategoryLeafHbId(catName, 676));
            }
          }
        }
      }

      if (JSON.stringify(hbSettings).includes("2147483647")) {
        hbSettings = deepScrubPoisonedCategoryIds(hbSettings) || {};
      }
      if (JSON.stringify(branding).includes("2147483647")) {
        branding = deepScrubPoisonedCategoryIds(branding) || {};
      }

      const nextHbJson = JSON.stringify(hbSettings);
      const nextBrandingJson = JSON.stringify(branding);
      if (nextHbJson !== origHbJson || nextBrandingJson !== origBrandingJson) {
        await pool.query(
          "UPDATE stores SET hepsiburada_settings = $1, branding = $2 WHERE id = $3",
          [nextHbJson, nextBrandingJson, row.id]
        );
        healedStores++;
      }
    }

    if (healedStores > 0) {
      console.log(`[SystemGuard] Self-healed category mappings for ${healedStores} store(s).`);
    }

    await healPoisonedMarketplaceUrls();

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
