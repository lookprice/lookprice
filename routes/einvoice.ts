import express from "express";
import crypto from "crypto";
import { pool } from "../models/db";
import { authenticate } from "../middleware/auth";
import { MySoftService } from "../src/services/backend/mysoftService";
import { UNIT_CODES, TAX_CODES } from "../src/lib/ubl-codes";

const router = express.Router();

// Get the E-Invoice service instance based on Store Settings
const getEInvoiceService = async (storeId: number) => {
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

    // Construct UBL JSON Data matching MySoft standard payload
    const ublData = {
       Id: invoice.document_number, 
       Uuid: invoice.ettn,
       ProfileId: invoice.e_document_type === 'E-FATURA' ? 'TICARIFATURA' : 'EARSIVFATURA',
       InvoiceTypeCode: 'SATIS',
       DocumentCurrencyCode: invoice.currency || 'TRY',
       IssueDate: formattedDate,
       IssueTime: formattedTime,
       Notes: [(invoice.notes || ""), invoice.waybill_number ? `İrsaliye No: ${invoice.waybill_number}` : ""].filter(Boolean),
       
       SenderAlias: settings.sender_alias || 'urn:mail:defaultgb@default.com',
       ReceiverAlias: settings.receiver_alias || 'urn:mail:defaultpk@default.com',
       TenantId: settings.tenant_id,
       
       Receiver: {
          VknTckn: taxNumber.replace(/\D/g, ''),
          Title: isCorporate ? customerTitle : undefined,
          Name: !isCorporate ? name : undefined,
          Surname: !isCorporate ? surname : undefined,
          TaxOffice: isCorporate ? taxOffice : undefined,
          Address: {
             Room: "",
             StreetName: address,
             CityName: "Bilinmeyen",
             CountryName: "Türkiye"
          }
       },

       LineExtensionAmount: Lines.reduce((sum, line) => sum + line.LineExtensionAmount, 0),
       TaxExclusiveAmount: Lines.reduce((sum, line) => sum + line.LineExtensionAmount, 0),
       TaxInclusiveAmount: Lines.reduce((sum, line) => sum + line.LineExtensionAmount + line.Taxes[0].TaxAmount, 0),
       PayableAmount: Lines.reduce((sum, line) => sum + line.LineExtensionAmount + line.Taxes[0].TaxAmount, 0),
       
       Lines: Lines
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
    // Process and insert them into purchase_invoices
    for (const inv of incomingInvoices) {
       // Check if invoice already exists via ETTN or Document Number
       const existing = await pool.query(
         "SELECT id FROM purchase_invoices WHERE store_id = $1 AND (ettn = $2 OR document_number = $3)", 
         [storeId, inv.ettn, inv.documentNumber]
       );
 
       if (existing.rows.length === 0) {
          // 1. Find or create company
          let companyId = null;
          if (inv.senderVkn) {
            const compRes = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND tax_number = $2", [storeId, inv.senderVkn]);
            if (compRes.rows.length > 0) {
              companyId = compRes.rows[0].id;
            } else {
              // Create company
              const newComp = await pool.query(
                "INSERT INTO companies (store_id, title, tax_number, address) VALUES ($1, $2, $3, $4) RETURNING id",
                [storeId, inv.senderTitle || 'Bilinmeyen Tedarikçi', inv.senderVkn, 'Otomatik Oluşturuldu']
              );
              companyId = newComp.rows[0].id;
            }
          }

          // 2. Insert invoice
          const invInsertRes = await pool.query(
            `INSERT INTO purchase_invoices 
            (store_id, company_id, invoice_number, document_number, ettn, e_document_type, supplier_name, tax_number, invoice_date, total_amount, grand_total, currency, status, integration_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
            [
              storeId, 
              companyId,
              inv.documentNumber || `IN-${Date.now()}`, 
              inv.documentNumber, 
              inv.ettn, 
              inv.documentType || 'E-FATURA', 
              inv.senderTitle || 'Bilinmeyen Tedarikçi',
              inv.senderVkn,
              inv.issueDate || new Date().toISOString(),
              inv.payableAmount || 0,
              inv.payableAmount || 0,
              inv.currency || 'TRY',
              'approved', 
              'RECEIVED'
            ]
          );
          
          const newInvoiceId = invInsertRes.rows[0].id;

          // 3. Attempt to parse lines if present in raw data
          // MySoft returns items in different fields depending on the response depth.
          const rawData = inv.raw || {};
          const rawLines = rawData.InvoiceLines || rawData.lines || rawData.InvoiceLine || rawData.Lines || [];
          
          if (Array.isArray(rawLines)) {
            for (const line of rawLines) {
              const productName = line.Name || line.itemName || line.name || line.InvoicedQuantity?.['@_unitCode'] || 'Bilinmeyen Ürün';
              const qtyRaw = line.Quantity || line.quantity || line.InvoicedQuantity?.['#text'] || line.InvoicedQuantity || 0;
              const qty = Number(qtyRaw) || 0;
              
              const upRaw = line.Price?.PriceAmount?.['#text'] || line.Price?.PriceAmount || line.Price || line.unitPrice || line.unit_price || 0;
              const up = Number(upRaw) || 0;
              
              const trRaw = line.TaxTotal?.TaxSubtotal?.Percent?.['#text'] || line.TaxTotal?.TaxSubtotal?.Percent || line.TaxRate || line.taxRate || line.tax_rate || 0;
              const tr = Number(trRaw) || 0;
              
              const lineTotal = qty * up;
              const taxAmount = (lineTotal * tr) / 100;

              await pool.query(
                `INSERT INTO purchase_invoice_items 
                 (purchase_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [newInvoiceId, productName, qty, up, tr, taxAmount, lineTotal + taxAmount]
              );
            }
          }

          // 4. Create Transaction
          if (companyId) {
            await pool.query(
              `INSERT INTO current_account_transactions 
                (store_id, company_id, purchase_invoice_id, type, amount, currency, description, transaction_date) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [storeId, companyId, newInvoiceId, 'credit', inv.payableAmount || 0, inv.currency || 'TRY', `E-Fatura İçe Aktarma: ${inv.documentNumber}`, inv.issueDate || new Date()]
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

export default router;
