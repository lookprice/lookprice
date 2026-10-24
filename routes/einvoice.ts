import express from "express";
import crypto from "crypto";
import { pool, addStockMovement } from "../models/db";
import { authenticate, getAuthorizedStoreId } from "../middleware/auth";
import { MySoftService } from "../src/services/backend/mysoftService";
import { IntegrationService } from "../src/services/IntegrationService";
import { UNIT_CODES, TAX_CODES } from "../src/lib/ubl-codes";
import { numberToTurkishWords } from "../src/utils/formatUtils";
import { findMatchingProduct, findOrCreateProductForInvoiceItem, saveSupplierMapping, sanitizeInvoiceItemCodes, isValidStandardBarcode, resolveExpenseClassification } from "./store/invoiceMatching";

const router = express.Router();

export const KDV_EXEMPTION_CODES_MAP: Record<string, string> = {
  "301": "11/1-a Mal İhracatı",
  "302": "11/1-b Hizmet İhracatı",
  "303": "11/1-c Roaming Hizmetleri",
  "311": "13/a Deniz, Hava ve Demiryolu Araçlarına İlişkin İstisna",
  "312": "13/b Liman ve Hava Meydanlarında Yapılan Hizmetler",
  "313": "13/c Altın, Gümüş, Platin vb. Arama İşletme ve Zenginleştirme",
  "314": "13/d Makine ve Teçhizat Teslimleri (Yatırım Teşvik)",
  "315": "13/e Limanlara Bağlantı Yapan Demiryolu Hatları İstisnası",
  "316": "13/f Ulusal Güvenlik Amaçlı Teslim ve Hizmetler",
  "317": "13/g Külçe Altın ve Gümüş Teslimleri",
  "318": "13/h Engellilerin Kullanımına Mahsus Araç ve Gereçler",
  "323": "13/k Teknoloji Geliştirme Bölgesinde Yapılan Teslimler",
  "324": "13/m Hastanelere Yapılan Teslim ve Hizmetler",
  "325": "13/i Ar-Ge Makineleri İstisnası",
  "350": "Diğerleri (Tam İstisna)",
  "201": "17/1 Kültür ve Eğitim Amacı Taşıyan İşlemler",
  "202": "17/2-a Sağlık, Çevre ve Sosyal Yardım Amaçlı İşlemler",
  "204": "17/2-c Yabancı Diplomatik Misyonlara Yapılan Teslimler",
  "207": "17/4-c Gümrük Antrepoları ve Geçici Depolama Yerleri",
  "208": "17/4-d Banka ve Sigorta Muameleleri",
  "211": "17/4-g Külçe Altın, Külçe Gümüş, Kıymetli Taş Teslimleri",
  "213": "17/4-i Serbest Bölgelerde Yapılan Fason İşler",
  "214": "17/4-ı Serbest Bölgelerde Verilen Hizmetler",
  "215": "17/4-j Boru Hattı ile Taşımacılık Hizmetleri",
  "221": "17/4-r Kurumların Aktifindeki Taşınmaz ve İştirak Hissesi",
  "223": "17/4-t Serbest Bölgelere İhraç Amaçlı Yük Taşıma",
  "225": "17/4-y Taşınmaz Satışları İstisnası",
  "226": "17/4-z Zirai Amaçlı Su Teslimleri",
  "235": "16/1-c Transit ve Gümrük Antrepo Rejimi",
  "250": "Diğerleri (Kısmi İstisna)",
  "701": "11/1-c İhraç Kayıtlı Teslimler",
  "702": "11/1-c İhraç Kayıtlı Hizmet Teslimleri"
};

// Helper function to extract full title (Ad + Soyad) for sole proprietorships and companies
export function extractSenderTitleFromUblOrDetails(source: any, defaultTitle: string = 'Bilinmeyen Tedarikçi'): string {
  if (!source) return defaultTitle;

  const supplierObj = source.supplierInfo || source.accountingSupplierParty?.party || source.supplier || source;
  const personObj = supplierObj.person || supplierObj.Person || source.person || source.Person || {};
  
  const firstName = (
    supplierObj.firstName || supplierObj.FirstName || supplierObj.first_name ||
    personObj.firstName || personObj.FirstName || source.firstName || source.FirstName || ""
  ).toString().trim();

  const familyName = (
    supplierObj.familyName || supplierObj.FamilyName || supplierObj.family_name ||
    supplierObj.lastName || supplierObj.LastName || supplierObj.last_name ||
    supplierObj.surname || supplierObj.Surname ||
    personObj.familyName || personObj.FamilyName || personObj.lastName || personObj.LastName ||
    source.familyName || source.FamilyName || source.lastName || source.LastName || source.surname || source.Surname || ""
  ).toString().trim();

  let rawTitle = (
    supplierObj.partyName || supplierObj.PartyName ||
    supplierObj.customerName || supplierObj.CustomerName ||
    supplierObj.supplierName || supplierObj.SupplierName ||
    source.senderTitle || source.SenderTitle ||
    source.title || source.Title ||
    source.senderName || source.SenderName ||
    source.companyName || source.CompanyName ||
    source.taxpayerName || source.TaxpayerName ||
    defaultTitle
  ).toString().trim();

  if (firstName && familyName) {
    const fullPersonName = `${firstName} ${familyName}`;
    if (!rawTitle || rawTitle === defaultTitle || rawTitle.toLowerCase() === firstName.toLowerCase()) {
      return fullPersonName;
    }
    if (!rawTitle.toLowerCase().includes(familyName.toLowerCase())) {
      return `${rawTitle} ${familyName}`;
    }
    return rawTitle;
  }

  if (rawTitle && rawTitle !== defaultTitle) {
    return rawTitle;
  }

  if (firstName) {
    return firstName;
  }

  return defaultTitle;
}

// Self-Healing database schema updates for e_waybills and sales_invoices cargo fields
export async function initCargoSchema() {
  try {
    await pool.query(`ALTER TABLE e_waybills ADD COLUMN IF NOT EXISTS delivery_term TEXT;`);
    await pool.query(`ALTER TABLE e_waybills ADD COLUMN IF NOT EXISTS transport_mode TEXT;`);
    await pool.query(`ALTER TABLE e_waybills ADD COLUMN IF NOT EXISTS carrier_name TEXT;`);
    await pool.query(`ALTER TABLE e_waybills ADD COLUMN IF NOT EXISTS carrier_vkn TEXT;`);
    await pool.query(`ALTER TABLE e_waybills ADD COLUMN IF NOT EXISTS tracking_number TEXT;`);
    await pool.query(`ALTER TABLE e_waybills ADD COLUMN IF NOT EXISTS is_cargo_shipment BOOLEAN DEFAULT FALSE;`);
    await pool.query(`ALTER TABLE e_waybills ADD COLUMN IF NOT EXISTS driver_phone TEXT;`);
    await pool.query(`ALTER TABLE e_waybills ADD COLUMN IF NOT EXISTS order_number TEXT;`);
    await pool.query(`ALTER TABLE e_waybills ADD COLUMN IF NOT EXISTS order_date DATE;`);
    await pool.query(`ALTER TABLE e_waybills ADD COLUMN IF NOT EXISTS matbu_number TEXT;`);
    await pool.query(`ALTER TABLE e_waybills ADD COLUMN IF NOT EXISTS matbu_date DATE;`);

    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS waybill_is_cargo_shipment BOOLEAN DEFAULT FALSE;`);
    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS waybill_carrier_name TEXT;`);
    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS waybill_carrier_vkn TEXT;`);
    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS waybill_tracking_number TEXT;`);
    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS waybill_delivery_term TEXT;`);
    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS waybill_transport_mode TEXT;`);
    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS waybill_order_number TEXT;`);
    await pool.query(`ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS waybill_order_date DATE;`);

    console.log("Self-healing schema verification: e_waybills and sales_invoices cargo columns processed successfully.");
  } catch (error) {
    console.error("Self-healing schema error for cargo columns:", error);
  }
}

// Get the E-Invoice service instance based on Store Settings
export const getEInvoiceService = async (storeId: number) => {
  console.log(`[getEInvoiceService] Fetching settings for storeId: ${storeId}`);
  const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
  if (storeRes.rows.length === 0) {
    console.error(`[getEInvoiceService] Store not found: ${storeId}`);
    throw new Error("Mağaza bulunamadı");
  }
  
  let settings = storeRes.rows[0].einvoice_settings || {};
  if (typeof settings === 'string') {
    try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
  }
  let branding = storeRes.rows[0].branding || {};
  if (typeof branding === 'string') {
    try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
  }
  const brandingSettings = branding.einvoice_settings || {};
  settings = { ...brandingSettings, ...settings };
  
  console.log(`[getEInvoiceService] Settings found:`, settings ? JSON.stringify(settings).substring(0, 50) + "..." : 'No');
  if (!settings || !settings.is_active) {
    throw new Error("E-Fatura sistemi bu mağaza için aktif değil");
  }

  if (settings.provider === 'mysoft') {
    return new MySoftService({ ...settings, is_ewaybill_test_mode: false });
  } else {
    throw new Error(`Desteklenmeyen entegratör: ${settings.provider}`);
  }
};

// Dedicated E-Waybill service instance (allows isolated E-Waybill Sandbox testing without touching live E-Invoice)
export const getEWaybillService = async (storeId: number) => {
  const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
  if (storeRes.rows.length === 0) {
    throw new Error("Mağaza bulunamadı");
  }

  let settings = storeRes.rows[0].einvoice_settings || {};
  if (typeof settings === 'string') {
    try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
  }
  let branding = storeRes.rows[0].branding || {};
  if (typeof branding === 'string') {
    try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
  }
  const brandingSettings = branding.einvoice_settings || {};
  settings = { ...brandingSettings, ...settings };

  if (!settings || (!settings.is_active && !settings.is_ewaybill_active)) {
    throw new Error("E-İrsaliye sistemi bu mağaza için aktif değil");
  }

  if (settings.provider === 'mysoft') {
    const isWaybillTest = !!settings.ewaybill_test_mode;
    const waybillCredentials = isWaybillTest
      ? {
          ...settings,
          is_ewaybill_test_mode: true,
          ewaybill_test_api_url: settings.ewaybill_test_api_url || "https://test-edocumentapi.mysoft.com.tr/api",
          username: settings.ewaybill_test_username || settings.username,
          password: settings.ewaybill_test_password || settings.password,
          vkn: settings.ewaybill_test_vkn || settings.vkn,
          tenant_id: settings.ewaybill_test_tenant_id || settings.tenant_id
        }
      : { ...settings, is_ewaybill_test_mode: false };
    return new MySoftService(waybillCredentials);
  } else {
    throw new Error(`Desteklenmeyen entegratör: ${settings.provider}`);
  }
};

// Helper to get series status with last used number and next sequence for each prefix
export const getSeriesStatusList = async (storeId: number) => {
  const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
  if (storeRes.rows.length === 0) return [];
  
  let settings = storeRes.rows[0].einvoice_settings || {};
  if (typeof settings === 'string') {
    try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
  }
  let branding = storeRes.rows[0].branding || {};
  if (typeof branding === 'string') {
    try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
  }
  const merged = { ...(branding.einvoice_settings || {}), ...settings };
  
  let seriesList = merged.series_list;
  if (!Array.isArray(seriesList) || seriesList.length === 0) {
    const efPrefix = (merged.einvoice_prefix || 'GEF').toUpperCase().substring(0, 3);
    const eaPrefix = (merged.earchive_prefix || 'GEA').toUpperCase().substring(0, 3);
    const ewPrefix = (merged.ewaybill_prefix || 'IRS').toUpperCase().substring(0, 3);
    seriesList = [
      { id: 'series_ef_default', prefix: efPrefix, type: 'E-FATURA', description: 'Ana E-Fatura Serisi', is_default: true },
      { id: 'series_ea_default', prefix: eaPrefix, type: 'E-ARSIV', description: 'Ana E-Arşiv Serisi', is_default: true },
      { id: 'series_ew_default', prefix: ewPrefix, type: 'E-İRSALİYE', description: 'Ana E-İrsaliye Serisi', is_default: true }
    ];
  }

  const currentYear = new Date().getFullYear().toString();
  const results = [];

  for (const s of seriesList) {
    const cleanPrefix = (s.prefix || (s.type === 'E-İRSALİYE' ? 'IRS' : 'GAP')).toUpperCase().substring(0, 3).padEnd(3, 'X');
    const prefixWithYear = `${cleanPrefix}${currentYear}`;

    let lastDocNum = null;
    let nextSeq = 1;

    if (s.type === 'E-İRSALİYE') {
      const baseStartSeq = Number(merged.ewaybill_start_sequence || merged.waybill_start_sequence || 0);
      nextSeq = baseStartSeq + 1;
      if (baseStartSeq > 0) {
        lastDocNum = merged.ewaybill_last_number || `${prefixWithYear}${baseStartSeq.toString().padStart(9, '0')}`;
      }

      const seqRes = await pool.query(
        `SELECT waybill_number as doc_num 
         FROM e_waybills 
         WHERE store_id = $1 
           AND waybill_number LIKE $2 
           AND LENGTH(waybill_number) = 16
         ORDER BY waybill_number DESC 
         LIMIT 1`,
        [storeId, `${prefixWithYear}%`]
      );

      if (seqRes.rows.length > 0 && seqRes.rows[0].doc_num) {
        const foundDocNum = seqRes.rows[0].doc_num;
        const parsed = parseInt(foundDocNum.substring(7), 10);
        if (!isNaN(parsed) && parsed >= nextSeq) {
          nextSeq = parsed + 1;
          lastDocNum = foundDocNum;
        }
      }
    } else {
      const seqRes = await pool.query(
        `SELECT COALESCE(document_number, invoice_number) as doc_num 
         FROM sales_invoices 
         WHERE store_id = $1 
           AND (document_number LIKE $2 OR invoice_number LIKE $2) 
           AND (LENGTH(document_number) = 16 OR LENGTH(invoice_number) = 16)
         ORDER BY COALESCE(document_number, invoice_number) DESC 
         LIMIT 1`,
        [storeId, `${prefixWithYear}%`]
      );

      if (seqRes.rows.length > 0) {
        lastDocNum = seqRes.rows[0].doc_num;
        const lastSeqPart = lastDocNum.substring(7);
        const parsed = parseInt(lastSeqPart, 10);
        if (!isNaN(parsed)) {
          nextSeq = parsed + 1;
        }
      }
    }

    const nextDocNum = `${prefixWithYear}${nextSeq.toString().padStart(9, '0')}`;

    results.push({
      id: s.id || `series_${cleanPrefix}_${s.type}`,
      prefix: cleanPrefix,
      type: s.type || 'E-FATURA',
      description: s.description || `${cleanPrefix} Serisi`,
      is_default: !!s.is_default,
      year: currentYear,
      last_document_number: lastDocNum,
      next_sequence: nextSeq,
      next_document_number: nextDocNum
    });
  }

  return results;
};

// 0. GET Invoice Series Status
router.get("/einvoice/series", authenticate, async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const series = await getSeriesStatusList(storeId);
    res.json(series);
  } catch (error: any) {
    console.error("Error fetching invoice series status:", error);
    res.status(500).json({ error: error.message });
  }
});

// 0.1 POST Invoice Series (Save/Add/Update Series)
router.post("/einvoice/series", authenticate, async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const { series_list } = req.body;
    if (!Array.isArray(series_list)) {
      return res.status(400).json({ error: "series_list bir dizi olmalıdır" });
    }

    // Fetch existing settings
    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });

    let settings = storeRes.rows[0].einvoice_settings || {};
    if (typeof settings === 'string') {
      try { settings = JSON.parse(settings); } catch (e) { settings = {}; }
    }
    let branding = storeRes.rows[0].branding || {};
    if (typeof branding === 'string') {
      try { branding = JSON.parse(branding); } catch (e) { branding = {}; }
    }

    // Sanitize series list
    const sanitizedList = series_list.map((s: any, idx: number) => {
      const cleanPrefix = (s.prefix || 'GAP').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3).padEnd(3, 'X');
      return {
        id: s.id || `series_${cleanPrefix}_${Date.now()}_${idx}`,
        prefix: cleanPrefix,
        type: s.type === 'E-ARSIV' ? 'E-ARSIV' : 'E-FATURA',
        description: s.description || `${cleanPrefix} Serisi`,
        is_default: !!s.is_default
      };
    });

    // Determine active defaults for einvoice_prefix and earchive_prefix
    const defaultEF = sanitizedList.find(s => s.is_default && s.type === 'E-FATURA') || sanitizedList.find(s => s.type === 'E-FATURA');
    const defaultEA = sanitizedList.find(s => s.is_default && s.type === 'E-ARSIV') || sanitizedList.find(s => s.type === 'E-ARSIV');

    settings.series_list = sanitizedList;
    if (defaultEF) settings.einvoice_prefix = defaultEF.prefix;
    if (defaultEA) settings.earchive_prefix = defaultEA.prefix;

    if (!branding.einvoice_settings) branding.einvoice_settings = {};
    branding.einvoice_settings.series_list = sanitizedList;
    if (defaultEF) branding.einvoice_settings.einvoice_prefix = defaultEF.prefix;
    if (defaultEA) branding.einvoice_settings.earchive_prefix = defaultEA.prefix;

    await pool.query(
      "UPDATE stores SET einvoice_settings = $1, branding = $2 WHERE id = $3",
      [JSON.stringify(settings), JSON.stringify(branding), storeId]
    );

    const updatedSeries = await getSeriesStatusList(storeId);
    res.json({ success: true, series: updatedSeries, einvoice_prefix: settings.einvoice_prefix, earchive_prefix: settings.earchive_prefix });
  } catch (error: any) {
    console.error("Error saving invoice series:", error);
    res.status(500).json({ error: error.message });
  }
});

// 1. Check Taxpayer endpoint
router.post("/einvoice/check-taxpayer", authenticate, async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const { vknTckn } = req.body;
    
    if (!vknTckn) return res.status(400).json({ error: "VKN veya TCKN gereklidir" });

    const service = await getEInvoiceService(storeId);
    
    // Check official taxpayer cache first (ensure alias is valid and not null)
    const cacheRes = await pool.query("SELECT taxpayer_title, alias FROM official_taxpayer_cache WHERE vkn = $1", [vknTckn]);
    
    let result;
    if (cacheRes.rows.length > 0 && cacheRes.rows[0].alias && cacheRes.rows[0].alias.trim() !== '') {
      console.log(`[checkTaxpayer] VKN ${vknTckn} found in official cache with valid alias.`);
      result = { isTaxpayer: true, documentType: 'E-FATURA', title: cacheRes.rows[0].taxpayer_title, alias: cacheRes.rows[0].alias };
    } else {
      result = await service.checkTaxpayer(vknTckn);
      if (result && result.isTaxpayer) {
        await pool.query("INSERT INTO official_taxpayer_cache (vkn, taxpayer_title, alias, last_updated) VALUES ($1, $2, $3, NOW()) ON CONFLICT (vkn) DO UPDATE SET taxpayer_title = EXCLUDED.taxpayer_title, alias = EXCLUDED.alias, last_updated = NOW()", [vknTckn, result.title || '', result.alias || '']);
      }
    }
    
    res.json(result);
  } catch (error: any) {
    console.error("Check Taxpayer endpoint error:", error);
    // Return a friendly payload so frontend won't raise unhandled 500 developer alerts
    res.json({ 
      isTaxpayer: false, 
      documentType: 'E-ARSIV', 
      alias: "", 
      error: "Mükellef kaydı entegratörden sorgulanamadı (E-Arşiv ile devam edebilir ve/veya manuel E-Fatura seçebilirsiniz)" 
    });
  }
});

// 2. Send Sales Invoice to Entegrator
router.post("/einvoice/send/:invoiceId", authenticate, async (req: any, res) => {
  const { invoiceId } = req.params;
  let storeId = req.user.store_id; 
  let ettn: string | undefined = undefined;
  console.log(`[INVOICE-SEND-ENTRY] InvoiceID: ${invoiceId}, UserStoreId: ${storeId}`);
  try {
    // 1. Fetch the invoice first to identify the correct storeId
    let invoice;
    if (req.user.role === 'superadmin') {
      const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
      if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı" });
      invoice = invRes.rows[0];
      storeId = invoice.store_id;
    } else {
      const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1 AND store_id = $2", [invoiceId, storeId]);
      if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı" });
      invoice = invRes.rows[0];
    }

    // Dynamically fallback to linked companies or customers details if blank on the invoice itself
    if (invoice.company_id && (!invoice.tax_number || !invoice.address || !invoice.company_title)) {
      const compRes = await pool.query(
        "SELECT title, tax_number, tax_office, address, email FROM companies WHERE id = $1",
        [invoice.company_id]
      );
      if (compRes.rows.length > 0) {
        const comp = compRes.rows[0];
        invoice.tax_number = invoice.tax_number || comp.tax_number;
        invoice.tax_office = invoice.tax_office || comp.tax_office;
        invoice.address = invoice.address || comp.address;
        invoice.company_title = invoice.company_title || comp.title;
        invoice.customer_email = invoice.customer_email || comp.email;
      }
    } else if (invoice.customer_id) {
      const custRes = await pool.query(
        "SELECT name, surname, full_name, tax_number, tax_office, address, city, email FROM customers WHERE id = $1",
        [invoice.customer_id]
      );
      if (custRes.rows.length > 0) {
        const cust = custRes.rows[0];
        invoice.tax_number = invoice.tax_number || cust.tax_number;
        invoice.tax_office = invoice.tax_office || cust.tax_office;
        invoice.address = invoice.address || cust.address;
        invoice.customer_city = cust.city;
        const realName = cust.full_name || `${cust.name || ''} ${cust.surname || ''}`.trim();
        if (realName && (!invoice.customer_name || invoice.customer_name === 'Amazon Müşterisi' || invoice.customer_name === 'Bireysel Web Müşterisi')) {
          invoice.customer_name = realName;
        }
        invoice.customer_email = invoice.customer_email || cust.email;
      }
    }

    // Fetch Invoice Items early to detect zero-tax exemptions
    const itemsRes = await pool.query("SELECT * FROM sales_invoice_items WHERE sales_invoice_id = $1", [invoiceId]);
    const items = itemsRes.rows;

    if (items.length === 0) {
      return res.status(400).json({ error: "Faturaya ait ürün/hizmet kalemi bulunamadı." });
    }

    const hasZeroTaxItem = items.some((item: any) => Number(item.tax_rate) === 0);

    const service = await getEInvoiceService(storeId);
    
    // Validate recipient taxpayer number
    const taxNumber = (invoice.tax_number || "").replace(/\D/g, '');
    if (!taxNumber || (taxNumber.length !== 10 && taxNumber.length !== 11)) {
       return res.status(400).json({ error: "Geçerli bir VKN (10 hane) veya TCKN (11 hane) bulunamadı." });
    }

    // Dynamic GİB taxpayer lookup
    let docType = invoice.e_document_type || 'E-ARSIV';
    let pkAlias = '';
    
    // Fetch Store settings for sender parameters
    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) throw new Error("Mağaza ayarları bulunamadı.");
    const row = storeRes.rows[0] || {};
    const settings = row.einvoice_settings || {};
    const branding = row.branding || {};

    try {
      console.log(`[INVOICE-SEND] Querying registry for buyer VKN/TCKN: ${taxNumber}`);
      
      // Check official taxpayer cache first (require non-empty alias)
      const cacheRes = await pool.query("SELECT taxpayer_title, alias FROM official_taxpayer_cache WHERE vkn = $1", [taxNumber]);
      
      let taxpayerCheck;
      if (cacheRes.rows.length > 0 && cacheRes.rows[0].alias && cacheRes.rows[0].alias.trim() !== '') {
        console.log(`[checkTaxpayer (send)] VKN ${taxNumber} found in official cache with valid alias.`);
        taxpayerCheck = { isTaxpayer: true, documentType: 'E-FATURA', title: cacheRes.rows[0].taxpayer_title, alias: cacheRes.rows[0].alias };
      } else {
        taxpayerCheck = await service.checkTaxpayer(taxNumber);
        if (taxpayerCheck && taxpayerCheck.isTaxpayer) {
          await pool.query("INSERT INTO official_taxpayer_cache (vkn, taxpayer_title, alias, last_updated) VALUES ($1, $2, $3, NOW()) ON CONFLICT (vkn) DO UPDATE SET taxpayer_title = EXCLUDED.taxpayer_title, alias = EXCLUDED.alias, last_updated = NOW()", [taxNumber, taxpayerCheck.title || '', taxpayerCheck.alias || '']);
        }
      }
      
      if (taxpayerCheck && taxpayerCheck.isTaxpayer) {
        docType = 'E-FATURA';
        if (taxpayerCheck.alias && taxpayerCheck.alias.trim() !== '') {
          pkAlias = taxpayerCheck.alias;
          console.log(`[INVOICE-SEND] GİB Check: Registered e-Invoice User! Correcting docType to E-FATURA and using alias: ${pkAlias}`);
        } else {
          // If taxpayer is registered but cache had no alias, do a fresh live lookup
          const liveCheck = await service.checkTaxpayer(taxNumber);
          if (liveCheck && liveCheck.alias) {
            pkAlias = liveCheck.alias;
            await pool.query("UPDATE official_taxpayer_cache SET alias = $1, last_updated = NOW() WHERE vkn = $2", [pkAlias, taxNumber]);
            console.log(`[INVOICE-SEND] Fresh GİB lookup found alias: ${pkAlias}`);
          } else {
            pkAlias = '';
            console.log(`[INVOICE-SEND] GİB Check: Registered e-Invoice User. No specific alias returned.`);
          }
        }
      } else {
        docType = 'E-ARSIV';
        console.log(`[INVOICE-SEND] GİB Check: Receiver is not an e-Invoice user. Correcting docType to E-ARSIV.`);
      }
    } catch (checkErr) {
      console.warn("[INVOICE-SEND] Taxpayer GİB registry check failed. Keeping draft selection:", checkErr);
      docType = invoice.e_document_type || 'E-ARSIV';
    }

    if (docType === 'E-FATURA' && (!pkAlias || pkAlias.trim() === "" || pkAlias === 'urn:mail:defaultpk')) {
       // Attempt one last direct lookup before rejecting
       try {
         const finalCheck = await service.checkTaxpayer(taxNumber);
         if (finalCheck && finalCheck.alias) {
           pkAlias = finalCheck.alias;
           await pool.query("UPDATE official_taxpayer_cache SET alias = $1, taxpayer_title = $2, last_updated = NOW() WHERE vkn = $3", [pkAlias, finalCheck.title || '', taxNumber]);
         }
       } catch (e) {
         console.warn("[INVOICE-SEND] Final fallback alias lookup failed:", e);
       }

       if (!pkAlias || pkAlias.trim() === "" || pkAlias === 'urn:mail:defaultpk') {
         return res.status(400).json({ 
           error: `Bu mükellef (${invoice.company_title || invoice.customer_name || taxNumber}) E-Fatura kullanıcısı olarak görünüyor ancak GİB kayıtlarında aktif bir 'Etiket' (Posta Kutusu / Alias) adresi bulunamadı. (VKN: ${taxNumber})` 
         });
       }
    }

    let giInvoiceType = invoice.gi_invoice_type || 'SATIS';
    
    // Auto-upgrade to ISTISNA if there's any 0% tax item and it's currently SATIS
    if (hasZeroTaxItem && giInvoiceType === 'SATIS') {
      giInvoiceType = 'ISTISNA';
    }

    const exemptionCode = invoice.gi_exemption_reason_code || (giInvoiceType === 'ISTISNA' ? '350' : (invoice.tax_exemption_reason ? '350' : null));
    const rawExemptionReason = (invoice.gi_exemption_reason_text || invoice.tax_exemption_reason || "").trim();
    const mappedExemptionLabel = exemptionCode ? (KDV_EXEMPTION_CODES_MAP[exemptionCode] ? `${exemptionCode} - ${KDV_EXEMPTION_CODES_MAP[exemptionCode]}` : `KDV Kanunu Madde ${exemptionCode} İstisnası`) : "350 - Diğerleri (KDV İstisnası)";
    
    // GİB Schematron requires at least 5 characters for TaxExemptionReason
    let exemptionReason = rawExemptionReason;
    if (!exemptionReason || exemptionReason.length < 5) {
      exemptionReason = mappedExemptionLabel;
    }
    const effectiveExemptionCode = String(exemptionCode || "350");
    const effectiveExemptionReason = exemptionReason;
    const withholdingCode = invoice.gi_withholding_tax_code;

    // --- GİB Compliance Validations ---
    if (giInvoiceType === 'IADE') {
       const returnNo = (invoice.return_invoice_number || "").toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
       if (!returnNo) {
          return res.status(400).json({ error: "İade faturaları için 'İade Edilen Fatura No' zorunludur." });
       }
       if (returnNo.length !== 16) {
          return res.status(400).json({ 
             error: `GİB kurallarına göre İADE faturalarında referans gösterilen fatura numarası (İade Edilen Fatura No) tam olarak 16 haneli olmalıdır (3 hane harf öneki, 4 hane yıl ve 9 hane sıra numarası, örn: GIB2026000001234). Girilen değer: "${invoice.return_invoice_number || ''}" (${returnNo.length} hane)` 
          });
       }
       if (!invoice.return_invoice_date) {
          return res.status(400).json({ error: "İade faturaları için 'İade Edilen Fatura Tarihi' zorunludur." });
       }
    }

    if (giInvoiceType === 'ISTISNA' && !exemptionCode) {
       return res.status(400).json({ error: "İstisna faturaları için 'İstisna Muafiyet Kodu' zorunludur." });
    }
    if (giInvoiceType === 'TEVKIFAT' && !withholdingCode) {
       return res.status(400).json({ error: "Tevkifatlı faturalar için 'Tevkifat Kodu' zorunludur." });
    }

    // 2. Email for E-Archive (GİB Mandatory for some scenarios, highly recommended for all)
    const customerEmail = invoice.customer_email || invoice.email;
    if (docType === 'E-ARSIV' && !customerEmail) {
       return res.status(400).json({ error: "E-Arşiv faturaları için müşteri e-posta adresi zorunludur." });
    }

    console.log(`[INVOICE-SEND] settings: ${JSON.stringify(settings).substring(0, 100)}`);

    // Determine Store VKN for tenantIdentifierNumber
    let storeTaxNumber = (settings.vkn || settings.tax_number || branding.tax_number || "").replace(/\s/g, '').replace(/\D/g, '');
    if (!storeTaxNumber && settings.tenant_id && (settings.tenant_id.length === 10 || settings.tenant_id.length === 11)) {
      storeTaxNumber = settings.tenant_id.replace(/\s/g, '').replace(/\D/g, '');
    }

    if (!storeTaxNumber || (storeTaxNumber.length !== 10 && storeTaxNumber.length !== 11)) {
      return res.status(400).json({ 
        error: `Geçersiz veya eksik Firma VKN/TCKN (${storeTaxNumber || 'Boş'}). Lütfen Ayarlar > E-Fatura paneline gidin, 10 haneli Vergi Kimlik Numarasını (VKN) veya 11 haneli T.C. Kimlik Numarasını (TCKN) girerek kaydedin.`
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (customerEmail && !emailRegex.test(customerEmail)) {
        res.status(400).json({ error: "Geçerli bir müşteri e-posta adresi girilmelidir." });
        return;
    }
    
    // Ensure ETTN and Document Number are present and atomic
    let documentNumber = invoice.document_number;
    ettn = invoice.ettn;
    
    // Determine expected prefix based on CORRECTED docType and defined series
    const seriesList: any[] = Array.isArray(settings.series_list) ? settings.series_list : [];
    const requestedPrefix = (req.body?.prefix || invoice.prefix || '').toUpperCase().substring(0, 3);
    const existingDocPrefix = (documentNumber || '').toUpperCase().substring(0, 3);
    const existingInvPrefix = (invoice.invoice_number || '').toUpperCase().substring(0, 3);

    let expectedPrefix = '';
    const matchingSeries = seriesList.find((s: any) => 
      s.prefix && (s.prefix.toUpperCase() === requestedPrefix || s.prefix.toUpperCase() === existingDocPrefix || s.prefix.toUpperCase() === existingInvPrefix) &&
      (s.type === docType || s.type === 'ALL')
    );

    if (matchingSeries) {
      expectedPrefix = matchingSeries.prefix.toUpperCase();
    } else {
      const defaultSeries = seriesList.find((s: any) => s.is_default && (s.type === docType || s.type === 'ALL'));
      if (defaultSeries && defaultSeries.prefix) {
        expectedPrefix = defaultSeries.prefix.toUpperCase();
      } else {
        expectedPrefix = docType === 'E-FATURA' ? (settings.einvoice_prefix || 'GEF') : (settings.earchive_prefix || 'GEA');
      }
    }
    expectedPrefix = expectedPrefix.substring(0, 3).padEnd(3, 'X');
    const actualPrefix = documentNumber ? documentNumber.substring(0, 3) : '';
    
    // If the docType changed or prefix doesn't match the designated series, regenerate document number!
    const docTypeMismatch = invoice.e_document_type && invoice.e_document_type !== docType;
    const isIncorrectPrefix = actualPrefix && actualPrefix.toUpperCase() !== expectedPrefix.toUpperCase();
    
    console.log(`[INVOICE-SEND] Invoice ID: ${invoiceId}, Existing DocNumber: ${documentNumber}, Expected Prefix: ${expectedPrefix}, Mismatch? ${docTypeMismatch || isIncorrectPrefix}`);
    
    // Only regenerate if documentNumber is missing, ETTN is missing, or it's the first attempt and there's a configuration mismatch.
    if (!documentNumber || !ettn || ((!invoice.integration_status || invoice.integration_status === 'UNKNOWN') && (docTypeMismatch || isIncorrectPrefix))) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        
        // Regenerate doc number using prefix with invoice date year
        let prefix = expectedPrefix.toUpperCase().substring(0, 3).padEnd(3, 'X');
        const currentYear = (invoice.invoice_date ? new Date(invoice.invoice_date).getFullYear() : new Date().getFullYear()).toString();
        const prefixWithYear = `${prefix}${currentYear}`;
        
        const seqRes = await client.query(
           `SELECT COALESCE(document_number, invoice_number) as doc_num 
            FROM sales_invoices 
            WHERE store_id = $1 
              AND (document_number LIKE $2 OR invoice_number LIKE $2) 
              AND (LENGTH(document_number) = 16 OR LENGTH(invoice_number) = 16) 
            ORDER BY COALESCE(document_number, invoice_number) DESC 
            LIMIT 1 FOR UPDATE`,
           [storeId, `${prefixWithYear}%`]
        );
        
        let nextSequenceNumber = 1;
        if (seqRes.rows.length > 0) {
            const lastDocNum = seqRes.rows[0].doc_num;
            const lastSequencePart = lastDocNum.substring(7);
            const parsedSeq = parseInt(lastSequencePart, 10);
            if (!isNaN(parsedSeq)) {
               nextSequenceNumber = parsedSeq + 1;
            }
        }
        
        const sequenceString = nextSequenceNumber.toString().padStart(9, '0');
        documentNumber = `${prefixWithYear}${sequenceString}`;
        invoice.document_number = documentNumber;

        // Regenerate ETTN if docTypeMismatch, isIncorrectPrefix, or if previous attempt was in draft/failed/error state to ensure clean submission
        if (!ettn || docTypeMismatch || isIncorrectPrefix || invoice.integration_status === 'HATALI' || invoice.integration_status === 'FAILED' || invoice.integration_status === 'DRAFT') {
          ettn = crypto.randomUUID();
          invoice.ettn = ettn;
        }
        
        invoice.e_document_type = docType;
        if (giInvoiceType === 'IADE') {
          invoice.invoice_profile = docType === 'E-ARSIV' ? 'EARSIVFATURA' : 'TEMELFATURA';
        } else {
          invoice.invoice_profile = docType === 'E-ARSIV' ? 'EARSIVFATURA' : (invoice.invoice_profile || 'TEMELFATURA');
        }
        
        // Save correct document_number, ettn, e_document_type, and set invoice_profile to EARSIVFATURA if E-Arşiv
        await client.query(
           "UPDATE sales_invoices SET document_number = $1, ettn = $2, e_document_type = $3, invoice_profile = $4 WHERE id = $5",
           [documentNumber, ettn, docType, invoice.invoice_profile, invoiceId]
        );
        await client.query("COMMIT");
        console.log(`[INVOICE-SEND] Updated draft number: ${documentNumber}, updated docType: ${docType}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    // If previously failed or error state, assign fresh ETTN for clean retry
    if (invoice.integration_status === 'HATALI' || invoice.integration_status === 'FAILED') {
      ettn = crypto.randomUUID();
      invoice.ettn = ettn;
      await pool.query("UPDATE sales_invoices SET ettn = $1 WHERE id = $2", [ettn, invoiceId]);
      console.log(`[INVOICE-SEND] Refreshed ETTN for previously failed invoice: ${ettn}`);
    }

    // Determine Party Information
    console.log("[DEBUG-INVOICE-DATA] Invoice Object:", JSON.stringify(invoice, null, 2));

    const isCorporate = taxNumber.length === 10;
    // Prioritize explicitly stored title or name, fallback to generic
    let customerName = invoice.company_title || invoice.customer_name || invoice.sale_customer_name || 'Bilinmeyen Müşteri';
    let customerTitle = customerName;
    let taxOffice = invoice.tax_office || "BilinmeyenVD";
    let address = invoice.address || "Girilmemiş Adres, Türkiye";
    
    console.log(`[DEBUG-CUSTOMER] Name: ${customerName}, Title: ${customerTitle}`);

    // Improved Address handling for GİB/MySoft
    let cityName = (invoice.customer_city || invoice.city || "").toString().trim().toUpperCase();
    let districtName = (invoice.customer_district || invoice.district || "").toString().trim().toUpperCase();
    let cleanAddress = (address || "").replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cityName && cleanAddress) {
       const cleanAddr = cleanAddress.replace(/, Türkiye/gi, '').replace(/,Turkey/gi, '').trim();
       const parts = cleanAddr.split(/[,/]+/).map(p => p.trim()).filter(Boolean);
       if (parts.length >= 2) {
          cityName = parts[parts.length - 1].toUpperCase().substring(0, 30);
          districtName = districtName || parts[parts.length - 2].toUpperCase().substring(0, 30);
       } else if (parts.length === 1) {
          cityName = parts[0].toUpperCase().substring(0, 30);
       }
    }
    if (!cityName) cityName = "İSTANBUL";
    if (!districtName) districtName = "MERKEZ";

    // Date formatting
    const docDate = new Date(invoice.invoice_date || new Date());
    if (isNaN(docDate.getTime())) {
      return res.status(400).json({ error: "Fatura tarihi geçersiz." });
    }
    const formattedDate = docDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
    
    // Time formatting - use local TR time (UTC+3) rather than UTC
    let formattedTime = "12:00:00";
    try {
      // Create a date string in YYYY-MM-DD HH:mm:ss format which MySoft often expects for docTime
      const now = new Date(docDate.getTime() + (3 * 60 * 60 * 1000));
      const timePart = now.toISOString().split('T')[1].substring(0, 8);
      formattedTime = `${formattedDate} ${timePart}`;
    } catch (e) {
      console.warn("Could not format time from docDate, using default");
      formattedTime = `${formattedDate} 12:00:00`;
    }
    
    if (invoice.invoice_time) {
        // user provided time, ensure it's in HH:mm:ss format and combine with date
        let userTime = "12:00:00";
        if (invoice.invoice_time.length === 5) {
            userTime = invoice.invoice_time + ":00";
        } else if (invoice.invoice_time.length >= 8) {
            userTime = invoice.invoice_time.substring(0, 8);
        }
        formattedTime = `${formattedDate} ${userTime}`;
    }

    const nameParts = (invoice.customer_name || "").split(' ');
    const surname = nameParts.length > 1 ? nameParts.pop() : "";
    const name = nameParts.join(' ') || (invoice.customer_name || "Müşteri");

    // LINES (mapped to invoiceDetail for MySoft)
    const isTaxInclusive = !!invoice.is_tax_inclusive;
    const InvoiceDetail = items.map((item, index) => {
      const qty = Number(String(item.quantity).replace(',', '.')) || 1;
      const price = Number(String(item.unit_price).replace(',', '.')) || 0;
      const taxRate = Number(String(item.tax_rate).replace(',', '.')) || 0;
      
      let lineExtensionAmount: number; // tax exclusive total
      let unitPrice: number; // tax exclusive unit price
      let taxAmount: number;

      if (isTaxInclusive) {
        const itemTotalIncl = qty * price;
        lineExtensionAmount = itemTotalIncl / (1 + (taxRate / 100));
        unitPrice = lineExtensionAmount / qty;
        taxAmount = itemTotalIncl - lineExtensionAmount;
      } else {
        lineExtensionAmount = qty * price;
        unitPrice = price;
        taxAmount = (lineExtensionAmount * taxRate) / 100;
      }

      const rawUnit = (item.unit_code || "").trim();
      const norm = rawUnit.toLowerCase();
      const unitMapping: { [key: string]: string } = {
        "adet": "C62",
        "ad": "C62",
        "pcs": "C62",
        "piece": "C62",
        "kg": "KGM",
        "kilogram": "KGM",
        "gr": "GRM",
        "litre": "LTR",
        "lt": "LTR",
        "meter": "MTR",
        "metre": "MTR",
        "paket": "PA",
        "kutu": "BX",
        "ton": "TNE",
        "metrekare": "MTK",
        "m2": "MTK",
        "gün": "DAY",
        "gun": "DAY",
        "saat": "HUR",
        "ay": "MON",
        "yıl": "ANN"
      };
      const unitCodeVal = rawUnit ? (unitMapping[norm] || rawUnit) : UNIT_CODES.PIECE;
      const isItemZeroOrExempt = Number(taxRate) === 0 || giInvoiceType === 'ISTISNA' || Number(taxAmount) === 0;

      const lineSubObj: any = {
        taxableAmount: Number(lineExtensionAmount.toFixed(2)),
        TaxableAmount: Number(lineExtensionAmount.toFixed(2)),
        taxAmount: Number(taxAmount.toFixed(2)),
        TaxAmount: Number(taxAmount.toFixed(2)),
        calculationSequenceNumeric: 0,
        CalculationSequenceNumeric: 0,
        percent: Number(taxRate.toFixed(2)),
        Percent: Number(taxRate.toFixed(2)),
        taxName: "Katma Değer Vergisi",
        TaxName: "Katma Değer Vergisi",
        taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
        TaxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
        taxCategory: {
          taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
          TaxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
          name: "Katma Değer Vergisi",
          Name: "Katma Değer Vergisi",
          taxScheme: {
            name: "Katma Değer Vergisi",
            Name: "Katma Değer Vergisi",
            taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
            TaxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV
          },
          TaxScheme: {
            name: "Katma Değer Vergisi",
            Name: "Katma Değer Vergisi",
            taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
            TaxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV
          },
          ...(isItemZeroOrExempt ? {
            taxExemptionReasonCode: effectiveExemptionCode,
            taxExemptionReasonName: effectiveExemptionReason,
            taxExemptionReason: effectiveExemptionReason,
            taxExemptionReasonText: effectiveExemptionReason,
            exemptionReasonCode: effectiveExemptionCode,
            exemptionReason: effectiveExemptionReason,
            TaxExemptionReasonCode: effectiveExemptionCode,
            TaxExemptionReasonName: effectiveExemptionReason,
            TaxExemptionReason: effectiveExemptionReason
          } : {})
        },
        TaxCategory: {
          taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
          TaxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
          name: "Katma Değer Vergisi",
          Name: "Katma Değer Vergisi",
          taxScheme: {
            name: "Katma Değer Vergisi",
            Name: "Katma Değer Vergisi",
            taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
            TaxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV
          },
          TaxScheme: {
            name: "Katma Değer Vergisi",
            Name: "Katma Değer Vergisi",
            taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
            TaxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV
          },
          ...(isItemZeroOrExempt ? {
            taxExemptionReasonCode: effectiveExemptionCode,
            taxExemptionReasonName: effectiveExemptionReason,
            taxExemptionReason: effectiveExemptionReason,
            taxExemptionReasonText: effectiveExemptionReason,
            exemptionReasonCode: effectiveExemptionCode,
            exemptionReason: effectiveExemptionReason,
            TaxExemptionReasonCode: effectiveExemptionCode,
            TaxExemptionReasonName: effectiveExemptionReason,
            TaxExemptionReason: effectiveExemptionReason
          } : {})
        },
        ...(isItemZeroOrExempt ? {
          taxExemptionReasonCode: effectiveExemptionCode,
          taxExemptionReasonName: effectiveExemptionReason,
          taxExemptionReason: effectiveExemptionReason,
          taxExemptionReasonText: effectiveExemptionReason,
          exemptionReasonCode: effectiveExemptionCode,
          exemptionReason: effectiveExemptionReason,
          TaxExemptionReasonCode: effectiveExemptionCode,
          TaxExemptionReasonName: effectiveExemptionReason,
          TaxExemptionReason: effectiveExemptionReason
        } : {})
      };

      const lineTaxTotalStructure = [
        {
          taxAmount: Number(taxAmount.toFixed(2)),
          TaxAmount: Number(taxAmount.toFixed(2)),
          taxSubtotalList: [lineSubObj],
          ...(isItemZeroOrExempt ? {
            taxExemptionReasonCode: effectiveExemptionCode,
            taxExemptionReasonName: effectiveExemptionReason,
            taxExemptionReason: effectiveExemptionReason,
            taxExemptionReasonText: effectiveExemptionReason,
            exemptionReasonCode: effectiveExemptionCode,
            exemptionReason: effectiveExemptionReason,
            TaxExemptionReasonCode: effectiveExemptionCode,
            TaxExemptionReasonName: effectiveExemptionReason,
            TaxExemptionReason: effectiveExemptionReason
          } : {})
        }
      ];

      return {
        lineNumber: index + 1,
        lineId: String(index + 1),
        itemName: item.product_name || "Ürün/Hizmet",
        name: item.product_name || "Ürün/Hizmet",
        productName: item.product_name || "Ürün/Hizmet",
        quantity: Number(qty.toFixed(4)),
        qty: Number(qty.toFixed(4)),
        unitCode: unitCodeVal,
        price: Number(unitPrice.toFixed(4)),
        unitPrice: Number(unitPrice.toFixed(4)),
        unitPriceTra: Number(unitPrice.toFixed(4)),
        allowance: 0.0,
        lineTotal: Number(lineExtensionAmount.toFixed(2)),
        amtTra: Number(lineExtensionAmount.toFixed(2)),
        lineExtensionAmount: Number(lineExtensionAmount.toFixed(2)),
        vatRate: Number(taxRate.toFixed(2)),
        percent: Number(taxRate.toFixed(2)),
        amtVatTra: Number(taxAmount.toFixed(2)),
        taxAmount: Number(taxAmount.toFixed(2)),
        taxableAmtTra: Number(lineExtensionAmount.toFixed(2)),
        taxableAmount: Number(lineExtensionAmount.toFixed(2)),
        taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
        taxTotal: lineTaxTotalStructure,
        taxes: [
          {
            taxCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
            taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
            taxRate: Number(taxRate.toFixed(2)),
            taxAmount: Number(taxAmount.toFixed(2)),
            ...(isItemZeroOrExempt ? {
              taxExemptionReasonCode: effectiveExemptionCode,
              taxExemptionReasonName: effectiveExemptionReason,
              taxExemptionReason: effectiveExemptionReason,
              taxExemptionReasonText: effectiveExemptionReason,
              exemptionReasonCode: effectiveExemptionCode,
              exemptionReason: effectiveExemptionReason,
              TaxExemptionReasonCode: effectiveExemptionCode,
              TaxExemptionReasonName: effectiveExemptionReason,
              TaxExemptionReason: effectiveExemptionReason
            } : {})
          }
        ],
        taxLists: [
          {
            taxCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
            taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
            taxRate: Number(taxRate.toFixed(2)),
            taxAmount: Number(taxAmount.toFixed(2)),
            ...(isItemZeroOrExempt ? {
              taxExemptionReasonCode: effectiveExemptionCode,
              taxExemptionReasonName: effectiveExemptionReason,
              taxExemptionReason: effectiveExemptionReason,
              taxExemptionReasonText: effectiveExemptionReason,
              exemptionReasonCode: effectiveExemptionCode,
              exemptionReason: effectiveExemptionReason,
              TaxExemptionReasonCode: effectiveExemptionCode,
              TaxExemptionReasonName: effectiveExemptionReason,
              TaxExemptionReason: effectiveExemptionReason
            } : {})
          }
        ],
        taxCategory: {
          taxScheme: {
            name: "Katma Değer Vergisi",
            taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV
          },
          ...(isItemZeroOrExempt ? {
            taxExemptionReasonCode: effectiveExemptionCode,
            taxExemptionReasonName: effectiveExemptionReason,
            taxExemptionReason: effectiveExemptionReason,
            taxExemptionReasonText: effectiveExemptionReason,
            exemptionReasonCode: effectiveExemptionCode,
            exemptionReason: effectiveExemptionReason,
            TaxExemptionReasonCode: effectiveExemptionCode,
            TaxExemptionReasonName: effectiveExemptionReason,
            TaxExemptionReason: effectiveExemptionReason
          } : {})
        },
        TaxCategory: {
          TaxScheme: {
            Name: "Katma Değer Vergisi",
            TaxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV
          },
          ...(isItemZeroOrExempt ? {
            taxExemptionReasonCode: effectiveExemptionCode,
            taxExemptionReasonName: effectiveExemptionReason,
            taxExemptionReason: effectiveExemptionReason,
            taxExemptionReasonText: effectiveExemptionReason,
            exemptionReasonCode: effectiveExemptionCode,
            exemptionReason: effectiveExemptionReason,
            TaxExemptionReasonCode: effectiveExemptionCode,
            TaxExemptionReasonName: effectiveExemptionReason,
            TaxExemptionReason: effectiveExemptionReason
          } : {})
        },
        ...(isItemZeroOrExempt ? {
          taxExemptionReasonCode: effectiveExemptionCode,
          taxExemptionReasonName: effectiveExemptionReason,
          taxExemptionReason: effectiveExemptionReason,
          taxExemptionReasonText: effectiveExemptionReason,
          exemptionReasonCode: effectiveExemptionCode,
          exemptionReason: effectiveExemptionReason,
          TaxExemptionReasonCode: effectiveExemptionCode,
          TaxExemptionReasonName: effectiveExemptionReason,
          TaxExemptionReason: effectiveExemptionReason
        } : {})
      };
    });

    // Construct UBL JSON Data matching MySoft standard payload (Outbox format)
    if (!invoice.document_number) throw new Error("Fatura numarası oluşturulamadı.");
    
    // Explicitly compute totals from lines to ensure consistency
    const totalLineExtension = InvoiceDetail.reduce((acc, item) => acc + Number(item.amtTra), 0);
    const totalTax = InvoiceDetail.reduce((acc, item) => acc + Number(item.amtVatTra), 0);
    const grandTotal = totalLineExtension + totalTax;

    const taxSubTotals = (() => {
       const groups: { [key: string]: { taxableAmount: number; taxAmount: number } } = {};
       InvoiceDetail.forEach(detail => {
          const rate = String(Number(detail.vatRate || detail.percent || 0));
          const taxable = Number(detail.taxableAmtTra || detail.taxableAmount || 0);
          const tax = Number(detail.amtVatTra || detail.taxAmount || 0);
          if (!groups[rate]) {
             groups[rate] = { taxableAmount: 0, taxAmount: 0 };
          }
          groups[rate].taxableAmount += taxable;
          groups[rate].taxAmount += tax;
       });
       return Object.keys(groups).map(rate => {
          const numRate = Number(rate);
          const isZeroOrExempt = numRate === 0 || giInvoiceType === 'ISTISNA' || groups[rate].taxAmount === 0;
          const subObj: any = {
             taxableAmount: Number(groups[rate].taxableAmount.toFixed(2)),
             TaxableAmount: Number(groups[rate].taxableAmount.toFixed(2)),
             taxAmount: Number(groups[rate].taxAmount.toFixed(2)),
             TaxAmount: Number(groups[rate].taxAmount.toFixed(2)),
             calculationSequenceNumeric: 0,
             CalculationSequenceNumeric: 0,
             percent: numRate,
             Percent: numRate,
             taxName: "Katma Değer Vergisi",
             TaxName: "Katma Değer Vergisi",
             taxTypeCode: "0015",
             TaxTypeCode: "0015",
             taxCategory: {
               taxTypeCode: "0015",
               TaxTypeCode: "0015",
               name: "Katma Değer Vergisi",
               Name: "Katma Değer Vergisi",
               taxScheme: {
                 name: "Katma Değer Vergisi",
                 Name: "Katma Değer Vergisi",
                 taxTypeCode: "0015",
                 TaxTypeCode: "0015"
               },
               TaxScheme: {
                 name: "Katma Değer Vergisi",
                 Name: "Katma Değer Vergisi",
                 taxTypeCode: "0015",
                 TaxTypeCode: "0015"
               }
             },
             TaxCategory: {
               taxTypeCode: "0015",
               TaxTypeCode: "0015",
               name: "Katma Değer Vergisi",
               Name: "Katma Değer Vergisi",
               taxScheme: {
                 name: "Katma Değer Vergisi",
                 Name: "Katma Değer Vergisi",
                 taxTypeCode: "0015",
                 TaxTypeCode: "0015"
               },
               TaxScheme: {
                 name: "Katma Değer Vergisi",
                 Name: "Katma Değer Vergisi",
                 taxTypeCode: "0015",
                 TaxTypeCode: "0015"
               }
             }
          };
          if (isZeroOrExempt) {
             subObj.taxExemptionReasonCode = effectiveExemptionCode;
             subObj.taxExemptionReasonName = effectiveExemptionReason;
             subObj.taxExemptionReason = effectiveExemptionReason;
             subObj.taxExemptionReasonText = effectiveExemptionReason;
             subObj.exemptionReasonCode = effectiveExemptionCode;
             subObj.exemptionReason = effectiveExemptionReason;
             subObj.TaxExemptionReasonCode = effectiveExemptionCode;
             subObj.TaxExemptionReasonName = effectiveExemptionReason;
             subObj.TaxExemptionReason = effectiveExemptionReason;
             
             subObj.taxCategory.taxExemptionReasonCode = effectiveExemptionCode;
             subObj.taxCategory.taxExemptionReasonName = effectiveExemptionReason;
             subObj.taxCategory.taxExemptionReason = effectiveExemptionReason;
             subObj.taxCategory.taxExemptionReasonText = effectiveExemptionReason;
             subObj.taxCategory.exemptionReasonCode = effectiveExemptionCode;
             subObj.taxCategory.exemptionReason = effectiveExemptionReason;
             subObj.taxCategory.TaxExemptionReasonCode = effectiveExemptionCode;
             subObj.taxCategory.TaxExemptionReasonName = effectiveExemptionReason;
             subObj.taxCategory.TaxExemptionReason = effectiveExemptionReason;

             subObj.TaxCategory.taxExemptionReasonCode = effectiveExemptionCode;
             subObj.TaxCategory.taxExemptionReasonName = effectiveExemptionReason;
             subObj.TaxCategory.taxExemptionReason = effectiveExemptionReason;
             subObj.TaxCategory.taxExemptionReasonText = effectiveExemptionReason;
             subObj.TaxCategory.exemptionReasonCode = effectiveExemptionCode;
             subObj.TaxCategory.exemptionReason = effectiveExemptionReason;
             subObj.TaxCategory.TaxExemptionReasonCode = effectiveExemptionCode;
             subObj.TaxCategory.TaxExemptionReasonName = effectiveExemptionReason;
             subObj.TaxCategory.TaxExemptionReason = effectiveExemptionReason;
          }
          return subObj;
       });
    })();

    const taxTotalItem: any = {
       taxAmount: Number(totalTax.toFixed(2)),
       TaxAmount: Number(totalTax.toFixed(2)),
       taxSubtotalList: taxSubTotals
    };
    if (giInvoiceType === 'ISTISNA' || totalTax === 0) {
       taxTotalItem.taxExemptionReasonCode = effectiveExemptionCode;
       taxTotalItem.taxExemptionReasonName = effectiveExemptionReason;
       taxTotalItem.taxExemptionReason = effectiveExemptionReason;
       taxTotalItem.taxExemptionReasonText = effectiveExemptionReason;
       taxTotalItem.exemptionReasonCode = effectiveExemptionCode;
       taxTotalItem.exemptionReason = effectiveExemptionReason;
       taxTotalItem.TaxExemptionReasonCode = effectiveExemptionCode;
       taxTotalItem.TaxExemptionReasonName = effectiveExemptionReason;
       taxTotalItem.TaxExemptionReason = effectiveExemptionReason;
    }

    const taxStructure = [taxTotalItem];

    const ublData: any = {
       isCalculateByApi: false,
       isManuelCalculation: true,
       id: 0, 
       connectorGuid: settings.connector_guid || undefined,
       eDocumentType: docType === 'E-FATURA' ? 'EFATURA' : 'EARSIVFATURA',
       profile: (() => {
          if (giInvoiceType === 'IADE') {
             return docType === 'E-ARSIV' ? 'EARSIVFATURA' : 'TEMELFATURA';
          }
          return docType === 'E-ARSIV' ? 'TEMELFATURA' : (invoice.invoice_profile || 'TEMELFATURA');
       })(),
       invoiceProfileDescription: (() => {
          if (giInvoiceType === 'IADE') {
             return docType === 'E-ARSIV' ? 'EARSIVFATURA' : 'TEMELFATURA';
          }
          return docType === 'E-ARSIV' ? 'TEMELFATURA' : (invoice.invoice_profile || 'TEMELFATURA');
       })(),
       invoiceType: giInvoiceType,
       documentTypeCode: giInvoiceType,
       invoiceTypeCodeDescription: giInvoiceType,
       docDate: formattedDate,
       issueDate: formattedDate,
       docTime: formattedTime,
       issueTime: formattedTime,
       ettn: ettn,
       uuid: ettn,
       docNo: documentNumber,
       documentNo: documentNumber,
       invoiceNumber: documentNumber,
       note: (() => {
          let n = (invoice.notes || "").trim();
          const bankDetails = (branding?.payment_settings?.bank_details || branding?.payment_settings?.hotel_bank_details || "").trim();
          if (!n) {
             return ["İrsaliye Yerine Geçer.", bankDetails ? `Banka Hesap ve IBAN Bilgileri:\n${bankDetails}` : ""].filter(Boolean).join("\n\n");
          }
          let res = n;
          if (!res.includes("İrsaliye Yerine Geçer")) {
             res = `İrsaliye Yerine Geçer.\n\n${res}`;
          }
          if (bankDetails && !res.includes(bankDetails.substring(0, 8))) {
             res = `${res}\n\nBanka Hesap ve IBAN Bilgileri:\n${bankDetails}`;
          }
          return res;
       })(),
       notes: (() => {
          let n = (invoice.notes || "").trim();
          const bankDetails = (branding?.payment_settings?.bank_details || branding?.payment_settings?.hotel_bank_details || "").trim();
          let res = n || ["İrsaliye Yerine Geçer.", bankDetails ? `Banka Hesap ve IBAN Bilgileri:\n${bankDetails}` : ""].filter(Boolean).join("\n\n");
          if (!res.includes("İrsaliye Yerine Geçer")) res = `İrsaliye Yerine Geçer.\n\n${res}`;
          if (bankDetails && !res.includes(bankDetails.substring(0, 8))) res = `${res}\n\nBanka Hesap ve IBAN Bilgileri:\n${bankDetails}`;
          return res.split('\n').map((str: string) => ({ note: str.trim() })).filter((obj: any) => obj.note);
       })(),
       noteList: (() => {
          let n = (invoice.notes || "").trim();
          const bankDetails = (branding?.payment_settings?.bank_details || branding?.payment_settings?.hotel_bank_details || "").trim();
          let res = n || ["İrsaliye Yerine Geçer.", bankDetails ? `Banka Hesap ve IBAN Bilgileri:\n${bankDetails}` : ""].filter(Boolean).join("\n\n");
          if (!res.includes("İrsaliye Yerine Geçer")) res = `İrsaliye Yerine Geçer.\n\n${res}`;
          if (bankDetails && !res.includes(bankDetails.substring(0, 8))) res = `${res}\n\nBanka Hesap ve IBAN Bilgileri:\n${bankDetails}`;
          return res.split('\n').map((str: string) => str.trim()).filter(Boolean);
       })(),
       notesList: (() => {
          let n = (invoice.notes || "").trim();
          const bankDetails = (branding?.payment_settings?.bank_details || branding?.payment_settings?.hotel_bank_details || "").trim();
          let res = n || ["İrsaliye Yerine Geçer.", bankDetails ? `Banka Hesap ve IBAN Bilgileri:\n${bankDetails}` : ""].filter(Boolean).join("\n\n");
          if (!res.includes("İrsaliye Yerine Geçer")) res = `İrsaliye Yerine Geçer.\n\n${res}`;
          if (bankDetails && !res.includes(bankDetails.substring(0, 8))) res = `${res}\n\nBanka Hesap ve IBAN Bilgileri:\n${bankDetails}`;
          return res.split('\n').map((str: string) => str.trim()).filter(Boolean);
       })(),
       currencyCode: (invoice.currency || 'TRY').toUpperCase(),
       currencyRate: String(Number(Number(invoice.exchange_rate || 1).toFixed(4))),
       tenantIdentifierNumber: storeTaxNumber,
       dueDate: invoice.due_date ? String(invoice.due_date).split('T')[0] : undefined,
       paymentDueDate: invoice.due_date ? String(invoice.due_date).split('T')[0] : undefined,
       paymentTerms: invoice.due_days ? `${invoice.due_days} Gün Vade` : undefined,
       
       pkAlias: docType === 'E-FATURA' ? pkAlias : undefined,
       gbAlias: settings.sender_alias || undefined,
       senderAlias: settings.sender_alias || undefined,
       
       // Handle Billing Reference for Return (IADE) Invoices (Mandatory UBL fields)
       ...(giInvoiceType === 'IADE' && invoice.return_invoice_number ? (() => {
          // Helper to format invoice number to exactly 16 characters required by GİB Schematron check
          const formatInvoiceNumber16 = (input: string, fallbackYear = "2026"): string => {
             let cleaned = (input || "").toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
             if (cleaned.length === 16) {
                return cleaned;
             }
             if (!cleaned) {
                return `IAD${fallbackYear}000000001`;
             }
             const prefixMatch = cleaned.match(/^([A-Z]{3})/);
             const prefix = prefixMatch ? prefixMatch[1] : "IAD";
             let rest = prefixMatch ? cleaned.substring(3) : cleaned;
             const yearMatch = rest.match(/(20\d{2})/);
             const year = yearMatch ? yearMatch[1] : fallbackYear;
             if (yearMatch) {
                rest = rest.replace(year, '');
             }
             const sequenceDigits = rest.replace(/[^0-9]/g, '');
             const sequenceStr = sequenceDigits ? sequenceDigits.substring(0, 9) : "1";
             const paddedSequence = sequenceStr.padStart(9, '0');
             return `${prefix}${year}${paddedSequence}`;
          };

          const refId = formatInvoiceNumber16(invoice.return_invoice_number, formattedDate.substring(0, 4));

          // Robustly format reference date to YYYY-MM-DD string
          let refDate = formattedDate;
          if (invoice.return_invoice_date) {
             try {
                const rDate = new Date(invoice.return_invoice_date);
                if (!isNaN(rDate.getTime())) {
                   refDate = rDate.toISOString().split('T')[0];
                } else {
                   const rawDateStr = String(invoice.return_invoice_date);
                   refDate = rawDateStr.includes('T') ? rawDateStr.split('T')[0] : rawDateStr;
                }
             } catch (e) {
                const rawDateStr = String(invoice.return_invoice_date);
                refDate = rawDateStr.includes('T') ? rawDateStr.split('T')[0] : rawDateStr;
             }
          }
          
          return {
             // Standard Mysoft root-level properties for return referencing (e-Invoice / e-Archive outbox schema)
             billingRefInvoiceNo: refId,
             billingRefInvoiceDate: refDate,
             billingRefInvoiceTypeCode: 'IADE',

             // 1. Nested array variations (most common for modern standard-compliant integrators)
             billingReference: [
                {
                   invoiceDocumentReference: {
                      id: refId,
                      issueDate: refDate,
                      documentTypeCode: 'IADE',
                      documentType: 'IADE'
                   }
                }
             ],
             billingReferences: [
                {
                   invoiceDocumentReference: {
                      id: refId,
                      issueDate: refDate,
                      documentTypeCode: 'IADE',
                      documentType: 'IADE'
                   }
                }
             ],
             BillingReference: [
                {
                   InvoiceDocumentReference: {
                      ID: refId,
                      IssueDate: refDate,
                      DocumentTypeCode: 'IADE',
                      DocumentType: 'IADE'
                   }
                }
             ],
             BillingReferences: [
                {
                   InvoiceDocumentReference: {
                      ID: refId,
                      IssueDate: refDate,
                      DocumentTypeCode: 'IADE',
                      DocumentType: 'IADE'
                   }
                }
             ],

             // 2. Nested single object variations (for APIs that simplify singleton arrays to single objects)
             billingReferenceObject: {
                invoiceDocumentReference: {
                   id: refId,
                   issueDate: refDate,
                   documentTypeCode: 'IADE',
                   documentType: 'IADE'
                }
             },
             BillingReferenceObject: {
                InvoiceDocumentReference: {
                   ID: refId,
                   IssueDate: refDate,
                   DocumentTypeCode: 'IADE',
                   DocumentType: 'IADE'
                }
             },

             // 3. Flat list variations (for simplified APIs that flatten the intermediate UBL layer)
             billingReferenceFlatList: [
                {
                   id: refId,
                   issueDate: refDate,
                   documentTypeCode: 'IADE',
                   documentType: 'IADE'
                }
             ],
             billingReferencesFlatList: [
                {
                   id: refId,
                   issueDate: refDate,
                   documentTypeCode: 'IADE',
                   documentType: 'IADE'
                }
             ],

             // 4. Flat direct key variations
             billingRefList: [
                {
                   id: refId,
                   issueDate: refDate,
                   documentTypeCode: 'IADE'
                }
             ],
             billingRef: {
                id: refId,
                issueDate: refDate,
                documentTypeCode: 'IADE'
             },
             BillingRef: {
                ID: refId,
                IssueDate: refDate,
                DocumentTypeCode: 'IADE'
             },

             // 5. Additional references variations (such as Izibiz, or generic XML attachment models)
             additionalReferences: [
                {
                   id: refId,
                   issueDate: refDate,
                   documentTypeCode: 'IADE',
                   documentType: 'IADE'
                }
             ],
             additionalDocumentReference: [
                {
                   id: refId,
                   issueDate: refDate,
                   documentTypeCode: 'IADE',
                   documentType: 'IADE'
                }
             ],
             AdditionalDocumentReference: [
                {
                   ID: refId,
                   IssueDate: refDate,
                   DocumentTypeCode: 'IADE',
                   DocumentType: 'IADE'
                }
             ]
          };
       })() : {}),
       
       customerTaxNumber: taxNumber,
       customerTitle: (customerTitle || (isCorporate ? customerTitle : `${name} ${surname}`)).substring(0, 100),
       customerTaxOffice: taxOffice || "",
       customerAddress: (cleanAddress || "Girilmemiş Adres").substring(0, 250),
       customerCity: cityName || "İSTANBUL",
       customerCountry: "Türkiye",

       buyerInformation: {
          vknTckn: taxNumber,
          title: (customerTitle || (isCorporate ? customerTitle : `${name} ${surname}`)).substring(0, 100),
          taxOffice: taxOffice || "",
          address: (cleanAddress || "Girilmemiş Adres").substring(0, 250),
          city: cityName || "İSTANBUL",
          country: "Türkiye"
       },
       
       invoiceAccount: {
          vknTckn: taxNumber,
          accountName: (customerTitle || (isCorporate ? customerTitle : `${name} ${surname}`)).substring(0, 100),
          taxOfficeName: taxOffice || "",
          email1: customerEmail || "",
          countryName: "Türkiye",
          cityName: cityName || "İSTANBUL",
          citySubdivision: districtName || "MERKEZ",
          streetName: (cleanAddress || "Girilmemiş Adres").substring(0, 250)
       },

       taxTotal: taxStructure,
       ...( (giInvoiceType === 'ISTISNA' || totalTax === 0 || InvoiceDetail.some(d => d.percent === 0 || d.taxAmount === 0)) ? {
          taxExemptionReasonCode: effectiveExemptionCode,
          taxExemptionReasonName: effectiveExemptionReason,
          taxExemptionReason: effectiveExemptionReason,
          taxExemptionReasonText: effectiveExemptionReason,
          exemptionReasonCode: effectiveExemptionCode,
          exemptionReason: effectiveExemptionReason,
          kdvExemptionReasonCode: effectiveExemptionCode,
          kdvExemptionReason: effectiveExemptionReason,
          TaxExemptionReasonCode: effectiveExemptionCode,
          TaxExemptionReasonName: effectiveExemptionReason,
          TaxExemptionReason: effectiveExemptionReason,
       } : {}),

       invoiceDetail: InvoiceDetail,
       invoiceLines: InvoiceDetail,

       totalAmounts: {
          lineTotalAmount: Number(totalLineExtension.toFixed(2)),
          taxExclusiveAmount: Number(totalLineExtension.toFixed(2)),
          taxTotalAmount: Number(totalTax.toFixed(2)),
          payableAmount: Number(grandTotal.toFixed(2))
       },

       invoiceTotals: {
          lineTotalAmount: Number(totalLineExtension.toFixed(2)),
          taxExclusiveAmount: Number(totalLineExtension.toFixed(2)),
          taxAmountTotal: Number(totalTax.toFixed(2)),
          payableAmount: Number(grandTotal.toFixed(2))
       },

       invoiceCalculation: {
          lineExtensionAmount: Number(totalLineExtension.toFixed(2)),
          taxExclusiveAmount: Number(totalLineExtension.toFixed(2)),
          taxInclusiveAmount: Number(grandTotal.toFixed(2)),
          payableAmount: Number(grandTotal.toFixed(2)),
          grandTotalAmountText: numberToTurkishWords(Number(grandTotal.toFixed(2)), (invoice.currency || 'TRY').toUpperCase()),
          allowanceTotalAmount: 0
       }
    };


    // Sending
    let result;
    try {
      console.log(`[INVOICE-SEND] Initiating sendInvoice with docType: ${docType}, documentNumber: ${documentNumber}`);
      result = await service.sendInvoice(ublData);
    } catch (sendErr: any) {
      const errMsg = sendErr.message || "";
      console.warn(`[INVOICE-SEND] Primary attempt failed: "${errMsg}". Checking if auto-recovery applies...`);

      const isProfileMismatch = 
        errMsg.includes("Profile alanında") || 
        errMsg.includes("E-Fatura için") || 
        errMsg.includes("uygun Profile") ||
        errMsg.includes("Profile değeri") ||
        errMsg.includes("geçersiz değer");

      const isEArchiveRequired =
        errMsg.includes("mükellef değil") ||
        errMsg.includes("E-Fatura kullanıcısı değil") ||
        errMsg.includes("E-Arşiv Fatura olarak") ||
        errMsg.includes("E-Arşiv faturası") ||
        errMsg.includes("not registered") ||
        errMsg.includes("mükellefi değildir");

      if (isProfileMismatch && docType === 'E-ARSIV') {
        console.warn(`[INVOICE-SEND-RECOVERY] Integrator rejected E-Arşiv due to target being an active E-Fatura taxpayer. Attempting auto-recovery as E-FATURA...`);
        docType = 'E-FATURA';
        pkAlias = 'urn:mail:defaultpk';
        
        const defaultEF = seriesList.find((s: any) => s.is_default && s.type === 'E-FATURA');
        const expectedPrefix = defaultEF?.prefix || settings.einvoice_prefix || 'GEF';
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          let prefix = expectedPrefix.toUpperCase().substring(0, 3).padEnd(3, 'X');
          const currentYear = (invoice.invoice_date ? new Date(invoice.invoice_date).getFullYear() : new Date().getFullYear()).toString();
          const prefixWithYear = `${prefix}${currentYear}`;
          
          const seqRes = await client.query(
             `SELECT COALESCE(document_number, invoice_number) as doc_num 
              FROM sales_invoices 
              WHERE store_id = $1 
                AND (document_number LIKE $2 OR invoice_number LIKE $2) 
                AND (LENGTH(document_number) = 16 OR LENGTH(invoice_number) = 16) 
              ORDER BY COALESCE(document_number, invoice_number) DESC 
              LIMIT 1 FOR UPDATE`,
             [storeId, `${prefixWithYear}%`]
          );
          
          let nextSequenceNumber = 1;
          if (seqRes.rows.length > 0) {
              const lastDocNum = seqRes.rows[0].doc_num;
              const lastSequencePart = lastDocNum.substring(7);
              const parsedSeq = parseInt(lastSequencePart, 10);
              if (!isNaN(parsedSeq)) {
                 nextSequenceNumber = parsedSeq + 1;
              }
          }
          
          const sequenceString = nextSequenceNumber.toString().padStart(9, '0');
          documentNumber = `${prefixWithYear}${sequenceString}`;
          
          ettn = crypto.randomUUID();
          
          await client.query(
             "UPDATE sales_invoices SET document_number = $1, ettn = $2, e_document_type = $3, invoice_profile = $4 WHERE id = $5",
             [documentNumber, ettn, docType, 'TEMELFATURA', invoiceId]
          );
          await client.query("COMMIT");
          console.log(`[INVOICE-SEND-RECOVERY] Successfully set sequence and saved as E-FATURA: ${documentNumber}`);
        } catch (dbErr) {
          await client.query("ROLLBACK");
          console.error("[INVOICE-SEND-RECOVERY] DB Update failed inside E-FATURA recovery branch:", dbErr);
          throw dbErr;
        } finally {
          client.release();
        }

        // Reconstruct fields for E-FATURA
        ublData.eDocumentType = 'EFATURA';
        ublData.profile = giInvoiceType === 'IADE' ? 'TEMELFATURA' : (invoice.invoice_profile || 'TEMELFATURA');
        ublData.docNo = documentNumber;
        ublData.pkAlias = pkAlias;
        ublData.ettn = ettn;

        console.log("[INVOICE-SEND-RECOVERY] Retrying sendInvoice with updated E-FATURA sequence payload...");
        result = await service.sendInvoice(ublData);

      } else if (isEArchiveRequired && docType === 'E-FATURA') {
        console.warn(`[INVOICE-SEND-RECOVERY] Integrator rejected E-Fatura due to target NOT being an active e-Invoice taxpayer. Attempting auto-recovery as E-ARSIV...`);
        docType = 'E-ARSIV';
        pkAlias = '';

        const defaultEA = seriesList.find((s: any) => s.is_default && s.type === 'E-ARSIV');
        const expectedPrefix = defaultEA?.prefix || settings.earchive_prefix || 'GEA';
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          let prefix = expectedPrefix.toUpperCase().substring(0, 3).padEnd(3, 'X');
          const currentYear = (invoice.invoice_date ? new Date(invoice.invoice_date).getFullYear() : new Date().getFullYear()).toString();
          const prefixWithYear = `${prefix}${currentYear}`;

          const seqRes = await client.query(
             `SELECT COALESCE(document_number, invoice_number) as doc_num 
              FROM sales_invoices 
              WHERE store_id = $1 
                AND (document_number LIKE $2 OR invoice_number LIKE $2) 
                AND (LENGTH(document_number) = 16 OR LENGTH(invoice_number) = 16) 
              ORDER BY COALESCE(document_number, invoice_number) DESC 
              LIMIT 1 FOR UPDATE`,
             [storeId, `${prefixWithYear}%`]
          );

          let nextSequenceNumber = 1;
          if (seqRes.rows.length > 0) {
              const lastDocNum = seqRes.rows[0].doc_num;
              const lastSequencePart = lastDocNum.substring(7);
              const parsedSeq = parseInt(lastSequencePart, 10);
              if (!isNaN(parsedSeq)) {
                 nextSequenceNumber = parsedSeq + 1;
              }
          }

          const sequenceString = nextSequenceNumber.toString().padStart(9, '0');
          documentNumber = `${prefixWithYear}${sequenceString}`;

          ettn = crypto.randomUUID();

          await client.query(
             "UPDATE sales_invoices SET document_number = $1, ettn = $2, e_document_type = $3, invoice_profile = $4 WHERE id = $5",
             [documentNumber, ettn, docType, 'EARSIVFATURA', invoiceId]
          );
          await client.query("COMMIT");
          console.log(`[INVOICE-SEND-RECOVERY] Successfully set sequence and saved as E-ARSIV: ${documentNumber}`);
        } catch (dbErr) {
          await client.query("ROLLBACK");
          console.error("[INVOICE-SEND-RECOVERY] DB Update failed inside E-ARSIV recovery branch:", dbErr);
          throw dbErr;
        } finally {
          client.release();
        }

        // Reconstruct fields for E-ARSIV
        ublData.eDocumentType = 'EARSIVFATURA';
        ublData.profile = 'TEMELFATURA';
        ublData.docNo = documentNumber;
        ublData.pkAlias = undefined;
        ublData.ettn = ettn;

        console.log("[INVOICE-SEND-RECOVERY] Retrying sendInvoice with updated E-ARSIV sequence payload...");
        result = await service.sendInvoice(ublData);

      } else {
        // Unhandled error, propagate
        throw sendErr;
      }
    }

    // Format DB Update
    if (result.isSuccess) {
       await pool.query(
         "UPDATE sales_invoices SET integration_status = $1, integration_message = $2, ettn = $3, e_document_type = $4, document_number = $5 WHERE id = $6", 
         ['QUEUED', result.message, result.ettn, docType, documentNumber, invoiceId]
       );
    }

    res.json(result);
  } catch (error: any) {
    if (error.message && error.message.includes("Aynı belge numarasından daha önce kayıt oluşturulmuştur")) {
        console.log(`[INVOICE-SEND-RECOVERY] Intercepted duplicate document number error for invoice ${invoiceId}. Marking as QUEUED automatically.`);
        await pool.query(
          "UPDATE sales_invoices SET integration_status = $1, integration_message = $2 WHERE id = $3", 
          ['QUEUED', 'Fatura başarıyla entegratöre iletilmiş (Tekrar gönderimi engellendi).', invoiceId]
        );
        return res.json({
           isSuccess: true,
           ettn: ettn,
           message: "Fatura zaten sisteme başarıyla gönderilmiş! Durumu senkronize edildi."
        });
    }

    console.error(`[EINVOICE-SEND-CRITICAL-ERROR] Invoice: ${invoiceId}, Store: ${storeId}:`, error);
    try {
      await pool.query(
        "UPDATE sales_invoices SET integration_status = $1, integration_message = $2 WHERE id = $3",
        ['HATALI', (error.message || 'Gönderim hatası').substring(0, 500), invoiceId]
      );
    } catch (dbErr) {
      console.warn("Failed to set HATALI status on sales_invoices:", dbErr);
    }
    await IntegrationService.logIntegrationError(storeId, 'E-Fatura', `Send Invoice ${invoiceId}`, error);
    res.status(500).json({ 
      error: error.message || "Bilinmeyen bir iç sunucu hatası oluştu.",
      details: error.response?.data || undefined
    });
  }
});

// 3. Check Status of a Sent Invoice
router.get("/einvoice/status/:invoiceId", authenticate, async (req: any, res) => {
  const { invoiceId } = req.params;
  let storeId = req.user.store_id;
  try {
    let ettn;
    
    if (req.user.role === 'superadmin') {
      const invRes = await pool.query("SELECT store_id, ettn FROM sales_invoices WHERE id = $1", [invoiceId]);
      if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı" });
      storeId = invRes.rows[0].store_id;
      ettn = invRes.rows[0].ettn;
    } else {
      const invRes = await pool.query("SELECT ettn FROM sales_invoices WHERE id = $1 AND store_id = $2", [invoiceId, storeId]);
      if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı" });
      ettn = invRes.rows[0].ettn;
    }

    if (!ettn) {
      return res.status(404).json({ error: "Geçerli bir ETTN bulunamadı." });
    }
    
    const service = await getEInvoiceService(storeId);
    console.log(`[INVOICE-STATUS-CHECK] Checking status for ETTN: ${ettn}`);
    const status = await service.getInvoiceStatus(ettn);
    console.log(`[INVOICE-STATUS-CHECK] Got status:`, status);

    // Update DB to reflect new status
    await pool.query(
      "UPDATE sales_invoices SET integration_status = $1, integration_message = $2 WHERE id = $3", 
      [status.status, status.message, invoiceId]
    );

    res.json(status);
  } catch (error: any) {
     await IntegrationService.logIntegrationError(storeId, 'E-Fatura', `Status Check ${invoiceId}`, error);
     res.status(500).json({ error: error.message || "Bilinmeyen bir hata oluştu" });
  }
});

// 4. Cancel E-Archive Invoice
router.post("/einvoice/cancel/:invoiceId", authenticate, async (req: any, res) => {
  const { invoiceId } = req.params;
  const { reason } = req.body;
  let storeId = req.user.store_id;
  try {
    let invoice;
    
    if (req.user.role === 'superadmin') {
      const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
      if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı" });
      invoice = invRes.rows[0];
      storeId = invoice.store_id;
    } else {
      const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1 AND store_id = $2", [invoiceId, storeId]);
      if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı" });
      invoice = invRes.rows[0];
    }

    if (!invoice.ettn) {
      return res.status(404).json({ error: "Fatura bulunamadı veya ETTN'si yok." });
    }
    
    const service = await getEInvoiceService(storeId);

    // Only allow E-ARSIV for cancellation via MySoft (E-FATURA usually requires different processes or portal)
    if (invoice.e_document_type !== 'E-ARSIV') {
        return res.status(400).json({ error: "Sadece E-Arşiv faturaları sistem üzerinden iptal edilebilir." });
    }

    // the 8-day rule for E-Archive
    const invoiceDate = new Date(invoice.invoice_date);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - invoiceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 8) {
       return res.status(400).json({ error: "E-Arşiv faturaları, düzenlenme tarihinden itibaren sadece 8 gün içerisinde iptal edilebilir." });
    }

    const ettn = invoice.ettn;
    const eDocType = invoice.e_document_type;
    
    const result = await (service as any).cancelInvoice(ettn, reason || "İptal talebi", eDocType);

    if (result.isSuccess) {
       await pool.query(
         "UPDATE sales_invoices SET integration_status = $1, integration_message = $2 WHERE id = $3", 
         ['CANCELLED', result.message, invoiceId]
       );
    }

    res.json(result);
  } catch (error: any) {
     await IntegrationService.logIntegrationError(storeId, 'E-Fatura', `Cancel Invoice ${invoiceId}`, error);
     res.status(500).json({ error: error.message || "Bilinmeyen bir hata oluştu" });
  }
});

// Robust Incoming Purchase Invoice Importer Engine
export async function importIncomingInvoicesForStore(
  storeId: number, 
  startDate: string, 
  endDate: string,
  targetInvoiceNumbers?: string[],
  preFetchedInvoices?: any[]
): Promise<{ importedCount: number; updatedCount: number; skippedCount: number; results: any[]; errors: string[] }> {
  console.log(`[importIncomingInvoicesForStore] Store: ${storeId}, Dates: ${startDate} to ${endDate}`);
  const errors: string[] = [];
  const results: any[] = [];
  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  const service = await getEInvoiceService(storeId);
  if (!service) throw new Error(`Mağaza ${storeId} için E-Fatura servisi başlatılamadı.`);

  const normalizeDate = (d: any) => {
    if (!d) return new Date().toISOString().split('T')[0];
    if (typeof d !== 'string') return d;
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(d)) {
      const [day, month, year] = d.split('.');
      return `${year}-${month}-${day}`;
    }
    const parsed = new Date(d);
    return !isNaN(parsed.getTime()) ? parsed.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  };

  const incomingInvoices = preFetchedInvoices || await service.getIncomingInvoices(startDate, endDate);
  if (!Array.isArray(incomingInvoices) || incomingInvoices.length === 0) {
    return { importedCount: 0, updatedCount: 0, skippedCount: 0, results: [], errors: [] };
  }

  // Pre-load existing to avoid redundant calls
  const existingRows = await pool.query(
    "SELECT id, ettn, invoice_number, document_number, supplier_name, grand_total FROM purchase_invoices WHERE store_id = $1",
    [storeId]
  );
  const ettnMap = new Map();
  const docNoMap = new Map();
  for (const row of existingRows.rows) {
    if (row.ettn) ettnMap.set(String(row.ettn).toLowerCase().trim(), row);
    if (row.document_number && row.document_number.trim() !== '') docNoMap.set(String(row.document_number).toLowerCase().trim(), row);
    if (row.invoice_number && row.invoice_number.trim() !== '' && row.invoice_number !== row.document_number) docNoMap.set(String(row.invoice_number).toLowerCase().trim(), row);
  }

  console.log(`[importIncomingInvoicesForStore] Processing ${incomingInvoices.length} items. Already in DB: ${existingRows.rows.length}`);

  for (const inv of incomingInvoices) {
    try {
      const ettn = (inv.ettn || inv.uuid || inv.Uuid || (typeof inv.raw === 'string' ? inv.raw : '') || '').toString().toLowerCase().trim();
      const docNum = (inv.documentNumber || inv.id || inv.Id || '').toString().trim();

      if (targetInvoiceNumbers && targetInvoiceNumbers.length > 0) {
        if (!targetInvoiceNumbers.some(t => docNum.toLowerCase().includes(t.toLowerCase()) || ettn.toLowerCase().includes(t.toLowerCase()))) continue;
      }

      let existing = (ettn ? ettnMap.get(ettn) : null) || (docNum ? docNoMap.get(docNum.toLowerCase()) : null);
      
      const isComplete = existing && 
        existing.document_number && existing.document_number.trim() !== '' && 
        existing.supplier_name && existing.supplier_name !== 'Bilinmeyen Tedarikçi' &&
        Number(existing.grand_total || 0) > 0;

      if (isComplete) {
        skippedCount++;
        results.push({ documentNumber: existing.document_number, ettn, status: 'ALREADY_EXISTS', id: existing.id });
        continue;
      }

      if (!ettn) continue;

      // Fetch full details (expensive call, only if not complete)
      console.log(`[importIncomingInvoicesForStore] Fetching details for ${ettn}...`);
      const details = await service.getInvoiceDetailsByUuid(ettn);
      if (!details) {
        errors.push(`Detaylar alınamadı: ${ettn}`);
        continue;
      }

      const finalDocNo = (details.docNo || details.Id || details.id || docNum || '').toString().trim();
      if (!finalDocNo) continue;

      // Double check existing by finalDocNo if we didn't have a docNum before
      if (!existing && finalDocNo) {
        existing = docNoMap.get(finalDocNo.toLowerCase());
      }

      // Business Logic: Company, Expense resolve, Items mapping
      const senderVkn = (details.supplierInfo?.identifierNumber || details.SenderVkn || inv.senderVkn || '').toString().trim();
      const senderTitle = extractSenderTitleFromUblOrDetails(details, inv.senderTitle || 'Bilinmeyen Tedarikçi');
      
      let companyId = null;
      if (senderVkn) {
        const cleanVkn = senderVkn.replace(/\D/g, '');
        let compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND clean_tax_number(tax_number) = $2 LIMIT 1", [storeId, cleanVkn]);
        if (compRes.rows.length === 0 && senderTitle !== 'Bilinmeyen Tedarikçi') {
          compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2)) LIMIT 1", [storeId, senderTitle]);
        }
        if (compRes.rows.length > 0) {
          companyId = compRes.rows[0].id;
        } else {
          const newComp = await pool.query("INSERT INTO companies (store_id, title, tax_number, address) VALUES ($1, $2, $3, $4) RETURNING id", [storeId, senderTitle, cleanVkn || null, 'Otomatik Oluşturuldu']);
          companyId = newComp.rows[0].id;
        }
      }

      const rawLines = details.detailList || details.InvoiceLines || details.lines || [];
      const lineItemNames = (Array.isArray(rawLines) ? rawLines : [rawLines]).map((l: any) => 
        l.detailItem?.itemName || l.itemName || l.Item?.Name?.['#text'] || l.Item?.Name || l.Name || ''
      ).filter(Boolean);

      const expenseCheck = await resolveExpenseClassification(pool, storeId, {
        companyId, supplierTitle: senderTitle, supplierVkn: senderVkn, pinToCompany: true
      });

      const grandAmt = Number(details.legalMonetaryTotal?.payableAmount || details.PayableAmount || inv.payableAmount || 0);
      const taxAmt = Number(details.taxTotal?.reduce((sum: number, t: any) => sum + Number(t.taxAmount || t.TaxAmount || 0), 0) || inv.taxAmount || 0);
      const baseAmt = Number(details.legalMonetaryTotal?.taxExclusiveAmount || details.TaxExclusiveAmount || (grandAmt - taxAmt) || 0);
      const issueDate = normalizeDate(details.docDate || details.IssueDate || inv.issueDate);

      let invoiceId: number;
      if (existing) {
        await pool.query(
          `UPDATE purchase_invoices SET 
            invoice_number = $1, document_number = $2, ettn = $3, supplier_name = $4, tax_number = $5, 
            invoice_date = $6, total_amount = $7, tax_amount = $8, grand_total = $9, 
            currency = $10, company_id = COALESCE($11, company_id), is_expense = $12, expense_category = $13, expense_center = $14
          WHERE id = $15`,
          [finalDocNo, finalDocNo, ettn, senderTitle, senderVkn, issueDate, baseAmt, taxAmt, grandAmt, details.documentCurrencyCode || 'TRY', companyId, expenseCheck.isExpense, expenseCheck.expenseCategory, expenseCheck.expenseCenter, existing.id]
        );
        invoiceId = existing.id;
        updatedCount++;
      } else {
        const ins = await pool.query(
          `INSERT INTO purchase_invoices 
            (store_id, company_id, invoice_number, document_number, ettn, e_document_type, supplier_name, tax_number, invoice_date, total_amount, tax_amount, grand_total, currency, status, integration_status, payment_method, payment_status, is_expense, expense_category, expense_center)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING id`,
          [storeId, companyId, finalDocNo, finalDocNo, ettn, 'EFATURA', senderTitle, senderVkn, issueDate, baseAmt, taxAmt, grandAmt, details.documentCurrencyCode || 'TRY', 'approved', 'RECEIVED', 'term', 'unpaid', expenseCheck.isExpense, expenseCheck.expenseCategory, expenseCheck.expenseCenter]
        );
        invoiceId = ins.rows[0].id;
        importedCount++;
      }

      // Items & Stock
      const existingItems = await pool.query("SELECT id FROM purchase_invoice_items WHERE purchase_invoice_id = $1 LIMIT 1", [invoiceId]);
      if (existingItems.rows.length === 0 && Array.isArray(rawLines)) {
        for (const line of rawLines) {
          const pName = line.detailItem?.itemName || line.itemName || line.Item?.Name?.['#text'] || line.Item?.Name || 'Bilinmeyen Ürün';
          const sellerCodeRaw = line.detailItem?.sellersItemIdentificationId || line.detailItem?.sellersItemIdentification || line.Item?.SellersItemIdentification?.ID?.['#text'] || line.Item?.SellersItemIdentification?.ID || line.sellersItemIdentification;
          const sellerCode = typeof sellerCodeRaw === 'string' ? sellerCodeRaw.trim() : (typeof sellerCodeRaw === 'number' ? String(sellerCodeRaw) : null);
          const buyerCodeRaw = line.detailItem?.buyersItemIdentificationId || line.detailItem?.buyersItemIdentification || line.Item?.BuyersItemIdentification?.ID?.['#text'] || line.Item?.BuyersItemIdentification?.ID || line.buyersItemIdentification;
          const buyerCode = typeof buyerCodeRaw === 'string' ? buyerCodeRaw.trim() : (typeof buyerCodeRaw === 'number' ? String(buyerCodeRaw) : null);
          const barcodeRaw = line.Item?.StandardItemIdentification?.ID?.['#text'] || line.Item?.StandardItemIdentification?.ID || line.Item?.ItemInstance?.ProductTraceID;
          const barcode = typeof barcodeRaw === 'string' ? barcodeRaw.trim() : (typeof barcodeRaw === 'number' ? String(barcodeRaw) : null);

          const qty = Number(String(line.invoicedQuantity || line.Quantity || 0).replace(',','.')) || 0;
          const up = Number(String(line.unitPrice || line.Price?.PriceAmount || 0).replace(',','.')) || 0;
          const tr = Number(String(line.taxTotal?.taxSubtotalList?.[0]?.percent || line.TaxTotal?.TaxSubtotal?.Percent || 0).replace(',','.')) || 0;
          const lTax = (qty * up * tr) / 100;
          const lTotal = qty * up;

          let productId: number | null = null;
          let finalBarcode: string | null = barcode;
          let finalProductCode: string | null = sellerCode || buyerCode || null;

          if (!expenseCheck.isExpense) {
            const resolved = await findOrCreateProductForInvoiceItem(pool, storeId, {
              supplierVkn: senderVkn,
              productName: pName,
              barcode,
              productCode: sellerCode || buyerCode,
              sellerCode,
              buyerCode,
              unitPrice: up,
              taxRate: tr,
              currency: details.documentCurrencyCode || 'TRY'
            });
            productId = resolved.productId;
            finalBarcode = resolved.barcode;
            finalProductCode = resolved.productCode;

            if (senderVkn && pName && productId && !resolved.autoCreated) {
              await saveSupplierMapping(pool, storeId, senderVkn, pName, productId, finalProductCode);
            }
          }

          await pool.query(
            `INSERT INTO purchase_invoice_items (purchase_invoice_id, product_id, product_name, barcode, product_code, quantity, unit_price, tax_rate, tax_amount, total_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [invoiceId, productId, pName, finalBarcode, finalProductCode, qty, up, tr, lTax, lTotal]
          );

          if (productId && !expenseCheck.isExpense && qty > 0) {
            await pool.query("UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2, cost_currency = $3 WHERE id = $4", [qty, up, details.documentCurrencyCode || 'TRY', productId]);
            await addStockMovement(pool, storeId, productId, 'in', qty, 'purchase_invoice', `Alış Faturası: ${finalDocNo}`, up, senderTitle, details.documentCurrencyCode || 'TRY', null, invoiceId, 'purchase', finalDocNo);
          }
        }
      }

      // Current Account Transaction
      if (companyId) {
        const txCheck = await pool.query("SELECT id FROM current_account_transactions WHERE purchase_invoice_id = $1 LIMIT 1", [invoiceId]);
        if (txCheck.rows.length === 0) {
          await pool.query(
            "INSERT INTO current_account_transactions (store_id, company_id, purchase_invoice_id, type, amount, currency, description, transaction_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [storeId, companyId, invoiceId, 'credit', grandAmt, details.documentCurrencyCode || 'TRY', `E-Fatura İçe Aktarma: ${finalDocNo}`, issueDate]
          );
        }
      }

      results.push({ documentNumber: finalDocNo, ettn, status: 'IMPORTED', id: invoiceId });
    } catch (err: any) {
      console.error(`[importIncomingInvoicesForStore] Error with an invoice: ${err.message}`);
      errors.push(err.message);
    }
  }

  return { importedCount, updatedCount, skippedCount, results, errors };
}

// Legacy alias for compatibility with cron jobs
export async function processAndImportIncomingInvoiceList(
  _pool: any,
  storeId: number,
  _service: any,
  incomingInvoices: any[]
): Promise<{ importedCount: number; updatedCount: number; skippedCount: number; results: any[] }> {
  const res = await importIncomingInvoicesForStore(storeId, "", "", undefined, incomingInvoices);
  return {
    importedCount: res.importedCount,
    updatedCount: res.updatedCount,
    skippedCount: res.skippedCount,
    results: res.results
  };
}

// 5. Sync Incoming Invoices Endpoint
router.post("/einvoice/sync-inbox", authenticate, async (req: any, res) => {
  let storeIdRaw = req.user.role === 'superadmin' ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  const storeId = storeIdRaw ? parseInt(String(storeIdRaw)) : null;
  const { startDate, endDate } = req.body;
  try {
    if (!storeId || isNaN(storeId)) return res.status(400).json({ error: "Geçerli bir Mağaza ID bulunamadı." });
    if (!startDate || !endDate) return res.status(400).json({ error: "Başlangıç ve bitiş tarihi gereklidir." });

    const result = await importIncomingInvoicesForStore(storeId, startDate, endDate);
    res.json({
      message: `${result.importedCount} adet yeni fatura içeri aktarıldı, ${result.updatedCount} adet güncellendi.`,
      importedCount: result.importedCount,
      updatedCount: result.updatedCount,
      skippedCount: result.skippedCount,
      results: result.results
    });
  } catch (error: any) {
    await IntegrationService.logIntegrationError(storeId || 0, 'E-Fatura', `Sync Inbox`, error);
    res.status(500).json({ error: error.message || "Bilinmeyen bir hata oluştu" });
  }
});


// Diagnostic Backfill Endpoint for Missing Invoices
router.post("/einvoice/backfill-invoices", authenticate, async (req: any, res) => {
  let storeIdRaw = req.user.role === 'superadmin' ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  const storeId = storeIdRaw ? parseInt(String(storeIdRaw)) : null;
  const targetInvoiceNumbers = req.body.invoiceNumbers || [
    "BTS2026000017536", "HD42026000742811", "HD42026000741650", "HD42026000676130", "HD42026000618053"
  ];

  try {
    if (!storeId || isNaN(storeId)) return res.status(400).json({ error: "Geçerli bir Mağaza ID bulunamadı." });
    const service = await getEInvoiceService(storeId);
    if (!service) return res.status(400).json({ error: "E-Fatura servisi başlatılamadı." });

    const endDateStr = new Date().toISOString().split('T')[0];
    const startDateObj = new Date();
    startDateObj.setDate(startDateObj.getDate() - 180);
    const startDateStr = startDateObj.toISOString().split('T')[0];

    console.log(`[BACKFILL] Scanning incoming invoices for store ${storeId} from ${startDateStr} to ${endDateStr}`);
    const incoming = await service.getIncomingInvoices(startDateStr, endDateStr);
    
    const { importedCount, updatedCount, skippedCount, results } = await importIncomingInvoicesForStore(storeId, startDateStr, endDateStr, targetInvoiceNumbers, incoming);

    res.json({
      success: true,
      message: `Backfill tamamlandı. ${importedCount} adet yeni içe aktarıldı, ${updatedCount} adet güncellendi, ${skippedCount} adet zaten mevcuttu.`,
      foundCount: incoming.length,
      importedCount,
      updatedCount,
      skippedCount,
      results
    });
  } catch (error: any) {
    console.error("Backfill error:", error);
    res.status(500).json({ error: error.message || "Backfill işlemi başarısız oldu" });
  }
});

// 5. Test Connection
router.post("/einvoice/test-connection", authenticate, async (req: any, res) => {
  try {
    const storeId = req.user.role === 'superadmin' ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    console.log(`[test-connection] Starting for storeId: ${storeId}`);
    const service = await getEInvoiceService(storeId);
    
    // We can test connection by attempting a trivial check taxpayer call on a known VKN (like MySoft itself or a static one)
    // or just checking if authenticate() works.
    const result = await service.checkTaxpayer("4840843430"); // MySoft VKN for testing
    
    res.json({ 
      success: true, 
      message: "Bağlantı başarılı. Entegratör sistemi ile iletişim sağlandı.",
      data: result 
    });
  } catch (error: any) {
    console.error("Test Connection endpoint error:", error);
    res.status(500).json({ error: `Bağlantı Hatası: ${error.message}` });
  }
});

// Helper to group and deduplicate VAT rows in invoice HTML
export function cleanInvoiceHtmlVatRows(html: string): string {
  if (!html || typeof html !== "string") return html;

  // Single row regex that ensures it does not cross multiple <tr> tags
  const singleRowRegex = /<tr\b[^>]*>(?:(?!<tr\b)[\s\S])*?Hesaplanan Katma Değer Vergisi[\s\S]*?<\/tr>/gi;
  
  const groups = new Map<string, {
    firstMatch: string;
    currency: string;
    rate: string;
    isTL: boolean;
    amounts: number[];
    originalMatches: string[];
  }>();

  let m;
  while ((m = singleRowRegex.exec(html)) !== null) {
    const fullRow = m[0];
    const isTL = fullRow.includes("(TL)") || fullRow.includes("TL</span>") || fullRow.includes(" TRY") || fullRow.includes("TRY</span>");
    const rateMatch = fullRow.match(/%\s*(\d+(?:[.,]\d+)?)/);
    const rate = rateMatch ? rateMatch[1].replace(",", ".") : "0";
    const key = `${rate}_${isTL ? "TL" : "MAIN"}`;

    const tdMatches = fullRow.match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    const lastTd = tdMatches ? tdMatches[tdMatches.length - 1] : "";
    const cleanTdText = lastTd.replace(/<[^>]+>/g, "").trim();
    
    const numMatch = cleanTdText.match(/([0-9.]+),([0-9]{2})/);
    let amount = 0;
    let curr = isTL ? "TL" : "";
    if (numMatch) {
      const normalizedNum = numMatch[1].replace(/\./g, "") + "." + numMatch[2];
      amount = parseFloat(normalizedNum);
      const afterNum = cleanTdText.replace(numMatch[0], "").trim();
      if (afterNum && !isTL) curr = afterNum;
    }

    if (!groups.has(key)) {
      groups.set(key, {
        firstMatch: fullRow,
        currency: curr,
        rate,
        isTL,
        amounts: [amount],
        originalMatches: [fullRow]
      });
    } else {
      const g = groups.get(key)!;
      g.amounts.push(amount);
      g.originalMatches.push(fullRow);
    }
  }

  let resultHtml = html;

  for (const [key, g] of groups.entries()) {
    if (g.originalMatches.length > 1) {
      const allIdentical = g.amounts.every(a => Math.abs(a - g.amounts[0]) < 0.001);
      
      let finalRowHtml = g.firstMatch;
      if (!allIdentical) {
        const totalAmount = g.amounts.reduce((sum, a) => sum + a, 0);
        const formattedAmount = totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        finalRowHtml = g.firstMatch.replace(/(<td[^>]*>)([\s\S]*?)(<\/td>(\s*<\/tr>)?$)/i, (tdM, p1, p2, p3) => {
          if (p2.includes("<span>")) {
            return `${p1}<span>${formattedAmount} ${g.currency || (g.isTL ? "TL" : "")}</span>${p3}`;
          }
          return `${p1}${formattedAmount}${g.currency || (g.isTL ? "TL" : "")}${p3}`;
        });
      }

      let isFirst = true;
      for (const origRow of g.originalMatches) {
        if (isFirst) {
          resultHtml = resultHtml.replace(origRow, finalRowHtml);
          isFirst = false;
        } else {
          resultHtml = resultHtml.replace(origRow, "");
        }
      }
    }
  }

  return resultHtml;
}

export function injectSalesExchangeRateBlockIfNeeded(html: string, inv: any): string {
  if (!html || typeof html !== 'string') return html;
  const curr = (inv.currency || 'TRY').toUpperCase();
  if (curr === 'TRY' || curr === 'TL') return html;

  let exRate = Number(inv.exchange_rate) || 1.0;
  if (exRate <= 0) exRate = 1.0;

  const finalSubtotal = Number(inv.total_amount) || 0;
  const finalTotalVat = Number(inv.tax_amount) || 0;
  const finalGrandTotal = Number(inv.grand_total) || (finalSubtotal + finalTotalVat);

  const trySubtotalNum = finalSubtotal * exRate;
  const tryVatNum = finalTotalVat * exRate;
  const tryGrandTotalNum = finalGrandTotal * exRate;

  const trySubtotal = trySubtotalNum.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tryVat = tryVatNum.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tryGrandTotal = tryGrandTotalNum.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const exchangeRateBlock = `
    <div style="margin-top: 16px; border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; background: #ffffff; page-break-inside: avoid;">
      <div style="background: #0f172a; color: #ffffff; padding: 6px 12px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>DÖVİZ KARŞILIKLARI (TRY)</span>
        <span style="font-size: 10.5px; font-weight: 700; background: #22c55e; color: #000000; padding: 2px 6px; border-radius: 4px;">1 ${curr} = ${exRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} TRY</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 600; color: #334155;">Mal Hizmet Toplam Tutarı (TL)</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-weight: 700; font-family: monospace;">${trySubtotal} TL</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 600; color: #334155;">Hesaplanan KDV (TL)</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-weight: 700; font-family: monospace;">${tryVat} TL</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: 800; color: #0f172a; font-size: 11.5px;">Vergiler Dahil Toplam Tutar (TL)</td>
            <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-weight: 900; font-size: 12px; font-family: monospace; color: #0f172a;">${tryGrandTotal} TL</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${exchangeRateBlock}</body>`);
  } else {
    return html + exchangeRateBlock;
  }
}

// 6. Get Invoice HTML
export async function generateLocalSalesInvoiceHtml(invoiceId: number, storeId: number): Promise<string> {
  const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
  if (invRes.rows.length === 0) throw new Error("Fatura bulunamadı");
  const inv = invRes.rows[0];

  const itemsRes = await pool.query(
    "SELECT * FROM sales_invoice_items WHERE sales_invoice_id = $1 ORDER BY id ASC",
    [invoiceId]
  );
  const items = itemsRes.rows;

  const storeRes = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
  const store = storeRes.rows[0] || {};
  let branding = store.branding || {};
  if (typeof branding === 'string') { try { branding = JSON.parse(branding); } catch (e) { branding = {}; } }
  let einvoiceSettings = store.einvoice_settings || {};
  if (typeof einvoiceSettings === 'string') { try { einvoiceSettings = JSON.parse(einvoiceSettings); } catch (e) { einvoiceSettings = {}; } }

  // Supplier info
  const storeName = store.store_name || store.name || branding.store_name || branding.name || 'Seçkin Mağaza';
  const supplierVkn = einvoiceSettings.vkn || branding.tax_number || store.tax_number || '1111111111';
  const supplierTaxOffice = einvoiceSettings.tax_office || branding.tax_office || store.tax_office || '-';
  const supplierAddress = einvoiceSettings.address || branding.address || store.address || '-';
  const supplierPhone = einvoiceSettings.phone || branding.phone || store.phone || '';
  const supplierEmail = einvoiceSettings.email || branding.email || store.email || '';
  const supplierMersis = einvoiceSettings.mersis_no || branding.mersis_no || '';
  const supplierWeb = einvoiceSettings.web_address || branding.website || '';
  const logoUrl = branding.logo_url || branding.logo || '';

  // Buyer info
  const customerName = inv.customer_name || inv.company_title || inv.sale_customer_name || 'Cari Müşteri';
  const customerVkn = inv.tax_number || '-';
  const customerTaxOffice = inv.tax_office || '-';
  const customerAddress = inv.address || inv.customer_address || '-';
  const customerEmail = inv.customer_email || inv.email || '';
  const customerPhone = inv.customer_phone || inv.phone || '';

  // Document Info
  const docNumber = inv.document_number || inv.invoice_number || 'TASLAK-' + inv.id;
  const ettnVal = inv.ettn || "[GİB'e Gönderilmedi]";
  const invoiceDate = inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR');
  const dueDateFormatted = inv.due_date ? new Date(inv.due_date).toLocaleDateString('tr-TR') : '';
  const invoiceTime = inv.invoice_time || '00:00:00';
  
  let computedDocType = 'E-ARŞİV FATURA';
  const docType = (inv.e_document_type || '').toUpperCase();
  const profile = (inv.invoice_profile || '').toUpperCase();
  if (docType === 'E-FATURA' || profile === 'TICARIFATURA' || profile === 'TEMELFATURA') {
    computedDocType = 'E-FATURA';
  } else if (docType === 'E-IRSALIYE' || docType === 'E-İRSALİYE') {
    computedDocType = 'E-İRSALİYE';
  }

  const profileLabel = profile === 'TICARIFATURA' ? 'TİCARİ FATURA' : profile === 'TEMELFATURA' ? 'TEMEL FATURA' : 'EARSIVFATURA';
  const typeLabel = inv.gi_invoice_type || inv.invoice_type || 'SATIS';

  // Determine Stamp / Watermark
  const statusLower = (inv.status || 'draft').toLowerCase();
  const intStatusUpper = (inv.integration_status || '').toUpperCase();
  const isApprovedAndSent = ['APPROVED', 'ONAYLANDI', '1300', 'SUCCESS'].includes(intStatusUpper) && Boolean(inv.ettn);

  let stampTitle = "TASLAK";
  let stampSubtitle = "TASLAK FATURA • RESMİ NİTELİĞİ YOKTUR";
  let stampColor = "#d97706";
  let stampBg = "#fffbeb";
  let stampBorder = "#f59e0b";

  if (statusLower === 'cancelled' || intStatusUpper === 'CANCELLED' || intStatusUpper === 'İPTAL') {
    stampTitle = "İPTAL EDİLDİ";
    stampSubtitle = "İPTAL FATURA • GEÇERSİZDİR";
    stampColor = "#dc2626";
    stampBg = "#fef2f2";
    stampBorder = "#ef4444";
  } else if (statusLower === 'approved' && !isApprovedAndSent) {
    stampTitle = "GİB'E GÖNDERİLMEDİ";
    stampSubtitle = "GİB'E GÖNDERİLMEDİ • BİLGİLENDİRME ÖN İZLEMESİ";
    stampColor = "#ea580c";
    stampBg = "#fff7ed";
    stampBorder = "#f97316";
  } else if (statusLower === 'draft' || intStatusUpper === 'DRAFT' || intStatusUpper === 'NOT_SENT') {
    stampTitle = "TASLAK";
    stampSubtitle = "TASLAK FATURA • RESMİ NİTELİĞİ YOKTUR";
    stampColor = "#d97706";
    stampBg = "#fffbeb";
    stampBorder = "#f59e0b";
  }

  // Items and totals calculation
  let subtotal = 0;
  let totalDiscount = 0;
  let totalVat = 0;
  const vatMap: Record<number, number> = {};

  const itemsRows = items.map((item: any, idx: number) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.unit_price) || 0;
    let vatRate = Number(item.tax_rate ?? item.vat_rate ?? item.vat_percent ?? item.kdv_rate ?? 0);
    const disc = Number(item.discount_amount ?? item.discount ?? 0);

    let lineSubtotal = qty * price - disc;
    let lineVat = 0;

    if (inv.is_tax_inclusive) {
      const lineNet = qty * price - disc;
      lineSubtotal = vatRate > 0 ? lineNet / (1 + vatRate / 100) : lineNet;
      lineVat = lineNet - lineSubtotal;
    } else {
      if (item.tax_amount !== undefined && item.tax_amount !== null && Number(item.tax_amount) > 0) {
        lineVat = Number(item.tax_amount);
        if (vatRate === 0 && lineSubtotal > 0) {
          vatRate = Math.round((lineVat / lineSubtotal) * 100);
        }
      } else {
        lineVat = lineSubtotal * (vatRate / 100);
      }
    }

    // Fallback: If item.tax_rate was 0 but invoice has inv.tax_amount > 0 and inv.total_amount > 0
    if (vatRate === 0 && items.length === 1 && Number(inv.tax_amount) > 0 && Number(inv.total_amount) > 0) {
      const invSubtotal = Number(inv.total_amount);
      const invTax = Number(inv.tax_amount);
      vatRate = Math.round((invTax / invSubtotal) * 100);
      lineVat = invTax;
    }

    const lineTotal = item.total_price ? Number(item.total_price) : (lineSubtotal + lineVat);

    subtotal += lineSubtotal;
    totalDiscount += disc;
    totalVat += lineVat;

    vatMap[vatRate] = (vatMap[vatRate] || 0) + lineVat;

    return `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px; font-weight: 600;">${idx + 1}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; font-weight: 600; color: #0f172a;">${item.product_name || '-'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px; font-weight: 600;">${qty.toLocaleString('tr-TR')} ${item.unit || item.unit_code || 'Adet'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-size: 11px; font-weight: 600; font-family: monospace;">${price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-size: 11px; font-weight: 600; font-family: monospace;">${disc > 0 ? disc.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: center; font-size: 11px; font-weight: 600;">%${vatRate}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-size: 11px; font-weight: 600; font-family: monospace;">${lineVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-size: 11px; font-weight: 700; font-family: monospace; color: #0f172a;">${lineTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }).join('');

  // Use DB inv totals if present and valid, otherwise fallback to calculated subtotal / totalVat
  const invSubtotal = Number(inv.total_amount);
  const invTax = Number(inv.tax_amount);
  const invGrandTotal = Number(inv.grand_total);

  const finalSubtotal = !isNaN(invSubtotal) && invSubtotal > 0 ? invSubtotal : subtotal;
  const finalTotalVat = !isNaN(invTax) && invTax >= 0 ? invTax : totalVat;
  const finalGrandTotal = !isNaN(invGrandTotal) && invGrandTotal > 0 ? invGrandTotal : (finalSubtotal + finalTotalVat);

  // Ensure vatMap reflects finalTotalVat accurately (never empty)
  const sumVatInMap = Object.values(vatMap).reduce((acc, v) => acc + v, 0);
  if (finalTotalVat > 0 && (Object.keys(vatMap).length === 0 || sumVatInMap === 0)) {
    delete vatMap[0];
    const inferredRate = finalSubtotal > 0 ? Math.round((finalTotalVat / finalSubtotal) * 100) : 20;
    vatMap[inferredRate] = finalTotalVat;
  } else if (Object.keys(vatMap).length === 0) {
    vatMap[0] = 0;
  }

  const curr = inv.currency || 'TRY';
  const currSymbol = (curr === 'TRY' || curr === 'TL') ? 'TL' : curr;
  const amountWordsRaw = numberToTurkishWords(finalGrandTotal, curr);
  const amountWords = amountWordsRaw.replace(/\s+/g, '');

  // Grouped VAT rows according to Rule #4
  let vatRowsHtml = Object.entries(vatMap)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([rate, amt]) => `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 600; font-size: 11px; color: #334155;">Hesaplanan KDV (%${rate})</td>
        <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-weight: 700; font-size: 11px; font-family: monospace; color: #0f172a;">${amt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currSymbol}</td>
      </tr>
    `).join('');

  if (!vatRowsHtml.trim()) {
    const fallbackRate = finalSubtotal > 0 ? Math.round((finalTotalVat / finalSubtotal) * 100) : 20;
    vatRowsHtml = `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 600; font-size: 11px; color: #334155;">Hesaplanan KDV (%${fallbackRate})</td>
        <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-weight: 700; font-size: 11px; font-family: monospace; color: #0f172a;">${finalTotalVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currSymbol}</td>
      </tr>
    `;
  }

  if (Object.keys(vatMap).length > 1) {
    vatRowsHtml += `
      <tr style="background-color: #f1f5f9;">
        <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 700; font-size: 11px; color: #0f172a;">Toplam KDV</td>
        <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-weight: 800; font-size: 11px; font-family: monospace; color: #0f172a;">${finalTotalVat.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currSymbol}</td>
      </tr>
    `;
  }

  let exchangeRateBlock = '';
  if (curr !== 'TRY' && curr !== 'TL') {
    let exRate = Number(inv.exchange_rate) || 0;
    if (exRate <= 0) {
      let currRates = store.currency_rates || {};
      if (typeof currRates === 'string') { try { currRates = JSON.parse(currRates); } catch (e) {} }
      exRate = Number(currRates[curr]) || 1.0;
    }

    const trySubtotalNum = finalSubtotal * exRate;
    const tryVatNum = finalTotalVat * exRate;
    const tryGrandTotalNum = finalGrandTotal * exRate;

    const trySubtotal = trySubtotalNum.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const tryVat = tryVatNum.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const tryGrandTotal = tryGrandTotalNum.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const tryVatRows = Object.entries(vatMap)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([rate, amt]) => {
        const tryAmt = (amt * exRate).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 600; font-size: 11px; color: #334155;">Hesaplanan KDV (%${rate}) (TL)</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-weight: 700; font-size: 11px; font-family: monospace; color: #0f172a;">${tryAmt} TL</td>
          </tr>
        `;
      }).join('');

    exchangeRateBlock = `
      <div style="margin-top: 12px; border: 1.5px solid #0f172a; border-radius: 6px; overflow: hidden; background: #ffffff;">
        <div style="background: #0f172a; color: #ffffff; padding: 6px 12px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
          <span>DÖVİZ KARŞILIKLARI (TRY)</span>
          <span style="font-size: 10.5px; font-weight: 700; background: #22c55e; color: #000000; padding: 2px 6px; border-radius: 4px;">1 ${curr} = ${exRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} TRY</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <tbody>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 600; color: #334155;">Mal Hizmet Toplam Tutarı (TL)</td>
              <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-weight: 700; font-family: monospace;">${trySubtotal} TL</td>
            </tr>
            ${tryVatRows}
            <tr style="background-color: #f8fafc;">
              <td style="border: 1px solid #cbd5e1; padding: 6px 8px; font-weight: 800; color: #0f172a; font-size: 11.5px;">Vergiler Dahil Toplam Tutar (TL)</td>
              <td style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: right; font-weight: 900; font-size: 12px; font-family: monospace; color: #0f172a;">${tryGrandTotal} TL</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  const bankDetails = (branding.payment_settings?.bank_details || branding.payment_settings?.hotel_bank_details || '').trim();
  const effectiveInvoiceNotes = (() => {
    let n = (inv.notes || "").trim();
    if (!n) {
      return ["İrsaliye Yerine Geçer.", bankDetails ? `Banka Hesap ve IBAN Bilgileri:\n${bankDetails}` : ""].filter(Boolean).join("\n\n");
    }
    let res = n;
    if (!res.includes("İrsaliye Yerine Geçer")) {
      res = `İrsaliye Yerine Geçer.\n\n${res}`;
    }
    if (bankDetails && !res.includes(bankDetails.substring(0, 8))) {
      res = `${res}\n\nBanka Hesap ve IBAN Bilgileri:\n${bankDetails}`;
    }
    return res;
  })();

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <title>${computedDocType} - ${docNumber}</title>
  <style>
    @media print {
      @page { size: A4 portrait; margin: 8mm; }
      body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background-color: #fff;
      margin: 0;
      padding: 20px;
      font-size: 12px;
      box-sizing: border-box;
    }
  </style>
</head>
<body>

  <!-- Watermark background for non-official / draft / unsent invoices -->
  ${!isApprovedAndSent ? `
  <div style="position: fixed; top: 38%; left: 5%; width: 90%; text-align: center; transform: rotate(-28deg); pointer-events: none; z-index: 9999; opacity: 0.13;">
    <div style="font-size: 58px; font-weight: 900; color: ${stampColor}; text-transform: uppercase; letter-spacing: 5px; border: 8px solid ${stampColor}; padding: 14px 28px; display: inline-block; border-radius: 12px;">
      ${stampTitle}
    </div>
    <div style="font-size: 18px; font-weight: 800; color: ${stampColor}; margin-top: 8px; letter-spacing: 1.5px;">
      ${stampSubtitle}
    </div>
  </div>
  ` : ''}

  <!-- Header Container -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
    <tr>
      <td style="width: 55%; vertical-align: top; padding-right: 12px;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${storeName}" style="max-height: 55px; max-width: 200px; object-fit: contain; margin-bottom: 8px; display: block;" />` : ''}
        <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${storeName}</div>
        <div style="font-size: 11px; color: #334155; line-height: 1.45;">
          ${supplierAddress}<br/>
          <strong>VKN/TC:</strong> ${supplierVkn} &nbsp;|&nbsp; <strong>Vergi Dairesi:</strong> ${supplierTaxOffice}<br/>
          ${supplierPhone ? `<strong>Tel:</strong> ${supplierPhone}` : ''} ${supplierEmail ? `&nbsp;|&nbsp; <strong>E-Posta:</strong> ${supplierEmail}` : ''}<br/>
          ${supplierMersis ? `<strong>Mersis No:</strong> ${supplierMersis}` : ''} ${supplierWeb ? `&nbsp;|&nbsp; <strong>Web:</strong> ${supplierWeb}` : ''}
        </div>
      </td>
      <td style="width: 45%; vertical-align: top; text-align: right;">
        <div style="font-size: 20px; font-weight: 900; color: #1e293b; letter-spacing: 1px; margin-bottom: 6px;">${computedDocType}</div>
        
        <!-- Stamp Badge Box -->
        <div style="margin-bottom: 8px;">
          <div style="border: 2px dashed ${stampBorder}; background-color: ${stampBg}; color: ${stampColor}; padding: 6px 12px; border-radius: 8px; text-align: center; display: inline-block;">
            <div style="font-size: 14px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">${stampTitle}</div>
            <div style="font-size: 8.5px; font-weight: 700; margin-top: 2px;">${stampSubtitle}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 4px;">
          <tr>
            <td style="text-align: right; font-weight: 600; color: #64748b; padding: 2px 4px;">Fatura No:</td>
            <td style="text-align: right; font-weight: 800; color: #0f172a; padding: 2px 4px; font-family: monospace;">${docNumber}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: 600; color: #64748b; padding: 2px 4px;">ETTN:</td>
            <td style="text-align: right; font-weight: 700; color: #334155; padding: 2px 4px; font-family: monospace; font-size: 10px;">${ettnVal}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: 600; color: #64748b; padding: 2px 4px;">Tarih / Saat:</td>
            <td style="text-align: right; font-weight: 700; color: #0f172a; padding: 2px 4px;">${invoiceDate} ${invoiceTime}</td>
          </tr>
          <tr>
            <td style="text-align: right; font-weight: 600; color: #64748b; padding: 2px 4px;">Senaryo / Tip:</td>
            <td style="text-align: right; font-weight: 700; color: #0f172a; padding: 2px 4px;">${profileLabel} / ${typeLabel}</td>
          </tr>
          ${dueDateFormatted ? `
          <tr>
            <td style="text-align: right; font-weight: 700; color: #b91c1c; padding: 2px 4px;">Vade Tarihi:</td>
            <td style="text-align: right; font-weight: 800; color: #b91c1c; padding: 2px 4px;">${dueDateFormatted}${inv.due_days ? ` (${inv.due_days} Gün)` : ''}</td>
          </tr>` : ''}
        </table>
      </td>
    </tr>
  </table>

  <!-- Buyer Box -->
  <div style="border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; margin-bottom: 16px; background-color: #f8fafc;">
    <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">SAYIN (ALICI)</div>
    <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">${customerName}</div>
    <div style="font-size: 11px; color: #334155; line-height: 1.4;">
      <strong>VKN / TCKN:</strong> ${customerVkn} &nbsp;|&nbsp; <strong>Vergi Dairesi:</strong> ${customerTaxOffice}<br/>
      ${customerAddress}<br/>
      ${customerPhone ? `<strong>Tel:</strong> ${customerPhone}` : ''} ${customerEmail ? `&nbsp;|&nbsp; <strong>E-Posta:</strong> ${customerEmail}` : ''}
    </div>
  </div>

  <!-- Items Table -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
    <thead>
      <tr style="background-color: #0f172a; color: #ffffff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
        <th style="border: 1px solid #0f172a; padding: 7px 8px; text-align: center; width: 35px;">S.No</th>
        <th style="border: 1px solid #0f172a; padding: 7px 8px; text-align: left;">Mal / Hizmet Açıklaması</th>
        <th style="border: 1px solid #0f172a; padding: 7px 8px; text-align: center; width: 80px;">Miktar</th>
        <th style="border: 1px solid #0f172a; padding: 7px 8px; text-align: right; width: 90px;">Birim Fiyat</th>
        <th style="border: 1px solid #0f172a; padding: 7px 8px; text-align: right; width: 75px;">İskonto</th>
        <th style="border: 1px solid #0f172a; padding: 7px 8px; text-align: center; width: 60px;">KDV %</th>
        <th style="border: 1px solid #0f172a; padding: 7px 8px; text-align: right; width: 85px;">KDV Tutarı</th>
        <th style="border: 1px solid #0f172a; padding: 7px 8px; text-align: right; width: 105px;">Toplam Tutar</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <!-- Totals & Notes Section -->
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <!-- Left side: Notes & Amount in Words -->
      <td style="width: 58%; vertical-align: top; padding-right: 12px;">
        <div style="border: 1.5px solid #000; padding: 8px 12px; border-radius: 6px; font-weight: 800; font-size: 11.5px; background: #fff; margin-bottom: 10px;">
          YALNIZ: # ${amountWords} #
        </div>

        <div style="border: 1.5px solid #0f172a; border-radius: 6px; padding: 10px 14px; background: #ffffff; font-size: 11.5px; margin-bottom: 10px; line-height: 1.55;">
          <strong style="display: block; text-transform: uppercase; color: #475569; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">Fatura Açıklaması / Notlar:</strong>
          <div style="white-space: pre-wrap; color: #0f172a; font-weight: 600;">${effectiveInvoiceNotes}</div>
        </div>

        ${exchangeRateBlock}
      </td>

      <!-- Right side: Financial Totals Box -->
      <td style="width: 42%; vertical-align: top;">
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 600;">Mal Hizmet Toplam Tutarı</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-weight: 700; font-family: monospace;">${finalSubtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currSymbol}</td>
          </tr>
          ${totalDiscount > 0 ? `
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 5px 8px; font-weight: 600; color: #dc2626;">Toplam İskonto</td>
            <td style="border: 1px solid #cbd5e1; padding: 5px 8px; text-align: right; font-weight: 700; font-family: monospace; color: #dc2626;">-${totalDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currSymbol}</td>
          </tr>
          ` : ''}
          
          <!-- Grouped VAT Rows -->
          ${vatRowsHtml}

          <tr style="background-color: #0f172a; color: #ffffff;">
            <td style="border: 1px solid #0f172a; padding: 7px 8px; font-weight: 800; font-size: 12px;">Ödenecek Toplam Tutar</td>
            <td style="border: 1px solid #0f172a; padding: 7px 8px; text-align: right; font-weight: 900; font-size: 13px; font-family: monospace;">${finalGrandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currSymbol}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

router.get("/einvoice/:id/html", authenticate, async (req: any, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';
    const requestedStoreId = req.query.storeId ? Number(req.query.storeId) : undefined;
    const invoiceId = req.params.id;
    const invoiceType = req.query.type || 'purchase';

    let invoiceRes;
    try {
        if (invoiceType === 'sales') {
            if (isSuperAdmin && !requestedStoreId) {
                invoiceRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
            } else {
                invoiceRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1 AND store_id = $2", [invoiceId, requestedStoreId || req.user.store_id]);
            }
        } else {
            if (isSuperAdmin && !requestedStoreId) {
                invoiceRes = await pool.query("SELECT * FROM purchase_invoices WHERE id = $1", [invoiceId]);
            } else {
                invoiceRes = await pool.query("SELECT * FROM purchase_invoices WHERE id = $1 AND store_id = $2", [invoiceId, requestedStoreId || req.user.store_id]);
            }
        }
    } catch (queryErr) {
        console.error("[DB-ERROR] Error fetching invoice details:", queryErr);
        if (invoiceType === 'sales') {
            if (isSuperAdmin && !requestedStoreId) {
                invoiceRes = await pool.query("SELECT id, store_id, ettn, document_number, notes FROM sales_invoices WHERE id = $1", [invoiceId]);
            } else {
                invoiceRes = await pool.query("SELECT id, store_id, ettn, document_number, notes FROM sales_invoices WHERE id = $1 AND store_id = $2", [invoiceId, requestedStoreId || req.user.store_id]);
            }
        } else {
            if (isSuperAdmin && !requestedStoreId) {
                invoiceRes = await pool.query("SELECT id, store_id, ettn, document_number, notes FROM purchase_invoices WHERE id = $1", [invoiceId]);
            } else {
                invoiceRes = await pool.query("SELECT id, store_id, ettn, document_number, notes FROM purchase_invoices WHERE id = $1 AND store_id = $2", [invoiceId, requestedStoreId || req.user.store_id]);
            }
        }
    }

    if (!invoiceRes || invoiceRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı." });

    const invData = invoiceRes.rows[0];
    const targetStoreId = invData.store_id || requestedStoreId || req.user.store_id;

    if (!isSuperAdmin && invData.store_id && invData.store_id !== req.user.store_id) {
        return res.status(403).json({ error: "Yetkisiz işlem: Bu faturaya erişim yetkiniz bulunmamaktadır." });
    }

    // Handle Sales Invoice Preview (Draft, Unsent, or Sent)
    if (invoiceType === 'sales') {
      const isDraftOrUnsent = invData.status === 'draft' ||
                              ['DRAFT', 'NOT_SENT'].includes(invData.integration_status) ||
                              !invData.ettn;

      if (!isDraftOrUnsent) {
        try {
          const service = await getEInvoiceService(targetStoreId);
          if ('getInvoiceHtml' in service) {
            const docTypeToUse = invData.e_document_type || 'E-ARSIV';
            let html = await (service as any).getInvoiceHtml(invData.ettn, invData.document_number, docTypeToUse, false);
            if (html && typeof html === 'string' && html.trim().length > 0) {
              html = cleanInvoiceHtmlVatRows(html);
              html = injectSalesExchangeRateBlockIfNeeded(html, invData);
              return res.json({ html });
            }
          }
        } catch (serviceErr) {
          console.warn("[HTML-FETCH] MySoft service call failed for sales invoice, generating local stamped HTML:", serviceErr);
        }
      }

      // Local HTML fallback with watermark & status stamps
      const localHtml = await generateLocalSalesInvoiceHtml(Number(invoiceId), targetStoreId);
      return res.json({ html: localHtml });
    }

    // Purchase Invoice
    const { ettn, document_number, notes, currency, exchange_rate } = invData;
    const grand_total = invData.grand_total || invData.payable_amount || invData.total_amount || 0;
    const subtotal = invData.subtotal || invData.total_amount || (Number(grand_total) - Number(invData.tax_amount || 0));
    const tax_amount = invData.tax_amount || 0;
    if (!ettn && !document_number) return res.status(400).json({ error: "Faturanın ETTN'si veya numarası bulunmuyor." });

    const service = await getEInvoiceService(targetStoreId);
    if ('getInvoiceHtml' in service) {
      const docTypeToUse = invData.e_document_type || 'E-ARSIV';
      let html = await (service as any).getInvoiceHtml(ettn, document_number, docTypeToUse, true);
      return res.json({ html });
    }

    res.status(400).json({ error: "Kullandığınız entegratör için HTML önizleme desteği bulunmuyor." });
  } catch (error: any) {
    console.error("Get HTML endpoint error:", error);
    res.status(500).json({ error: error.message || "Bilinmeyen bir hata oluştu" });
  }
});

export const runGlobalEInvoiceSync = async () => {
  try {
    const storesRes = await pool.query(
      `SELECT id FROM stores 
       WHERE einvoice_settings->>'is_active' = 'true'
         AND COALESCE(branding->>'is_demo', 'false') != 'true'
         AND COALESCE(NULLIF(TRIM(einvoice_settings->>'username'), ''), NULLIF(TRIM(einvoice_settings->>'earchive_username'), '')) IS NOT NULL
         AND COALESCE(NULLIF(TRIM(einvoice_settings->>'password'), ''), NULLIF(TRIM(einvoice_settings->>'api_token'), '')) IS NOT NULL`
    );
    for (const store of storesRes.rows) {
      try {
        const storeId = store.id;
        const service = await getEInvoiceService(storeId);
        
        // Look back 60 days to catch any delayed or back-dated invoices
        const endDate = new Date().toISOString().split('T')[0];
        const startDateObj = new Date();
        startDateObj.setDate(startDateObj.getDate() - 60);
        const startDate = startDateObj.toISOString().split('T')[0];

        // Fetch raw incoming invoices with combined docDate and envelopeDate modes (limit 1000)
        const incomingInvoices = await service.getIncomingInvoices(startDate, endDate);
        
        const { importedCount, updatedCount } = await importIncomingInvoicesForStore(storeId, startDate, endDate, undefined, incomingInvoices);
        if (importedCount > 0 || updatedCount > 0) {
          console.log(`[runGlobalEInvoiceSync] Store ${storeId} finished: imported ${importedCount}, updated ${updatedCount}.`);
        }
      } catch (err: any) {
        const msg = String(err?.message || '');
        if (!msg.includes('kimlik doğrulaması başarısız') && !msg.includes('Kullanıcı tanımsızdır') && !msg.includes('tanımlanmamış')) {
          console.info(`[runGlobalEInvoiceSync] Store ${store.id} skipped:`, msg);
        }
      }
    }
  } catch (err) {
    // ignore background sync query issue
  }
};

// --- E-WAYBILL (E-İRSALİYE) ENDPOINTS ---

// 1. Save Waybill Details Draft on Invoice
router.post("/einvoice/waybill/save/:invoiceId", authenticate, async (req: any, res) => {
  const { invoiceId } = req.params;
  const {
    driverName,
    driverSurname,
    driverVkn,
    plateNumber,
    trailerPlate,
    actualDate,
    actualTime,
    prefix,
    isCargoShipment,
    carrierName,
    trackingNumber,
    deliveryTerm,
    transportMode
  } = req.body;

  try {
    const storeId = req.user.store_id;
    let query = "";
    let params: any[] = [];

    if (req.user.role === 'superadmin') {
      query = `
        UPDATE sales_invoices 
        SET waybill_driver_name = $1, waybill_driver_surname = $2, waybill_driver_vkn = $3, 
            waybill_plate_number = $4, waybill_trailer_plate = $5, waybill_actual_date = $6, 
            waybill_actual_time = $7, waybill_prefix = $8,
            waybill_is_cargo_shipment = $9, waybill_carrier_name = $10, waybill_tracking_number = $11,
            waybill_delivery_term = $12, waybill_transport_mode = $13
        WHERE id = $14
      `;
      params = [
        driverName, driverSurname, driverVkn, plateNumber, trailerPlate, actualDate || null, actualTime || null, prefix || 'IRS',
        !!isCargoShipment, carrierName || null, trackingNumber || null, deliveryTerm || null, transportMode || null,
        invoiceId
      ];
    } else {
      query = `
        UPDATE sales_invoices 
        SET waybill_driver_name = $1, waybill_driver_surname = $2, waybill_driver_vkn = $3, 
            waybill_plate_number = $4, waybill_trailer_plate = $5, waybill_actual_date = $6, 
            waybill_actual_time = $7, waybill_prefix = $8,
            waybill_is_cargo_shipment = $9, waybill_carrier_name = $10, waybill_tracking_number = $11,
            waybill_delivery_term = $12, waybill_transport_mode = $13
        WHERE id = $14 AND store_id = $15
      `;
      params = [
        driverName, driverSurname, driverVkn, plateNumber, trailerPlate, actualDate || null, actualTime || null, prefix || 'IRS',
        !!isCargoShipment, carrierName || null, trackingNumber || null, deliveryTerm || null, transportMode || null,
        invoiceId, storeId
      ];
    }

    await pool.query(query, params);
    res.json({ success: true, message: "İrsaliye taslak bilgileri kaydedildi." });
  } catch (err: any) {
    console.error("Save Waybill Error:", err);
    res.status(500).json({ error: "İrsaliye bilgileri kaydedilemedi: " + err.message });
  }
});

// Helper function to build MySoft Waybill JSON Payload (DespatchOutboxModel - MySoft Swagger v8)
async function buildMySoftWaybillPayload(pool: any, data: any, storeSettings: any, branding: any, pkAlias: string, isIndependent: boolean = false) {
  // Recipient tax details
  const taxNumber = (data.tax_number || data.company_tax_number || "").replace(/\D/g, '') || "11111111111";

  // Driver / Plate details
  const isCargoShipment = !!data.is_cargo_shipment || !!data.waybill_is_cargo_shipment;
  const rawDriverName = ((isIndependent ? data.driver_name : data.waybill_driver_name) || "Sürücü").trim();
  const rawDriverSurname = ((isIndependent ? data.driver_surname : data.waybill_driver_surname) || "").trim();
  // If driver_surname was left empty and full name was entered in driver_name, split it cleanly
  let driverName = rawDriverName;
  let driverSurname = rawDriverSurname;
  if (!driverSurname && rawDriverName.includes(" ")) {
    const parts = rawDriverName.split(/\s+/);
    driverSurname = parts.pop() || "Soyad";
    driverName = parts.join(" ") || "Sürücü";
  } else if (!driverSurname) {
    driverSurname = "Soyad";
  }

  const rawDriverVkn = ((isIndependent ? data.driver_vkn : data.waybill_driver_vkn) || "").replace(/\D/g, '');
  const driverVkn = (rawDriverVkn.length === 11) ? rawDriverVkn : "11111111111";
  const plateNumber = ((isIndependent ? data.plate_number : data.waybill_plate_number) || "34ABC000").replace(/\s/g, '').toUpperCase();

  // Dates and Times (MySoft requires ISO-8601 with timezone offset, and actualReferalDate >= docDate)
  const rawDocDateObj = (isIndependent ? data.waybill_date : data.invoice_date)
    ? new Date(isIndependent ? data.waybill_date : data.invoice_date)
    : new Date();
  const rawActualDateObj = (isIndependent ? data.actual_date : data.waybill_actual_date)
    ? new Date(isIndependent ? data.actual_date : data.waybill_actual_date)
    : rawDocDateObj;

  const docDateYmd = !isNaN(rawDocDateObj.getTime()) ? rawDocDateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  let actualDateYmd = !isNaN(rawActualDateObj.getTime()) ? rawActualDateObj.toISOString().split('T')[0] : docDateYmd;
  if (actualDateYmd < docDateYmd) {
    actualDateYmd = docDateYmd;
  }

  const normalizeTimeStr = (t: any, fallback: string) => {
    if (!t || typeof t !== 'string') return fallback;
    const clean = t.trim().split('.')[0];
    if (/^\d{2}:\d{2}:\d{2}$/.test(clean)) return clean;
    if (/^\d{2}:\d{2}$/.test(clean)) return `${clean}:00`;
    return fallback;
  };

  const nowTimeStr = new Date().toTimeString().split(' ')[0];
  const docTimeHms = normalizeTimeStr(isIndependent ? data.waybill_time : data.invoice_time, nowTimeStr);
  let actualTimeHms = normalizeTimeStr(isIndependent ? data.actual_time : data.waybill_actual_time, docTimeHms);
  if (actualDateYmd === docDateYmd && actualTimeHms < docTimeHms) {
    actualTimeHms = docTimeHms;
  }

  // Retrieve items
  let lines: any[] = [];
  if (isIndependent) {
    const itemsRes = await pool.query("SELECT * FROM e_waybill_items WHERE waybill_id = $1 ORDER BY id ASC", [data.id]);
    lines = itemsRes.rows;
  } else {
    const itemsRes = await pool.query("SELECT * FROM sales_invoice_items WHERE sales_invoice_id = $1 ORDER BY id ASC", [data.id]);
    lines = itemsRes.rows;
  }

  const currencyCode = ((data.currency || 'TRY').toUpperCase() === 'TL' ? 'TRY' : (data.currency || 'TRY').toUpperCase());

  const despatchDetail = lines.map((item: any, index: number) => {
    const quantity = Number(item.quantity) || 1;
    const unitPrice = Number(item.unit_price || item.price || 0);
    const lineTotal = Number(item.total_price || item.line_total || (quantity * unitPrice) || 0);
    const unitCode = (() => {
      const rawUnit = (item.unit_code || item.unit || "").trim().toLowerCase();
      const mapping: any = {
        "adet": "C62", "ad": "C62", "pcs": "C62", "piece": "C62", "c62": "C62",
        "kg": "KGM", "kilogram": "KGM", "kgm": "KGM",
        "gr": "GRM", "gram": "GRM", "g": "GRM", "grm": "GRM",
        "lt": "LTR", "litre": "LTR", "l": "LTR", "ltr": "LTR",
        "paket": "PA", "kutu": "BX", "ton": "TNE", "m2": "MTK", "mt": "MTR", "metre": "MTR"
      };
      return mapping[rawUnit] || (rawUnit.length >= 2 && rawUnit.length <= 3 ? rawUnit.toUpperCase() : "C62");
    })();

    const prodName = (item.product_name || item.name || "Ürün").trim().substring(0, 200);
    const prodCode = String(item.product_code || item.sku || item.product_id || (index + 1)).substring(0, 50);

    return {
      product: {
        productCode: prodCode,
        productName: prodName,
        serialIdList: null
      },
      unitCode,
      qty: quantity,
      unitPriceTra: unitPrice,
      amtTra: lineTotal,
      currencyCode,
      note: item.description || item.note || ""
    };
  });

  const customerTitle = (data.company_title || data.company_name || (data.customer_name ? `${data.customer_name} ${data.customer_surname || ''}`.trim() : "") || "Seçkin Müşteri").trim();
  const addrStr = (data.address || data.company_address || data.customer_address || data.delivery_address || "İstanbul Merkez").trim();
  const delivAddrStr = (data.delivery_address || data.company_delivery_address || addrStr || "İstanbul Merkez").trim();

  const extractCityDistrict = (rawAddress: string) => {
    const cleaned = rawAddress.replace(/[,/\\-]+/g, ' ').trim();
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    const city = (tokens.length >= 1 ? tokens[tokens.length - 1] : "İSTANBUL").toLocaleUpperCase('tr-TR');
    const district = (tokens.length >= 2 ? tokens[tokens.length - 2] : "MERKEZ").toLocaleUpperCase('tr-TR');
    return { city, district };
  };

  const { city: accCity, district: accDistrict } = extractCityDistrict(addrStr);
  const { city: delivCity, district: delivDistrict } = extractCityDistrict(delivAddrStr);
  const taxOfficeName = (data.tax_office || data.company_tax_office || "MERKEZ").trim();
  const customerPhone = (data.company_phone || data.customer_phone || data.phone || "").trim();
  const customerEmail = (data.company_email || data.customer_email || data.email || "").trim();

  // Cargo / Carrier resolution
  const cName = (isIndependent ? data.carrier_name : data.waybill_carrier_name) || "Aras Kargo";
  const carrierVknMap: { [key: string]: string } = {
    "yurtiçi kargo": "9830022295", "aras kargo": "0720039649", "mng kargo": "6220353119",
    "ptt kargo": "7330135756", "sürat kargo": "7820257003", "ups kargo": "9130018597"
  };
  const cVknFromDb = (isIndependent ? data.carrier_vkn : data.waybill_carrier_vkn);
  const cVkn = (cVknFromDb || carrierVknMap[cName.toLowerCase().trim()] || "0720039649").replace(/\D/g, '');

  // Normalize profile ("TEMEL IRSALİYE" -> "TEMELIRSALIYE")
  const rawScenario = (data.scenario || "TEMELIRSALIYE").toString().trim();
  const normalizedProfile = rawScenario
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'I')
    .replace(/i/g, 'I')
    .replace(/Ş/g, 'S')
    .replace(/ş/g, 'S')
    .replace(/Ğ/g, 'G')
    .replace(/ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/ç/g, 'C')
    .replace(/\s+/g, '')
    .toUpperCase() || "TEMELIRSALIYE";

  const rawType = (data.waybill_type || "SEVK").toString().trim().toUpperCase();
  const normalizedType = rawType === "MATBUDAN" ? "MATBUDAN" : "SEVK";

  // Resolve valid docNo (if draft / TASLAK, leave null for preview/control or use 16-char official docNo for send)
  const rawDocNo = isIndependent ? data.waybill_number : data.waybill_number;
  const validDocNo = (rawDocNo && !rawDocNo.startsWith("TASLAK") && rawDocNo.length === 16) ? rawDocNo : null;

  const orderNo = (data.order_number || data.waybill_order_number || "").toString().trim();
  const orderDateRaw = data.order_date || data.waybill_order_date;
  const orderDateIso = orderDateRaw && !isNaN(new Date(orderDateRaw).getTime())
    ? `${new Date(orderDateRaw).toISOString().split('T')[0]}T00:00:00+03:00`
    : `${docDateYmd}T00:00:00+03:00`;

  const resolvedPkAlias = (pkAlias && pkAlias !== "urn:mail:defaultpk")
    ? pkAlias
    : "urn:mail:irsaliyepk@gib.gov.tr";

  const rawNoteText = (data.notes || "").toString().trim();
  const noteText = rawNoteText
    .replace(/İrsaliye\s+Yerine\s+Geçer\.?/gi, "")
    .replace(/İrsaliye\s+yerine\s+geçer\.?/gi, "")
    .trim();

  const payload: any = {
    id: null,
    connectorGuid: storeSettings.connector_guid || null,
    eDespatchType: normalizedType,
    profile: normalizedProfile,
    docNo: validDocNo,
    ettn: (isIndependent ? data.ettn : data.waybill_ettn) || undefined,
    docDate: `${docDateYmd}T00:00:00+03:00`,
    docTime: `${docDateYmd}T${docTimeHms}+03:00`,
    actualReferalDate: `${actualDateYmd}T00:00:00+03:00`,
    actualReferalTime: `${actualDateYmd}T${actualTimeHms}+03:00`,
    pkAlias: resolvedPkAlias,
    gbAlias: storeSettings.ewaybill_sender_alias || null,
    orderNo: orderNo || null,
    orderDate: orderNo ? orderDateIso : null,
    currencyCode,
    currencyRate: Number(data.exchange_rate || 1),
    isCalculateByApi: true,
    isManuelCalculation: false,
    note1: noteText || null,

    deliveryAccount: {
      accountName: customerTitle.substring(0, 100),
      identifierNumber: taxNumber,
      city: { name: accCity },
      country: { code: "TR", name: "Türkiye" },
      citySubdivision: accDistrict,
      taxOffice: { name: taxOfficeName },
      postalCode: "34000",
      streetName: addrStr.substring(0, 250),
      district: accDistrict,
      telephone1: customerPhone,
      email1: customerEmail
    },

    account: {
      accountName: customerTitle.substring(0, 100),
      identifierNumber: taxNumber,
      city: { name: accCity },
      country: { code: "TR", name: "Türkiye" },
      citySubdivision: accDistrict,
      taxOffice: { name: taxOfficeName },
      postalCode: "34000",
      streetName: addrStr.substring(0, 250),
      district: accDistrict,
      telephone1: customerPhone,
      email1: customerEmail
    },

    deliveryAddress: {
      deliveryPartyAccountName: customerTitle.substring(0, 100),
      deliveryPartyIdentifierNumber: taxNumber,
      deliveryPartyTaxOffice: taxOfficeName,
      city: { name: delivCity },
      country: { code: "TR", name: "Türkiye" },
      citySubdivision: delivDistrict,
      taxOffice: { name: taxOfficeName },
      postalCode: "34000",
      streetName: delivAddrStr.substring(0, 250),
      buildingName: "",
      buildingNumber: "",
      room: "",
      district: delivDistrict
    },

    ...(isCargoShipment ? {
      shipmentCarrier: {
        companyName: cName,
        identifierNumber: cVkn,
        city: { name: accCity },
        country: { code: "TR", name: "Türkiye" },
        citySubdivision: accDistrict,
        postalCode: "34000"
      },
      driverIdentifierNumber: driverVkn,
      driverName: driverName,
      driverSurname: driverSurname,
      lisancePlate: plateNumber || "34KARGO",
      lisancePlateSchemaId: "PLAKA"
    } : {
      driverIdentifierNumber: driverVkn,
      driverName: driverName,
      driverSurname: driverSurname,
      lisancePlate: plateNumber,
      lisancePlateSchemaId: "PLAKA"
    }),

    despatchDetail,
    notes: noteText ? [{ note: noteText }] : []
  };

  return payload;
}

// 2. Send E-Waybill to Entegrator (MySoft)
router.post("/einvoice/waybill/send/:invoiceId", authenticate, async (req: any, res) => {
  const { invoiceId } = req.params;
  let storeId = req.user.store_id;

  try {
    const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
    if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı" });
    const invoice = invRes.rows[0];
    
    if (req.user.role !== 'superadmin' && invoice.store_id !== storeId) {
      return res.status(403).json({ error: "Bu işlem için yetkiniz bulunmamaktadır." });
    }
    storeId = invoice.store_id;

    // Load store settings
    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0]?.einvoice_settings || {};
    const branding = storeRes.rows[0]?.branding || {};

    const service = await getEWaybillService(storeId);
    const taxNumber = (invoice.tax_number || "").replace(/\D/g, '');
    const taxpayerCheck = await service.checkTaxpayer(taxNumber);
    let pkAlias = taxpayerCheck.waybillAlias || "urn:mail:irsaliyepk@gib.gov.tr";

    let waybillNumber = invoice.waybill_number;
    let waybillEttn = invoice.waybill_ettn || crypto.randomUUID();

    if (!waybillNumber || waybillNumber.startsWith("TASLAK")) {
       const prefix = (invoice.waybill_prefix || "IRS").toUpperCase().substring(0, 3);
       const year = new Date().getFullYear();
       const seqRes = await pool.query(
         "SELECT waybill_number FROM sales_invoices WHERE store_id = $1 AND waybill_number LIKE $2 ORDER BY waybill_number DESC LIMIT 1",
         [storeId, `${prefix}${year}%`]
       );
       let seq = 1;
       if (seqRes.rows[0]?.waybill_number) {
         seq = parseInt(seqRes.rows[0].waybill_number.substring(7)) + 1;
       }
       waybillNumber = `${prefix}${year}${seq.toString().padStart(9, '0')}`;
       await pool.query("UPDATE sales_invoices SET waybill_number = $1, waybill_ettn = $2 WHERE id = $3", [waybillNumber, waybillEttn, invoiceId]);
       invoice.waybill_number = waybillNumber;
       invoice.waybill_ettn = waybillEttn;
    }

    const ublData = await buildMySoftWaybillPayload(pool, invoice, settings, branding, pkAlias);
    const result = await service.sendWaybill(ublData);

    if (result.isSuccess) {
      await pool.query("UPDATE sales_invoices SET waybill_status = 'SUCCESS', waybill_message = $1 WHERE id = $2", ["GİB'e iletildi.", invoiceId]);
      res.json({ success: true, waybillNumber, ettn: waybillEttn });
    } else {
      throw new Error(result.message);
    }
  } catch (err: any) {
    console.error("Waybill Send Error:", err);
    await pool.query("UPDATE sales_invoices SET waybill_status = 'ERROR', waybill_message = $1 WHERE id = $2", [err.message, invoiceId]);
    res.status(500).json({ error: err.message });
  }
});

// 3. Durum Sorgulama E-Waybill status endpoint
router.get("/einvoice/waybill/status/:invoiceId", authenticate, async (req: any, res) => {
  const { invoiceId } = req.params;
  try {
    const invRes = await pool.query("SELECT store_id, waybill_ettn FROM sales_invoices WHERE id = $1", [invoiceId]);
    if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı." });
    const { store_id, waybill_ettn } = invRes.rows[0];

    if (!waybill_ettn) return res.status(400).json({ error: "E-İrsaliye henüz gönderilmemiş." });

    const service = await getEWaybillService(store_id);
    const result = await service.getWaybillStatus(waybill_ettn);

    await pool.query("UPDATE sales_invoices SET waybill_status = $1, waybill_message = $2 WHERE id = $3", [result.status.toUpperCase(), result.message, invoiceId]);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. E-Waybill Preview HTML
router.get("/einvoice/waybill/preview-html/:invoiceId", authenticate, async (req: any, res) => {
  const { invoiceId } = req.params;
  try {
    const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
    const invoice = invRes.rows[0];
    if (!invoice) return res.status(404).json({ error: "Fatura bulunamadı" });

    // Load store settings & branding
    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [invoice.store_id]);
    const settings = storeRes.rows[0]?.einvoice_settings || {};
    const branding = storeRes.rows[0]?.branding || {};

    const service = await getEWaybillService(invoice.store_id);
    
    // Determine PK Alias
    const taxNumber = (invoice.tax_number || "").replace(/\D/g, '');
    const taxpayerCheck = await service.checkTaxpayer(taxNumber);
    let pkAlias = taxpayerCheck.waybillAlias || "urn:mail:irsaliyepk@gib.gov.tr";

    // Build Payload
    const ublData = await buildMySoftWaybillPayload(pool, invoice, settings, branding, pkAlias);
    
    // Call MySoft Preview
    const html = await service.getWaybillPreviewHtml(ublData);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err: any) {
    console.error("Waybill Preview Endpoint Error:", err);
    res.status(500).json({ error: "Önizleme oluşturulamadı: " + err.message });
  }
});

// 5. Fetch E-Waybill representation (Sent HTML)
router.get("/einvoice/waybill/html/:invoiceId", authenticate, async (req: any, res) => {
  const { invoiceId } = req.params;
  try {
    const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
    if (invRes.rows.length === 0) return res.status(404).json({ error: "Kayıt bulunamadı" });
    const invoice = invRes.rows[0];

    if (!invoice.waybill_ettn) return res.status(400).json({ error: "E-İrsaliye ETTN bulunamadı." });

    const service = await getEWaybillService(invoice.store_id);
    const htmlContent = await service.getWaybillHtml(invoice.waybill_ettn, invoice.notes || "");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(htmlContent);
  } catch (err: any) {
    res.status(500).json({ error: "Görüntüleme hatası: " + err.message });
  }
});

// ==========================================
// INDEPENDENT E-WAYBILL (E-İRSALİYE) ENDPOINTS
// ==========================================

// 1. List independent waybills
router.get("/independent-waybills", authenticate, async (req: any, res) => {
  try {
    const rawStoreId = req.query.storeId;
    if (rawStoreId === 'undefined' || rawStoreId === 'null') {
      const userStoreId = req.user?.store_id;
      if (!userStoreId) {
        return res.json([]);
      }
    }
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    if (!storeId || storeId <= 0) {
      return res.json([]);
    }
    let query = `
      SELECT ew.*, 
             c.title as company_name, c.title as company_title,
             cust.name as customer_name, cust.surname as customer_surname,
             si.invoice_number as linked_invoice_number
      FROM e_waybills ew
      LEFT JOIN companies c ON ew.company_id = c.id
      LEFT JOIN customers cust ON ew.customer_id = cust.id
      LEFT JOIN sales_invoices si ON ew.invoice_id = si.id
      WHERE ew.store_id = $1
    `;
    let params: any[] = [storeId];

    const { search, status } = req.query;
    let paramIndex = 2;

    if (status) {
      query += ` AND LOWER(ew.status) = LOWER($${paramIndex})`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query += ` AND (
        ew.waybill_number ILIKE $${paramIndex} OR
        c.title ILIKE $${paramIndex} OR
        cust.name ILIKE $${paramIndex} OR
        cust.surname ILIKE $${paramIndex}
      )`;
      params.push(searchTerm);
      paramIndex++;
    }

    query += " ORDER BY ew.waybill_date DESC, ew.id DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    console.error("List Independent Waybills Error:", err);
    res.status(500).json({ error: "İrsaliyeler yüklenemedi: " + err.message });
  }
});

// 1.1 E-Waybill Series & Sequence Info (Must be defined BEFORE /:id)
router.get("/independent-waybills/series-info", authenticate, async (req: any, res) => {
  try {
    const rawStoreId = req.query.storeId;
    if (rawStoreId === 'undefined' || rawStoreId === 'null') {
      const userStoreId = req.user?.store_id;
      if (!userStoreId) {
        return res.status(400).json({ error: "Geçerli bir mağaza ID'si belirtilmelidir." });
      }
    }
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    if (!storeId || storeId <= 0) {
      return res.status(400).json({ error: "Geçerli bir mağaza seçilmelidir." });
    }
    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı." });

    const settings = storeRes.rows[0].einvoice_settings || {};
    const prefix = (settings.ewaybill_prefix || "IRS").toUpperCase().substring(0, 3);
    const year = new Date().getFullYear().toString();
    const prefixWithYear = `${prefix}${year}`;

    let baseStartSeq = Number(settings.ewaybill_start_sequence || settings.waybill_start_sequence || settings.ewaybill_last_sequence || 0);
    if (!baseStartSeq && settings.ewaybill_last_number && settings.ewaybill_last_number.startsWith(prefixWithYear)) {
      const p = parseInt(settings.ewaybill_last_number.substring(7), 10);
      if (!isNaN(p)) baseStartSeq = p;
    }

    // Get highest number in DB (only count successfully transmitted/queued waybills, not failed/draft ones)
    const seqRes = await pool.query(
      `SELECT waybill_number FROM e_waybills 
       WHERE store_id = $1 AND waybill_number LIKE $2 AND LENGTH(waybill_number) = 16
         AND LOWER(COALESCE(status, '')) NOT IN ('error', 'draft', 'cancelled')
       ORDER BY waybill_number DESC LIMIT 1`,
      [storeId, `${prefixWithYear}%`]
    );

    let highestSeq = baseStartSeq;
    let lastNumber = settings.ewaybill_last_number || (baseStartSeq > 0 ? `${prefixWithYear}${baseStartSeq.toString().padStart(9, '0')}` : null);
    if (seqRes.rows.length > 0 && seqRes.rows[0].waybill_number) {
      const docNum = seqRes.rows[0].waybill_number;
      const parsed = parseInt(docNum.substring(7), 10);
      if (!isNaN(parsed) && parsed > highestSeq) {
        highestSeq = parsed;
        lastNumber = docNum;
      }
    }

    const nextSeq = highestSeq + 1;
    const nextNumber = `${prefixWithYear}${nextSeq.toString().padStart(9, '0')}`;

    res.json({
      prefix,
      year,
      startSequence: baseStartSeq,
      lastNumber: lastNumber || (baseStartSeq > 0 ? `${prefixWithYear}${baseStartSeq.toString().padStart(9, '0')}` : "-"),
      nextSequence: nextSeq,
      nextNumber,
      provider: settings.provider || "none",
      isActive: !!settings.is_ewaybill_active,
      username: settings.username || "",
      vkn: settings.vkn || ""
    });
  } catch (err: any) {
    res.status(500).json({ error: "Seri bilgisi alınamadı: " + err.message });
  }
});

// 1.2 Update E-Waybill Start Sequence
router.post("/independent-waybills/series-info", authenticate, async (req: any, res) => {
  try {
    const storeId = getAuthorizedStoreId(req, req.body.storeId);
    const { startSequence, prefix } = req.body;

    const storeRes = await pool.query("SELECT einvoice_settings FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı." });

    const settings = storeRes.rows[0].einvoice_settings || {};
    if (prefix) settings.ewaybill_prefix = prefix.toUpperCase().substring(0, 3);
    if (startSequence !== undefined) {
      const num = parseInt(startSequence, 10);
      if (!isNaN(num) && num >= 0) {
        settings.ewaybill_start_sequence = num;
        const curPrefix = (settings.ewaybill_prefix || "IRS").toUpperCase().substring(0, 3);
        const curYear = new Date().getFullYear().toString();
        settings.ewaybill_last_number = `${curPrefix}${curYear}${num.toString().padStart(9, '0')}`;
      }
    }

    await pool.query("UPDATE stores SET einvoice_settings = $1 WHERE id = $2", [JSON.stringify(settings), storeId]);
    res.json({ success: true, message: "E-İrsaliye seri bilgisi güncellendi.", settings });
  } catch (err: any) {
    res.status(500).json({ error: "Güncelleme başarısız: " + err.message });
  }
});

// 2. Clear Waybill/Details
router.get("/independent-waybills/:id", authenticate, async (req: any, res) => {
  try {
    const waybillId = Number(req.params.id);
    if (isNaN(waybillId) || waybillId <= 0) {
      return res.status(400).json({ error: "Geçersiz irsaliye ID." });
    }
    const storeId = getAuthorizedStoreId(req, req.query.storeId);
    const waybillRes = await pool.query(
      `SELECT ew.*, 
              c.title as company_name, c.title as company_title, c.tax_number as company_tax_number, c.tax_office as company_tax_office, c.address as company_address, c.email as company_email,
              cust.name as customer_name, cust.surname as customer_surname, cust.phone as customer_phone, cust.email as customer_email, cust.address as customer_address,
              si.invoice_number as linked_invoice_number
       FROM e_waybills ew
       LEFT JOIN companies c ON ew.company_id = c.id
       LEFT JOIN customers cust ON ew.customer_id = cust.id
       LEFT JOIN sales_invoices si ON ew.invoice_id = si.id
       WHERE ew.id = $1 AND ew.store_id = $2`,
      [req.params.id, storeId]
    );

    if (waybillRes.rows.length === 0) {
      return res.status(404).json({ error: "İrsaliye bulunamadı." });
    }

    const waybill = waybillRes.rows[0];

    // Grab items
    const itemsRes = await pool.query(
      "SELECT * FROM e_waybill_items WHERE waybill_id = $1 ORDER BY id ASC",
      [waybill.id]
    );

    waybill.items = itemsRes.rows;
    res.json(waybill);
  } catch (err: any) {
    console.error("Get Waybill Detail Error:", err);
    res.status(500).json({ error: "İrsaliye detayları yüklenemedi: " + err.message });
  }
});

// 3. Create independent waybill
router.post("/independent-waybills", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
  const {
    company_id,
    customer_id,
    waybill_date,
    waybill_time,
    actual_date,
    actual_time,
    prefix,
    scenario,
    waybill_type,
    driver_name,
    driver_surname,
    driver_vkn,
    plate_number,
    trailer_plate,
    notes,
    currency,
    exchange_rate,
    delivery_address,
    items,
    delivery_term,
    transport_mode,
    carrier_name,
    tracking_number,
    is_cargo_shipment
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "İrsaliye oluşturmak için en az bir ürün eklemelisiniz." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Draft number generation placeholder
    const draftPrefix = (prefix || 'IRS').toUpperCase();
    const draftNum = `TASLAK-${draftPrefix}-${Date.now().toString().slice(-6)}`;

    // Total calculations
    let totalAmount = 0;
    let taxAmount = 0;
    let grandTotal = 0;

    for (const item of items) {
      const q = Number(item.quantity) || 1;
      const up = Number(item.unit_price) || 0;
      const tr = Number(item.tax_rate) || 20;

      const itemTotal = q * up;
      const itemTax = itemTotal * (tr / 100);
      const itemGrand = itemTotal + itemTax;

      totalAmount += itemTotal;
      taxAmount += itemTax;
      grandTotal += itemGrand;
    }

    const waybillRes = await client.query(
      `INSERT INTO e_waybills (
        store_id, company_id, customer_id, waybill_number, waybill_date, waybill_time,
        actual_date, actual_time, prefix, scenario, waybill_type,
        driver_name, driver_surname, driver_vkn, plate_number, trailer_plate,
        notes, status, total_amount, tax_amount, grand_total, currency, exchange_rate, delivery_address,
        delivery_term, transport_mode, carrier_name, tracking_number, is_cargo_shipment,
        carrier_vkn, driver_phone, order_number, order_date, matbu_number, matbu_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'draft', $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34)
      RETURNING id`,
      [
        storeId,
        req.body.company_id || null,
        req.body.customer_id || null,
        draftNum,
        req.body.waybill_date || new Date().toISOString().split('T')[0],
        req.body.waybill_time || "12:00:00",
        req.body.actual_date || new Date().toISOString().split('T')[0],
        req.body.actual_time || "12:00:00",
        draftPrefix,
        req.body.scenario || 'TEMEL IRSALİYE',
        req.body.waybill_type || 'SEVK',
        req.body.driver_name || '',
        req.body.driver_surname || '',
        req.body.driver_vkn || '',
        req.body.plate_number || '',
        req.body.trailer_plate || '',
        req.body.notes || '',
        totalAmount,
        taxAmount,
        grandTotal,
        req.body.currency || 'TRY',
        req.body.exchange_rate || 1,
        req.body.delivery_address || null,
        req.body.delivery_term || null,
        req.body.transport_mode || null,
        req.body.carrier_name || null,
        req.body.tracking_number || null,
        !!req.body.is_cargo_shipment,
        req.body.carrier_vkn || null,
        req.body.driver_phone || null,
        req.body.order_number || null,
        req.body.order_date || null,
        req.body.matbu_number || null,
        req.body.matbu_date || null
      ]
    );

    const waybillId = waybillRes.rows[0].id;

    // Insert items
    for (const item of items) {
      const q = Number(item.quantity) || 1;
      const up = Number(item.unit_price) || 0;
      const tr = Number(item.tax_rate) || 20;

      const itemTotal = q * up;
      const itemTax = itemTotal * (tr / 100);

      await client.query(
        `INSERT INTO e_waybill_items (
          waybill_id, product_id, product_name, barcode, quantity, unit_code, unit_price, tax_rate, tax_amount, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          waybillId,
          item.product_id || null,
          item.product_name,
          item.barcode || '',
          q,
          item.unit_code || 'Adet',
          up,
          tr,
          itemTax,
          itemTotal
        ]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, id: waybillId, draftNum });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Create Waybill Error:", err);
    res.status(500).json({ error: "İrsaliye oluşturulamadı: " + err.message });
  } finally {
    client.release();
  }
});

// 4. Update independent waybill
router.put("/independent-waybills/:id", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
  const { id } = req.params;
  const {
    company_id,
    customer_id,
    waybill_date,
    waybill_time,
    actual_date,
    actual_time,
    prefix,
    scenario,
    waybill_type,
    driver_name,
    driver_surname,
    driver_vkn,
    plate_number,
    trailer_plate,
    notes,
    currency,
    exchange_rate,
    delivery_address,
    items,
    delivery_term,
    transport_mode,
    carrier_name,
    tracking_number,
    is_cargo_shipment
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "İrsaliyede en az bir ürün bulunmalıdır." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if waybill is editable (can only edit draft status)
    const statusCheck = await client.query(
      "SELECT status, waybill_number FROM e_waybills WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );

    if (statusCheck.rows.length === 0) {
      return res.status(404).json({ error: "Güncellenecek irsaliye bulunamadı." });
    }

    const currentWaybill = statusCheck.rows[0];
    const currentStatus = (currentWaybill.status || '').toLowerCase();
    if (currentStatus !== 'draft' && currentStatus !== 'error') {
      return res.status(400).json({ error: "Sadece Taslak veya Hatalı durumundaki irsaliyeler düzenlenebilir." });
    }

    // Recalculate totals
    let totalAmount = 0;
    let taxAmount = 0;
    let grandTotal = 0;

    for (const item of items) {
      const q = Number(item.quantity) || 1;
      const up = Number(item.unit_price) || 0;
      const tr = Number(item.tax_rate) || 20;

      const itemTotal = q * up;
      const itemTax = itemTotal * (tr / 100);
      const itemGrand = itemTotal + itemTax;

      totalAmount += itemTotal;
      taxAmount += itemTax;
      grandTotal += itemGrand;
    }

    // Keep prefix compliant if draft string unmodified
    let finalWaybillNumber = currentWaybill.waybill_number;
    if (finalWaybillNumber.startsWith("TASLAK-")) {
      const draftPrefix = (prefix || 'IRS').toUpperCase();
      finalWaybillNumber = `TASLAK-${draftPrefix}-${Date.now().toString().slice(-6)}`;
    }

    await client.query(
      `UPDATE e_waybills SET 
        company_id = $1, customer_id = $2, waybill_number = $3, waybill_date = $4, waybill_time = $5,
        actual_date = $6, actual_time = $7, prefix = $8, scenario = $9, waybill_type = $10,
        driver_name = $11, driver_surname = $12, driver_vkn = $13, plate_number = $14, trailer_plate = $15,
        notes = $16, total_amount = $17, tax_amount = $18, grand_total = $19, currency = $20, exchange_rate = $21, delivery_address = $22,
        delivery_term = $23, transport_mode = $24, carrier_name = $25, tracking_number = $26, is_cargo_shipment = $27,
        carrier_vkn = $28, driver_phone = $29, order_number = $30, order_date = $31, matbu_number = $32, matbu_date = $33
      WHERE id = $34 AND store_id = $35`,
      [
        req.body.company_id || null,
        req.body.customer_id || null,
        finalWaybillNumber,
        req.body.waybill_date,
        req.body.waybill_time,
        req.body.actual_date,
        req.body.actual_time,
        req.body.prefix || 'IRS',
        req.body.scenario || 'TEMEL IRSALİYE',
        req.body.waybill_type || 'SEVK',
        req.body.driver_name || '',
        req.body.driver_surname || '',
        req.body.driver_vkn || '',
        req.body.plate_number || '',
        req.body.trailer_plate || '',
        req.body.notes || '',
        totalAmount,
        taxAmount,
        grandTotal,
        req.body.currency || 'TRY',
        req.body.exchange_rate || 1,
        req.body.delivery_address || null,
        req.body.delivery_term || null,
        req.body.transport_mode || null,
        req.body.carrier_name || null,
        req.body.tracking_number || null,
        !!req.body.is_cargo_shipment,
        req.body.carrier_vkn || null,
        req.body.driver_phone || null,
        req.body.order_number || null,
        req.body.order_date || null,
        req.body.matbu_number || null,
        req.body.matbu_date || null,
        id,
        storeId
      ]
    );

    // Wipe and recreate items
    await client.query("DELETE FROM e_waybill_items WHERE waybill_id = $1", [id]);

    for (const item of items) {
      const q = Number(item.quantity) || 1;
      const up = Number(item.unit_price) || 0;
      const tr = Number(item.tax_rate) || 20;

      const itemTax = q * up * (tr / 100);

      await client.query(
        `INSERT INTO e_waybill_items (
          waybill_id, product_id, product_name, barcode, quantity, unit_code, unit_price, tax_rate, tax_amount, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          id,
          item.product_id || null,
          item.product_name,
          item.barcode || '',
          q,
          item.unit_code || 'Adet',
          up,
          tr,
          itemTax,
          q * up
        ]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "İrsaliye güncellendi." });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Update Waybill Error:", err);
    res.status(500).json({ error: "İrsaliye güncellenemedi: " + err.message });
  } finally {
    client.release();
  }
});

// 5. Delete independent waybill
router.delete("/independent-waybills/:id", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);
  try {
    const statusCheck = await pool.query(
      "SELECT status FROM e_waybills WHERE id = $1 AND store_id = $2",
      [req.params.id, storeId]
    );

    if (statusCheck.rows.length === 0) {
      return res.status(404).json({ error: "Silinecek irsaliye bulunamadı." });
    }

    const currentStatus = statusCheck.rows[0].status;
    if (currentStatus === 'success' || currentStatus === 'queued') {
      return res.status(400).json({ error: "Resmileşmiş veya işlem sırasındaki irsaliyeler silinemez." });
    }

    await pool.query("DELETE FROM e_waybills WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    res.json({ success: true, message: "İrsaliye başarıyla silindi." });
  } catch (err: any) {
    console.error("Delete Waybill Error:", err);
    res.status(500).json({ error: "İrsaliye silinemedi: " + err.message });
  }
});

// 6. Transmit independent waybill to MySoft
router.post("/independent-waybills/:id/send", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const storeId = getAuthorizedStoreId(req, req.query.storeId || req.body.storeId);

  try {
    const waybillRes = await pool.query(
      `SELECT ew.*, 
              c.title as company_name, c.title as company_title, c.tax_number as company_tax_number, c.tax_office as company_tax_office, c.address as company_address, c.delivery_address as company_delivery_address, c.email as company_email,
              cust.name as customer_name, cust.surname as customer_surname, cust.phone as customer_phone, cust.email as customer_email, cust.address as customer_address
       FROM e_waybills ew
       LEFT JOIN companies c ON ew.company_id = c.id
       LEFT JOIN customers cust ON ew.customer_id = cust.id
       WHERE ew.id = $1 AND ew.store_id = $2`,
      [id, storeId]
    );

    if (waybillRes.rows.length === 0) {
      return res.status(404).json({ error: "İrsaliye bulunamadı." });
    }

    const waybill = waybillRes.rows[0];

    // GİB shipment logistics block validations
    const isCargoShipment = !!waybill.is_cargo_shipment;
    const plateNumber = (waybill.plate_number || "").replace(/\s/g, '').toUpperCase();
    if (!isCargoShipment && !plateNumber) {
      return res.status(400).json({ error: "GİB kuralları gereği İrsaliye Gönderiminde Araç Plakası girilmesi zorunludur." });
    }

    // Load store setup
    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) throw new Error("Mağaza ayarları yüklenemedi.");
    const settings = storeRes.rows[0].einvoice_settings || {};
    const branding = storeRes.rows[0].branding || {};

    // Sequence Generator: Always respect configured official e-waybill prefix
    const prefix = (settings.ewaybill_prefix || waybill.prefix || "IRS").toUpperCase().substring(0,3);
    const year = new Date().getFullYear().toString();
    const prefixWithYear = `${prefix}${year}`;

    // Read configured starting sequence from store settings (e.g. 37 for Gap Bilişim so next is 38)
    let baseStartSeq = Number(settings.ewaybill_start_sequence || settings.waybill_start_sequence || settings.ewaybill_last_sequence || 0);
    if (!baseStartSeq && settings.ewaybill_last_number && settings.ewaybill_last_number.startsWith(prefixWithYear)) {
      const p = parseInt(settings.ewaybill_last_number.substring(7), 10);
      if (!isNaN(p)) baseStartSeq = p;
    }

    const client = await pool.connect();
    let waybillNumber = waybill.waybill_number;
    let waybillEttn = waybill.ettn || crypto.randomUUID();
    const isFailedOrDraft = ['error', 'draft', 'cancelled'].includes((waybill.status || '').toLowerCase());

    try {
      await client.query("BEGIN");

      // Release any official 16-char numbers stuck on failed/draft waybills for this store so sequence numbers are never skipped
      await client.query(
        `UPDATE e_waybills 
         SET waybill_number = 'TASLAK-IRS-' || id::text
         WHERE store_id = $1 AND LENGTH(waybill_number) = 16 AND LOWER(COALESCE(status, '')) IN ('error', 'draft', 'cancelled')`,
        [storeId]
      );

      // Always recalculate next sequence if draft, TASLAK, wrong prefix, or retrying after ERROR
      if (!waybillNumber || waybillNumber.startsWith("TASLAK") || waybillNumber.substring(0,3) !== prefix || isFailedOrDraft) {
        // Query highest waybill number among successfully sent/queued waybills
        const seqRes = await client.query(
          `SELECT waybill_number FROM e_waybills 
           WHERE store_id = $1 AND waybill_number LIKE $2 AND LENGTH(waybill_number) = 16
             AND LOWER(COALESCE(status, '')) NOT IN ('error', 'draft', 'cancelled')
             AND id != $3
           ORDER BY waybill_number DESC LIMIT 1 FOR UPDATE`,
          [storeId, `${prefixWithYear}%`, id]
        );

        let nextSequenceNumber = baseStartSeq + 1;
        if (seqRes.rows.length > 0 && seqRes.rows[0].waybill_number) {
          const lastDocNum = seqRes.rows[0].waybill_number;
          const lastSequencePart = lastDocNum.substring(7);
          const parsed = parseInt(lastSequencePart, 10);
          if (!isNaN(parsed)) {
            nextSequenceNumber = Math.max(nextSequenceNumber, parsed + 1);
          }
        }

        const paddedSequence = nextSequenceNumber.toString().padStart(9, '0');
        waybillNumber = `${prefixWithYear}${paddedSequence}`;
      }

      await client.query(
        "UPDATE e_waybills SET waybill_number = $1, ettn = $2, prefix = $3, status = 'queued', message = NULL WHERE id = $4",
        [waybillNumber, waybillEttn, prefix, id]
      );

      await client.query("COMMIT");
      waybill.waybill_number = waybillNumber;
      waybill.ettn = waybillEttn;
      waybill.prefix = prefix;
    } catch (dbErr) {
      await client.query("ROLLBACK");
      throw dbErr;
    } finally {
      client.release();
    }

    const service = await getEWaybillService(storeId);
    
    // Taxpayer check for pkAlias (always prefer waybillAlias or GİB virtual e-waybill alias)
    const taxNumber = (waybill.company_tax_number || "").replace(/\D/g, '');
    const taxpayerCheck = await service.checkTaxpayer(taxNumber);
    let pkAlias = taxpayerCheck.waybillAlias || "urn:mail:irsaliyepk@gib.gov.tr";

    const ublData = await buildMySoftWaybillPayload(pool, waybill, settings, branding, pkAlias, true);
    const result = await service.sendWaybill(ublData);

    if (result.isSuccess) {
      await pool.query("UPDATE e_waybills SET status = 'SUCCESS', message = $1 WHERE id = $2", ["GİB'e iletildi.", id]);
      res.json({ success: true, waybillNumber, ettn: waybillEttn });
    } else {
      throw new Error(result.message);
    }
  } catch (err: any) {
    console.error("Waybill Send Error:", err);
    // Revert waybill_number to TASLAK-IRS-{id} on failure so the official sequence number is not burned
    await pool.query(
      "UPDATE e_waybills SET status = 'ERROR', message = $1, waybill_number = 'TASLAK-IRS-' || id::text WHERE id = $2",
      [err.message, id]
    );
    res.status(500).json({ error: err.message });
  }
});

// 5. Durum Sorgulama E-Waybill status endpoint (Independent)
router.get("/independent-waybills/:id/status", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const storeId = getAuthorizedStoreId(req, req.query.storeId);
  try {
    const waybillRes = await pool.query("SELECT ettn FROM e_waybills WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (waybillRes.rows.length === 0) return res.status(404).json({ error: "İrsaliye bulunamadı." });
    const { ettn } = waybillRes.rows[0];

    if (!ettn) return res.status(400).json({ error: "İrsaliye henüz gönderilmemiş." });

    const service = await getEWaybillService(storeId);
    const result = await service.getWaybillStatus(ettn);

    await pool.query("UPDATE e_waybills SET status = $1, message = $2 WHERE id = $3", [result.status.toUpperCase(), result.message, id]);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. E-Waybill Preview HTML (Independent)
router.get("/independent-waybills/:id/preview-html", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const storeId = getAuthorizedStoreId(req, req.query.storeId);
  try {
    const waybillRes = await pool.query(
      `SELECT ew.*, 
              c.title as company_name, c.title as company_title, c.tax_number as company_tax_number, c.tax_office as company_tax_office, c.address as company_address, c.delivery_address as company_delivery_address, c.email as company_email,
              cust.name as customer_name, cust.surname as customer_surname, cust.phone as customer_phone, cust.email as customer_email, cust.address as customer_address
       FROM e_waybills ew
       LEFT JOIN companies c ON ew.company_id = c.id
       LEFT JOIN customers cust ON ew.customer_id = cust.id
       WHERE ew.id = $1 AND ew.store_id = $2`,
      [id, storeId]
    );
    if (waybillRes.rows.length === 0) return res.status(404).json({ error: "İrsaliye bulunamadı" });
    const waybill = waybillRes.rows[0];

    // Load store setup
    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0].einvoice_settings || {};
    const branding = storeRes.rows[0].branding || {};

    const service = await getEWaybillService(storeId);
    
    // Determine PK Alias
    const taxNumber = (waybill.company_tax_number || "").replace(/\D/g, '');
    const taxpayerCheck = await service.checkTaxpayer(taxNumber);
    let pkAlias = taxpayerCheck.waybillAlias || "urn:mail:irsaliyepk@gib.gov.tr";

    // Build Payload
    const ublData = await buildMySoftWaybillPayload(pool, waybill, settings, branding, pkAlias, true);
    
    // Call MySoft Preview
    const html = await service.getWaybillPreviewHtml(ublData);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err: any) {
    console.error("Waybill Preview Endpoint Error:", err);
    res.status(500).json({ error: "Önizleme oluşturulamadı: " + err.message });
  }
});

// 8. E-Waybill Control (Independent)
router.get("/independent-waybills/:id/control", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const storeId = getAuthorizedStoreId(req, req.query.storeId);
  try {
    const waybillRes = await pool.query(
      `SELECT ew.*, 
              c.title as company_name, c.title as company_title, c.tax_number as company_tax_number, c.tax_office as company_tax_office, c.address as company_address, c.delivery_address as company_delivery_address, c.email as company_email,
              cust.name as customer_name, cust.surname as customer_surname, cust.phone as customer_phone, cust.email as customer_email, cust.address as customer_address
       FROM e_waybills ew
       LEFT JOIN companies c ON ew.company_id = c.id
       LEFT JOIN customers cust ON ew.customer_id = cust.id
       WHERE ew.id = $1 AND ew.store_id = $2`,
      [id, storeId]
    );
    if (waybillRes.rows.length === 0) return res.status(404).json({ error: "İrsaliye bulunamadı" });
    const waybill = waybillRes.rows[0];

    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0].einvoice_settings || {};
    const branding = storeRes.rows[0].branding || {};

    const service = await getEWaybillService(storeId);
    const taxNumber = (waybill.company_tax_number || "").replace(/\D/g, '');
    const taxpayerCheck = await service.checkTaxpayer(taxNumber);
    let pkAlias = taxpayerCheck.waybillAlias || "urn:mail:irsaliyepk@gib.gov.tr";

    const ublData = await buildMySoftWaybillPayload(pool, waybill, settings, branding, pkAlias, true);
    const result = await service.controlWaybill(ublData);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Kontrol gerçekleştirilemedi: " + err.message });
  }
});

// 9. E-Waybill Control (Invoice-linked)
router.get("/einvoice/waybill/control/:invoiceId", authenticate, async (req: any, res) => {
  const { invoiceId } = req.params;
  try {
    const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
    const invoice = invRes.rows[0];
    if (!invoice) return res.status(404).json({ error: "Fatura bulunamadı" });

    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [invoice.store_id]);
    const settings = storeRes.rows[0]?.einvoice_settings || {};
    const branding = storeRes.rows[0]?.branding || {};

    const service = await getEWaybillService(invoice.store_id);
    const taxNumber = (invoice.tax_number || "").replace(/\D/g, '');
    const taxpayerCheck = await service.checkTaxpayer(taxNumber);
    let pkAlias = taxpayerCheck.waybillAlias || "urn:mail:irsaliyepk@gib.gov.tr";

    const ublData = await buildMySoftWaybillPayload(pool, invoice, settings, branding, pkAlias, false);
    const result = await service.controlWaybill(ublData);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Kontrol gerçekleştirilemedi: " + err.message });
  }
});

// 10. Fetch E-Waybill representation (Independent Sent HTML)
router.get("/independent-waybills/:id/html", authenticate, async (req: any, res) => {
  const { id } = req.params;
  const storeId = getAuthorizedStoreId(req, req.query.storeId);
  try {
    const waybillRes = await pool.query("SELECT * FROM e_waybills WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (waybillRes.rows.length === 0) return res.status(404).json({ error: "Kayıt bulunamadı" });
    const waybill = waybillRes.rows[0];

    if (!waybill.ettn) return res.status(400).json({ error: "İrsaliye ETTN bulunamadı." });

    const service = await getEWaybillService(storeId);
    const htmlContent = await service.getWaybillHtml(waybill.ettn, waybill.notes || "");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(htmlContent);
  } catch (err: any) {
    res.status(500).json({ error: "Görüntüleme hatası: " + err.message });
  }
});
// 9. Convert multiple waybills to a single Sales Invoice
router.post("/independent-waybills/convert-to-invoice", authenticate, async (req: any, res) => {
  const storeId = getAuthorizedStoreId(req, req.body.storeId || req.query.storeId);
  const { waybillIds, invoiceProfile, giInvoiceType, paymentMethod, notes, currency } = req.body;

  if (!waybillIds || !Array.isArray(waybillIds) || waybillIds.length === 0) {
    return res.status(400).json({ error: "Faturaya dönüştürmek için en az bir irsaliye seçmelisiniz." });
  }

  const cleanWaybillIds = waybillIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id) && id > 0);
  if (cleanWaybillIds.length === 0) {
    return res.status(400).json({ error: "Geçerli bir irsaliye seçilmedi." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Gather active waybills (starts at $2 because $1 is storeId)
    const selectPlaceholders = cleanWaybillIds.map((_: any, idx: number) => `$${idx + 2}`).join(",");
    const waybillsRes = await client.query(
      `SELECT * FROM e_waybills WHERE store_id = $1 AND id IN (${selectPlaceholders})`,
      [storeId, ...cleanWaybillIds]
    );

    if (waybillsRes.rows.length === 0) {
      throw new Error("Seçilen irsaliyeler bulunamadı.");
    }

    // Validate if any are already invoiced
    const alreadyInvoiced = waybillsRes.rows.filter(w => w.is_invoiced);
    if (alreadyInvoiced.length > 0) {
      throw new Error("Seçilen irsaliyelerin bazısı zaten faturaya dönüştürülmüştür.");
    }

    // Verify they belong to the same Customer or Company to consolidate properly
    const firstWaybill = waybillsRes.rows[0];
    for (const item of waybillsRes.rows) {
      if (item.company_id !== firstWaybill.company_id || item.customer_id !== firstWaybill.customer_id) {
        throw new Error("Toplu faturalandırma için tüm irsaliyeler aynı Cari/Müşteriye ait olmalıdır.");
      }
    }

    // Pull item entries for all selected waybills (starts at $1)
    const itemPlaceholders = cleanWaybillIds.map((_: any, idx: number) => `$${idx + 1}`).join(",");
    const itemsRes = await client.query(
      `SELECT * FROM e_waybill_items WHERE waybill_id IN (${itemPlaceholders}) ORDER BY id ASC`,
      [...cleanWaybillIds]
    );
    const waybillItems = itemsRes.rows;

    // Consolidate identical products
    const consolidatedMap = new Map<string, any>();
    for (const wi of waybillItems) {
      const key = `${wi.product_id || 'null'}-${wi.product_name}-${wi.barcode || ''}-${wi.unit_price}-${wi.tax_rate}`;
      if (consolidatedMap.has(key)) {
        const existing = consolidatedMap.get(key);
        existing.quantity += Number(wi.quantity);
        existing.tax_amount += Number(wi.tax_amount);
        existing.total_price += Number(wi.total_price);
      } else {
        consolidatedMap.set(key, {
          product_id: wi.product_id,
          product_name: wi.product_name,
          barcode: wi.barcode,
          quantity: Number(wi.quantity),
          unit_code: wi.unit_code,
          unit_price: Number(wi.unit_price),
          tax_rate: Number(wi.tax_rate ?? 20),
          tax_amount: Number(wi.tax_amount || 0),
          total_price: Number(wi.total_price || 0)
        });
      }
    }

    const consolidatedItems = Array.from(consolidatedMap.values());

    // Auto generate Sales Invoice Draft number
    const prefixRes = await client.query("SELECT einvoice_settings FROM stores WHERE id = $1", [storeId]);
    const settings = prefixRes.rows[0]?.einvoice_settings || {};
    const salesPrefix = (settings.einvoice_prefix || "GAP").substring(0, 3);
    const currentYear = new Date().getFullYear().toString();

    const countRes = await client.query(
      "SELECT COUNT(*) FROM sales_invoices WHERE store_id = $1 AND invoice_number LIKE $2",
      [storeId, `${salesPrefix}${currentYear}%`]
    );
    const count = Number(countRes.rows[0].count) + 1;
    const finalInvoiceNumber = `${salesPrefix}${currentYear}${count.toString().padStart(9, '0')}`;

    // Get company/customer address data dynamically from DB
    let taxNumber = "11111111111";
    let taxOffice = "";
    let customerEmail = "";
    let address = "İstanbul Merkez";
    let companyTitle = "";
    let customerName = "";

    if (firstWaybill.company_id) {
      const compRes = await client.query("SELECT * FROM companies WHERE id = $1", [firstWaybill.company_id]);
      if (compRes.rows.length > 0) {
        const comp = compRes.rows[0];
        taxNumber = comp.tax_number || "11111111111";
        taxOffice = comp.tax_office || "";
        customerEmail = comp.email || "";
        address = comp.address || firstWaybill.delivery_address || "İstanbul Merkez";
        companyTitle = comp.title || "";
      }
    } else if (firstWaybill.customer_id) {
      const custRes = await client.query("SELECT * FROM customers WHERE id = $1", [firstWaybill.customer_id]);
      if (custRes.rows.length > 0) {
        const cust = custRes.rows[0];
        taxNumber = (cust.phone || "11111111111").replace(/\D/g, '').substring(0, 11);
        customerEmail = cust.email || "";
        address = cust.address || firstWaybill.delivery_address || "İstanbul Merkez";
        customerName = `${cust.name || ""} ${cust.surname || ""}`.trim();
      }
    }

    // Totals
    let totalNet = 0;
    let totalTax = 0;
    let totalGrand = 0;

    for (const ci of consolidatedItems) {
      const lineNet = ci.quantity * ci.unit_price;
      const lineTax = lineNet * (ci.tax_rate / 100);
      const lineTotal = lineNet + lineTax;

      totalNet += lineNet;
      totalTax += lineTax;
      totalGrand += lineTotal;
    }

    const joinedWaybillNumbers = waybillsRes.rows.map(w => w.waybill_number).filter(Boolean).join(", ");
    const invoiceNotes = notes
      ? notes
      : `İrsaliye No: ${joinedWaybillNumbers} (${waybillsRes.rows.map(w => new Date(w.waybill_date || Date.now()).toLocaleDateString('tr-TR')).join(", ")}) istinaden düzenlenmiştir.`;

    // Create sales invoice draft
    const invoiceRes = await client.query(
      `INSERT INTO sales_invoices (
        store_id, company_id, customer_id, company_title, customer_name,
        invoice_number, invoice_date, invoice_time,
        total_amount, tax_amount, grand_total, currency, exchange_rate,
        notes, payment_method, invoice_type, status, e_document_type,
        invoice_profile, is_tax_inclusive, tax_number, tax_office, address, customer_email,
        gi_invoice_type, waybill_number, waybill_actual_date, waybill_ettn, waybill_status
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, CURRENT_DATE, CURRENT_TIME,
        $7, $8, $9, $10, $11,
        $12, $13, 'manual', 'draft', $14,
        $15, FALSE, $16, $17, $18, $19,
        $20, $21, $22, $23, $24
      )
      RETURNING id`,
      [
        storeId,
        firstWaybill.company_id || null,
        firstWaybill.customer_id || null,
        companyTitle || null,
        customerName || null,
        finalInvoiceNumber,
        totalNet,
        totalTax,
        totalGrand,
        currency || firstWaybill.currency || 'TRY',
        firstWaybill.exchange_rate || 1,
        invoiceNotes,
        paymentMethod || 'none',
        "EFATURA",
        invoiceProfile || "TICARIFATURA",
        taxNumber,
        taxOffice,
        address,
        customerEmail,
        giInvoiceType || "SATIS",
        firstWaybill.waybill_number || null,
        firstWaybill.actual_date || firstWaybill.waybill_date || null,
        firstWaybill.ettn || null,
        firstWaybill.status || null
      ]
    );

    const invoiceId = invoiceRes.rows[0].id;

    // Create Invoice items
    for (const ci of consolidatedItems) {
      const lineNet = ci.quantity * ci.unit_price;
      const lineTax = lineNet * (ci.tax_rate / 100);
      const lineGrand = lineNet + lineTax;

      await client.query(
        `INSERT INTO sales_invoice_items (
          sales_invoice_id, product_id, product_name, barcode, quantity, unit_code, unit_price, tax_rate, tax_amount, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          invoiceId,
          ci.product_id,
          ci.product_name,
          ci.barcode || '',
          ci.quantity,
          ci.unit_code || 'Adet',
          ci.unit_price,
          ci.tax_rate,
          lineTax,
          lineGrand
        ]
      );
    }

    // Link waybills to invoice ($1 = invoiceId, $2 = storeId, $3+ = cleanWaybillIds)
    const updatePlaceholders = cleanWaybillIds.map((_: any, idx: number) => `$${idx + 3}`).join(",");
    await client.query(
      `UPDATE e_waybills 
       SET is_invoiced = TRUE, invoice_id = $1, status = CASE WHEN LOWER(COALESCE(status, '')) = 'success' THEN 'SUCCESS' ELSE status END
       WHERE store_id = $2 AND id IN (${updatePlaceholders})`,
      [invoiceId, storeId, ...cleanWaybillIds]
    );

    await client.query("COMMIT");
    res.status(201).json({ success: true, invoiceId, invoiceNumber: finalInvoiceNumber });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Convert Waybills to Invoice Error:", err);
    res.status(500).json({ error: "Faturaya dönüştürme işlemi başarısız: " + err.message });
  } finally {
    client.release();
  }
});

export default router;
