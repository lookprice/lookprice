import express from "express";
import crypto from "crypto";
import { pool, addStockMovement } from "../models/db";
import { authenticate } from "../middleware/auth";
import { MySoftService } from "../src/services/backend/mysoftService";
import { IntegrationService } from "../src/services/IntegrationService";
import { UNIT_CODES, TAX_CODES } from "../src/lib/ubl-codes";
import { numberToTurkishWords } from "../src/utils/dashboardUtils";

const router = express.Router();

// Get the E-Invoice service instance based on Store Settings
export const getEInvoiceService = async (storeId: number) => {
  console.log(`[getEInvoiceService] Fetching settings for storeId: ${storeId}`);
  const storeRes = await pool.query("SELECT einvoice_settings FROM stores WHERE id = $1", [storeId]);
  if (storeRes.rows.length === 0) {
    console.error(`[getEInvoiceService] Store not found: ${storeId}`);
    throw new Error("Mağaza bulunamadı");
  }
  
  const settings = storeRes.rows[0].einvoice_settings;
  console.log(`[getEInvoiceService] Settings found:`, settings ? JSON.stringify(settings).substring(0, 50) + "..." : 'No');
  if (!settings || !settings.is_active) {
    throw new Error("E-Fatura sistemi bu mağaza için aktif değil");
  }

  if (settings.provider === 'mysoft') {
    return new MySoftService(settings);
  } else {
    throw new Error(`Desteklenmeyen entegratör: ${settings.provider}`);
  }
};

// 1. Check Taxpayer endpoint
router.post("/einvoice/check-taxpayer", authenticate, async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const { vknTckn } = req.body;
    
    if (!vknTckn) return res.status(400).json({ error: "VKN veya TCKN gereklidir" });

    const service = await getEInvoiceService(storeId);
    
    // Check official taxpayer cache first
    const cacheRes = await pool.query("SELECT taxpayer_title, alias FROM official_taxpayer_cache WHERE vkn = $1", [vknTckn]);
    
    let result;
    if (cacheRes.rows.length > 0) {
      console.log(`[checkTaxpayer] VKN ${vknTckn} found in official cache.`);
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
    } else if (invoice.customer_id && (!invoice.tax_number || !invoice.address || !invoice.customer_name)) {
      const custRes = await pool.query(
        "SELECT name, full_name, tax_number, tax_office, address, email FROM customers WHERE id = $1",
        [invoice.customer_id]
      );
      if (custRes.rows.length > 0) {
        const cust = custRes.rows[0];
        invoice.tax_number = invoice.tax_number || cust.tax_number;
        invoice.tax_office = invoice.tax_office || cust.tax_office;
        invoice.address = invoice.address || cust.address;
        invoice.customer_name = invoice.customer_name || cust.full_name || cust.name;
        invoice.customer_email = invoice.customer_email || cust.email;
      }
    }

    const service = await getEInvoiceService(storeId);
    
    // Validate recipient taxpayer number
    const taxNumber = (invoice.tax_number || "").replace(/\D/g, '');
    if (!taxNumber || (taxNumber.length !== 10 && taxNumber.length !== 11)) {
       return res.status(400).json({ error: "Geçerli bir VKN (10 hane) veya TCKN (11 hane) bulunamadı." });
    }

    // Dynamic GİB taxpayer lookup
    let docType = invoice.e_document_type || 'E-ARSIV';
    let pkAlias = '';
    
    // Fetch Store and Company settings to use for UBL Generation (need this for receiver_alias / mailboxes)
    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) throw new Error("Mağaza ayarları bulunamadı.");
    const row = storeRes.rows[0] || {};
    const settings = row.einvoice_settings || {};
    const branding = row.branding || {};
    pkAlias = settings.receiver_alias || '';

    try {
      console.log(`[INVOICE-SEND] Querying registry for buyer VKN/TCKN: ${taxNumber}`);
      
      // Check official taxpayer cache first
      const cacheRes = await pool.query("SELECT taxpayer_title, alias FROM official_taxpayer_cache WHERE vkn = $1", [taxNumber]);
      
      let taxpayerCheck;
      if (cacheRes.rows.length > 0) {
        console.log(`[checkTaxpayer (send)] VKN ${taxNumber} found in official cache.`);
        taxpayerCheck = { isTaxpayer: true, documentType: 'E-FATURA', title: cacheRes.rows[0].taxpayer_title, alias: cacheRes.rows[0].alias };
      } else {
        taxpayerCheck = await service.checkTaxpayer(taxNumber);
        if (taxpayerCheck && taxpayerCheck.isTaxpayer) {
          await pool.query("INSERT INTO official_taxpayer_cache (vkn, taxpayer_title, alias, last_updated) VALUES ($1, $2, $3, NOW()) ON CONFLICT (vkn) DO UPDATE SET taxpayer_title = EXCLUDED.taxpayer_title, alias = EXCLUDED.alias, last_updated = NOW()", [taxNumber, taxpayerCheck.title || '', taxpayerCheck.alias || '']);
        }
      }
      
      if (taxpayerCheck.isTaxpayer) {
        docType = 'E-FATURA';
        if (taxpayerCheck.alias) {
          pkAlias = taxpayerCheck.alias;
          console.log(`[INVOICE-SEND] GİB Check: Registered e-Invoice User! Correcting docType to E-FATURA and using alias: ${pkAlias}`);
        } else {
          pkAlias = pkAlias || '';
          console.log(`[INVOICE-SEND] GİB Check: Registered e-Invoice User. No specific alias returned, letting MySoft auto-resolve.`);
        }
      } else {
        docType = 'E-ARSIV';
        console.log(`[INVOICE-SEND] GİB Check: Receiver is not an e-Invoice user. Correcting docType to E-ARSIV.`);
      }
    } catch (checkErr) {
      console.warn("[INVOICE-SEND] Taxpayer GİB registry check failed. Keeping draft selection:", checkErr);
      docType = invoice.e_document_type || 'E-ARSIV';
    }

    if (docType === 'E-FATURA' && (!pkAlias || pkAlias.trim() === "")) {
      pkAlias = 'urn:mail:defaultpk'; // Fallback to standard GİB default mailbox to prevent empty tag validation error
    }

    const giInvoiceType = invoice.gi_invoice_type || 'SATIS';
    const exemptionCode = invoice.gi_exemption_reason_code;
    const withholdingCode = invoice.gi_withholding_tax_code;

    // --- GİB Compliance Validations ---
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
    
    // Determine expected prefix based on CORRECTED docType
    const expectedPrefix = docType === 'E-FATURA' ? (settings.einvoice_prefix || 'GAP') : (settings.earchive_prefix || 'GEA');
    const actualPrefix = documentNumber ? documentNumber.substring(0, 3) : '';
    
    // If the docType changed, we MUST regenerate the invoice number to keep sequences matching!
    const docTypeMismatch = invoice.e_document_type && invoice.e_document_type !== docType;
    const isIncorrectPrefix = actualPrefix && actualPrefix.toUpperCase() !== expectedPrefix.toUpperCase();
    
    console.log(`[INVOICE-SEND] Invoice ID: ${invoiceId}, Existing DocNumber: ${documentNumber}, Expected Prefix: ${expectedPrefix}, Mismatch? ${docTypeMismatch || isIncorrectPrefix}`);
    
    // Only regenerate if documentNumber is missing, ETTN is missing, or it's the first attempt and there's a configuration mismatch.
    if (!documentNumber || !ettn || ((!invoice.integration_status || invoice.integration_status === 'UNKNOWN') && (docTypeMismatch || isIncorrectPrefix))) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        
        // Regenerate doc number
        let prefix = expectedPrefix.toUpperCase().substring(0, 3).padEnd(3, 'X');
        const currentYear = new Date().getFullYear().toString();
        const prefixWithYear = `${prefix}${currentYear}`;
        
        const seqRes = await client.query(
           "SELECT document_number FROM sales_invoices WHERE store_id = $1 AND document_number LIKE $2 AND LENGTH(document_number) = 16 ORDER BY document_number DESC LIMIT 1 FOR UPDATE",
           [storeId, `${prefixWithYear}%`]
        );
        
        let nextSequenceNumber = 1;
        if (seqRes.rows.length > 0) {
            const lastDocNum = seqRes.rows[0].document_number;
            const lastSequencePart = lastDocNum.substring(7);
            const parsedSeq = parseInt(lastSequencePart, 10);
            if (!isNaN(parsedSeq)) {
               nextSequenceNumber = parsedSeq + 1;
            }
        }
        
        const sequenceString = nextSequenceNumber.toString().padStart(9, '0');
        documentNumber = `${prefixWithYear}${sequenceString}`;
        invoice.document_number = documentNumber;

        // Regenerate ETTN if docTypeMismatch or isIncorrectPrefix is true to prevent integrator uuid reuse conflicts!
        if (!ettn || docTypeMismatch || isIncorrectPrefix) {
          ettn = crypto.randomUUID();
          invoice.ettn = ettn;
        }
        
        invoice.e_document_type = docType;
        invoice.invoice_profile = docType === 'E-ARSIV' ? 'EARSIVFATURA' : (invoice.invoice_profile || 'TEMELFATURA');
        
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

    // Fetch Invoice Items
    const itemsRes = await pool.query("SELECT * FROM sales_invoice_items WHERE sales_invoice_id = $1", [invoiceId]);
    const items = itemsRes.rows;

    if (items.length === 0) {
      return res.status(400).json({ error: "Faturaya ait ürün/hizmet kalemi bulunamadı." });
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
    let cityName = "İSTANBUL";
    let districtName = "MERKEZ";
    if (address) {
       const cleanAddr = address.replace(/, Türkiye/gi, '').replace(/,Turkey/gi, '').trim();
       const parts = cleanAddr.split(/[,/]+/).map(p => p.trim()).filter(Boolean);
       if (parts.length >= 2) {
          cityName = parts[parts.length - 1].toUpperCase().substring(0, 30);
          districtName = parts[parts.length - 2].toUpperCase().substring(0, 30);
       } else if (parts.length === 1) {
          cityName = parts[0].toUpperCase().substring(0, 30);
       }
    }

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

      return {
        productName: item.product_name || "Ürün/Hizmet",
        qty: String(Number(qty.toFixed(4))),
        unitCode: (() => {
          const rawUnit = (item.unit_code || "").trim();
          if (!rawUnit) return UNIT_CODES.PIECE;
          const norm = rawUnit.toLowerCase();
          const mapping: { [key: string]: string } = {
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
          return mapping[norm] || rawUnit;
        })(),
        unitPriceTra: String(Number(unitPrice.toFixed(4))),
        amtTra: String(Number(lineExtensionAmount.toFixed(2))),
        vatRate: String(Number(taxRate.toFixed(2))),
        amtVatTra: String(Number(taxAmount.toFixed(2))),
        taxableAmtTra: String(Number(lineExtensionAmount.toFixed(2))),
        taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV
      };
    });

    // Construct UBL JSON Data matching MySoft standard payload (Outbox format)
    if (!invoice.document_number) throw new Error("Fatura numarası oluşturulamadı.");
    
    // Explicitly compute totals from lines to ensure consistency
    const totalLineExtension = InvoiceDetail.reduce((acc, item) => acc + Number(item.amtTra), 0);
    const totalTax = InvoiceDetail.reduce((acc, item) => acc + Number(item.amtVatTra), 0);
    const grandTotal = totalLineExtension + totalTax;

    const ublData: any = {
       isCalculateByApi: false,
       isManuelCalculation: true,
       id: 0, 
       connectorGuid: settings.connector_guid || undefined,
       eDocumentType: docType === 'E-FATURA' ? 'EFATURA' : 'EARSIVFATURA',
       profile: docType === 'E-ARSIV' ? 'TEMELFATURA' : (invoice.invoice_profile || 'TEMELFATURA'),
       invoiceType: giInvoiceType,
       docDate: formattedDate,
       docTime: formattedTime,
       ettn: ettn,
       docNo: documentNumber,
       currencyCode: (invoice.currency || 'TRY').toUpperCase(),
       currencyRate: String(Number(Number(invoice.exchange_rate || 1).toFixed(4))),
       tenantIdentifierNumber: storeTaxNumber,
       
       pkAlias: docType === 'E-FATURA' ? pkAlias : undefined,
       
       invoiceAccount: {
          vknTckn: taxNumber,
          accountName: (customerTitle || (isCorporate ? customerTitle : `${name} ${surname}`)).substring(0, 100),
          taxOfficeName: taxOffice || "",
          email1: customerEmail || "",
          countryName: "Türkiye",
          cityName: cityName || "İSTANBUL",
          citySubdivision: districtName || "MERKEZ",
          streetName: (address || "Girilmemiş Adres").substring(0, 250)
       },

       tax: [{
         taxAmount: Number(totalTax.toFixed(2)),
         taxSubTotal: InvoiceDetail.map(detail => ({
            taxableAmount: Number(Number(detail.taxableAmtTra).toFixed(2)),
            taxAmount: Number(Number(detail.amtVatTra).toFixed(2)),
            calculationSequenceNumeric: 0,
            percent: String(detail.vatRate),
            taxName: "Katma Değer Vergisi",
            taxTypeCode: "0015"
         }))
       }],

       invoiceDetail: InvoiceDetail,

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
        
        const expectedPrefix = settings.einvoice_prefix || 'GAP';
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          let prefix = expectedPrefix.toUpperCase().substring(0, 3).padEnd(3, 'X');
          const currentYear = new Date().getFullYear().toString();
          const prefixWithYear = `${prefix}${currentYear}`;
          
          const seqRes = await client.query(
             "SELECT document_number FROM sales_invoices WHERE store_id = $1 AND document_number LIKE $2 AND LENGTH(document_number) = 16 ORDER BY document_number DESC LIMIT 1 FOR UPDATE",
             [storeId, `${prefixWithYear}%`]
          );
          
          let nextSequenceNumber = 1;
          if (seqRes.rows.length > 0) {
              const lastDocNum = seqRes.rows[0].document_number;
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
        ublData.profile = invoice.invoice_profile || 'TEMELFATURA';
        ublData.docNo = documentNumber;
        ublData.pkAlias = pkAlias;
        ublData.ettn = ettn;

        console.log("[INVOICE-SEND-RECOVERY] Retrying sendInvoice with updated E-FATURA sequence payload...");
        result = await service.sendInvoice(ublData);

      } else if (isEArchiveRequired && docType === 'E-FATURA') {
        console.warn(`[INVOICE-SEND-RECOVERY] Integrator rejected E-Fatura due to target NOT being an active e-Invoice taxpayer. Attempting auto-recovery as E-ARSIV...`);
        docType = 'E-ARSIV';
        pkAlias = '';

        const expectedPrefix = settings.earchive_prefix || 'GEA';
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          let prefix = expectedPrefix.toUpperCase().substring(0, 3).padEnd(3, 'X');
          const currentYear = new Date().getFullYear().toString();
          const prefixWithYear = `${prefix}${currentYear}`;

          const seqRes = await client.query(
             "SELECT document_number FROM sales_invoices WHERE store_id = $1 AND document_number LIKE $2 AND LENGTH(document_number) = 16 ORDER BY document_number DESC LIMIT 1 FOR UPDATE",
             [storeId, `${prefixWithYear}%`]
          );

          let nextSequenceNumber = 1;
          if (seqRes.rows.length > 0) {
              const lastDocNum = seqRes.rows[0].document_number;
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

// 5. Sync Incoming Invoices
router.post("/einvoice/sync-inbox", authenticate, async (req: any, res) => {
    let storeIdRaw = req.user.role === 'superadmin' ? (req.query.storeId || req.body.storeId) : req.user.store_id;
    const storeId = storeIdRaw ? parseInt(String(storeIdRaw)) : null;
    const { startDate, endDate } = req.body;
  try {
    
    console.log(`[SYNC-INBOX] Store: ${storeId}, Dates: ${startDate} to ${endDate}`);
    
    if (!storeId || isNaN(storeId)) return res.status(400).json({ error: "Geçerli bir Mağaza ID bulunamadı." });
    if (!startDate || !endDate) {
       return res.status(400).json({ error: "Başlangıç ve bitiş tarihi gereklidir." });
    }

    const service = await getEInvoiceService(storeId);
    if (!service) return res.status(400).json({ error: "E-Fatura servisi başlatılamadı." });
    
    // Fetch raw incoming invoices from MySoft
    let incomingInvoices = [];
    try {
      console.log(`[SYNC-INBOX] Calling integrator service...`);
      incomingInvoices = await service.getIncomingInvoices(startDate, endDate);
      console.log(`[SYNC-INBOX] Received ${incomingInvoices.length} invoices from integrator.`);
    } catch (apiErr: any) {
      console.error("[SYNC-INBOX] MySoft API call failed:", apiErr.message);
      return res.status(500).json({ error: `Entegratör hatası: ${apiErr.message}` });
    }
    
    let importedCount = 0;
    // Helper to normalize Turkish date format (DD.MM.YYYY) to (YYYY-MM-DD)
    const normalizeDate = (dateStr: any) => {
      if (typeof dateStr !== 'string') return dateStr;
      if (dateStr.includes('.')) {
        const parts = dateStr.split('.');
        if (parts.length === 3 && parts[2].length === 4) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      return dateStr;
    };

    // Process and insert them into purchase_invoices
    for (const inv of incomingInvoices) {
       let invoiceDetails = inv;
       
       // If basic info is missing but ETTN exists, fetch full details early
       const rawForLines = inv.raw || (typeof inv === 'object' ? inv : {});
       const linesAtRoot = rawForLines.detailList || rawForLines.InvoiceLines || rawForLines.lines || rawForLines.InvoiceLine || rawForLines.Lines || rawForLines.invoiceLines;
       
       if (!linesAtRoot && inv.ettn) {
         console.log(`Fetching full details for invoice: ${inv.ettn} before processing...`);
         const details = await service.getInvoiceDetailsByUuid(inv.ettn);
         if (details) {
           const detailsBase = details.legalMonetaryTotal?.taxExclusiveAmount || details.TaxExclusiveAmount || 0;
           const detailsTaxArr = details.taxTotal || details.TaxTotal || [];
           const detailsTax = Array.isArray(detailsTaxArr) 
             ? detailsTaxArr.reduce((sum: number, tax: any) => sum + (Number(tax.taxAmount || tax.TaxAmount || 0)), 0)
             : (Number(detailsTaxArr.taxAmount || detailsTaxArr.TaxAmount) || 0);

           invoiceDetails = {
             ...inv,
             documentNumber: details.docNo || details.Id || details.id || inv.documentNumber,
             issueDate: normalizeDate(details.docDate || details.IssueDate || details.issueDate || inv.issueDate),
             senderTitle: details.supplierInfo?.partyName || details.supplierInfo?.customerName || details.SenderTitle || details.senderTitle || inv.senderTitle,
             senderVkn: details.supplierInfo?.identifierNumber || details.SenderVkn || details.senderVkn || inv.senderVkn,
             payableAmount: details.legalMonetaryTotal?.payableAmount || details.PayableAmount || details.payableAmount || inv.payableAmount,
             baseAmount: Number(detailsBase) || inv.baseAmount || 0,
             taxAmount: Number(detailsTax) || inv.taxAmount || 0,
             currency: details.documentCurrencyCode || details.CurrencyCode || details.currencyCode || inv.currency,
             exchangeRate: Number(details.pricingExchangeRate?.calculationRate || details.PricingExchangeRate?.CalculationRate || details.paymentExchangeRate?.calculationRate || details.exchangeRate || details.ExchangeRate || details.currencyRate || 1) || 1,
             documentType: details.profileId || details.InvoiceTypeCode || details.invoiceTypeCode || inv.documentType,
             raw: details
           };
         }
       } else {
         // Even if we have lines, normalize the date in inv
         invoiceDetails = {
           ...inv,
           issueDate: normalizeDate(inv.issueDate)
         };
       }

       // Check if invoice already exists
       const existingRes = await pool.query(
         "SELECT id, ettn FROM purchase_invoices WHERE store_id = $1 AND (ettn = $2 OR document_number = $3)", 
         [storeId, invoiceDetails.ettn, invoiceDetails.documentNumber]
       );

       if (existingRes.rows.length > 0) {
          // If it exists but has no ETTN, update it
          const existing = existingRes.rows[0];
          if (!existing.ettn && invoiceDetails.ettn) {
             console.log(`Updating missing ETTN for existing invoice ${invoiceDetails.documentNumber}: ${invoiceDetails.ettn}`);
             await pool.query(
               "UPDATE purchase_invoices SET ettn = $1 WHERE id = $2",
               [invoiceDetails.ettn, existing.id]
             );
          }
          continue; // Already processed
       }

       if (true) {
          // 1. Find or create company
          let companyId = null;
          if (invoiceDetails.senderVkn) {
            const compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND tax_number = $2", [storeId, invoiceDetails.senderVkn]);
            if (compRes.rows.length > 0) {
              companyId = compRes.rows[0].id;
            } else {
              // Create company
              const newComp = await pool.query(
                "INSERT INTO companies (store_id, title, tax_number, address) VALUES ($1, $2, $3, $4) RETURNING id",
                [storeId, invoiceDetails.senderTitle || 'Bilinmeyen Tedarikçi', invoiceDetails.senderVkn, 'Otomatik Oluşturuldu']
              );
              companyId = newComp.rows[0].id;
            }
          }

          const baseAmt = Number(invoiceDetails.baseAmount) || (Number(invoiceDetails.payableAmount) - Number(invoiceDetails.taxAmount || 0));
          const taxAmt = Number(invoiceDetails.taxAmount) || 0;
          const grandAmt = Number(invoiceDetails.payableAmount) || (baseAmt + taxAmt);

          const invInsertRes = await pool.query(
            `INSERT INTO purchase_invoices 
            (store_id, company_id, invoice_number, document_number, ettn, e_document_type, supplier_name, tax_number, invoice_date, total_amount, tax_amount, grand_total, currency, exchange_rate, status, integration_status, payment_method, payment_status, is_tax_inclusive)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING id`,
            [
              storeId, 
              companyId,
              invoiceDetails.documentNumber, 
              invoiceDetails.documentNumber, 
              invoiceDetails.ettn, 
              invoiceDetails.documentType, 
              invoiceDetails.senderTitle,
              invoiceDetails.senderVkn,
              (() => {
                const d = invoiceDetails.issueDate;
                if (!d) return new Date().toISOString();
                if (typeof d !== 'string') return d;
                // If it's DD.MM.YYYY format
                if (/^\d{2}\.\d{2}\.\d{4}$/.test(d)) {
                  const [day, month, year] = d.split('.');
                  return `${year}-${month}-${day}`;
                }
                // Try standard parsing
                try {
                  const parsed = new Date(d);
                  if (!isNaN(parsed.getTime())) return parsed.toISOString();
                } catch (e) {}
                return new Date().toISOString();
              })(),
              baseAmt,
              taxAmt,
              grandAmt,
              invoiceDetails.currency,
              invoiceDetails.exchangeRate || 1,
              'approved', 
              'RECEIVED',
              'term',
              'unpaid',
              false // E-invoices are imported as Exclusive (KDV Hariç) by default
            ]
          );
          
          const newInvoiceId = invInsertRes.rows[0].id;

          // 3. Attempt to parse lines and match with existing products
          const rawData = invoiceDetails.raw || (typeof inv === 'object' ? inv : {});
          let rawLines = rawData.detailList || rawData.InvoiceLines || rawData.lines || rawData.InvoiceLine || rawData.Lines || rawData.invoiceLines || [];
          if (rawLines && !Array.isArray(rawLines)) {
            rawLines = [rawLines];
          }
          
          if (Array.isArray(rawLines)) {
            for (const line of rawLines) {
              const productName = line.detailItem?.itemName || line.itemName || line.Item?.Name?.['#text'] || line.Item?.Name || line.Name || line.name || line.InvoicedQuantity?.['@_unitCode'] || 'Bilinmeyen Ürün';
              
              // Extract potential barcode or product code from the e-invoice line
              let extractedCodeObj = line.detailItem?.buyersItemIdentification || line.detailItem?.sellersItemIdentification || line.Item?.StandardItemIdentification?.ID?.['#text'] || line.Item?.StandardItemIdentification?.ID || line.Item?.SellersItemIdentification?.ID?.['#text'] || line.Item?.SellersItemIdentification?.ID || line.Item?.BuyersItemIdentification?.ID?.['#text'] || line.Item?.BuyersItemIdentification?.ID || line.sellersItemIdentification || line.buyersItemIdentification;
              let productBarcodeCode = typeof extractedCodeObj === 'string' ? extractedCodeObj.trim() : (typeof extractedCodeObj === 'number' ? String(extractedCodeObj) : null);
              if (productBarcodeCode === '') productBarcodeCode = null;

              const qtyRaw = line.invoicedQuantity || line.Quantity || line.quantity || line.InvoicedQuantity?.['#text'] || line.InvoicedQuantity || 0;
              const unitCode = line.unitCode || line.UnitCode || line.unitCode || line.InvoicedQuantity?.['@_unitCode'] || 'C62'; // C62 is Piece
              
              const qty = Number(String(qtyRaw).replace(',', '.')) || 0;
              
              const upRaw = line.unitPrice || line.Price?.PriceAmount?.['#text'] || line.Price?.PriceAmount || line.Price || line.unitPrice || line.unit_price || 0;
              const up = Number(String(upRaw).replace(',', '.')) || 0;
              
              const trRaw = line.taxTotal?.taxSubtotalList?.[0]?.percent || line.TaxTotal?.TaxSubtotal?.Percent?.['#text'] || line.TaxTotal?.TaxSubtotal?.Percent || line.TaxRate || line.taxRate || line.tax_rate || 0;
              const tr = Number(String(trRaw).replace(',', '.')) || 0;
              
              const lineTotal = qty * up;
              const taxAmount = (lineTotal * tr) / 100;

              // Try to find matching product by name or barcode
              let prodMatch;
              if (productBarcodeCode) {
                 prodMatch = await pool.query(
                   "SELECT id, barcode FROM products WHERE store_id = $1 AND (LOWER(name) = LOWER($2) OR barcode = $3 OR barcode = $4)",
                   [storeId, productName, productName, productBarcodeCode]
                 );
              } else {
                 prodMatch = await pool.query(
                   "SELECT id, barcode FROM products WHERE store_id = $1 AND (LOWER(name) = LOWER($2) OR barcode = $3)",
                   [storeId, productName, productName]
                 );
              }
              
              let productId = prodMatch.rows.length > 0 ? prodMatch.rows[0].id : null;
              let finalBarcode = prodMatch.rows.length > 0 ? prodMatch.rows[0].barcode : productBarcodeCode;

              if (!productId) {
                // Determine a safe barcode
                finalBarcode = productBarcodeCode ? productBarcodeCode : `AUTO-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                
                // Check if barcode already exists for this store before creating
                const existingProd = await pool.query("SELECT id FROM products WHERE barcode = $1 AND store_id = $2", [finalBarcode, storeId]);
                if (existingProd.rows.length > 0) {
                  productId = existingProd.rows[0].id;
                } else {
                  // Create product with "yeni_fatura_urunu" label to highlight it
                  const newProdRes = await pool.query(
                    `INSERT INTO products 
                     (store_id, name, barcode, price, cost_price, tax_rate, stock_quantity, currency, product_type, labels) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                    [storeId, productName, finalBarcode, 0, up, tr, 0, invoiceDetails.currency || 'TRY', 'product', JSON.stringify(["yeni_fatura_urunu"])]
                  );
                  productId = newProdRes.rows[0].id;
                }
              }

              await pool.query(
                `INSERT INTO purchase_invoice_items 
                 (purchase_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price, unit_code) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [newInvoiceId, productId, productName, finalBarcode, qty, up, tr, taxAmount, lineTotal, unitCode]
              );
              
              // If product exists, update its stock automatically
              if (productId) {
                await pool.query(
                  "UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2, cost_currency = $3 WHERE id = $4",
                  [qty, up, invoiceDetails.currency || 'TRY', productId]
                );
                
                // Log stock movement
                await addStockMovement(
                  pool, 
                  storeId, 
                  productId, 
                  'in', 
                  qty, 
                  'purchase_invoice', 
                  `E-Fatura İçe Aktarma: ${invoiceDetails.documentNumber}`, 
                  up, 
                  invoiceDetails.senderTitle, 
                  invoiceDetails.currency
                );
              }
            }
          }

          // 4. Create Transaction
          if (companyId) {
            await pool.query(
              `INSERT INTO current_account_transactions 
                (store_id, company_id, purchase_invoice_id, type, amount, currency, description, transaction_date) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [storeId, companyId, newInvoiceId, 'credit', invoiceDetails.payableAmount || 0, invoiceDetails.currency || 'TRY', `E-Fatura İçe Aktarma: ${invoiceDetails.documentNumber}`, invoiceDetails.issueDate || new Date()]
            );
          }

          importedCount++;
       }
    }

    res.json({ message: `${importedCount} adet yeni fatura içeri aktarıldı.`, importedCount });
  } catch (error: any) {
    await IntegrationService.logIntegrationError(storeId || 0, 'E-Fatura', `Sync Inbox`, error);
    res.status(500).json({ error: error.message || "Bilinmeyen bir hata oluştu" });
  }
});

// 5. Test Connection
router.post("/einvoice/test-connection", authenticate, async (req: any, res) => {
  try {
    const storeId = req.user.store_id;
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

// 6. Get Invoice HTML
router.get("/einvoice/:id/html", authenticate, async (req: any, res) => {
  try {
    const storeId = req.user.store_id;
    const invoiceId = req.params.id;
    const invoiceType = req.query.type || 'purchase';

    let invoiceRes;
    if (invoiceType === 'sales') {
        invoiceRes = await pool.query("SELECT ettn, document_number FROM sales_invoices WHERE id = $1 AND store_id = $2", [invoiceId, storeId]);
    } else {
        invoiceRes = await pool.query("SELECT ettn, document_number FROM purchase_invoices WHERE id = $1 AND store_id = $2", [invoiceId, storeId]);
    }
    
    if (invoiceRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı." });

    const { ettn, document_number } = invoiceRes.rows[0];
    if (!ettn && !document_number) return res.status(400).json({ error: "Faturanın ETTN'si veya numarası bulunmuyor." });

    const service = await getEInvoiceService(storeId);
    
    if ('getInvoiceHtml' in service) {
      console.log(`[HTML-FETCH] Fetching HTML for Invoice: ${invoiceId}, ETTN: ${ettn}, DocNumber: ${document_number}`);
      const html = await (service as any).getInvoiceHtml(ettn, document_number);
      console.log(`[HTML-FETCH] HTML fetched for ${invoiceId}`);
      return res.json({ html });
    }

    res.status(400).json({ error: "Kullandığınız entegratör için HTML önizleme desteği bulunmuyor." });
  } catch (error: any) {
    console.error("Get HTML endpoint error:", error);
    res.status(500).json({ error: error.message || "Bilinmeyen bir hata oluştu" });
  }
});

export const runGlobalEInvoiceSync = async () => {
  console.log("[runGlobalEInvoiceSync] Triggering background sync for all active stores");
  try {
    const storesRes = await pool.query(
      "SELECT id FROM stores WHERE einvoice_settings->>'is_active' = 'true'"
    );
    for (const store of storesRes.rows) {
      try {
        const storeId = store.id;
        const service = await getEInvoiceService(storeId);
        
        // Let's pull the last 3 days
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Fetch raw incoming invoices
        const incomingInvoices = await service.getIncomingInvoices(startDate, endDate);
        
        let importedCount = 0;
        const normalizeDate = (dateStr: any) => {
          if (typeof dateStr !== 'string') return dateStr;
          if (dateStr.includes('.')) {
            const parts = dateStr.split('.');
            if (parts.length === 3 && parts[2].length === 4) {
              return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          }
          return dateStr;
        };

        for (const inv of incomingInvoices) {
           let invoiceDetails = inv;
           
           const rawForLines = inv.raw || (typeof inv === 'object' ? inv : {});
           const linesAtRoot = rawForLines.detailList || rawForLines.InvoiceLines || rawForLines.lines || rawForLines.InvoiceLine || rawForLines.Lines || rawForLines.invoiceLines;
           
           if (!linesAtRoot && inv.ettn) {
             const details = await service.getInvoiceDetailsByUuid(inv.ettn);
             if (details) {
               const detailsBase = details.legalMonetaryTotal?.taxExclusiveAmount || details.TaxExclusiveAmount || 0;
               const detailsTaxArr = details.taxTotal || details.TaxTotal || [];
               const detailsTax = Array.isArray(detailsTaxArr) 
                 ? detailsTaxArr.reduce((sum: number, tax: any) => sum + (Number(tax.taxAmount || tax.TaxAmount || 0)), 0)
                 : (Number(detailsTaxArr.taxAmount || detailsTaxArr.TaxAmount) || 0);

               invoiceDetails = {
                 ...inv,
                 documentNumber: details.docNo || details.Id || details.id || inv.documentNumber,
                 issueDate: normalizeDate(details.docDate || details.IssueDate || details.issueDate || inv.issueDate),
                 senderTitle: details.supplierInfo?.partyName || details.supplierInfo?.customerName || details.SenderTitle || details.senderTitle || inv.senderTitle,
                 senderVkn: details.supplierInfo?.identifierNumber || details.SenderVkn || details.senderVkn || inv.senderVkn,
                 payableAmount: details.legalMonetaryTotal?.payableAmount || details.PayableAmount || details.payableAmount || inv.payableAmount,
                 baseAmount: Number(detailsBase) || inv.baseAmount || 0,
                 taxAmount: Number(detailsTax) || inv.taxAmount || 0,
                 currency: details.documentCurrencyCode || details.CurrencyCode || details.currencyCode || inv.currency,
                 exchangeRate: Number(details.pricingExchangeRate?.calculationRate || details.PricingExchangeRate?.CalculationRate || details.paymentExchangeRate?.calculationRate || details.exchangeRate || details.ExchangeRate || details.currencyRate || 1) || 1,
                 documentType: details.profileId || details.InvoiceTypeCode || details.invoiceTypeCode || inv.documentType,
                 raw: details
               };
             }
           } else {
             invoiceDetails = {
               ...inv,
               issueDate: normalizeDate(inv.issueDate)
             };
           }

           const existingRes = await pool.query(
             "SELECT id, ettn FROM purchase_invoices WHERE store_id = $1 AND (ettn = $2 OR document_number = $3)", 
             [storeId, invoiceDetails.ettn, invoiceDetails.documentNumber]
           );

           if (existingRes.rows.length > 0) {
              const existing = existingRes.rows[0];
              if (!existing.ettn && invoiceDetails.ettn) {
                 await pool.query(
                   "UPDATE purchase_invoices SET ettn = $1 WHERE id = $2",
                   [invoiceDetails.ettn, existing.id]
                 );
              }
              continue;
           }

           let companyId = null;
           if (invoiceDetails.senderVkn) {
             const compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND tax_number = $2", [storeId, invoiceDetails.senderVkn]);
             if (compRes.rows.length > 0) {
               companyId = compRes.rows[0].id;
             } else {
               const newComp = await pool.query(
                 "INSERT INTO companies (store_id, title, tax_number, address) VALUES ($1, $2, $3, $4) RETURNING id",
                 [storeId, invoiceDetails.senderTitle || 'Bilinmeyen Tedarikçi', invoiceDetails.senderVkn, 'Otomatik Oluşturuldu']
               );
               companyId = newComp.rows[0].id;
             }
           }

           const baseAmt = Number(invoiceDetails.baseAmount) || (Number(invoiceDetails.payableAmount) - Number(invoiceDetails.taxAmount || 0));
           const taxAmt = Number(invoiceDetails.taxAmount) || 0;
           const grandAmt = Number(invoiceDetails.payableAmount) || (baseAmt + taxAmt);

           await pool.query(
             `INSERT INTO purchase_invoices 
             (store_id, company_id, invoice_number, document_number, ettn, e_document_type, supplier_name, tax_number, invoice_date, total_amount, tax_amount, grand_total, currency, exchange_rate, status, integration_status, payment_method, payment_status, is_tax_inclusive, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, false) RETURNING id`,
             [
               storeId, 
               companyId,
               invoiceDetails.documentNumber, 
               invoiceDetails.documentNumber, 
               invoiceDetails.ettn, 
               invoiceDetails.documentType, 
               invoiceDetails.senderTitle,
               invoiceDetails.senderVkn,
               (() => {
                 const d = invoiceDetails.issueDate;
                 if (!d) return new Date().toISOString();
                 if (typeof d !== 'string') return d;
                 if (/^\d{2}\.\d{2}\.\d{4}$/.test(d)) {
                   const [day, month, year] = d.split('.');
                   return `${year}-${month}-${day}`;
                 }
                 try {
                   const parsed = new Date(d);
                   if (!isNaN(parsed.getTime())) return parsed.toISOString();
                 } catch (e) {}
                 return new Date().toISOString();
               })(),
               baseAmt,
               taxAmt,
               grandAmt,
               invoiceDetails.currency || 'TRY',
               invoiceDetails.exchangeRate || 1,
               'pending',
               'RECEIVED',
               'term',
               'unpaid',
               false
             ]
           );
           
           importedCount++;
        }
        console.log(`[runGlobalEInvoiceSync] Store ${storeId} imported ${importedCount} new invoices.`);
      } catch (err) {
         console.error(`[runGlobalEInvoiceSync] Error in store ${store.id}:`, err);
      }
    }
  } catch (err) {
    console.error(`[runGlobalEInvoiceSync] Failed to query active stores:`, err);
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
    prefix
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
            waybill_actual_time = $7, waybill_prefix = $8
        WHERE id = $9
      `;
      params = [driverName, driverSurname, driverVkn, plateNumber, trailerPlate, actualDate || null, actualTime || null, prefix || 'IRS', invoiceId];
    } else {
      query = `
        UPDATE sales_invoices 
        SET waybill_driver_name = $1, waybill_driver_surname = $2, waybill_driver_vkn = $3, 
            waybill_plate_number = $4, waybill_trailer_plate = $5, waybill_actual_date = $6, 
            waybill_actual_time = $7, waybill_prefix = $8
        WHERE id = $9 AND store_id = $10
      `;
      params = [driverName, driverSurname, driverVkn, plateNumber, trailerPlate, actualDate || null, actualTime || null, prefix || 'IRS', invoiceId, storeId];
    }

    await pool.query(query, params);
    res.json({ success: true, message: "İrsaliye taslak bilgileri kaydedildi." });
  } catch (err: any) {
    console.error("Save Waybill Error:", err);
    res.status(500).json({ error: "İrsaliye bilgileri kaydedilemedi: " + err.message });
  }
});

// 2. Send E-Waybill to Entegrator (MySoft)
router.post("/einvoice/waybill/send/:invoiceId", authenticate, async (req: any, res) => {
  const { invoiceId } = req.params;
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

    // Safeguard linked company / customer properties
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
    } else if (invoice.customer_id && (!invoice.tax_number || !invoice.address || !invoice.customer_name)) {
      const custRes = await pool.query(
        "SELECT name, full_name, tax_number, tax_office, address, email FROM customers WHERE id = $1",
        [invoice.customer_id]
      );
      if (custRes.rows.length > 0) {
        const cust = custRes.rows[0];
        invoice.tax_number = invoice.tax_number || cust.tax_number;
        invoice.tax_office = invoice.tax_office || cust.tax_office;
        invoice.address = invoice.address || cust.address;
        invoice.customer_name = invoice.customer_name || cust.full_name || cust.name;
        invoice.customer_email = invoice.customer_email || cust.email;
      }
    }

    // Recipient tax details
    const taxNumber = (invoice.tax_number || "").replace(/\D/g, '');
    if (!taxNumber || (taxNumber.length !== 10 && taxNumber.length !== 11)) {
       return res.status(400).json({ error: "Alıcı firmaya ait geçerli bir TCKN/VKN bulunamadı." });
    }

    // Driver / Plate validations (Mandatory for GİB E-Waybill)
    const driverName = invoice.waybill_driver_name || "Bilinmeyen";
    const driverSurname = invoice.waybill_driver_surname || "Sürücü";
    const driverVkn = (invoice.waybill_driver_vkn || "11111111111").replace(/\D/g, '');
    const plateNumber = (invoice.waybill_plate_number || "").replace(/\s/g, '').toUpperCase();
    const trailerPlate = invoice.waybill_trailer_plate || "";
    const actualDate = invoice.waybill_actual_date ? new Date(invoice.waybill_actual_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const actualTime = invoice.waybill_actual_time || new Date().toTimeString().split(' ')[0];

    if (!plateNumber) {
      return res.status(400).json({ error: "GİB Şema/Şematron kuralları gereği Araç Plaka Numarası girilmesi zorunludur." });
    }

    // Let's increment sequence number atomicaly
    const defaultPrefix = (invoice.waybill_prefix || "IRS").toUpperCase().substring(0, 3);
    const currentYear = new Date().getFullYear().toString();
    const prefixWithYear = `${defaultPrefix}${currentYear}`;

    const client = await pool.connect();
    let waybillNumber = "";
    let waybillEttn = invoice.waybill_ettn || crypto.randomUUID();

    try {
      await client.query("BEGIN");

      // Count existing successfully processed waybills under this prefix/year to increment sequence
      const seqRes = await client.query(
         "SELECT waybill_number FROM sales_invoices WHERE store_id = $1 AND waybill_number LIKE $2 AND LENGTH(waybill_number) = 16 ORDER BY waybill_number DESC LIMIT 1 FOR UPDATE",
         [storeId, `${prefixWithYear}%`]
      );

      let nextSequenceNumber = 1;
      if (seqRes.rows.length > 0 && seqRes.rows[0].waybill_number) {
          const lastDocNum = seqRes.rows[0].waybill_number;
          const lastSequencePart = lastDocNum.substring(7);
          const parsed = parseInt(lastSequencePart, 10);
          if (!isNaN(parsed)) {
             nextSequenceNumber = parsed + 1;
          }
      }

      const paddedSequence = nextSequenceNumber.toString().padStart(9, '0');
      waybillNumber = `${prefixWithYear}${paddedSequence}`;

      // Update local record to hold this reserved number
      await client.query(
        "UPDATE sales_invoices SET waybill_number = $1, waybill_ettn = $2, waybill_status = 'QUEUED' WHERE id = $3",
        [waybillNumber, waybillEttn, invoiceId]
      );

      await client.query("COMMIT");
    } catch (dbErr) {
      await client.query("ROLLBACK");
      throw dbErr;
    } finally {
      client.release();
    }

    // Load store settings
    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
    if (storeRes.rows.length === 0) throw new Error("Mağaza ayarları bulunamadı.");
    const settings = storeRes.rows[0].einvoice_settings || {};
    const branding = storeRes.rows[0].branding || {};

    let storeTaxNumber = (settings.vkn || settings.tax_number || branding.tax_number || "").replace(/\s/g, '').replace(/\D/g, '');
    if (!storeTaxNumber && settings.tenant_id) {
      storeTaxNumber = settings.tenant_id.replace(/\s/g, '').replace(/\D/g, '');
    }

    // Retrieve items
    const itemsRes = await pool.query("SELECT * FROM sales_invoice_items WHERE sales_invoice_id = $1", [invoiceId]);
    const lines = itemsRes.rows;
    if (lines.length === 0) {
      return res.status(400).json({ error: "İrsaliye içeriğinde sevk edilecek ürün bulunamadı." });
    }

    // Build details
    const DespatchLines = lines.map((item, index) => {
      const quantity = Number(item.quantity);
      return {
        id: String(index + 1),
        productName: item.product_name,
        qty: quantity,
        unitCode: (() => {
          const rawUnit = item.unit_code;
          if (!rawUnit) return UNIT_CODES.PIECE;
          const norm = rawUnit.toLowerCase();
          const mapping: { [key: string]: string } = {
            "adet": "C62", "ad": "C62", "pcs": "C62", "piece": "C62",
            "kg": "KGM", "kilogram": "KGM", "gr": "GRM",
            "litre": "LTR", "lt": "LTR", "meter": "MTR", "metre": "MTR",
            "paket": "PA", "kutu": "BX", "ton": "TNE",
            "metrekare": "MTK", "m2": "MTK"
          };
          return mapping[norm] || rawUnit;
        })(),
        unitPriceTra: String(Number(Number(item.unit_price || 0).toFixed(4))),
        amtTra: String(Number(Number(item.total_price || 0).toFixed(2)))
      };
    });

    const isCorporate = taxNumber.length === 10;
    const customerTitle = invoice.company_title || invoice.customer_name || "Seyirci Müşteri";

    // Split names
    const parts = customerTitle.trim().split(/\s+/);
    const surname = parts.length > 1 ? parts.pop() : "ŞAHIS";
    const name = parts.join(" ") || "PERAKENDE";

    // Build address mapping
    const addressTokens = (invoice.address || "İstanbul Merkez").trim().split(/\s+/);
    const cityName = addressTokens[addressTokens.length - 1] || "İSTANBUL";
    const districtName = addressTokens[addressTokens.length - 2] || "MERKEZ";

    // Map UBL-TR compliant MySoft e-Waybill JSON Payload
    const ublData: any = {
      isCalculateByApi: false,
      isManuelCalculation: true,
      connectorGuid: settings.connector_guid || undefined,
      eDocumentType: "IRSALIYE",
      profile: "TEMELIRSALIYE",
      despatchAdviceType: "SEVK",
      docDate: new Date(invoice.invoice_date).toISOString().split('T')[0],
      docTime: invoice.invoice_time || "12:00:00",
      ettn: waybillEttn,
      docNo: waybillNumber,
      currencyCode: (invoice.currency || 'TRY').toUpperCase(),
      currencyRate: String(Number(Number(invoice.exchange_rate || 1).toFixed(4))),
      tenantIdentifierNumber: storeTaxNumber,
      
      // Receviver mailbox setup
      pkAlias: settings.receiver_alias_waybill || settings.receiver_alias || "urn:mail:defaultpk",

      despatchAdviceAccount: {
        vknTckn: taxNumber,
        accountName: customerTitle.substring(0, 100),
        taxOfficeName: invoice.tax_office || "",
        email1: invoice.customer_email || "",
        countryName: "Türkiye",
        cityName: cityName.toUpperCase(),
        citySubdivision: districtName.toUpperCase(),
        streetName: (invoice.address || "İstanbul").substring(0, 250)
      },

      despatchAdviceDetail: DespatchLines,
      despatchDetail: DespatchLines, // Mirror key redundancy
      invoiceDetail: DespatchLines, // Mirror key redundancy

      // GİB shipment logistics block (Carrier/Driver)
      shipment: {
        driverName: driverName,
        driverSurname: driverSurname,
        driverVknTckn: driverVkn,
        plateNumber: plateNumber,
        trailerPlateNumber: trailerPlate || undefined,
        actualDeliveryDate: actualDate,
        actualDeliveryTime: actualTime
      }
    };

    const service = await getEInvoiceService(storeId);
    console.log(`[MySoft e-Waybill] Triggering sendWaybill with document number: ${waybillNumber}`);
    
    const result = await service.sendWaybill(ublData);

    if (result.isSuccess) {
      await pool.query(
        "UPDATE sales_invoices SET waybill_status = 'SUCCESS', waybill_message = $1, waybill_number = $2 WHERE id = $3",
        ["Gönderim Başarılı: Kuyruğa Alındı. GİB onayı bekleniyor.", waybillNumber, invoiceId]
      );
      return res.json({ success: true, waybillNumber, ettn: waybillEttn, message: "E-İrsaliye başarıyla kuyruğa iletildi." });
    } else {
      throw new Error(result.message || "Mysoft bilinmeyen bir hata verdi.");
    }

  } catch (err: any) {
    console.error("Transmitting Waybill to MySoft Failed:", err);
    await pool.query(
      "UPDATE sales_invoices SET waybill_status = 'ERROR', waybill_message = $1 WHERE id = $2",
      [err.message || "Portakal entegratörü ile bağlantı hatası.", invoiceId]
    );
    res.status(500).json({ error: "E-İrsaliye gönderim adımı başarısız oldu: " + err.message });
  }
});

// 3. Durum Sorgulama E-Waybill status endpoint
router.get("/einvoice/waybill/status/:invoiceId", authenticate, async (req: any, res) => {
  const { invoiceId } = req.params;
  try {
    const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
    if (invRes.rows.length === 0) return res.status(404).json({ error: "Kayıt bulunamadı" });
    const invoice = invRes.rows[0];

    if (!invoice.waybill_ettn) {
      return res.status(400).json({ error: "Bu fatura için iletilmiş bir E-İrsaliye bulunmamaktadır." });
    }

    const service = await getEInvoiceService(invoice.store_id);
    const result = await service.getWaybillStatus(invoice.waybill_ettn);

    // Update status in local DB
    await pool.query(
      "UPDATE sales_invoices SET waybill_status = $1, waybill_message = $2 WHERE id = $3",
      [result.status.toUpperCase(), result.message, invoiceId]
    );

    res.json({ success: true, status: result.status, message: result.message });
  } catch (err: any) {
    console.error("Fetch Waybill Status Error:", err);
    res.status(500).json({ error: "İrsaliye durum sorgulaması başarısız: " + err.message });
  }
});

// 4. Fetch E-Waybill representation (HTML / Web View)
router.get("/einvoice/waybill/html/:invoiceId", authenticate, async (req: any, res) => {
  const { invoiceId } = req.params;
  try {
    const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
    if (invRes.rows.length === 0) return res.status(404).json({ error: "Kayıt bulunamadı" });
    const invoice = invRes.rows[0];

    if (!invoice.waybill_ettn) {
      return res.status(400).json({ error: "Bu faturaya ait bir E-İrsaliye ETTN kodu bulunamadı." });
    }

    const service = await getEInvoiceService(invoice.store_id);
    const htmlContent = await service.getWaybillHtml(invoice.waybill_ettn);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(htmlContent);
  } catch (err: any) {
    console.error("Waybill HTML Visualization failed:", err);
    res.status(500).json({ error: "İrsaliye görüntüsü oluşturulamadı: " + err.message });
  }
});

export default router;
