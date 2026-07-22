import express from "express";
import { pool, addStockMovement } from "../../models/db";
import { getEInvoiceService } from "../einvoice";
import { getTurkishSearchSnippet, normalizeTurkishParam } from "./utils";

const router = express.Router();

// --- Sales Invoices ---

router.get("/sales", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { startDate, endDate, status, search } = req.query;

    let query = `
      SELECT DISTINCT si.*, 
             c.title as company_title,
             cust.full_name as customer_name,
             s.customer_name as sale_customer_name
      FROM sales_invoices si 
      LEFT JOIN companies c ON si.company_id = c.id 
      LEFT JOIN customers cust ON si.customer_id = cust.id
      LEFT JOIN sales s ON si.sale_id = s.id
      LEFT JOIN sales_invoice_items sii ON si.id = sii.sales_invoice_id
      WHERE si.store_id = $1
    `;
    const params: any[] = [storeId];

    if (startDate) {
      params.push(startDate);
      query += ` AND si.invoice_date >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate + ' 23:59:59');
      query += ` AND si.invoice_date <= $${params.length}`;
    }
    if (status && status !== 'all') {
      params.push(status);
      query += ` AND si.status = $${params.length}`;
    }
    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
      searchTerms.forEach(term => {
        const pLen = params.length + 1;
        query += ` AND (
          ${getTurkishSearchSnippet('si.invoice_number', pLen)} OR 
          ${getTurkishSearchSnippet('si.document_number', pLen)} OR
          ${getTurkishSearchSnippet('si.ettn', pLen)} OR
          ${getTurkishSearchSnippet('si.notes', pLen)} OR
          ${getTurkishSearchSnippet('si.waybill_number', pLen)} OR
          ${getTurkishSearchSnippet('si.tax_number', pLen)} OR
          ${getTurkishSearchSnippet('c.title', pLen)} OR
          ${getTurkishSearchSnippet('cust.full_name', pLen)} OR
          ${getTurkishSearchSnippet('s.customer_name', pLen)} OR
          ${getTurkishSearchSnippet('sii.product_name', pLen)}
        )`;
        params.push(normalizeTurkishParam(term));
      });
    }

    query += " ORDER BY si.invoice_date DESC, si.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/sales/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const invoiceResult = await pool.query(
      `SELECT si.*, 
              c.title as company_title,
              c.tax_number as company_tax_number,
              c.tax_office as company_tax_office,
              c.address as company_address,
              c.email as company_email,
              cust.full_name as customer_name,
              cust.tax_number as customer_tax_number,
              cust.tax_office as customer_tax_office,
              cust.address as customer_address,
              cust.email as customer_email_fallback
       FROM sales_invoices si 
       LEFT JOIN companies c ON si.company_id = c.id 
       LEFT JOIN customers cust ON si.customer_id = cust.id
       WHERE si.id = $1 AND si.store_id = $2`,
      [req.params.id, storeId]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    
    const itemsResult = await pool.query(
      "SELECT * FROM sales_invoice_items WHERE sales_invoice_id = $1",
      [req.params.id]
    );
    
    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;

    if (invoice.company_id) {
      invoice.tax_number = invoice.tax_number || invoice.company_tax_number;
      invoice.tax_office = invoice.tax_office || invoice.company_tax_office;
      invoice.address = invoice.address || invoice.company_address;
      invoice.customer_email = invoice.customer_email || invoice.company_email;
    } else if (invoice.customer_id) {
      invoice.tax_number = invoice.tax_number || invoice.customer_tax_number;
      invoice.tax_office = invoice.tax_office || invoice.customer_tax_office;
      invoice.address = invoice.address || invoice.customer_address;
      invoice.customer_email = invoice.customer_email || invoice.customer_email_fallback;
    }
    
    res.json(invoice);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/sales", async (req: any, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { 
      storeId: bodyStoreId, 
      sale_id,
      quotation_id,
      company_id, 
      customer_id, 
      invoice_number, 
      waybill_number,
      invoice_date, 
      invoice_time,
      items, 
      notes, 
      currency, 
      exchange_rate,
      payment_method,
      invoice_type,
      invoice_profile,
      status,
      is_tax_inclusive,
      e_document_type: req_e_document_type,
      tax_number: req_tax_number,
      tax_office,
      address,
      customer_email,
      gi_invoice_type,
      gi_exemption_reason_code,
      gi_withholding_tax_code
    } = req.body;
    
    let storeId = req.user.store_id;
    if (req.user.role === "superadmin" && bodyStoreId) {
      storeId = bodyStoreId;
    }

    if (!storeId) throw new Error("Store ID is required");

    const finalIsTaxInclusive = is_tax_inclusive !== undefined ? is_tax_inclusive : true;

    const storeRes = await client.query("SELECT branding, einvoice_settings FROM stores WHERE id = $1", [storeId]);
    const branding = storeRes.rows[0]?.branding || {};
    const einvoiceSettings = storeRes.rows[0]?.einvoice_settings || { is_active: false };
    
    let e_document_type = req_e_document_type || null;

    if (invoice_type === 'TEMELFATURA' || invoice_type === 'TICARIFATURA' || invoice_profile === 'TEMELFATURA' || invoice_profile === 'TICARIFATURA') {
      e_document_type = 'E-FATURA';
    } else if (invoice_type === 'EARSIVFATURA' || invoice_profile === 'EARSIVFATURA') {
      e_document_type = 'E-ARŞİV';
    }
    
    let tax_number = null;
    
    if (einvoiceSettings.is_active && !e_document_type) {
      if (company_id) {
         const cRes = await client.query("SELECT tax_number FROM companies WHERE id = $1", [company_id]);
         if (cRes.rows.length) tax_number = cRes.rows[0].tax_number;
      } else if (customer_id) {
         const cRes = await client.query("SELECT tax_number FROM customers WHERE id = $1", [customer_id]);
         if (cRes.rows.length) tax_number = cRes.rows[0].tax_number;
      }

      if (tax_number) {
         try {
           const { MySoftService } = await import("../../src/services/backend/mysoftService");
           const mysoft = new MySoftService(einvoiceSettings);
           const taxResult = await mysoft.checkTaxpayer(tax_number);
           e_document_type = taxResult.documentType === 'E-ARSIV' ? 'E-ARŞİV' : taxResult.documentType; 
         } catch (err) {
           console.error("E-Invoice check failed during invoice creation", err);
           e_document_type = 'E-ARŞİV'; 
         }
      } else {
         e_document_type = 'E-ARŞİV'; 
      }
    } else if (e_document_type === 'E-ARSIV') {
      e_document_type = 'E-ARŞİV';
    }
    
    let total_amount = 0; 
    let tax_amount = 0;
    let grand_total = 0;
    
    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      
      if (finalIsTaxInclusive) {
        const itemTotalIncl = qty * price;
        const lineExtensionAmount = itemTotalIncl / (1 + (taxRate / 100));
        const lineTax = itemTotalIncl - lineExtensionAmount;
        
        total_amount += lineExtensionAmount;
        tax_amount += lineTax;
        grand_total += itemTotalIncl;
      } else {
        const lineExtensionAmount = qty * price;
        const lineTax = (lineExtensionAmount * taxRate) / 100;
        const itemTotalIncl = lineExtensionAmount + lineTax;
        
        total_amount += lineExtensionAmount;
        tax_amount += lineTax;
        grand_total += itemTotalIncl;
      }
    }
    
    const invoiceResult = await client.query(
      `INSERT INTO sales_invoices 
        (store_id, sale_id, company_id, customer_id, invoice_number, waybill_number, invoice_date, invoice_time, total_amount, tax_amount, grand_total, currency, exchange_rate, notes, invoice_type, status, payment_method, quotation_id, e_document_type, invoice_profile, is_tax_inclusive, customer_email, tax_number, tax_office, address, gi_invoice_type, gi_exemption_reason_code, gi_withholding_tax_code) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28) RETURNING id`,
      [
        storeId, 
        sale_id || null, 
        company_id || null, 
        customer_id || null, 
        invoice_number, 
        waybill_number || null, 
        invoice_date || new Date(), 
        invoice_time || new Date().toLocaleTimeString('tr-TR', { hour12: false }),
        total_amount, 
        tax_amount, 
        grand_total, 
        currency || branding?.default_currency || 'TRY', 
        exchange_rate || 1, 
        notes, 
        invoice_type || 'manual', 
        status || 'draft', 
        payment_method || 'cash', 
        quotation_id || null, 
        e_document_type, 
        invoice_profile || (e_document_type === 'E-FATURA' ? 'TICARIFATURA' : 'EARSIVFATURA'), 
        finalIsTaxInclusive,
        req.body.customer_email || null,
        req.body.tax_number || tax_number || null,
        req.body.tax_office || null,
        req.body.address || null,
        req.body.gi_invoice_type || 'SATIS',
        req.body.gi_exemption_reason_code || null,
        req.body.gi_withholding_tax_code || null
      ]
    );
    
    const invoiceId = invoiceResult.rows[0].id;

    const currentTaxNum = req.body.tax_number || null;
    const currentTaxOffice = req.body.tax_office || null;
    const currentAddress = req.body.address || null;
    const currentEmail = req.body.customer_email || null;

    if (company_id) {
      const compRes = await client.query("SELECT * FROM companies WHERE id = $1", [company_id]);
      if (compRes.rows.length > 0) {
        const comp = compRes.rows[0];
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let valIdx = 1;

        if (currentTaxNum && (!comp.tax_number || comp.tax_number.trim() === "")) {
          updateFields.push(`tax_number = $${valIdx++}`);
          updateValues.push(currentTaxNum);
        }
        if (currentTaxOffice && (!comp.tax_office || comp.tax_office.trim() === "")) {
          updateFields.push(`tax_office = $${valIdx++}`);
          updateValues.push(currentTaxOffice);
        }
        if (currentAddress && (!comp.address || comp.address.trim() === "")) {
          updateFields.push(`address = $${valIdx++}`);
          updateValues.push(currentAddress);
        }
        if (currentEmail && (!comp.email || comp.email.trim() === "")) {
          updateFields.push(`email = $${valIdx++}`);
          updateValues.push(currentEmail);
        }

        if (updateFields.length > 0) {
          updateValues.push(company_id);
          await client.query(
            `UPDATE companies SET ${updateFields.join(', ')} WHERE id = $${valIdx}`,
            updateValues
          );
        }
      }
    } else if (customer_id) {
      const custRes = await client.query("SELECT * FROM customers WHERE id = $1", [customer_id]);
      if (custRes.rows.length > 0) {
        const cust = custRes.rows[0];
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let valIdx = 1;

        if (currentTaxNum && (!cust.tax_number || cust.tax_number.trim() === "")) {
          updateFields.push(`tax_number = $${valIdx++}`);
          updateValues.push(currentTaxNum);
        }
        if (currentTaxOffice && (!cust.tax_office || cust.tax_office.trim() === "")) {
          updateFields.push(`tax_office = $${valIdx++}`);
          updateValues.push(currentTaxOffice);
        }
        if (currentAddress && (!cust.address || cust.address.trim() === "")) {
          updateFields.push(`address = $${valIdx++}`);
          updateValues.push(currentAddress);
        }
        if (currentEmail && (!cust.email || cust.email.trim() === "")) {
          updateFields.push(`email = $${valIdx++}`);
          updateValues.push(currentEmail);
        }

        if (updateFields.length > 0) {
          updateValues.push(customer_id);
          await client.query(
            `UPDATE customers SET ${updateFields.join(', ')} WHERE id = $${valIdx}`,
            updateValues
          );
        }
      }
    }
    
    let displayName = 'Müşteri';
    if (company_id) {
      const companyRes = await client.query("SELECT title FROM companies WHERE id = $1", [company_id]);
      if (companyRes.rows.length > 0) displayName = companyRes.rows[0].title;
    } else if (customer_id) {
      const custRes = await client.query("SELECT full_name FROM customers WHERE id = $1", [customer_id]);
      if (custRes.rows.length > 0) displayName = custRes.rows[0].full_name;
    }

    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      
      let itemTax = 0;
      let itemTotal = 0; 

      if (finalIsTaxInclusive) {
        const itemTotalIncl = qty * price;
        itemTotal = itemTotalIncl / (1 + (taxRate / 100));
        itemTax = itemTotalIncl - itemTotal;
      } else {
        itemTotal = qty * price;
        itemTax = (itemTotal * taxRate) / 100;
      }
      
      await client.query(
        `INSERT INTO sales_invoice_items 
          (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [invoiceId, item.product_id || null, item.product_name, item.barcode || '', item.quantity, item.unit_price, item.tax_rate, itemTax, itemTotal]
      );
      
      if (item.product_id) {
        const productRes = await client.query("SELECT product_type FROM products WHERE id = $1", [item.product_id]);
        const productType = productRes.rows.length > 0 ? productRes.rows[0].product_type : 'product';

        if (productType !== 'service') {
          await client.query(
            "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
            [item.quantity, item.product_id, storeId]
          );
          
          await addStockMovement(client, storeId, item.product_id, 'out', item.quantity, 'sales_invoice', `Satış Faturası: ${invoice_number}`, item.unit_price, displayName, currency);
        }
      }
    }
    
    if (company_id && status !== 'draft') {
      if (quotation_id || sale_id) {
        await client.query("DELETE FROM current_account_transactions WHERE (quotation_id = $1 OR sale_id = $2) AND sales_invoice_id IS NULL", [quotation_id || null, sale_id || null]);
      }

      const storeRes = await client.query("SELECT * FROM stores WHERE id = $1", [storeId]);
      const store = storeRes.rows[0];
      const branding = store?.branding || {};
      const defaultCurrency = store?.default_currency || branding?.default_currency || 'TRY';

      await client.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, transaction_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [storeId, company_id, invoiceId, 'debt', grand_total, currency || defaultCurrency, exchange_rate || 1, `Satış Faturası: ${invoice_number}`, invoice_date || new Date()]
      );

      if (payment_method && payment_method !== 'term') {
        await client.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [storeId, company_id, invoiceId, 'credit', grand_total, currency || defaultCurrency, exchange_rate || 1, `Satış Faturası Tahsilatı: ${invoice_number} (${payment_method})`, payment_method, invoice_date || new Date()]
        );
      }
    }
    
    await client.query("COMMIT");
    res.json({ success: true, id: invoiceId });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.put("/sales/:id", async (req: any, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
    const { 
      company_id, customer_id, invoice_number, waybill_number, invoice_date, invoice_time,
      notes, items, payment_method, currency, exchange_rate, 
      invoice_type, invoice_profile, status, is_tax_inclusive,
      tax_number, tax_office, address,
      gi_invoice_type, gi_exemption_reason_code, gi_withholding_tax_code
    } = req.body;

    const finalIsTaxInclusive = is_tax_inclusive !== undefined ? is_tax_inclusive : true;

    const oldInvoiceResult = await client.query(
      "SELECT * FROM sales_invoices WHERE id = $1 AND store_id = $2",
      [req.params.id, storeId]
    );
    
    if (oldInvoiceResult.rows.length === 0) throw new Error("Invoice not found");
    
    const oldInvoice = oldInvoiceResult.rows[0];
    const oldItemsResult = await client.query(
      "SELECT * FROM sales_invoice_items WHERE sales_invoice_id = $1",
      [req.params.id]
    );
    
    let displayName = 'Müşteri';
    if (company_id) {
      const companyRes = await client.query("SELECT title FROM companies WHERE id = $1", [company_id]);
      if (companyRes.rows.length > 0) displayName = companyRes.rows[0].title;
    } else if (customer_id) {
      const custRes = await client.query("SELECT full_name FROM customers WHERE id = $1", [customer_id]);
      if (custRes.rows.length > 0) displayName = custRes.rows[0].full_name;
    }

    for (const item of oldItemsResult.rows) {
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, storeId]
        );
      }
    }
    
    await client.query("DELETE FROM stock_movements WHERE source = 'sales_invoice' AND (description LIKE $1 OR description LIKE $2 OR description LIKE $3)", [`%${oldInvoice.invoice_number}%`, `%${oldInvoice.invoice_number}%`, `%${oldInvoice.invoice_number}%`]);

    await client.query("DELETE FROM sales_invoice_items WHERE sales_invoice_id = $1", [req.params.id]);
    await client.query("DELETE FROM current_account_transactions WHERE sales_invoice_id = $1", [req.params.id]);

    if (oldInvoice.quotation_id || oldInvoice.sale_id) {
       await client.query("DELETE FROM current_account_transactions WHERE (quotation_id = $1 OR sale_id = $2) AND sales_invoice_id IS NULL", [oldInvoice.quotation_id || null, oldInvoice.sale_id || null]);
    }

    let total_amount = 0; 
    let tax_amount = 0;
    let grand_total = 0;
    
    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      
      if (finalIsTaxInclusive) {
        const itemTotalIncl = qty * price;
        const lineExtensionAmount = itemTotalIncl / (1 + (taxRate / 100));
        const lineTax = itemTotalIncl - lineExtensionAmount;
        
        total_amount += lineExtensionAmount;
        tax_amount += lineTax;
        grand_total += itemTotalIncl;
      } else {
        const lineExtensionAmount = qty * price;
        const lineTax = (lineExtensionAmount * taxRate) / 100;
        const itemTotalIncl = lineExtensionAmount + lineTax;
        
        total_amount += lineExtensionAmount;
        tax_amount += lineTax;
        grand_total += itemTotalIncl;
      }
    }
    
    const storeResAuto = await client.query("SELECT branding, einvoice_settings FROM stores WHERE id = $1", [storeId]);
    const einvoiceSettings = storeResAuto.rows[0]?.einvoice_settings || { is_active: false };
    
    let e_document_type = req.body.e_document_type || oldInvoice.e_document_type; 
    
    if (invoice_type === 'TEMELFATURA' || invoice_type === 'TICARIFATURA' || invoice_profile === 'TEMELFATURA' || invoice_profile === 'TICARIFATURA') {
      e_document_type = 'E-FATURA';
    } else if (invoice_type === 'EARSIVFATURA' || invoice_profile === 'EARSIVFATURA') {
      e_document_type = 'E-ARŞİV';
    }

    if (einvoiceSettings.is_active && !req.body.e_document_type && !e_document_type) {
      let tax_number = null;
      if (company_id) {
         const cRes = await client.query("SELECT tax_number FROM companies WHERE id = $1", [company_id]);
         if (cRes.rows.length) tax_number = cRes.rows[0].tax_number;
      } else if (customer_id) {
         const cRes = await client.query("SELECT tax_number FROM customers WHERE id = $1", [customer_id]);
         if (cRes.rows.length) tax_number = cRes.rows[0].tax_number;
      }

      if (tax_number) {
         try {
           const { MySoftService } = await import("../../src/services/backend/mysoftService");
           const mysoft = new MySoftService(einvoiceSettings);
           const taxResult = await mysoft.checkTaxpayer(tax_number);
           e_document_type = taxResult.documentType === 'E-ARSIV' ? 'E-ARŞİV' : taxResult.documentType; 
         } catch (err) {
           console.error("E-Invoice check failed during invoice update", err);
           e_document_type = 'E-ARŞİV'; 
         }
      } else {
         e_document_type = 'E-ARŞİV';
      }
    } else if (e_document_type === 'E-ARSIV') {
      e_document_type = 'E-ARŞİV';
    }

    await client.query(
      `UPDATE sales_invoices 
       SET company_id = $1, customer_id = $2, invoice_number = $3, waybill_number = $4, invoice_date = $5, 
           total_amount = $6, tax_amount = $7, grand_total = $8, currency = $9, exchange_rate = $10, 
           notes = $11, payment_method = $12, invoice_type = $13, status = $14, e_document_type = $15, 
           invoice_profile = $16, is_tax_inclusive = $17,
        customer_email = $18,
        tax_number = $19, tax_office = $20, address = $21,
        gi_invoice_type = $22, gi_exemption_reason_code = $23, gi_withholding_tax_code = $24,
        invoice_time = $25
    WHERE id = $26 AND store_id = $27`,
    [
      company_id || null, customer_id || null, invoice_number, waybill_number || null, invoice_date, 
      total_amount, tax_amount, grand_total, currency || 'TRY', exchange_rate || 1, 
      notes, payment_method, invoice_type, status, e_document_type, 
      invoice_profile || (e_document_type === 'E-FATURA' ? 'TICARIFATURA' : 'EARSIVFATURA'), 
      finalIsTaxInclusive,
      req.body.customer_email || null,
      req.body.tax_number || null, tax_office || null, address || null,
      gi_invoice_type || 'SATIS', gi_exemption_reason_code || null, gi_withholding_tax_code || null,
      invoice_time || null,
      req.params.id, storeId
    ]
    );

    const currentTaxNum = tax_number || null;
    const currentTaxOffice = tax_office || null;
    const currentAddress = address || null;
    const currentEmail = req.body.customer_email || null;

    if (company_id) {
      const compRes = await client.query("SELECT * FROM companies WHERE id = $1", [company_id]);
      if (compRes.rows.length > 0) {
        const comp = compRes.rows[0];
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let valIdx = 1;

        if (currentTaxNum && (!comp.tax_number || comp.tax_number.trim() === "")) {
          updateFields.push(`tax_number = $${valIdx++}`);
          updateValues.push(currentTaxNum);
        }
        if (currentTaxOffice && (!comp.tax_office || comp.tax_office.trim() === "")) {
          updateFields.push(`tax_office = $${valIdx++}`);
          updateValues.push(currentTaxOffice);
        }
        if (currentAddress && (!comp.address || comp.address.trim() === "")) {
          updateFields.push(`address = $${valIdx++}`);
          updateValues.push(currentAddress);
        }
        if (currentEmail && (!comp.email || comp.email.trim() === "")) {
          updateFields.push(`email = $${valIdx++}`);
          updateValues.push(currentEmail);
        }

        if (updateFields.length > 0) {
          updateValues.push(company_id);
          await client.query(
            `UPDATE companies SET ${updateFields.join(', ')} WHERE id = $${valIdx}`,
            updateValues
          );
        }
      }
    } else if (customer_id) {
      const custRes = await client.query("SELECT * FROM customers WHERE id = $1", [customer_id]);
      if (custRes.rows.length > 0) {
        const cust = custRes.rows[0];
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let valIdx = 1;

        if (currentTaxNum && (!cust.tax_number || cust.tax_number.trim() === "")) {
          updateFields.push(`tax_number = $${valIdx++}`);
          updateValues.push(currentTaxNum);
        }
        if (currentTaxOffice && (!cust.tax_office || cust.tax_office.trim() === "")) {
          updateFields.push(`tax_office = $${valIdx++}`);
          updateValues.push(currentTaxOffice);
        }
        if (currentAddress && (!cust.address || cust.address.trim() === "")) {
          updateFields.push(`address = $${valIdx++}`);
          updateValues.push(currentAddress);
        }
        if (currentEmail && (!cust.email || cust.email.trim() === "")) {
          updateFields.push(`email = $${valIdx++}`);
          updateValues.push(currentEmail);
        }

        if (updateFields.length > 0) {
          updateValues.push(customer_id);
          await client.query(
            `UPDATE customers SET ${updateFields.join(', ')} WHERE id = $${valIdx}`,
            updateValues
          );
        }
      }
    }

    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const taxRate = Number(item.tax_rate) || 0;
      
      let itemTax = 0;
      let itemTotal = 0; 

      if (finalIsTaxInclusive) {
        const itemTotalIncl = qty * price;
        itemTotal = itemTotalIncl / (1 + (taxRate / 100));
        itemTax = itemTotalIncl - itemTotal;
      } else {
        itemTotal = qty * price;
        itemTax = (itemTotal * taxRate) / 100;
      }
      
      await client.query(
        `INSERT INTO sales_invoice_items 
          (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [req.params.id, item.product_id || null, item.product_name, item.barcode || '', item.quantity, item.unit_price, item.tax_rate, itemTax, itemTotal]
      );
      
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, storeId]
        );
        await addStockMovement(client, storeId, item.product_id, 'out', item.quantity, 'sales_invoice', `Satış Faturası (Güncellendi): ${invoice_number}`, item.unit_price, displayName, currency);
      }
    }

    if (company_id && status !== 'draft') {
      const storeRes = await client.query("SELECT * FROM stores WHERE id = $1", [storeId]);
      const store = storeRes.rows[0];
      const branding = store?.branding || {};
      const defaultCurrency = store?.default_currency || branding?.default_currency || 'TRY';

      await client.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, transaction_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [storeId, company_id, req.params.id, 'debt', grand_total, currency || defaultCurrency, exchange_rate || 1, `Satış Faturası: ${invoice_number}`, invoice_date || new Date()]
      );

      if (payment_method && payment_method !== 'term') {
        await client.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, sales_invoice_id, type, amount, currency, exchange_rate, description, payment_method, transaction_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [storeId, company_id, req.params.id, 'credit', grand_total, currency || defaultCurrency, exchange_rate || 1, `Satış Faturası Tahsilatı: ${invoice_number} (${payment_method})`, payment_method, invoice_date || new Date()]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.post("/sales/:id/create-from-sale", async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const saleRes = await client.query("SELECT * FROM sales WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (saleRes.rows.length === 0) throw new Error("Sale not found");
    const sale = saleRes.rows[0];

    const itemsRes = await client.query("SELECT * FROM sale_items WHERE sale_id = $1", [id]);
    
    let total_amount = 0;
    let tax_amount = 0;
    let grand_total = 0;

    const invoiceItems = [];
    for (const item of itemsRes.rows) {
      let taxRate = 20; 
      if (item.product_id) {
        const prodRes = await client.query("SELECT tax_rate FROM products WHERE id = $1", [item.product_id]);
        if (prodRes.rows.length > 0) taxRate = Number(prodRes.rows[0].tax_rate || 20);
      }

      const kdvDahilTotal = Number(item.quantity) * Number(item.unit_price);
      const kdvHaricTotal = kdvDahilTotal / (1 + taxRate / 100);
      const itemTax = kdvDahilTotal - kdvHaricTotal;
      
      total_amount += kdvHaricTotal;
      tax_amount += itemTax;
      grand_total += kdvDahilTotal;

      const kdvHaricPrice = Number(item.unit_price) / (1 + taxRate / 100);

      invoiceItems.push({
        product_id: item.product_id,
        product_name: item.product_name,
        barcode: item.barcode,
        quantity: item.quantity,
        unit_price: kdvHaricPrice,
        tax_rate: taxRate,
        tax_amount: itemTax,
        total_price: kdvHaricTotal
      });
    }

    const invoiceResult = await client.query(
      `INSERT INTO sales_invoices 
        (store_id, sale_id, company_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, exchange_rate, notes, invoice_type, status, payment_method, is_tax_inclusive, payment_method, payment_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
      [storeId, id, sale.company_id || null, sale.customer_id || null, `INV-${Date.now()}`, new Date(), total_amount, tax_amount, grand_total, sale.currency || 'TRY', sale.exchange_rate || 1, `Satış #${id} üzerinden oluşturuldu.`, 'manual', 'draft', sale.payment_method || 'cash', true]
    );

    const invoiceId = invoiceResult.rows[0].id;

    for (const item of invoiceItems) {
      await client.query(
        `INSERT INTO sales_invoice_items 
          (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [invoiceId, item.product_id, item.product_name, item.barcode, item.quantity, item.unit_price, item.tax_rate, item.tax_amount, item.total_price]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, invoiceId });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// --- Purchase Invoices ---

router.get("/purchase", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { search, startDate, endDate } = req.query;

    let query = `
      SELECT DISTINCT pi.*, c.title as company_name 
      FROM purchase_invoices pi 
      LEFT JOIN companies c ON pi.company_id = c.id 
      LEFT JOIN purchase_invoice_items pii ON pi.id = pii.purchase_invoice_id
      WHERE pi.store_id = $1
    `;
    const params: any[] = [storeId];

    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
      searchTerms.forEach(term => {
        const pLen = params.length + 1;
        query += ` AND (
          ${getTurkishSearchSnippet('pi.invoice_number', pLen)} OR 
          ${getTurkishSearchSnippet('pi.document_number', pLen)} OR
          ${getTurkishSearchSnippet('pi.supplier_name', pLen)} OR
          ${getTurkishSearchSnippet('pi.ettn', pLen)} OR
          ${getTurkishSearchSnippet('pi.notes', pLen)} OR
          ${getTurkishSearchSnippet('pi.waybill_number', pLen)} OR
          ${getTurkishSearchSnippet('pi.tax_number', pLen)} OR
          ${getTurkishSearchSnippet('c.title', pLen)} OR
          ${getTurkishSearchSnippet('pii.product_name', pLen)}
        )`;
        params.push(normalizeTurkishParam(term));
      });
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND pi.invoice_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate + ' 23:59:59');
      query += ` AND pi.invoice_date <= $${params.length}`;
    }

    query += ` ORDER BY pi.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/purchase/:id", async (req: any, res) => {
  try {
    let query = `
      SELECT pi.*, c.title as company_name 
      FROM purchase_invoices pi 
      LEFT JOIN companies c ON pi.company_id = c.id 
      WHERE pi.id = $1
    `;
    let params = [req.params.id];
    if (req.user.role !== "superadmin") {
      query += " AND pi.store_id = $2";
      params.push(req.user.store_id);
    }
    
    const invoiceResult = await pool.query(query, params);
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    
    const invoice = invoiceResult.rows[0];
    
    let itemsResult = await pool.query(
      "SELECT * FROM purchase_invoice_items WHERE purchase_invoice_id = $1",
      [req.params.id]
    );
    
    let items = itemsResult.rows;

    if (invoice.ettn && (!items || items.length === 0 || (items.length === 1 && (items[0].product_name === 'Bilinmeyen Ürün' || items[0].product_name === 'Bilinmeyen' || items[0].barcode?.startsWith('AUTO-') || items[0].product_name?.includes('ZZ-KUR') || items[0].product_name?.includes('FARKI'))))) {
       try {
         const service = await getEInvoiceService(invoice.store_id);
         if (service) {
           const details = await service.getInvoiceDetailsByUuid(invoice.ettn);
           if (details) {
              let rawLines = details.detailList || details.InvoiceLines || details.lines || details.InvoiceLine || details.Lines || details.invoiceLines || [];
              if (rawLines && !Array.isArray(rawLines)) {
                rawLines = [rawLines];
              }
              if (Array.isArray(rawLines) && rawLines.length > 0) {
                 await pool.query("DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [invoice.id]);
                 
                 for (const line of rawLines) {
                   const productName = line.detailItem?.itemName || line.itemName || line.Item?.Name?.['#text'] || line.Item?.Name || line.Name || line.name || 'Bilinmeyen Ürün';
                   
                   let extractedCodeObj = line.detailItem?.buyersItemIdentificationId || line.detailItem?.sellersItemIdentificationId || line.detailItem?.buyersItemIdentification || line.detailItem?.sellersItemIdentification || line.Item?.StandardItemIdentification?.ID?.['#text'] || line.Item?.StandardItemIdentification?.ID || line.Item?.SellersItemIdentification?.ID?.['#text'] || line.Item?.SellersItemIdentification?.ID || line.Item?.BuyersItemIdentification?.ID?.['#text'] || line.Item?.BuyersItemIdentification?.ID || line.sellersItemIdentification || line.buyersItemIdentification;
                   let productBarcodeCode = typeof extractedCodeObj === 'string' ? extractedCodeObj.trim() : (typeof extractedCodeObj === 'number' ? String(extractedCodeObj) : null);
                   if (productBarcodeCode === '') productBarcodeCode = null;

                   const qtyRaw = line.invoicedQuantity || line.Quantity || line.quantity || line.InvoicedQuantity?.['#text'] || line.InvoicedQuantity || 1;
                   const qty = Number(String(qtyRaw).replace(',', '.')) || 1;
                   
                   const upRaw = line.unitPrice || line.Price?.PriceAmount?.['#text'] || line.Price?.PriceAmount || line.Price || line.unitPrice || line.unit_price || 0;
                   const up = Number(String(upRaw).replace(',', '.')) || 0;
                   
                   const trRaw = line.taxTotal?.taxSubtotalList?.[0]?.percent || line.TaxTotal?.TaxSubtotal?.Percent?.['#text'] || line.TaxTotal?.TaxSubtotal?.Percent || line.TaxRate || line.taxRate || line.tax_rate || 20;
                   const tr = Number(String(trRaw).replace(',', '.')) || 20;
                   
                   const lineTotal = qty * up;
                   const taxAmount = (lineTotal * tr) / 100;

                   let prodMatch;
                   if (productBarcodeCode) {
                      prodMatch = await pool.query(
                        "SELECT id, barcode FROM products WHERE store_id = $1 AND (LOWER(name) = LOWER($2) OR barcode = $3 OR barcode = $4)",
                        [invoice.store_id, productName, productName, productBarcodeCode]
                      );
                   } else {
                      prodMatch = await pool.query(
                        "SELECT id, barcode FROM products WHERE store_id = $1 AND (LOWER(name) = LOWER($2) OR barcode = $3)",
                        [invoice.store_id, productName, productName]
                      );
                   }
                   
                   let productId = prodMatch.rows.length > 0 ? prodMatch.rows[0].id : null;
                   let finalBarcode = prodMatch.rows.length > 0 ? prodMatch.rows[0].barcode : productBarcodeCode;

                   if (!productId) {
                     finalBarcode = productBarcodeCode ? productBarcodeCode : `AUTO-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                     const existingProd = await pool.query("SELECT id FROM products WHERE barcode = $1 AND store_id = $2", [finalBarcode, invoice.store_id]);
                     if (existingProd.rows.length > 0) {
                       productId = existingProd.rows[0].id;
                     } else {
                       const newProdRes = await pool.query(
                         `INSERT INTO products 
                          (store_id, name, barcode, price, cost_price, tax_rate, stock_quantity, currency, product_type, labels) 
                          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
                         [invoice.store_id, productName, finalBarcode, 0, up, tr, 0, invoice.currency || 'TRY', 'product', JSON.stringify(["yeni_fatura_urunu"])]
                       );
                       productId = newProdRes.rows[0].id;
                     }
                   }

                   await pool.query(
                     `INSERT INTO purchase_invoice_items 
                      (purchase_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                     [invoice.id, productId, productName, finalBarcode, qty, up, tr, taxAmount, lineTotal]
                   );

                   // Update stock if product exists
                   if (productId) {
                     const prodInfo = await pool.query("SELECT volume_ml, unit FROM products WHERE id = $1", [productId]);
                     const volMl = Number(prodInfo.rows[0]?.volume_ml) || 0;
                     const baseUnit = String(prodInfo.rows[0]?.unit || '').toLowerCase();
                     
                     let effectiveQty = qty;
                     let descExtra = "";
                     
                     if (volMl > 0 && ['ml', 'gr', 'g', 'cc'].includes(baseUnit)) {
                       const isLikelyBulk = /şişe|kasa|paket|bottle|case|pack|cl/i.test(productName);
                       if (isLikelyBulk) {
                         effectiveQty = qty * volMl;
                         descExtra = ` (${qty} x ${volMl}ml)`;
                       }
                     }

                     await pool.query(
                       "UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2, cost_currency = $3 WHERE id = $4",
                       [effectiveQty, up, invoice.currency || 'TRY', productId]
                     );
                     
                     await addStockMovement(
                       pool, 
                       invoice.store_id, 
                       productId, 
                       'in', 
                       effectiveQty, 
                       'purchase_invoice', 
                       `E-Fatura Detay Sorgulama: ${invoice.invoice_number}${descExtra}`, 
                       up, 
                       invoice.supplier_name || invoice.company_name, 
                       invoice.currency
                     );
                   }
                 }

                 const refetched = await pool.query(
                   "SELECT * FROM purchase_invoice_items WHERE purchase_invoice_id = $1",
                   [invoice.id]
                 );
                 items = refetched.rows;
              }
           }
         }
       } catch (err: any) {
         console.error("[ON-THE-FLY-ITEMS-SYNC] Error:", err);
       }
    }
    
    invoice.items = items;
    res.json(invoice);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/purchase", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const {
      invoice_number, invoice_date, company_id, waybill_number, tax_number, tax_office,
      address, total_amount, tax_amount, grand_total, currency, exchange_rate, notes,
      supplier_name, is_expense, expense_category, items, status, is_tax_inclusive,
      payment_method, payment_status
    } = req.body;

    const finalIsTaxInclusive = is_tax_inclusive === true || is_tax_inclusive === 'true';

    // Calculate total_amount, tax_amount, grand_total if they are 0 or not provided
    let calculatedTotalAmount = Number(total_amount) || 0;
    let calculatedTaxAmount = Number(tax_amount) || 0;
    let calculatedGrandTotal = Number(grand_total) || 0;

    if ((calculatedGrandTotal === 0 || calculatedTotalAmount === 0) && items && Array.isArray(items)) {
      let subtotal = 0;
      let taxTotal = 0;
      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        const taxRate = Number(item.tax_rate) || 0;
        
        if (finalIsTaxInclusive) {
          const itemTotalIncl = qty * price;
          const itemTotalExcl = itemTotalIncl / (1 + (taxRate / 100));
          const itemTax = itemTotalIncl - itemTotalExcl;
          subtotal += itemTotalExcl;
          taxTotal += itemTax;
        } else {
          const itemTotal = qty * price;
          const itemTax = itemTotal * (taxRate / 100);
          subtotal += itemTotal;
          taxTotal += itemTax;
        }
      }
      calculatedTotalAmount = Number(subtotal.toFixed(2));
      calculatedTaxAmount = Number(taxTotal.toFixed(2));
      calculatedGrandTotal = Number((subtotal + taxTotal).toFixed(2));
    }

    const invoiceRes = await pool.query(
      `INSERT INTO purchase_invoices 
       (store_id, company_id, invoice_number, waybill_number, tax_number, tax_office, address, 
        invoice_date, total_amount, tax_amount, grand_total, currency, exchange_rate, notes, 
        supplier_name, is_expense, expense_category, status, is_tax_inclusive, payment_method, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *`,
      [
        storeId, company_id || null, invoice_number || `P-${Date.now()}`, waybill_number || null,
        tax_number || null, tax_office || null, address || null, invoice_date || new Date(),
        calculatedTotalAmount, calculatedTaxAmount, calculatedGrandTotal, currency || 'TRY', exchange_rate || 1,
        notes || null, supplier_name || null, is_expense || false, expense_category || null, status || 'pending',
        finalIsTaxInclusive, payment_method || null, payment_status || 'unpaid'
      ]
    );

    const invoice = invoiceRes.rows[0];

    // Add transaction to current account if company exists
    if (company_id) {
      console.log(`Adding current account transaction for company ${company_id}, invoice ${invoice.id}, amount ${calculatedGrandTotal}`);
      const storeRes = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
      const store = storeRes.rows[0];
      const branding = store?.branding || {};
      const defaultCurrency = store?.default_currency || branding?.default_currency || 'TRY';

      await pool.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, transaction_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [storeId, company_id, invoice.id, 'credit', calculatedGrandTotal, currency || defaultCurrency, exchange_rate || 1, `Alış Faturası: ${invoice_number}`, invoice_date || new Date()]
      );
    }

    if (items && Array.isArray(items)) {
      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        const taxRate = Number(item.tax_rate) || 0;
        
        let itemTaxAmount = 0;
        let itemTotalPrice = 0;
        
        if (finalIsTaxInclusive) {
          const itemTotalIncl = qty * price;
          const itemTotalExcl = itemTotalIncl / (1 + (taxRate / 100));
          itemTaxAmount = itemTotalIncl - itemTotalExcl;
          itemTotalPrice = itemTotalExcl;
        } else {
          const itemTotalExcl = qty * price;
          itemTaxAmount = itemTotalExcl * (taxRate / 100);
          itemTotalPrice = itemTotalExcl;
        }

        await pool.query(
          `INSERT INTO purchase_invoice_items 
           (purchase_invoice_id, product_id, product_name, barcode, quantity, unit_code, system_quantity, system_unit_code, unit_price, tax_rate, tax_amount, total_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
          [
            invoice.id, item.product_id || null, item.product_name || 'Bilinmeyen Ürün', item.barcode || null,
            qty, item.unit_code || 'Adet', item.system_quantity || null, item.system_unit_code || null, price, taxRate, itemTaxAmount, itemTotalPrice
          ]
        );

        if (item.product_id) {
          const qtyToStock = item.system_quantity != null ? Number(item.system_quantity) : Number(item.quantity || 1);
          await pool.query(
            "UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2, cost_currency = $3 WHERE id = $4",
            [qtyToStock, item.unit_price || 0, currency || 'TRY', item.product_id]
          );
          
          await addStockMovement(
            pool, storeId, item.product_id, 'in', qtyToStock, 'purchase_invoice',
            `Fatura Girişi: ${invoice.invoice_number}`, item.unit_price || 0, supplier_name || 'Tedarikçi', currency
          );
        }
      }
    }

    res.status(201).json(invoice);
  } catch (e: any) {
    console.error("Error in POST /purchase:", e);
    res.status(400).json({ error: e.message });
  }
});

router.put("/purchase/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;
    const {
      invoice_number, invoice_date, company_id, waybill_number, tax_number, tax_office,
      address, total_amount, tax_amount, grand_total, currency, exchange_rate, notes,
      supplier_name, is_expense, expense_category, items, status, is_tax_inclusive,
      payment_method, payment_status
    } = req.body;

    const checkRes = await pool.query("SELECT id FROM purchase_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (checkRes.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });

    const finalIsTaxInclusive = is_tax_inclusive === true || is_tax_inclusive === 'true';

    // Calculate total_amount, tax_amount, grand_total if they are 0 or not provided
    let calculatedTotalAmount = Number(total_amount) || 0;
    let calculatedTaxAmount = Number(tax_amount) || 0;
    let calculatedGrandTotal = Number(grand_total) || 0;

    if ((calculatedGrandTotal === 0 || calculatedTotalAmount === 0) && items && Array.isArray(items)) {
      let subtotal = 0;
      let taxTotal = 0;
      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        const taxRate = Number(item.tax_rate) || 0;
        
        if (finalIsTaxInclusive) {
          const itemTotalIncl = qty * price;
          const itemTotalExcl = itemTotalIncl / (1 + (taxRate / 100));
          const itemTax = itemTotalIncl - itemTotalExcl;
          subtotal += itemTotalExcl;
          taxTotal += itemTax;
        } else {
          const itemTotal = qty * price;
          const itemTax = itemTotal * (taxRate / 100);
          subtotal += itemTotal;
          taxTotal += itemTax;
        }
      }
      calculatedTotalAmount = Number(subtotal.toFixed(2));
      calculatedTaxAmount = Number(taxTotal.toFixed(2));
      calculatedGrandTotal = Number((subtotal + taxTotal).toFixed(2));
    }

    // Deduct old items stock before replacing them
    const oldItems = await pool.query("SELECT product_id, quantity, system_quantity FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [id]);
    for (const oldItem of oldItems.rows) {
      if (oldItem.product_id) {
        const qtyToRevert = oldItem.system_quantity != null ? oldItem.system_quantity : oldItem.quantity;
        await pool.query("UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2", [qtyToRevert, oldItem.product_id]);
      }
    }

    await pool.query("DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [id]);

    const invoiceRes = await pool.query(
      `UPDATE purchase_invoices 
       SET company_id = $1, invoice_number = $2, waybill_number = $3, tax_number = $4, tax_office = $5, address = $6, 
           invoice_date = $7, total_amount = $8, tax_amount = $9, grand_total = $10, currency = $11, exchange_rate = $12, 
           notes = $13, supplier_name = $14, is_expense = $15, expense_category = $16, status = $17, is_tax_inclusive = $18,
           payment_method = $19, payment_status = $20
       WHERE id = $21 AND store_id = $22 RETURNING *`,
      [
        company_id || null, invoice_number, waybill_number || null, tax_number || null, tax_office || null, address || null,
        invoice_date, calculatedTotalAmount, calculatedTaxAmount, calculatedGrandTotal, currency || 'TRY', exchange_rate || 1,
        notes || null, supplier_name || null, is_expense || false, expense_category || null, status || 'pending',
        finalIsTaxInclusive, payment_method || null, payment_status || 'unpaid',
        id, storeId
      ]
    );

    const invoice = invoiceRes.rows[0];

    // Delete old transaction and add new one
    await pool.query("DELETE FROM current_account_transactions WHERE purchase_invoice_id = $1", [id]);
    
    if (company_id) {
      const storeRes = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
      const store = storeRes.rows[0];
      const branding = store?.branding || {};
      const defaultCurrency = store?.default_currency || branding?.default_currency || 'TRY';

      await pool.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, purchase_invoice_id, type, amount, currency, exchange_rate, description, transaction_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [storeId, company_id, invoice.id, 'credit', calculatedGrandTotal, currency || defaultCurrency, exchange_rate || 1, `Alış Faturası: ${invoice_number}`, invoice_date || new Date()]
      );
    }

    if (items && Array.isArray(items)) {
      for (const item of items) {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        const taxRate = Number(item.tax_rate) || 0;
        
        let itemTaxAmount = 0;
        let itemTotalPrice = 0;
        
        if (finalIsTaxInclusive) {
          const itemTotalIncl = qty * price;
          const itemTotalExcl = itemTotalIncl / (1 + (taxRate / 100));
          itemTaxAmount = itemTotalIncl - itemTotalExcl;
          itemTotalPrice = itemTotalExcl;
        } else {
          const itemTotalExcl = qty * price;
          itemTaxAmount = itemTotalExcl * (taxRate / 100);
          itemTotalPrice = itemTotalExcl;
        }

        await pool.query(
          `INSERT INTO purchase_invoice_items 
           (purchase_invoice_id, product_id, product_name, barcode, quantity, unit_code, system_quantity, system_unit_code, unit_price, tax_rate, tax_amount, total_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            id, item.product_id || null, item.product_name || 'Bilinmeyen Ürün', item.barcode || null,
            qty, item.unit_code || 'Adet', item.system_quantity || null, item.system_unit_code || null, price, taxRate, itemTaxAmount, itemTotalPrice
          ]
        );

        if (item.product_id) {
          const qtyToStock = item.system_quantity != null ? Number(item.system_quantity) : Number(item.quantity || 1);
          await pool.query(
            "UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2, cost_currency = $3 WHERE id = $4",
            [qtyToStock, item.unit_price || 0, currency || 'TRY', item.product_id]
          );
          
          await addStockMovement(
            pool, storeId, item.product_id, 'in', qtyToStock, 'purchase_invoice',
            `Fatura Güncelleme: ${invoice.invoice_number}`, item.unit_price || 0, supplier_name || 'Tedarikçi', currency
          );
        }
      }
    }

    res.json(invoice);
  } catch (e: any) {
    console.error("Error in PUT /purchase/:id:", e);
    res.status(400).json({ error: e.message });
  }
});

router.delete("/purchase/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;

    const checkRes = await pool.query("SELECT id FROM purchase_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (checkRes.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });

    // Adjust stocks back
    const oldItems = await pool.query("SELECT product_id, quantity, system_quantity FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [id]);
    for (const oldItem of oldItems.rows) {
      if (oldItem.product_id) {
        const qtyToRevert = oldItem.system_quantity != null ? oldItem.system_quantity : oldItem.quantity;
        await pool.query("UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2", [qtyToRevert, oldItem.product_id]);
      }
    }

    await pool.query("DELETE FROM purchase_invoices WHERE id = $1 AND store_id = $2", [id, storeId]);
    res.json({ success: true, message: "Purchase invoice deleted successfully" });
  } catch (e: any) {
    console.error("Error in DELETE /purchase/:id:", e);
    res.status(400).json({ error: e.message });
  }
});

router.post("/purchase/:id/status", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE purchase_invoices SET status = $1 WHERE id = $2 AND store_id = $3 RETURNING *",
      [status, id, storeId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/purchase/:id/read", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE purchase_invoices SET status = 'read' WHERE id = $1 AND store_id = $2 RETURNING *",
      [id, storeId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.patch("/purchase/:id/payment-status", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      "UPDATE purchase_invoices SET payment_status = $1 WHERE id = $2 AND store_id = $3 RETURNING *",
      [status, id, storeId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Invoice not found" });
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
