import express from "express";
import { pool, logAction, addStockMovement, convertRecipeAmountToMl } from "../../models/db";
import { getEInvoiceService } from "../einvoice";
import { getTurkishSearchSnippet, normalizeTurkishParam } from "./utils";

const router = express.Router();

// Get All Quotations
router.get("/", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });
    
    const { search, status, startDate, endDate } = req.query;
    let query = "SELECT * FROM quotations WHERE store_id = $1";
    let params: any[] = [storeId];
    
    if (search) {
      const searchTerms = search.toLowerCase().split(' ').filter(Boolean);
      searchTerms.forEach(term => {
        const paramIndex = params.length + 1;
        query += ` AND (customer_name ILIKE $${paramIndex} OR customer_title ILIKE $${paramIndex})`;
        params.push(`%${term}%`);
      });
    }

    if (status && status !== 'all') {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, params);
    
    const quotationsWithItems = await Promise.all(result.rows.map(async (q: any) => {
      const itemsResult = await pool.query(
        "SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id ASC",
        [q.id]
      );
      return { ...q, items: itemsResult.rows };
    }));
    
    res.json(quotationsWithItems);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get Single Quotation
router.get("/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;
    
    const quotRes = await pool.query("SELECT * FROM quotations WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (quotRes.rows.length === 0) return res.status(404).json({ error: "Quotation not found" });
    
    const itemsRes = await pool.query("SELECT * FROM quotation_items WHERE quotation_id = $1", [id]);
    res.json({ ...quotRes.rows[0], items: itemsRes.rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Create Quotation
router.post("/", async (req: any, res) => {
  const client = await pool.connect();
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const { customer_name, customer_title, total_amount, currency, notes, items, company_id, expiry_date, payment_method, due_date, tax_number, tax_office, is_tax_inclusive, exchange_rate } = req.body;
    
    await client.query("BEGIN");

    let finalCompanyId = company_id;
    
    if (!finalCompanyId && customer_name) {
      const existingCompany = await client.query(
        "SELECT id FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2))",
        [storeId, customer_name]
      );
      
      if (existingCompany.rows.length > 0) {
        finalCompanyId = existingCompany.rows[0].id;
      } else {
        const newCompany = await client.query(
          "INSERT INTO companies (store_id, title, contact_person) VALUES ($1, $2, $3) RETURNING id",
          [storeId, customer_name, customer_title || '']
        );
        finalCompanyId = newCompany.rows[0].id;
      }
    }
    
    const quotRes = await client.query(
      "INSERT INTO quotations (store_id, customer_name, customer_title, total_amount, currency, notes, company_id, expiry_date, payment_method, due_date, tax_number, tax_office, is_tax_inclusive, exchange_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id",
      [storeId, customer_name, customer_title, total_amount, currency, notes, finalCompanyId || null, expiry_date || null, payment_method || 'cash', due_date || null, tax_number || null, tax_office || null, is_tax_inclusive !== undefined ? is_tax_inclusive : true, exchange_rate || 1]
    );
    const quotationId = quotRes.rows[0].id;
    
    for (const item of items) {
      await client.query(
        "INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [quotationId, item.product_id || null, item.product_name, item.barcode || null, item.quantity, item.unit_price, (item.tax_rate !== undefined && item.tax_rate !== null) ? item.tax_rate : 20, item.total_price]
      );
    }
    
    await client.query("COMMIT");
    res.json({ success: true, id: quotationId });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Update Quotation
router.put("/:id", async (req: any, res) => {
  const client = await pool.connect();
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;
    const { customer_name, customer_title, total_amount, currency, notes, items, company_id, expiry_date, payment_method, due_date, tax_number, tax_office, is_tax_inclusive, exchange_rate } = req.body;
    
    await client.query("BEGIN");
    
    const quotRes = await client.query(
      "UPDATE quotations SET customer_name = $1, customer_title = $2, total_amount = $3, currency = $4, notes = $5, company_id = $6, expiry_date = $7, payment_method = $8, due_date = $9, tax_number = $10, tax_office = $11, is_tax_inclusive = $12, exchange_rate = $13 WHERE id = $14 AND store_id = $15 RETURNING id",
      [customer_name, customer_title, total_amount, currency, notes, company_id || null, expiry_date || null, payment_method || 'cash', due_date || null, tax_number || null, tax_office || null, is_tax_inclusive !== undefined ? is_tax_inclusive : true, exchange_rate || 1, id, storeId]
    );
    
    if (quotRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Quotation not found" });
    }
    
    await client.query("DELETE FROM quotation_items WHERE quotation_id = $1", [id]);
    
    for (const item of items) {
      await client.query(
        "INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [id, item.product_id || null, item.product_name, item.barcode || null, item.quantity, item.unit_price, (item.tax_rate !== undefined && item.tax_rate !== null) ? item.tax_rate : 20, item.total_price]
      );
    }
    
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Delete Quotation
router.delete("/:id", async (req: any, res) => {
  const client = await pool.connect();
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;
    
    await client.query("BEGIN");

    // Check status first
    const qRes = await client.query("SELECT * FROM quotations WHERE id = $1 AND store_id = $2 FOR UPDATE", [id, storeId]);
    if (qRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Quotation not found" });
    }

    const quotation = qRes.rows[0];

    // If approved, we need to reverse stock and cari
    if (quotation.status === 'approved') {
      // Find related sale
      const saleRes = await client.query("SELECT id FROM sales WHERE quotation_id = $1 AND store_id = $2", [id, storeId]);
      
      for (const sale of saleRes.rows) {
        // Reverse stock
        const itemsRes = await client.query("SELECT * FROM sale_items WHERE sale_id = $1", [sale.id]);
        for (const item of itemsRes.rows) {
          if (item.product_id) {
            await client.query(
              "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2",
              [item.quantity, item.product_id]
            );
            await addStockMovement(client, storeId, item.product_id, 'in', item.quantity, 'quotation', `Teklif Silindi #${id} (İade)`);
          }
        }
        // Delete related records
        await client.query("DELETE FROM procurements WHERE sale_id = $1", [sale.id]);
        await client.query("DELETE FROM sale_items WHERE sale_id = $1", [sale.id]);
        await client.query("DELETE FROM sale_payments WHERE sale_id = $1", [sale.id]);
        await client.query("DELETE FROM current_account_transactions WHERE sale_id = $1", [sale.id]);
        await client.query("DELETE FROM sales WHERE id = $1", [sale.id]);
      }
      
      // Also delete transactions linked directly to quotation_id
      await client.query("DELETE FROM current_account_transactions WHERE quotation_id = $1", [id]);
    }

    await client.query("DELETE FROM quotation_items WHERE quotation_id = $1", [id]);
    await client.query("DELETE FROM quotations WHERE id = $1 AND store_id = $2", [id, storeId]);
    
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Approve Quotation (Convert to Sale)
router.post("/:id/approve", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const { payment_method, due_date, notes } = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const qResult = await client.query(
        "SELECT * FROM quotations WHERE id = $1 AND store_id = $2 FOR UPDATE",
        [req.params.id, storeId]
      );
      
      if (qResult.rows.length === 0) {
        throw new Error("Quotation not found");
      }
      
      const quotation = qResult.rows[0];
      
      if (quotation.status === 'approved' || quotation.is_sale) {
        throw new Error("Quotation already approved or converted to sale");
      }
      
      const paymentMethod = payment_method || quotation.payment_method || 'cash';
      const dueDate = (due_date || quotation.due_date) || null;

      if (!quotation.company_id && paymentMethod === 'term') {
        throw new Error("Quotation must be linked to a company for 'Term' payment");
      }

      const itemsRes = await client.query(
        "SELECT qi.*, p.stock_quantity FROM quotation_items qi LEFT JOIN products p ON qi.product_id = p.id WHERE qi.quotation_id = $1", 
        [quotation.id]
      );

      const storeRes = await client.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
      const branding = storeRes.rows[0]?.branding || {};

      const taxInclusive = quotation.is_tax_inclusive;
      
      // Calculate total tax and grand total for sale/invoice
      let totalQuotationTax = 0;
      for (const item of itemsRes.rows) {
        const rate = (item.tax_rate !== undefined && item.tax_rate !== null) ? Number(item.tax_rate) : (branding?.default_tax_rate !== undefined ? Number(branding.default_tax_rate) : 20);
        if (taxInclusive) {
          // If inclusive, total_amount already includes tax. Calculate tax portion.
          const kdvHaricTotal = Number(item.total_price) / (1 + rate / 100);
          totalQuotationTax += Number(item.total_price) - kdvHaricTotal;
        } else {
          // If exclusive, total_amount is base total. Calculate tax to add.
          totalQuotationTax += (Number(item.total_price) * rate) / 100;
        }
      }

      const grandTotalAmount = taxInclusive ? Number(quotation.total_amount) : (Number(quotation.total_amount) + totalQuotationTax);

      const saleRes = await client.query(
        "INSERT INTO sales (store_id, total_amount, currency, exchange_rate, status, customer_name, payment_method, due_date, quotation_id, notes, company_id, customer_id) VALUES ($1, $2, $3, $4, 'completed', $5, $6, $7, $8, $9, $10, $11) RETURNING id",
        [storeId, grandTotalAmount, quotation.currency || 'TRY', quotation.exchange_rate || 1, quotation.customer_name, paymentMethod, dueDate, quotation.id, notes || quotation.notes, quotation.company_id, quotation.customer_id]
      );
      const saleId = saleRes.rows[0].id;

      for (const item of itemsRes.rows) {
        const taxRate = (item.tax_rate !== undefined && item.tax_rate !== null) ? Number(item.tax_rate) : (branding?.default_tax_rate !== undefined ? Number(branding.default_tax_rate) : 20);
        
        let kdvHaricPrice: number;
        let taxAmount: number;
        let kdvHaricTotal: number;

        if (taxInclusive) {
          kdvHaricPrice = Number(item.unit_price) / (1 + taxRate / 100);
          kdvHaricTotal = Number(item.total_price) / (1 + taxRate / 100);
          taxAmount = Number(item.total_price) - kdvHaricTotal;
        } else {
          kdvHaricPrice = Number(item.unit_price);
          kdvHaricTotal = Number(item.total_price);
          taxAmount = (kdvHaricTotal * taxRate) / 100;
        }

        await client.query(
          "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [saleId, item.product_id, item.product_name, item.barcode, item.quantity, kdvHaricPrice, taxRate, taxAmount, kdvHaricTotal]
        );
        
        if (item.product_id) {
          // Fetch product type to check if it's a service
          const productRes = await client.query("SELECT product_type, stock_quantity FROM products WHERE id = $1", [item.product_id]);
          const product = productRes.rows[0];
          const productType = product ? product.product_type : 'product';
          const currentStock = product ? product.stock_quantity : 0;

          if (productType !== 'service') {
            const stockNeeded = item.quantity;

            // Check if this product has a recipe
            const recipeRes = await client.query(
              "SELECT ingredient_id, amount, unit FROM product_recipes WHERE product_id = $1 AND store_id = $2",
              [item.product_id, storeId]
            );

            if (recipeRes.rows.length > 0) {
              for (const recItem of recipeRes.rows) {
                const baseAmount = convertRecipeAmountToMl(Number(recItem.amount), recItem.unit);
                const totalIngredientQtyMl = Number(item.quantity) * baseAmount;
                
                const ingRes = await client.query("SELECT volume_ml, unit FROM products WHERE id = $1", [recItem.ingredient_id]);
                const volMl = Number(ingRes.rows[0]?.volume_ml) || 0;
                const ingUnit = ingRes.rows[0]?.unit;
                
                let finalDeduction = totalIngredientQtyMl;
                let descriptionExtra = "";
                
                if (volMl > 0 && !['ml', 'gr', 'g', 'cc'].includes(ingUnit?.toLowerCase())) {
                  finalDeduction = totalIngredientQtyMl / volMl;
                  descriptionExtra = ` (${totalIngredientQtyMl}ml / ${volMl}ml)`;
                }

                await client.query(
                  "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
                  [finalDeduction, recItem.ingredient_id]
                );
                await addStockMovement(
                  client, 
                  storeId, 
                  recItem.ingredient_id, 
                  'out', 
                  finalDeduction, 
                  'quotation', 
                  `Reçete Çıkışı (Satış #${saleId})${descriptionExtra}`, 
                  0, 
                  quotation.customer_name
                );
              }
            } else {
              if (currentStock < stockNeeded) {
                const missingQuantity = stockNeeded - (currentStock > 0 ? currentStock : 0);
                await client.query(
                  "INSERT INTO procurements (store_id, sale_id, product_id, product_name, barcode, quantity, status) VALUES ($1, $2, $3, $4, $5, $6, 'pending')",
                  [storeId, saleId, item.product_id, item.product_name, item.barcode, missingQuantity]
                );
              }

              await client.query(
                "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
                [item.quantity, item.product_id]
              );

              await addStockMovement(client, storeId, item.product_id, 'out', item.quantity, 'quotation', `Satış #${saleId} (Teklif #${quotation.id})`, kdvHaricPrice, quotation.customer_name);
            }
          }
        }
      }

      if (quotation.company_id) {
        // Prevent double entry by checking if transactions already exist for this quotation
        const existingTx = await client.query("SELECT id FROM current_account_transactions WHERE quotation_id = $1", [quotation.id]);
        if (existingTx.rows.length === 0) {
          await client.query(
            "INSERT INTO current_account_transactions (store_id, company_id, quotation_id, sale_id, type, amount, description, payment_method, currency, exchange_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
            [storeId, quotation.company_id, quotation.id, saleId, 'debt', quotation.total_amount, `Satışa Dönüşen Teklif #${quotation.id} (${paymentMethod})`, paymentMethod, quotation.currency || branding?.default_currency || 'TRY', quotation.exchange_rate || 1]
          );

          if (paymentMethod !== 'term') {
            await client.query(
              "INSERT INTO current_account_transactions (store_id, company_id, quotation_id, sale_id, type, amount, description, payment_method, currency, exchange_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
              [storeId, quotation.company_id, quotation.id, saleId, 'credit', quotation.total_amount, `Teklif #${quotation.id} Ödemesi (${paymentMethod})`, paymentMethod, quotation.currency || branding?.default_currency || 'TRY', quotation.exchange_rate || 1]
            );
          }
        }
      }

      if (paymentMethod !== 'term') {
        await client.query(
          "INSERT INTO sale_payments (sale_id, payment_method, amount) VALUES ($1, $2, $3)",
          [saleId, paymentMethod, quotation.total_amount]
        );
      }

      await client.query(
        "UPDATE quotations SET status = 'approved', is_sale = TRUE, payment_method = $1, due_date = $2 WHERE id = $3",
        [paymentMethod, dueDate, quotation.id]
      );

      // Automatically create a DRAFT Sales Invoice
      let autoEDocumentType = 'E-ARSIV';
      try {
        const service = await getEInvoiceService(storeId);
        const taxNum = (quotation.tax_number || "").replace(/\D/g, '');
        if (taxNum && (taxNum.length === 10 || taxNum.length === 11)) {
          const tp = await service.checkTaxpayer(taxNum);
          if (tp.isTaxpayer) autoEDocumentType = 'E-FATURA';
        }
      } catch (e) {
        // Fallback to EARŞİV
      }

      const invoiceNumber = `TASLAK-${Date.now().toString().slice(-6)}`;
      
      const invoiceNotes = quotation.service_id 
        ? `Teknik Servis #${quotation.service_id} - Teklif #${quotation.id} üzerinden otomatik oluşturuldu.`
        : `Teklif #${quotation.id} üzerinden otomatik oluşturuldu.`;
      
      const invRes = await client.query(
        `INSERT INTO sales_invoices 
          (store_id, sale_id, company_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, exchange_rate, notes, invoice_type, status, payment_method, quotation_id, tax_number, tax_office, address, e_document_type) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING id`,
        [
          storeId, 
          saleId, 
          quotation.company_id || null, 
          quotation.customer_id || null, 
          invoiceNumber, 
          new Date(), 
          grandTotalAmount - totalQuotationTax, 
          totalQuotationTax, 
          grandTotalAmount, 
          quotation.currency || 'TRY', 
          quotation.exchange_rate || 1, 
          invoiceNotes, 
          'manual', 
          'draft', 
          paymentMethod, 
          quotation.id,
          quotation.tax_number || null,
          quotation.tax_office || null,
          quotation.address || null,
          autoEDocumentType
        ]
      );
      const invoiceId = invRes.rows[0].id;

      for (const item of itemsRes.rows) {
        const taxRate = (item.tax_rate !== undefined && item.tax_rate !== null) ? Number(item.tax_rate) : 20;
        
        let kdvHaricPrice: number;
        let kdvHaricTotal: number;
        let itemTax: number;

        if (taxInclusive) {
          kdvHaricPrice = Number(item.unit_price) / (1 + taxRate / 100);
          kdvHaricTotal = Number(item.total_price) / (1 + taxRate / 100);
          itemTax = Number(item.total_price) - kdvHaricTotal;
        } else {
          kdvHaricPrice = Number(item.unit_price);
          kdvHaricTotal = Number(item.total_price);
          itemTax = (kdvHaricTotal * taxRate) / 100;
        }

        await client.query(
          `INSERT INTO sales_invoice_items 
            (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [invoiceId, item.product_id, item.product_name, item.barcode || '', item.quantity, kdvHaricPrice, taxRate, itemTax, kdvHaricTotal]
        );
      }

      if (quotation.service_id) {
        await client.query(
          "UPDATE service_records SET status = 'converted_to_sale', is_converted_to_sale = TRUE WHERE id = $1",
          [quotation.service_id]
        );
      }

    await client.query("COMMIT");
    res.json({ success: true, saleId });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("APPROVE QUOTATION ERROR:", err);
    res.status(500).json({ error: err.message || "Failed to approve quotation" });
  } finally {
    client.release();
  }
});

// Cancel Quotation
router.post("/:id/cancel", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const qRes = await client.query(
      "SELECT * FROM quotations WHERE id = $1 AND store_id = $2 FOR UPDATE",
      [req.params.id, storeId]
    );

    if (qRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Quotation not found" });
    }

    const quotation = qRes.rows[0];

    if (quotation.status === 'cancelled') {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Quotation already cancelled" });
    }

    // If it was approved, reverse everything
    if (quotation.status === 'approved') {
      const saleRes = await client.query("SELECT id FROM sales WHERE quotation_id = $1 AND store_id = $2", [quotation.id, storeId]);
      
      for (const sale of saleRes.rows) {
        // Reverse stock
        const itemsRes = await client.query("SELECT * FROM sale_items WHERE sale_id = $1", [sale.id]);
        for (const item of itemsRes.rows) {
          if (item.product_id) {
            await client.query(
              "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2",
              [item.quantity, item.product_id]
            );
            await addStockMovement(client, storeId, item.product_id, 'in', item.quantity, 'quotation', `Teklif İptal Edildi #${quotation.id} (İade)`, item.unit_price, quotation.customer_name);
          }
        }
        // Update sale status
        await client.query("UPDATE sales SET status = 'cancelled' WHERE id = $1", [sale.id]);
        // Delete payments and transactions
        await client.query("DELETE FROM sale_payments WHERE sale_id = $1", [sale.id]);
        await client.query("DELETE FROM current_account_transactions WHERE sale_id = $1", [sale.id]);
      }
      // Delete transactions linked directly to quotation
      await client.query("DELETE FROM current_account_transactions WHERE quotation_id = $1", [quotation.id]);
    }

    await client.query(
      "UPDATE quotations SET status = 'cancelled', is_sale = FALSE WHERE id = $1 AND store_id = $2",
      [req.params.id, storeId]
    );
    
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
