import express from "express";
import { pool } from "../../models/db";
import { getAuthorizedStoreId } from "./utils";

const router = express.Router();

// GET /api/store/info
router.get("/", async (req: any, res) => {
  try {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    let targetStoreId: number;

    if (req.query.slug) {
      const slug = String(req.query.slug || "").trim();
      let storeRes = await pool.query("SELECT id, parent_id, slug FROM stores WHERE LOWER(slug) = LOWER($1)", [slug]);
      if (storeRes.rows.length === 0) {
        storeRes = await pool.query("SELECT id, parent_id, slug FROM stores WHERE LOWER(store_code) = LOWER($1)", [slug]);
      }
      if (storeRes.rows.length === 0) {
        const normalizeAlias = (val: string) =>
          String(val || "")
            .replace(/ğ/gi, "g").replace(/ü/gi, "u").replace(/ş/gi, "s")
            .replace(/ı/g, "i").replace(/İ/g, "i").replace(/ö/gi, "o").replace(/ç/gi, "c")
            .toLowerCase().replace(/[^a-z0-9]/g, "");
        const normInput = normalizeAlias(slug);
        if (normInput) {
          const allStores = await pool.query("SELECT id, parent_id, slug, name, store_code FROM stores");
          const matched = allStores.rows.find((r: any) =>
            normalizeAlias(r.slug) === normInput ||
            normalizeAlias(r.store_code) === normInput ||
            normalizeAlias(r.name) === normInput
          );
          if (matched) {
            storeRes = { rows: [matched] } as any;
          }
        }
      }
      if (storeRes.rows.length === 0) {
        return res.status(404).json({ error: "Store not found" });
      }
      const targetRow = storeRes.rows[0];
      targetStoreId = Number(targetRow.id);

      const userRole = String(req.user?.role || "").toLowerCase();
      const userStoreId = Number(req.user?.store_id || 0);
      const isSuperAdmin = userRole === "superadmin";
      const isSameStore = userStoreId > 0 && userStoreId === targetStoreId;
      const isParentOpeningBranch = userStoreId > 0 && Number(targetRow.parent_id || 0) === userStoreId;

      if (!isSuperAdmin && !isSameStore && !isParentOpeningBranch) {
        let activeStoreSlug: string | null = req.user?.store_slug || null;
        if (!activeStoreSlug && userStoreId > 0) {
          try {
            const activeRes = await pool.query("SELECT slug FROM stores WHERE id = $1 LIMIT 1", [userStoreId]);
            activeStoreSlug = activeRes.rows[0]?.slug || null;
          } catch {}
        }
        return res.status(403).json({
          error: "unauthorized_store_context",
          message: "Aktif oturumunuz farklı bir mağaza hesabına ait.",
          active_store_id: userStoreId || null,
          active_store_slug: activeStoreSlug,
          requested_slug: slug
        });
      }
    } else {
      const reqStoreId = req.query.storeId ? parseInt(req.query.storeId as string) : undefined;
      const resolvedId = await getAuthorizedStoreId(req, reqStoreId);
      if (!resolvedId) {
        return res.status(403).json({ error: "Unauthorized store access" });
      }
      targetStoreId = resolvedId;
    }

    const storeRes = await pool.query(`
      SELECT 
        id, name, slug, address, contact_person, phone, country, email, api_key, subscription_end,
        logo_url, favicon_url, primary_color, default_currency, language, plan, background_image_url,
        fiscal_brand, fiscal_terminal_id, fiscal_active, fiscal_ip, fiscal_port, fiscal_departments, pos_bridge_token, pos_bridge_settings,
        default_tax_rate, currency_rates, branding, payment_settings, meta_settings,
        custom_domain, custom_domain_status, page_layout, menu_links, shipping_profiles, emails, phones,
        description, einvoice_settings, footer_links, parent_id, store_type, sub_sector, store_code, hotel_module_enabled,
        hero_title, hero_subtitle, hero_image_url, instagram_url, facebook_url, twitter_url, whatsapp_number, about_text,
        hepsiburada_settings, trendyol_settings, amazon_settings, pazarama_settings, n11_settings,
        google_merchant_settings, instagram_settings, instagram_access_token, instagram_business_account_id
      FROM stores 
      WHERE id = $1
    `, [targetStoreId]);

    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: "Store not found" });
    }

    const store = storeRes.rows[0];

    if (!store.whatsapp_number || store.whatsapp_number === "905428655000") {
      store.whatsapp_number = "905488902309";
    }
    if (!store.phone || store.phone === "905428655000" || store.phone === "+905428655000") {
      store.phone = "+90 548 890 23 09";
    }

    // Parse JSON fields
    const jsonFields = [
      'emails', 'phones', 'footer_links', 'shipping_profiles', 'branding', 
      'payment_settings', 'meta_settings', 'page_layout', 'menu_links', 'currency_rates', 'einvoice_settings',
      'hepsiburada_settings', 'trendyol_settings', 'amazon_settings', 'pazarama_settings', 'n11_settings',
      'google_merchant_settings', 'instagram_settings', 'fiscal_departments', 'pos_bridge_settings'
    ];
    jsonFields.forEach(field => {
      if (typeof store[field] === 'string') {
        try {
          store[field] = JSON.parse(store[field]);
        } catch (e) {
          store[field] = field === 'branding' || field === 'payment_settings' || field === 'meta_settings' || field === 'einvoice_settings' || field === 'currency_rates' || field.endsWith('_settings') ? {} : [];
        }
      } else if (!store[field]) {
        store[field] = field === 'branding' || field === 'payment_settings' || field === 'meta_settings' || field === 'einvoice_settings' || field === 'currency_rates' || field.endsWith('_settings') ? {} : [];
      }
    });

    // Merge branding onto store top-level and sync marketplace settings
    if (!store.branding || typeof store.branding !== 'object' || Array.isArray(store.branding)) {
      store.branding = {};
    }
    if ('branding' in store.branding) {
      delete store.branding.branding;
    }

    const dbStoreId = Number(store.id);
    const dbStoreSlug = store.slug;
    const dbStoreName = store.name;
    const dbParentId = store.parent_id ? Number(store.parent_id) : null;

    // Sync database column values into branding object
    store.branding.id = dbStoreId;
    store.branding.store_name = dbStoreName || store.branding.store_name || store.branding.name;
    store.branding.name = dbStoreName || store.branding.name || store.branding.store_name;
    store.branding.slug = dbStoreSlug;
    store.branding.address = store.address || store.branding.address;
    store.branding.contact_person = store.contact_person || store.branding.contact_person;
    store.branding.phone = store.phone || store.branding.phone;
    store.branding.email = store.email || store.branding.email;
    store.branding.country = store.country || store.branding.country || 'TR';
    store.branding.default_currency = store.default_currency || store.branding.default_currency || 'TRY';
    store.branding.language = store.language || store.branding.language || 'tr';
    store.branding.store_type = store.store_type || store.branding.store_type || 'product';
    store.branding.sub_sector = store.sub_sector || store.branding.sub_sector;
    const hotelLicenseGranted = Boolean(
      store.hotel_module_enabled || 
      (store.branding && (store.branding.hotel_license_enabled || store.branding.hotel_module_enabled))
    );
    store.hotel_license_enabled = hotelLicenseGranted;
    store.branding.hotel_license_enabled = hotelLicenseGranted;

    if (!hotelLicenseGranted) {
      store.hotel_module_enabled = false;
      store.branding.hotel_module_enabled = false;
    } else {
      const opEnabled = store.branding.hotel_module_enabled !== undefined 
        ? Boolean(store.branding.hotel_module_enabled) 
        : true;
      store.hotel_module_enabled = opEnabled;
      store.branding.hotel_module_enabled = opEnabled;
    }

    const mergeNonEmpty = (brObj: any, colObj: any) => {
      const a = (brObj && typeof brObj === 'object' && !Array.isArray(brObj)) ? brObj : {};
      const b = (colObj && typeof colObj === 'object' && !Array.isArray(colObj)) ? colObj : {};
      const out: any = { ...a, ...b };
      for (const [k, v] of Object.entries(a)) {
        if ((out[k] === '' || out[k] === null || out[k] === undefined) && v !== '' && v !== null && v !== undefined) {
          out[k] = v;
        }
      }
      if (a.enabled === true || b.enabled === true) {
        out.enabled = true;
      }
      return out;
    };

    const psFromCol = store.payment_settings || {};
    const psFromBr = store.branding.payment_settings || {};
    const msFromCol = store.meta_settings || {};
    const msFromBr = store.branding.meta_settings || {};
    const gmFromCol = store.google_merchant_settings || {};
    const gmFromBr = store.branding.google_merchant_settings || {};
    const igFromCol = store.instagram_settings || {};
    const igFromBr = store.branding.instagram_settings || {};
    const esFromCol = store.einvoice_settings || {};
    const esFromBr = store.branding.einvoice_settings || {};

    const hbFromCol = store.hepsiburada_settings || {};
    const hbFromBr = store.branding.hepsiburada_settings || {};
    const tyFromCol = store.trendyol_settings || {};
    const tyFromBr = store.branding.trendyol_settings || {};
    const amzFromCol = store.amazon_settings || {};
    const amzFromBr = store.branding.amazon_settings || {};
    const pzFromCol = store.pazarama_settings || {};
    const pzFromBr = store.branding.pazarama_settings || {};
    const n11FromCol = store.n11_settings || {};
    const n11FromBr = store.branding.n11_settings || {};

    store.parent_id = dbParentId;
    store.branding.parent_id = dbParentId;

    const cleanBranding = { ...store.branding };
    delete cleanBranding.branding;

    Object.assign(store, cleanBranding);
    store.branding = cleanBranding;

    // Re-enforce authoritative DB identity & branch hierarchy after Object.assign
    store.id = dbStoreId;
    store.branding.id = dbStoreId;
    store.slug = dbStoreSlug;
    store.branding.slug = dbStoreSlug;
    store.name = dbStoreName;
    store.parent_id = dbParentId;
    store.branding.parent_id = dbParentId;

    store.payment_settings = mergeNonEmpty(psFromBr, psFromCol);
    store.meta_settings = mergeNonEmpty(msFromBr, msFromCol);
    store.google_merchant_settings = mergeNonEmpty(gmFromBr, gmFromCol);
    store.instagram_settings = mergeNonEmpty(igFromBr, igFromCol);
    if (store.instagram_access_token && !store.instagram_settings.access_token) {
      store.instagram_settings.access_token = store.instagram_access_token;
    }
    if (store.instagram_business_account_id && !store.instagram_settings.account_id) {
      store.instagram_settings.account_id = store.instagram_business_account_id;
    }
    store.einvoice_settings = mergeNonEmpty(esFromBr, esFromCol);

    store.hepsiburada_settings = mergeNonEmpty(hbFromBr, hbFromCol);
    store.trendyol_settings = mergeNonEmpty(tyFromBr, tyFromCol);
    store.amazon_settings = mergeNonEmpty(amzFromBr, amzFromCol);
    store.pazarama_settings = mergeNonEmpty(pzFromBr, pzFromCol);
    store.n11_settings = mergeNonEmpty(n11FromBr, n11FromCol);

    store.branding.payment_settings = store.payment_settings;
    store.branding.meta_settings = store.meta_settings;
    store.branding.google_merchant_settings = store.google_merchant_settings;
    store.branding.instagram_settings = store.instagram_settings;
    store.branding.einvoice_settings = store.einvoice_settings;
    store.branding.hepsiburada_settings = store.hepsiburada_settings;
    store.branding.trendyol_settings = store.trendyol_settings;
    store.branding.amazon_settings = store.amazon_settings;
    store.branding.pazarama_settings = store.pazarama_settings;
    store.branding.n11_settings = store.n11_settings;

    // Auto-provision pos_bridge_token on first authenticated access so new stores & branches are onboarding-ready
    if (!store.pos_bridge_token) {
      const cryptoMod = await import("crypto");
      const generatedToken = `lpb_${dbStoreId}_${cryptoMod.randomBytes(16).toString('hex')}`;
      store.pos_bridge_token = generatedToken;
      pool.query("UPDATE stores SET pos_bridge_token = $1 WHERE id = $2", [generatedToken, dbStoreId]).catch(() => {});
    }
    const bridgeCfg = (store.pos_bridge_settings && typeof store.pos_bridge_settings === 'object' && !Array.isArray(store.pos_bridge_settings))
      ? store.pos_bridge_settings
      : {};
    store.fiscal_brand = store.fiscal_brand || store.branding.fiscal_brand || 'hugin_t300_spectra';
    store.fiscal_terminal_id = store.fiscal_terminal_id || store.branding.fiscal_terminal_id || '';
    store.fiscal_active = Boolean(store.fiscal_active ?? store.branding.fiscal_active ?? false);
    store.fiscal_ip = store.fiscal_ip || store.branding.fiscal_ip || '';
    store.fiscal_port = Number(store.fiscal_port || store.branding.fiscal_port || 4444);
    store.fiscal_departments = Array.isArray(store.fiscal_departments) && store.fiscal_departments.length > 0
      ? store.fiscal_departments
      : (Array.isArray(store.branding.fiscal_departments) ? store.branding.fiscal_departments : []);
    store.pos_bridge_settings = bridgeCfg;
    store.branding.fiscal_brand = store.fiscal_brand;
    store.branding.fiscal_terminal_id = store.fiscal_terminal_id;
    store.branding.fiscal_active = store.fiscal_active;
    store.branding.fiscal_ip = store.fiscal_ip;
    store.branding.fiscal_port = store.fiscal_port;
    store.branding.fiscal_departments = store.fiscal_departments;
    store.branding.pos_bridge_token = store.pos_bridge_token;
    store.branding.pos_bridge_settings = bridgeCfg;
    if (bridgeCfg.enabled !== undefined) {
      store.branding.pos_bridge_enabled = Boolean(bridgeCfg.enabled);
    }
    if (bridgeCfg.bridge_ip) {
      store.branding.pos_bridge_ip = bridgeCfg.bridge_ip;
    }
    if (bridgeCfg.bridge_port) {
      store.branding.pos_bridge_port = bridgeCfg.bridge_port;
    }

    // Fetch branches if this is a main store (HQ), or inherit HQ corporate identity if this is a branch
    if (!store.parent_id) {
      const branchesRes = await pool.query(
        "SELECT id, name, slug, address, phone FROM stores WHERE parent_id = $1",
        [store.id]
      );
      store.branches = branchesRes.rows;
    } else {
      const parentRes = await pool.query(
        `SELECT id, name, slug, address, phone, whatsapp_number, email, logo_url, favicon_url,
                primary_color, store_type, sub_sector, default_currency, currency_rates, einvoice_settings, branding
         FROM stores WHERE id = $1`,
        [store.parent_id]
      );
      if (parentRes.rows.length > 0) {
        const parentStore = parentRes.rows[0];
        let parentBranding: any = parentStore.branding || {};
        if (typeof parentBranding === 'string') {
          try { parentBranding = JSON.parse(parentBranding); } catch (e) { parentBranding = {}; }
        }
        let parentEinvoice: any = parentStore.einvoice_settings || parentBranding.einvoice_settings || {};
        if (typeof parentEinvoice === 'string') {
          try { parentEinvoice = JSON.parse(parentEinvoice); } catch (e) { parentEinvoice = {}; }
        }
        let parentRates: any = parentStore.currency_rates || parentBranding.currency_rates || {};
        if (typeof parentRates === 'string') {
          try { parentRates = JSON.parse(parentRates); } catch (e) { parentRates = {}; }
        }

        store.parent_store_name = parentStore.name;
        store.parent_store_slug = parentStore.slug;
        store.parent_slug = parentStore.slug;
        store.branding.parent_store_name = parentStore.name;
        store.branding.parent_store_slug = parentStore.slug;
        store.branding.parent_slug = parentStore.slug;
        // Branch inherits sector & corporate visual identity from HQ
        store.store_type = parentStore.store_type || parentBranding.store_type || store.store_type;
        store.sub_sector = parentStore.sub_sector || parentBranding.sub_sector || store.sub_sector;
        store.branding.store_type = store.store_type;
        store.branding.sub_sector = store.sub_sector;
        if (!store.logo_url && (parentStore.logo_url || parentBranding.logo_url)) {
          store.logo_url = parentStore.logo_url || parentBranding.logo_url;
          store.branding.logo_url = store.logo_url;
        }
        if (!store.favicon_url && (parentStore.favicon_url || parentBranding.favicon_url)) {
          store.favicon_url = parentStore.favicon_url || parentBranding.favicon_url;
          store.branding.favicon_url = store.favicon_url;
        }

        // Branch inherits HQ official legal info when not explicitly overridden on branch
        const pickLegal = (branchVal: any, ...hqCandidates: any[]) => {
          if (branchVal !== undefined && branchVal !== null && String(branchVal).trim() !== '') {
            return branchVal;
          }
          for (const candidate of hqCandidates) {
            if (candidate !== undefined && candidate !== null && String(candidate).trim() !== '') {
              return candidate;
            }
          }
          return '';
        };

        const resolvedLegalName = pickLegal(store.legal_name, parentBranding.legal_name, parentStore.name);
        const resolvedLegalPhone = pickLegal(store.legal_phone, parentBranding.legal_phone, store.phone, parentStore.phone);
        const resolvedLegalTaxOffice = pickLegal(store.legal_tax_office, store.einvoice_settings?.tax_office, parentBranding.legal_tax_office, parentEinvoice?.tax_office);
        const resolvedLegalTaxNumber = pickLegal(store.legal_tax_number, store.einvoice_settings?.tax_number, store.einvoice_settings?.vkn, parentBranding.legal_tax_number, parentEinvoice?.tax_number, parentEinvoice?.vkn);
        const resolvedLegalMersis = pickLegal(store.legal_mersis, parentBranding.legal_mersis);
        const resolvedLegalAddress = pickLegal(store.legal_address, store.address, parentBranding.legal_address, parentStore.address);

        if (resolvedLegalName) { store.legal_name = resolvedLegalName; store.branding.legal_name = resolvedLegalName; }
        if (resolvedLegalPhone) { store.legal_phone = resolvedLegalPhone; store.branding.legal_phone = resolvedLegalPhone; }
        if (resolvedLegalTaxOffice) { store.legal_tax_office = resolvedLegalTaxOffice; store.branding.legal_tax_office = resolvedLegalTaxOffice; }
        if (resolvedLegalTaxNumber) { store.legal_tax_number = resolvedLegalTaxNumber; store.branding.legal_tax_number = resolvedLegalTaxNumber; }
        if (resolvedLegalMersis) { store.legal_mersis = resolvedLegalMersis; store.branding.legal_mersis = resolvedLegalMersis; }
        if (resolvedLegalAddress) { store.legal_address = resolvedLegalAddress; store.branding.legal_address = resolvedLegalAddress; }

        if ((!store.currency_rates || Object.keys(store.currency_rates).length === 0) && parentRates && Object.keys(parentRates).length > 0) {
          store.currency_rates = parentRates;
          store.branding.currency_rates = parentRates;
        }
      }
    }

    const { normalizeStorageUrl } = await import("../utils/imageStorage");
    if (store.logo_url || store.branding?.logo_url) {
      const normalizedLogo = normalizeStorageUrl(store.logo_url || store.branding?.logo_url, store.id, store.name);
      store.logo_url = normalizedLogo;
      store.branding.logo_url = normalizedLogo;
    }
    if (store.favicon_url || store.branding?.favicon_url) {
      const normalizedFavicon = normalizeStorageUrl(store.favicon_url || store.branding?.favicon_url, store.id, store.name);
      store.favicon_url = normalizedFavicon;
      store.branding.favicon_url = normalizedFavicon;
    }

    res.json(store);
  } catch (error: any) {
    console.error("Error in GET /api/store/info:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
