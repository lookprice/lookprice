import express from "express";
import crypto from "crypto";
import { pool } from "../models/db";
import { authenticate } from "../middleware/auth";
import { MySoftService } from "../src/services/backend/mysoftService";
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
  try {
    const storeId = req.user.store_id;
    const { invoiceId } = req.params;
    
    const service = await getEInvoiceService(storeId);

    // Get the invoice
    const invRes = await pool.query("SELECT * FROM sales_invoices WHERE id = $1 AND store_id = $2", [invoiceId, storeId]);
    if (invRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı" });
    
    const invoice = invRes.rows[0];

    // Fetch Store and Company settings to use for UBL Generation
    const storeRes = await pool.query("SELECT einvoice_settings, branding FROM stores WHERE id = $1", [storeId]);
    const settings = storeRes.rows[0].einvoice_settings || {};
    
    // Sequence Generation Logic for UBL ID (document_number)
    let documentNumber = invoice.document_number;
    
    if (!documentNumber) {
      const docType = invoice.e_document_type || 'E-ARSIV';
      // Default to GAP for e-invoice, GEA for e-archive if prefix isn't defined
      let prefix = docType === 'E-FATURA' ? (settings.einvoice_prefix || 'GAP') : (settings.earchive_prefix || 'GEA');
      prefix = prefix.toUpperCase().substring(0, 3).padEnd(3, 'X'); // Ensure exactly 3 chars
      
      const currentYear = new Date().getFullYear().toString();
      const prefixWithYear = `${prefix}${currentYear}`; // e.g., GAP2026
      
      // Lock and find the highest document number for this exact prefix pattern in this store
      let ettn = null;
      try {
        await pool.query("BEGIN");
        const seqRes = await pool.query(
           "SELECT document_number FROM sales_invoices WHERE store_id = $1 AND document_number LIKE $2 ORDER BY document_number DESC LIMIT 1 FOR UPDATE",
           [storeId, `${prefixWithYear}%`]
        );
        
        let nextSequenceNumber = 1;
        if (seqRes.rows.length > 0) {
            const lastDocNum = seqRes.rows[0].document_number; // e.g., GAP2026000000001
            // Extract the last 9 digits
            const lastSequencePart = lastDocNum.substring(7); // GAP2026 is 7 chars. Substring from index 7 -> 9 chars
            const parsedSeq = parseInt(lastSequencePart, 10);
            if (!isNaN(parsedSeq)) {
               nextSequenceNumber = parsedSeq + 1;
            }
        }
        
        // Format 9 digit sequence
        const sequenceString = nextSequenceNumber.toString().padStart(9, '0');
        documentNumber = `${prefixWithYear}${sequenceString}`;
        
        // Generate ETTN UUID string right here for atomic guarantee
        ettn = crypto.randomUUID();
        
        await pool.query(
           "UPDATE sales_invoices SET document_number = $1, ettn = $2 WHERE id = $3",
           [documentNumber, ettn, invoiceId]
        );
        await pool.query("COMMIT");
      } catch (err) {
        await pool.query("ROLLBACK");
        throw err;
      }
      
      invoice.document_number = documentNumber;
      invoice.ettn = ettn;
    }

    // Fetch Invoice Items
    const itemsRes = await pool.query("SELECT * FROM sales_invoice_items WHERE sales_invoice_id = $1", [invoiceId]);
    const items = itemsRes.rows;

    if (items.length === 0) {
      return res.status(400).json({ error: "Faturaya ait ürün/hizmet kalemi bulunamadı." });
    }

    // Determine Party Information
    let customerName = invoice.customer_name || invoice.sale_customer_name || 'Bilinmeyen Müşteri';
    let customerTitle = invoice.company_title || customerName;
    let taxNumber = invoice.tax_number || "11111111111"; // Fallback to anonymous ID if missing
    let taxOffice = invoice.tax_office || "BilinmeyenVD";
    let address = invoice.company_address || "Girilmemiş Adres, Türkiye";
    let isCorporate = invoice.company_id ? true : false;
    
    // Split name for E-Archive (Requires Name and Surname separately usually)
    const nameParts = customerName.split(' ');
    const surname = nameParts.length > 1 ? nameParts.pop() : "Bilinmeyen";
    const name = nameParts.join(' ') || "Müşteri";

    // Date formatting
    const docDate = new Date(invoice.invoice_date || new Date());
    const formattedDate = docDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const formattedTime = docDate.toISOString().split('T')[1].substring(0, 8); // "HH:mm:ss"

    // LINES
    const isTaxInclusive = !!invoice.is_tax_inclusive;
    const Lines = items.map((item, index) => {
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
        Id: (index + 1).toString(),
        Name: item.product_name,
        Quantity: qty,
        UnitCode: item.unit_code || UNIT_CODES.PIECE,
        Price: unitPrice,
        LineExtensionAmount: lineExtensionAmount,
        Taxes: [
          {
            TaxCode: item.tevkifat_rate ? TAX_CODES.TEVKIFAT_KDV : TAX_CODES.KDV,
            TaxRate: taxRate,
            TaxAmount: taxAmount,
            TaxableAmount: lineExtensionAmount,
            WithholdingRate: item.tevkifat_rate ? item.tevkifat_rate : undefined
          }
        ]
      };
    });

    // Construct UBL JSON Data matching MySoft standard payload (Outbox format)
    const ublData = {
       isCalculateByApi: true,
       id: 0, // 0 usually means create new in integrator
       connectorGuid: settings.connector_guid || null,
       eDocumentType: invoice.e_document_type === 'E-FATURA' ? 'EFATURA' : 'EARSIV',
       profile: invoice.invoice_profile || (invoice.e_document_type === 'E-FATURA' ? 'TICARIFATURA' : 'EARSIVFATURA'),
       invoiceType: 'SATIS',
       ettn: invoice.ettn,
       prefix: invoice.document_number.substring(0, 3),
       issueDate: formattedDate,
       issueTime: formattedTime,
       notes: [(invoice.notes || ""), invoice.waybill_number ? `İrsaliye No: ${invoice.waybill_number}` : ""].filter(Boolean),
       
       senderAlias: settings.sender_alias || 'urn:mail:defaultgb@default.com',
       receiverAlias: settings.receiver_alias || 'urn:mail:defaultpk@default.com',
       
       receiver: {
          vknTckn: taxNumber.replace(/\D/g, ''),
          title: isCorporate ? customerTitle : undefined,
          name: !isCorporate ? name : undefined,
          surname: !isCorporate ? surname : undefined,
          taxOffice: isCorporate ? taxOffice : undefined,
          address: {
             room: "",
             streetName: address,
             cityName: "Türkiye", // Ideally map from address but Turkey is default
             countryName: "Türkiye"
          }
       },

       lines: Lines.map(line => ({
          id: line.Id,
          name: line.Name,
          quantity: line.Quantity,
          unitCode: line.UnitCode,
          price: line.Price,
          taxRate: line.Taxes[0].TaxRate,
          taxCode: line.Taxes[0].TaxCode
       }))
    };

    // Sending
    const result = await service.sendInvoice(ublData);

    // Format DB Update
    if (result.isSuccess) {
       await pool.query(
         "UPDATE sales_invoices SET integration_status = $1, integration_message = $2 WHERE id = $3", 
         ['QUEUED', result.message, invoiceId]
       );
    }

    res.json(result);
  } catch (error: any) {
    console.error("Send Invoice endpoint error:", error);
    res.status(500).json({ error: error.message || "Bilinmeyen bir hata oluştu" });
  }
});

// 3. Check Status of a Sent Invoice
router.get("/einvoice/status/:invoiceId", authenticate, async (req: any, res) => {
  try {
    const storeId = req.user.store_id;
    const { invoiceId } = req.params;
    
    const service = await getEInvoiceService(storeId);

    const invRes = await pool.query("SELECT ettn FROM sales_invoices WHERE id = $1 AND store_id = $2", [invoiceId, storeId]);
    if (invRes.rows.length === 0 || !invRes.rows[0].ettn) {
      return res.status(404).json({ error: "Geçerli bir ETTN bulunamadı." });
    }
    
    const ettn = invRes.rows[0].ettn;
    const status = await service.getInvoiceStatus(ettn);

    // Update DB to reflect new status
    await pool.query(
      "UPDATE sales_invoices SET integration_status = $1, integration_message = $2 WHERE id = $3", 
      [status.status, status.message, invoiceId]
    );

    res.json(status);
  } catch (error: any) {
     console.error("Check Status endpoint error:", error);
     res.status(500).json({ error: error.message || "Bilinmeyen bir hata oluştu" });
  }
});

// 4. Sync Incoming Invoices
router.post("/einvoice/sync-inbox", authenticate, async (req: any, res) => {
  try {
    let storeIdRaw = req.user.role === 'superadmin' ? (req.query.storeId || req.body.storeId) : req.user.store_id;
    const storeId = storeIdRaw ? parseInt(String(storeIdRaw)) : null;
    const { startDate, endDate } = req.body;
    
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
            (store_id, company_id, invoice_number, document_number, ettn, e_document_type, supplier_name, tax_number, invoice_date, total_amount, tax_amount, grand_total, currency, status, integration_status, payment_method, payment_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING id`,
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
              const productName = line.detailItem?.itemName || line.itemName || line.Name || line.itemName || line.name || line.InvoicedQuantity?.['@_unitCode'] || 'Bilinmeyen Ürün';
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
              const prodMatch = await pool.query(
                "SELECT id FROM products WHERE store_id = $1 AND (LOWER(name) = LOWER($2) OR barcode = $3)",
                [storeId, productName, productName]
              );
              
              const productId = prodMatch.rows.length > 0 ? prodMatch.rows[0].id : null;

              await pool.query(
                `INSERT INTO purchase_invoice_items 
                 (purchase_invoice_id, product_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price, unit_code) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [newInvoiceId, productId, productName, qty, up, tr, taxAmount, lineTotal, unitCode]
              );
              
              // If product exists, update its stock automatically
              if (productId) {
                await pool.query(
                  "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2",
                  [qty, productId]
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
    console.error("Sync Inbox endpoint error:", error);
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

    const invoiceRes = await pool.query("SELECT ettn, document_number FROM purchase_invoices WHERE id = $1 AND store_id = $2", [invoiceId, storeId]);
    if (invoiceRes.rows.length === 0) return res.status(404).json({ error: "Fatura bulunamadı." });

    const { ettn, document_number } = invoiceRes.rows[0];
    if (!ettn && !document_number) return res.status(400).json({ error: "Faturanın ETTN'si veya numarası bulunmuyor." });

    const service = await getEInvoiceService(storeId);
    
    if ('getInvoiceHtml' in service) {
      const html = await (service as any).getInvoiceHtml(ettn, document_number);
      return res.json({ html });
    }

    res.status(400).json({ error: "Kullandığınız entegratör için HTML önizleme desteği bulunmuyor." });
  } catch (error: any) {
    console.error("Get HTML endpoint error:", error);
    res.status(500).json({ error: error.message || "Bilinmeyen bir hata oluştu" });
  }
});

export default router;
