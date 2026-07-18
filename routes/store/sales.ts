import express from "express";
import { pool, logAction, addStockMovement, convertRecipeAmountToMl } from "../../models/db";
import { getTurkishSearchSnippet, normalizeTurkishParam } from "./utils";

const router = express.Router();

// Get All Sales
router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  const status = req.query.status;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  let query = `
    SELECT s.*, si.id as sales_invoice_id, si.invoice_number as sales_invoice_number 
    FROM sales s
    LEFT JOIN sales_invoices si ON si.sale_id = s.id
    WHERE s.store_id = $1 AND s.status != 'checkout_initiated'
  `;
  const params: any[] = [storeId];

  if (status && status !== 'all') {
    params.push(status);
    query += ` AND s.status = $${params.length}`;
  }
  if (startDate) {
    params.push(startDate);
    query += ` AND s.created_at >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate + ' 23:59:59');
    query += ` AND s.created_at <= $${params.length}`;
  }

  query += " ORDER BY s.created_at DESC";

  try {
    const sales = await pool.query(query, params);
    
    const salesWithDetails = [];
    for (const sale of sales.rows) {
      const items = await pool.query("SELECT * FROM sale_items WHERE sale_id = $1", [sale.id]);
      const payments = await pool.query("SELECT * FROM sale_payments WHERE sale_id = $1", [sale.id]);
      salesWithDetails.push({ ...sale, items: items.rows, payments: payments.rows });
    }
    
    res.json(salesWithDetails);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Fast POS Sale
router.post("/pos", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  const { items, total, paymentMethod, customerName, notes, currency, exchangeRate, status, tableNumber } = req.body;
  const saleStatus = status || 'completed';
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    let resolvedTableId = null;
    if (customerName) {
      const cleanName = customerName.replace(/Masa/gi, '').trim();
      const tableRes = await client.query(
        "SELECT id FROM restaurant_tables WHERE store_id = $1 AND (table_number = $2 OR table_number = $3)",
        [storeId, customerName, cleanName]
      );
      if (tableRes.rows.length > 0) {
        resolvedTableId = tableRes.rows[0].id;
      }
    }

    const saleRes = await client.query(
      "INSERT INTO sales (store_id, total_amount, currency, exchange_rate, status, customer_name, payment_method, notes, restaurant_table_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
      [storeId, total || 0, currency || 'TRY', exchangeRate || 1, saleStatus, customerName || 'Hızlı Satış', paymentMethod || 'cash', notes || 'Hızlı POS Satışı', resolvedTableId]
    );
    const saleId = saleRes.rows[0].id;

    if (saleStatus === 'pending') {
      if (resolvedTableId) {
        await client.query("UPDATE restaurant_tables SET status = 'occupied' WHERE id = $1 AND store_id = $2", [resolvedTableId, storeId]);
      } else if (customerName) {
        const cleanName = customerName.replace(/Masa/gi, '').trim();
        await client.query(
          "UPDATE restaurant_tables SET status = 'occupied' WHERE store_id = $1 AND (table_number = $2 OR table_number = $3)",
          [storeId, customerName, cleanName]
        );
      }
    }

    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.price);
      await client.query(
        "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [saleId, item.id || null, item.name, item.barcode || '', item.quantity, item.price, itemTotal]
      );

      if (item.id && saleStatus !== 'pending') {
        const productRes = await client.query("SELECT product_type FROM products WHERE id = $1", [item.id]);
        const productType = productRes.rows.length > 0 ? productRes.rows[0].product_type : 'product';

        const recipeRes = await client.query(
          "SELECT ingredient_id, amount, unit FROM product_recipes WHERE product_id = $1 AND store_id = $2",
          [item.id, storeId]
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
              'pos', 
              `Reçete Çıkışı (Hızlı POS Satışı #${saleId}, Ürün: ${item.name})${descriptionExtra}`, 
              0, 
              customerName || 'Hızlı Satış', 
              currency || 'TRY'
            );
          }
        } else if (productType !== 'service') {
          await client.query(
            "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
            [item.quantity, item.id]
          );
          await addStockMovement(client, storeId, item.id, 'out', item.quantity, 'pos', `Hızlı POS Satışı #${saleId}`, item.price, customerName || 'Hızlı Satış', currency || 'TRY');
        }
      }
    }

    let fiscalResult = null;
    if (saleStatus !== 'pending') {
      const storeBrandingRes = await client.query("SELECT fiscal_active, fiscal_brand, fiscal_terminal_id FROM stores WHERE id = $1", [storeId]);
      const branding = storeBrandingRes.rows[0];
      
      if (branding && branding.fiscal_active) {
        fiscalResult = {
          success: true,
          receiptNo: `F-${Math.floor(Math.random() * 1000000)}`,
          zNo: `Z-${Math.floor(Math.random() * 10000)}`,
          brand: branding.fiscal_brand,
          terminal: branding.fiscal_terminal_id,
          timestamp: new Date().toISOString()
        };
        
        const fiscalNote = `\n[FISCAL] Receipt: ${fiscalResult.receiptNo}, Z-No: ${fiscalResult.zNo}, Brand: ${branding.fiscal_brand}`;
        await client.query("UPDATE sales SET notes = COALESCE(notes, '') || $1 WHERE id = $2", [fiscalNote, saleId]);
      }

      await client.query(
        "INSERT INTO sale_payments (sale_id, payment_method, amount) VALUES ($1, $2, $3)",
        [saleId, paymentMethod || 'cash', total || 0]
      );
    }

    await client.query("COMMIT");

    await logAction(
      storeId, 
      req.user.id, 
      "pos_sale", 
      "sale", 
      saleId, 
      saleStatus === 'pending' ? `Adisyon Açıldı: Masa ${customerName}, Tutar: ${total} ₺` : `Hızlı POS Satışı: ${total} ₺, Ödeme: ${paymentMethod}`,
      null,
      { saleId, total, itemsCount: items.length, fiscal: fiscalResult, status: saleStatus }
    );

    res.json({ success: true, saleId, fiscal: fiscalResult });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Restaurant Table Transfer
router.post("/restaurant/tables/transfer", async (req: any, res) => {
  const { fromTableId, toTableId } = req.body;
  const storeId = req.user.store_id;

  if (!fromTableId || !toTableId) {
    return res.status(400).json({ error: "From and To table IDs are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const toTableRes = await client.query(
      "SELECT id, table_number FROM restaurant_tables WHERE id = $1 AND store_id = $2",
      [toTableId, storeId]
    );

    if (toTableRes.rows.length === 0) {
      throw new Error("Target table not found");
    }

    const targetTableNum = toTableRes.rows[0].table_number;

    const toTableSalesRes = await client.query(
      "SELECT id FROM sales WHERE restaurant_table_id = $1 AND store_id = $2 AND status = 'pending'",
      [toTableId, storeId]
    );

    if (toTableSalesRes.rows.length > 0) {
      throw new Error("Target table is not empty. Please merge or close it first.");
    }

    await client.query(
      "UPDATE sales SET restaurant_table_id = $1, customer_name = $2 WHERE restaurant_table_id = $3 AND store_id = $4 AND status = 'pending'",
      [toTableId, `Masa ${targetTableNum.replace(/Masa/gi, '').trim()}`, fromTableId, storeId]
    );

    await client.query(
      "UPDATE restaurant_tables SET status = 'empty' WHERE id = $1 AND store_id = $2",
      [fromTableId, storeId]
    );

    await client.query(
      "UPDATE restaurant_tables SET status = 'occupied' WHERE id = $1 AND store_id = $2",
      [toTableId, storeId]
    );

    await client.query("COMMIT");
    res.json({ success: true, message: "Table transferred successfully" });
  } catch (error: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Update Pending Sale
router.post("/:id/update-pending", async (req: any, res) => {
  const { id } = req.params;
  const { items, total, customerName, notes } = req.body;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const saleRes = await client.query("SELECT * FROM sales WHERE id = $1 AND store_id = $2 FOR UPDATE", [id, storeId]);
    if (saleRes.rows.length === 0) {
      throw new Error("Sale not found");
    }
    const sale = saleRes.rows[0];
    if (sale.status !== 'pending') {
      throw new Error("Sale is not pending");
    }

    await client.query("DELETE FROM sale_items WHERE sale_id = $1", [id]);
    
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.price);
      await client.query(
        "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, item.id || null, item.name, item.barcode || '', item.quantity, item.price, itemTotal]
      );
    }
    
    let resolvedTableId = null;
    const nameToResolve = customerName || sale.customer_name;
    if (nameToResolve) {
      const cleanName = nameToResolve.replace(/Masa/gi, '').trim();
      const tableRes = await client.query(
        "SELECT id FROM restaurant_tables WHERE store_id = $1 AND (table_number = $2 OR table_number = $3)",
        [storeId, nameToResolve, cleanName]
      );
      if (tableRes.rows.length > 0) {
        resolvedTableId = tableRes.rows[0].id;
      }
    }

    await client.query(
      "UPDATE sales SET total_amount = $1, customer_name = $2, notes = $3, restaurant_table_id = $4 WHERE id = $5",
      [total || 0, customerName || sale.customer_name, notes || sale.notes, resolvedTableId, id]
    );

    if (resolvedTableId) {
      await client.query("UPDATE restaurant_tables SET status = 'occupied' WHERE id = $1 AND store_id = $2", [resolvedTableId, storeId]);
    } else if (nameToResolve) {
      const cleanName = nameToResolve.replace(/Masa/gi, '').trim();
      await client.query(
        "UPDATE restaurant_tables SET status = 'occupied' WHERE store_id = $1 AND (table_number = $2 OR table_number = $3)",
        [storeId, nameToResolve, cleanName]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, saleId: id });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Complete Sale
router.post("/:id/complete", async (req: any, res) => {
  const { id } = req.params;
  const { paymentMethod, payments, companyId, dueDate } = req.body;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const saleRes = await client.query("SELECT * FROM sales WHERE id = $1 AND store_id = $2 FOR UPDATE", [id, storeId]);
    if (saleRes.rows.length === 0) {
      throw new Error("Sale not found");
    }
    const sale = saleRes.rows[0];
    if (!['pending', 'processing', 'shipped', 'delivered'].includes(sale.status)) {
      throw new Error("Sale is not in a completable status");
    }

    if (sale.status === 'pending' && req.body.items && Array.isArray(req.body.items)) {
      await client.query("DELETE FROM sale_items WHERE sale_id = $1", [id]);
      
      let newTotal = 0;
      for (const item of req.body.items) {
        const itemTotal = Number(item.quantity) * Number(item.unit_price);
        newTotal += itemTotal;
        await client.query(
          "INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)",
          [id, item.product_id || null, item.product_name, item.quantity, item.unit_price, itemTotal]
        );
      }
      
      await client.query("UPDATE sales SET total_amount = $1 WHERE id = $2", [newTotal, id]);
      sale.total_amount = newTotal;
    }

    if (sale.status === 'pending') {
      const itemsRes = await client.query("SELECT * FROM sale_items WHERE sale_id = $1", [id]);
      for (const item of itemsRes.rows) {
        if (item.product_id) {
          const productRes = await client.query("SELECT product_type FROM products WHERE id = $1", [item.product_id]);
          const productType = productRes.rows.length > 0 ? productRes.rows[0].product_type : 'product';

          const recipeRes = await client.query(
            "SELECT ingredient_id, amount, unit FROM product_recipes WHERE product_id = $1 AND store_id = $2",
            [item.product_id, storeId]
          );

          if (recipeRes.rows.length > 0) {
            for (const recItem of recipeRes.rows) {
              const totalIngredientQty = Number(item.quantity) * Number(recItem.amount);
              await client.query(
                "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
                [totalIngredientQty, recItem.ingredient_id]
              );
              await addStockMovement(
                client, 
                storeId, 
                recItem.ingredient_id, 
                'out', 
                totalIngredientQty, 
                'pos', 
                `Reçete Çıkışı (Satış #${id}, Ürün: ${item.product_name})`, 
                0, 
                sale.customer_name, 
                sale.currency || 'TRY'
              );
            }
          } else if (productType !== 'service') {
            await client.query(
              "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
              [item.quantity, item.product_id]
            );
            await addStockMovement(client, storeId, item.product_id, 'out', item.quantity, 'pos', `Kasa Satışı #${id}`, item.unit_price, sale.customer_name, sale.currency || 'TRY');
          }
        }
      }
    }

    const primaryMethod = payments && payments.length > 0
      ? (payments.length > 1 ? 'multiple' : payments[0].method)
      : (sale.status === 'processing' && sale.payment_method ? sale.payment_method : (paymentMethod || 'cash'));
    
    await client.query(
      "UPDATE sales SET status = 'completed', payment_method = $1 WHERE id = $2",
      [primaryMethod, id]
    );

    const finalCompanyId = sale.company_id; 
    
    if (payments && payments.length > 0) {
      for (const p of payments) {
        await client.query(
          "INSERT INTO sale_payments (sale_id, payment_method, amount) VALUES ($1, $2, $3)",
          [id, p.method, p.amount]
        );
        
        if (finalCompanyId) {
          const storeRes = await client.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
          const branding = storeRes.rows[0]?.branding || {};

          await client.query(
            "INSERT INTO current_account_transactions (store_id, company_id, sale_id, type, amount, description, payment_method, currency, exchange_rate) VALUES ($1, $2, $3, 'credit', $4, $5, $6, $7, $8)",
            [storeId, finalCompanyId, id, p.amount, `Satış #${id} Ödemesi (${p.method})`, p.method, sale.currency || branding?.default_currency || 'TRY', sale.exchange_rate || 1]
          );
        }
      }
    } else {
      const total = sale.total_amount;
      if (paymentMethod !== 'term') {
        await client.query(
          "INSERT INTO sale_payments (sale_id, payment_method, amount) VALUES ($1, $2, $3)",
          [id, paymentMethod || 'cash', total]
        );
      }

      if (finalCompanyId) {
        const storeRes = await client.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
        const branding = storeRes.rows[0]?.branding || {};

        await client.query(
          "INSERT INTO current_account_transactions (store_id, company_id, sale_id, type, amount, description, payment_method, currency, exchange_rate) VALUES ($1, $2, $3, 'debt', $4, $5, $6, $7, $8)",
          [storeId, finalCompanyId, id, total, `Satış #${id} (${paymentMethod || 'cash'})`, paymentMethod || 'cash', sale.currency || branding?.default_currency || 'TRY', sale.exchange_rate || 1]
        );
        
        if (paymentMethod !== 'term') {
          await client.query(
            "INSERT INTO current_account_transactions (store_id, company_id, sale_id, type, amount, description, payment_method, currency, exchange_rate) VALUES ($1, $2, $3, 'credit', $4, $5, $6, $7, $8)",
            [storeId, finalCompanyId, id, total, `Satış #${id} Ödemesi (${paymentMethod || 'cash'})`, paymentMethod || 'cash', sale.currency || branding?.default_currency || 'TRY', sale.exchange_rate || 1]
          );
        }
      }
    }

    const storeBrandingRes = await client.query("SELECT fiscal_active, fiscal_brand, fiscal_terminal_id FROM stores WHERE id = $1", [storeId]);
    const branding = storeBrandingRes.rows[0];
    let fiscalResult = null;
    
    if (branding && branding.fiscal_active) {
      fiscalResult = {
        success: true,
        receiptNo: `F-${Math.floor(Math.random() * 1000000)}`,
        zNo: `Z-${Math.floor(Math.random() * 10000)}`,
        brand: branding.fiscal_brand,
        terminal: branding.fiscal_terminal_id,
        timestamp: new Date().toISOString()
      };
      
      const fiscalNote = `\n[FISCAL] Receipt: ${fiscalResult.receiptNo}, Z-No: ${fiscalResult.zNo}, Brand: ${fiscalResult.brand}`;
      await client.query("UPDATE sales SET notes = COALESCE(notes, '') || $1 WHERE id = $2", [fiscalNote, id]);
    }

    if (sale.restaurant_table_id) {
      await client.query("UPDATE restaurant_tables SET status = 'empty' WHERE id = $1 AND store_id = $2", [sale.restaurant_table_id, storeId]);
    } else if (sale.customer_name) {
      const cleanName = sale.customer_name.replace(/Masa/gi, '').trim();
      await client.query(
        "UPDATE restaurant_tables SET status = 'empty' WHERE store_id = $1 AND (table_number = $2 OR table_number = $3)",
        [storeId, sale.customer_name, cleanName]
      );
    }

    await client.query("COMMIT");

    await logAction(
      storeId, 
      req.user.id, 
      "sale_complete", 
      "sale", 
      parseInt(id), 
      `Bekleyen satış tamamlandı: #${id}, Tutar: ${sale.total_amount} ₺`,
      { oldStatus: 'pending' },
      { newStatus: 'completed', paymentMethod: primaryMethod, fiscal: fiscalResult }
    );

    res.json({ success: true, fiscal: fiscalResult });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Ship Sale
router.post("/:id/ship", async (req: any, res) => {
  const { id } = req.params;
  const { carrier, trackingNumber } = req.body;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  
  try {
    const result = await pool.query(
      "UPDATE sales SET status = 'shipped', shipping_carrier = $1, tracking_number = $2 WHERE id = $3 AND store_id = $4 RETURNING *",
      [carrier, trackingNumber, id, storeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sale not found" });
    }

    await logAction(storeId, req.user.id, "sale_ship", "sales", parseInt(id), JSON.stringify({ carrier, trackingNumber }));

    res.json({ success: true, sale: result.rows[0] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Deliver Sale
router.post("/:id/deliver", async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  
  try {
    const result = await pool.query(
      "UPDATE sales SET status = 'delivered' WHERE id = $1 AND store_id = $2 RETURNING *",
      [id, storeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Sale not found" });
    }

    await logAction(storeId, req.user.id, "sale_deliver", "sales", parseInt(id), "Sipariş teslim edildi olarak işaretlendi");

    res.json({ success: true, sale: result.rows[0] });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Cancel Sale
router.post("/:id/cancel", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const saleRes = await client.query("SELECT * FROM sales WHERE id = $1 AND store_id = $2 FOR UPDATE", [req.params.id, storeId]);
    if (saleRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Sale not found" });
    }

    const sale = saleRes.rows[0];
    if (sale.status === 'cancelled') {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Sale already cancelled" });
    }

    const itemsRes = await client.query("SELECT * FROM sale_items WHERE sale_id = $1", [sale.id]);
    for (const item of itemsRes.rows) {
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2",
          [item.quantity, item.product_id]
        );
        await addStockMovement(client, storeId, item.product_id, 'in', item.quantity, 'sale', `Satış İptal Edildi #${sale.id} (İade)`, item.unit_price, sale.customer_name);
      }
    }

    await client.query("DELETE FROM current_account_transactions WHERE sale_id = $1", [sale.id]);
    await client.query("DELETE FROM sale_payments WHERE sale_id = $1", [sale.id]);

    await client.query("UPDATE sales SET status = 'cancelled' WHERE id = $1", [req.params.id]);

    if (sale.quotation_id) {
      await client.query("UPDATE quotations SET status = 'cancelled', is_sale = FALSE WHERE id = $1", [sale.quotation_id]);
    }

    await client.query("COMMIT");

    await logAction(
      storeId, 
      req.user.id, 
      "sale_cancel", 
      "sale", 
      parseInt(req.params.id), 
      `Satış iptal edildi: #${req.params.id}`,
      { oldStatus: sale.status },
      { newStatus: 'cancelled' }
    );

    res.json({ success: true });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Delete Sale
router.delete("/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const saleRes = await client.query("SELECT * FROM sales WHERE id = $1 AND store_id = $2 FOR UPDATE", [req.params.id, storeId]);
    if (saleRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Sale not found" });
    }

    const sale = saleRes.rows[0];

    if (sale.status === 'completed') {
      const itemsRes = await client.query("SELECT * FROM sale_items WHERE sale_id = $1", [sale.id]);
      for (const item of itemsRes.rows) {
        if (item.product_id) {
          await client.query(
            "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2",
            [item.quantity, item.product_id]
          );
          await addStockMovement(client, storeId, item.product_id, 'in', item.quantity, 'sale', `Satış Silindi #${sale.id} (İade)`, item.unit_price, sale.customer_name);
        }
      }
    }

    await client.query("DELETE FROM procurements WHERE sale_id = $1", [sale.id]);
    await client.query("DELETE FROM current_account_transactions WHERE sale_id = $1", [sale.id]);
    await client.query("DELETE FROM sale_items WHERE sale_id = $1", [sale.id]);
    await client.query("DELETE FROM sale_payments WHERE sale_id = $1", [sale.id]);
    await client.query("DELETE FROM sales WHERE id = $1 AND store_id = $2", [sale.id, storeId]);
    
    if (sale.quotation_id) {
      await client.query("UPDATE quotations SET status = 'pending', is_sale = FALSE WHERE id = $1", [sale.quotation_id]);
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

export default router;
