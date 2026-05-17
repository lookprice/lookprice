import express from "express";
import crypto from "crypto";
import { pool, addStockMovement } from "../models/db";
import { authenticate } from "../middleware/auth";
import { MySoftService } from "../src/services/backend/mysoftService";
import { IntegrationService } from "../src/services/IntegrationService";
import { UNIT_CODES, TAX_CODES } from "../src/lib/ubl-codes";

const router = express.Router();

// Get the E-Invoice service instance based on Store Settings
export const getEInvoiceService = async (storeId: number) => {
  const storeRes = await pool.query("SELECT einvoice_settings FROM stores WHERE id = $1", [storeId]);
  if (storeRes.rows.length === 0) throw new Error("Mağaza bulunamadı");
  
  const settings = storeRes.rows[0].einvoice_settings;
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
    const storeId = req.user.store_id;
    const { vknTckn } = req.body;
    
    if (!vknTckn) return res.status(400).json({ error: "VKN veya TCKN gereklidir" });

    const service = await getEInvoiceService(storeId);
    const result = await service.checkTaxpayer(vknTckn);
    
    res.json(result);
  } catch (error: any) {
    console.error("Check Taxpayer endpoint error:", error);
    res.status(500).json({ error: error.message || "Bilinmeyen bir hata oluştu" });
  }
});

// 2. Send Sales Invoice to Entegrator
router.post("/einvoice/send/:invoiceId", authenticate, async (req: any, res) => {
  const storeId = req.user.store_id;
  const { invoiceId } = req.params;
  try {
    const service = await getEInvoiceService(storeId);

    // Get the invoice
    const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1 AND store_id = $2", [invoiceId, storeId]);
    if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı" });
    
    const invoice = invRes.rows[0];
    const docType = invoice.e_document_type || 'E-ARSIV';
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

    // 1. Party Identifiers
    const taxNumber = (invoice.tax_number || "").replace(/\D/g, '');
    if (!taxNumber || (taxNumber.length !== 10 && taxNumber.length !== 11)) {
       return res.status(400).json({ error: "Geçerli bir VKN (10 hane) veya TCKN (11 hane) bulunamadı." });
    }

    // 2. Email for E-Archive (GİB Mandatory for some scenarios, highly recommended for all)
    const customerEmail = invoice.customer_email || invoice.email;
    if (docType === 'E-ARSIV' && !customerEmail) {
       // While GİB allows sending without email to some extent (using default), 
       // it's a "rule and schema" compliance point the user specifically mentioned.
       // We'll allow it if strictly forced, but warn or prefer it.
       // Actually, user said: "müşterinin e-mail bilgisi gibi GİB kurallarına uygun olup olmadığımızı kontrol etmedik"
       // So I will enforce it here.
       return res.status(400).json({ error: "E-Arşiv faturaları için müşteri e-posta adresi zorunludur." });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (customerEmail && !emailRegex.test(customerEmail)) {
        return res.status(400).json({ error: "Geçerli bir müşteri e-posta adresi girilmelidir." });
    }

    // Fetch Store and Company settings to use for UBL Generation
    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
    const row = storeRes.rows[0] || {};
    const settings = row.einvoice_settings || {};
    const branding = row.branding || {};
    
    // Ensure ETTN and Document Number are present and atomic
    let documentNumber = invoice.document_number;
    let ettn = invoice.ettn;
    
    console.log(`[INVOICE-SEND] Invoice ID: ${invoiceId}, Existing DocNumber: ${documentNumber}, Existing ETTN: ${ettn}`);
    
    if (!documentNumber || !ettn) {
      await pool.query("BEGIN");
      try {
        if (!documentNumber) {
          const docTypeStr = invoice.e_document_type || 'E-ARSIV';
          let prefix = docTypeStr === 'E-FATURA' ? (settings.einvoice_prefix || 'GAP') : (settings.earchive_prefix || 'GEA');
          prefix = prefix.toUpperCase().substring(0, 3).padEnd(3, 'X');
          
          const currentYear = new Date().getFullYear().toString();
          const prefixWithYear = `${prefix}${currentYear}`;
          
          const seqRes = await pool.query(
             "SELECT document_number FROM sales_invoices WHERE store_id = $1 AND document_number LIKE $2 ORDER BY document_number DESC LIMIT 1 FOR UPDATE",
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
        }

        if (!ettn) {
          ettn = crypto.randomUUID();
          invoice.ettn = ettn;
        }
        
        await pool.query(
           "UPDATE sales_invoices SET document_number = $1, ettn = $2 WHERE id = $3",
           [documentNumber, ettn, invoiceId]
        );
        await pool.query("COMMIT");
      } catch (err) {
        await pool.query("ROLLBACK");
        throw err;
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

    // Determine Store VKN for tenantIdentifierNumber
    const storeTaxNumber = (settings.vkn || branding.tax_number || "").replace(/\s/g, '');

    // Date formatting
    const docDate = new Date(invoice.invoice_date || new Date());
    const formattedDate = docDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const formattedTime = docDate.toISOString().split('T')[1].substring(0, 8); // "HH:mm:ss"

    const nameParts = (invoice.customer_name || "").split(' ');
    const surname = nameParts.length > 1 ? nameParts.pop() : "";
    const name = nameParts.join(' ') || (invoice.customer_name || "Müşteri");

    // LINES (mapped to invoiceDetail for MySoft)
    const isTaxInclusive = !!invoice.is_tax_inclusive;
    const InvoiceDetail = items.map((item, index) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      
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
        qty: Number(qty.toFixed(4)),
        unitCode: item.unit_code || UNIT_CODES.PIECE,
        unitPriceTra: Number(unitPrice.toFixed(4)),
        amtTra: Number(lineExtensionAmount.toFixed(2)),
        vatRate: Number(taxRate.toFixed(2)),
        amtVatTra: Number(taxAmount.toFixed(2)),
        taxableAmtTra: Number(lineExtensionAmount.toFixed(2)),
        taxTypeCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV
      };
    });

    // Construct UBL JSON Data matching MySoft standard payload (Outbox format)
    if (!invoice.document_number) throw new Error("Fatura numarası oluşturulamadı.");
    
    // Explicitly compute totals from lines to ensure consistency
    const totalLineExtension = InvoiceDetail.reduce((acc, item) => acc + item.amtTra, 0);
    const totalTax = InvoiceDetail.reduce((acc, item) => acc + item.amtVatTra, 0);
    const grandTotal = totalLineExtension + totalTax;

    const ublData: any = {
       isCalculateByApi: false,
       isManuelCalculation: false,
       id: 0, 
       connectorGuid: settings.connector_guid || undefined,
       eDocumentType: docType === 'E-FATURA' ? 'EFATURA' : 'EARSIVFATURA',
       profile: invoice.invoice_profile || (docType === 'E-FATURA' ? 'TICARIFATURA' : 'EARSIVFATURA'),
       invoiceType: giInvoiceType,
       docDate: formattedDate,
       docTime: formattedTime,
       ettn: invoice.ettn,
       docNo: invoice.document_number,
       currencyCode: invoice.currency || 'TRY',
       currencyRate: Number(Number(invoice.exchange_rate || 1).toFixed(4)),
       tenantIdentifierNumber: storeTaxNumber,
       
       pkAlias: settings.receiver_alias || 'urn:mail:defaultpk@default.com',
       
       invoiceAccount: {
          vknTckn: taxNumber,
          accountName: customerTitle || (isCorporate ? customerTitle : `${name} ${surname}`),
          taxOffice: taxOffice || "",
          email1: customerEmail || "",
          countryName: "Türkiye",
          cityName: cityName || "İSTANBUL",
          citySubdivision: districtName || "MERKEZ",
          streetName: (address || "Girilmemiş Adres").substring(0, 250)
       },

       tax: [{
         taxAmount: totalTax,
         taxSubTotal: InvoiceDetail.map(detail => ({
            taxableAmount: detail.taxableAmtTra,
            taxAmount: detail.amtVatTra,
            percent: String(detail.vatRate),
            taxName: "Katma Değer Vergisi",
            taxTypeCode: "0015"
         }))
       }],

       invoiceDetail: InvoiceDetail,

       invoiceCalculation: {
          lineExtensionAmount: Number(totalLineExtension).toFixed(2),
          taxExclusiveAmount: Number(totalLineExtension).toFixed(2),
          taxInclusiveAmount: Number(grandTotal).toFixed(2),
          payableAmount: Number(grandTotal).toFixed(2)
       }
    };


    // Sending
    const result = await service.sendInvoice(ublData);

    // Format DB Update
    if (result.isSuccess) {
       await pool.query(
         "UPDATE sales_invoices SET integration_status = $1, integration_message = $2, ettn = $3 WHERE id = $4", 
         ['QUEUED', result.message, result.ettn, invoiceId]
       );
    }

    res.json(result);
  } catch (error: any) {
    await IntegrationService.logIntegrationError(storeId, 'E-Fatura', `Send Invoice ${invoiceId}`, error);
    res.status(500).json({ error: error.message || "Bilinmeyen bir hata oluştu" });
  }
});

// 3. Check Status of a Sent Invoice
router.get("/einvoice/status/:invoiceId", authenticate, async (req: any, res) => {
  const storeId = req.user.store_id;
  const { invoiceId } = req.params;
  try {
    const service = await getEInvoiceService(storeId);

    const invRes = await pool.query("SELECT ettn FROM sales_invoices WHERE id = $1 AND store_id = $2", [invoiceId, storeId]);
    if (invRes.rows.length === 0 || !invRes.rows[0].ettn) {
      return res.status(404).json({ error: "Geçerli bir ETTN bulunamadı." });
    }
    
    const ettn = invRes.rows[0].ettn;
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
  const storeId = req.user.store_id;
  const { invoiceId } = req.params;
  const { reason } = req.body;
  try {
    const service = await getEInvoiceService(storeId);

    const invRes = await pool.query("SELECT ettn, e_document_type, invoice_date FROM sales_invoices WHERE id = $1 AND store_id = $2", [invoiceId, storeId]);
    if (invRes.rows.length === 0 || !invRes.rows[0].ettn) {
      return res.status(404).json({ error: "Fatura bulunamadı veya ETTN'si yok." });
    }
    
    // Only allow E-ARSIV for cancellation via MySoft (E-FATURA usually requires different processes or portal)
    if (invRes.rows[0].e_document_type !== 'E-ARSIV') {
        return res.status(400).json({ error: "Sadece E-Arşiv faturaları sistem üzerinden iptal edilebilir." });
    }

    // the 8-day rule for E-Archive
    const invoiceDate = new Date(invRes.rows[0].invoice_date);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - invoiceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 8) {
       return res.status(400).json({ error: "E-Arşiv faturaları, düzenlenme tarihinden itibaren sadece 8 gün içerisinde iptal edilebilir." });
    }

    const ettn = invRes.rows[0].ettn;
    const eDocType = invRes.rows[0].e_document_type;
    
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
              exchangeRate: (details.pricingExchangeRate?.calculationRate || details.PricingExchangeRate?.CalculationRate || details.paymentExchangeRate?.calculationRate || details.exchangeRate || details.ExchangeRate || details.currencyRate || 1),
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
            (store_id, company_id, invoice_number, document_number, ettn, e_document_type, supplier_name, tax_number, invoice_date, total_amount, tax_amount, grand_total, currency, exchange_rate, status, integration_status, payment_method, payment_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id`,
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
              'unpaid'
            ]
          );
          
          const newInvoiceId = invInsertRes.rows[0].id;

          // 3. Attempt to parse lines and match with existing products
          const rawData = invoiceDetails.raw || (typeof inv === 'object' ? inv : {});
          const rawLines = rawData.detailList || rawData.InvoiceLines || rawData.lines || rawData.InvoiceLine || rawData.Lines || rawData.invoiceLines || [];
          
          if (Array.isArray(rawLines)) {
            for (const line of rawLines) {
              const productName = line.detailItem?.itemName || line.itemName || line.Item?.Name?.['#text'] || line.Item?.Name || line.Name || line.name || line.InvoicedQuantity?.['@_unitCode'] || 'Bilinmeyen Ürün';
              
              // Extract potential barcode or product code from the e-invoice line
              let extractedCodeObj = line.detailItem?.buyersItemIdentification || line.detailItem?.sellersItemIdentification || line.Item?.StandardItemIdentification?.ID?.['#text'] || line.Item?.StandardItemIdentification?.ID || line.Item?.SellersItemIdentification?.ID?.['#text'] || line.Item?.SellersItemIdentification?.ID || line.Item?.BuyersItemIdentification?.ID?.['#text'] || line.Item?.BuyersItemIdentification?.ID || line.sellersItemIdentification || line.buyersItemIdentification;
              let productBarcodeCode = typeof extractedCodeObj === 'string' ? extractedCodeObj.trim() : (typeof extractedCodeObj === 'number' ? String(extractedCodeObj) : null);
              if (productBarcodeCode === '') productBarcodeCode = null;

              const qtyRaw = line.invoicedQuantity || line.Quantity || line.quantity || line.InvoicedQuantity?.['#text'] || line.InvoicedQuantity || 0;
              const unitCode = line.unitCode || line.UnitCode || line.unitCode || line.InvoicedQuantity?.['@_unitCode'] || 'C62'; // C62 is Piece
              
              const qty = Number(qtyRaw) || 0;
              
              const upRaw = line.unitPrice || line.Price?.PriceAmount?.['#text'] || line.Price?.PriceAmount || line.Price || line.unitPrice || line.unit_price || 0;
              const up = Number(upRaw) || 0;
              
              const trRaw = line.taxTotal?.taxSubtotalList?.[0]?.percent || line.TaxTotal?.TaxSubtotal?.Percent?.['#text'] || line.TaxTotal?.TaxSubtotal?.Percent || line.TaxRate || line.taxRate || line.tax_rate || 0;
              const tr = Number(trRaw) || 0;
              
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

export default router;
