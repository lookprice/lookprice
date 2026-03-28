import express from "express";
import { pool } from "../models/db.ts";

const router = express.Router();

// Public: Get Product by Barcode and Store Slug
router.get("/scan/:slug/:barcode", async (req, res) => {
  const { slug, barcode } = req.params;
  const storeRes = await pool.query(`
    SELECT 
      id, name, logo_url, primary_color, default_currency, background_image_url,
      hero_title, hero_subtitle, hero_image_url, about_text,
      instagram_url, facebook_url, twitter_url, whatsapp_number,
      address, phone, parent_id
    FROM stores 
    WHERE slug = $1
  `, [slug]);
  let store = storeRes.rows[0];

  if (store && store.parent_id) {
    // If it's a branch, we use the parent's branding for the scan result
    const parentRes = await pool.query(`
      SELECT 
        id, name, logo_url, primary_color, default_currency, background_image_url,
        hero_title, hero_subtitle, hero_image_url, about_text,
        instagram_url, facebook_url, twitter_url, whatsapp_number,
        address, phone, slug
      FROM stores 
      WHERE id = $1
    `, [store.parent_id]);
    if (parentRes.rows[0]) {
      const parentStore = parentRes.rows[0];
      // Keep the branch ID for logging and stock checking if needed, but use parent branding
      store = { ...parentStore, branch_id: store.id };
    }
  }
  
  if (!store && (slug === 'demo-store' || slug === 'demo')) {
    store = {
      id: -1,
      name: "Demo Mağaza",
      logo_url: "",
      primary_color: "#4f46e5",
      default_currency: "TRY",
      background_image_url: "",
      hero_title: "Hoş Geldiniz",
      hero_subtitle: "En iyi ürünler burada",
      about_text: "Biz bir demo mağazayız."
    };
  }

  if (!store) return res.status(404).json({ error: "Store not found" });

  let product = null;
  if (store.id !== -1) {
    const productRes = await pool.query("SELECT * FROM products WHERE store_id = $1 AND barcode = $2", [store.id, barcode]);
    product = productRes.rows[0];
  }
  
  if (!product) {
    // Demo product logic: Return a sample product instead of 404 for any store
    const demoProduct = {
      id: 0,
      store_id: store.id,
      barcode: barcode,
      name: "Demo Ürün (Örnek)",
      price: 129.90,
      currency: store.default_currency || 'TRY',
      description: "Bu bir demo üründür. Sistemde gerçek bir ürün bulunamadığında bu örnek gösterilir.",
      updated_at: new Date().toISOString(),
      is_demo: true
    };
    return res.json({ ...demoProduct, store });
  }

  // Log the scan
  await pool.query("INSERT INTO scan_logs (store_id, product_id) VALUES ($1, $2)", [store.branch_id || store.id, product.id]);

  res.json({ ...product, store });
});

// Public: Demo Request
router.post("/demo-request", async (req, res) => {
  const { name, storeName, phone, email, notes } = req.body;
  try {
    await pool.query(
      "INSERT INTO leads (name, store_name, phone, email, notes) VALUES ($1, $2, $3, $4, $5)",
      [name, storeName, phone, email, notes]
    );
    res.json({ success: true, message: "Talebiniz başarıyla alındı." });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/store/:slug", async (req, res) => {
  const { slug } = req.params;
  const storeRes = await pool.query(`
    SELECT 
      id, name, logo_url, primary_color, default_currency, background_image_url,
      hero_title, hero_subtitle, hero_image_url, about_text,
      instagram_url, facebook_url, twitter_url, whatsapp_number,
      address, phone, parent_id
    FROM stores 
    WHERE slug = $1
  `, [slug]);
  let store = storeRes.rows[0];

  if (store && store.parent_id) {
    // This is a branch. Redirect to parent store's website.
    const parentRes = await pool.query("SELECT slug FROM stores WHERE id = $1", [store.parent_id]);
    if (parentRes.rows[0]) {
      return res.json({ redirect: `/store/${parentRes.rows[0].slug}`, isBranch: true });
    }
  }
  
  if (!store && (slug === 'demo-store' || slug === 'demo')) {
    store = {
      id: -1,
      name: "Demo Mağaza",
      logo_url: "",
      primary_color: "#4f46e5",
      default_currency: "TRY",
      background_image_url: "",
      hero_title: "Hoş Geldiniz",
      hero_subtitle: "En iyi ürünler burada",
      about_text: "Biz bir demo mağazayız."
    };
  }
  
  if (!store) return res.status(404).json({ error: "Store not found" });
  res.json(store);
});

// Public: Get Store Products by Slug
router.get("/store/:slug/products", async (req, res) => {
  const { slug } = req.params;
  const storeRes = await pool.query("SELECT id FROM stores WHERE slug = $1", [slug]);
  let storeId = storeRes.rows[0]?.id;

  if (!storeId && (slug === 'demo-store' || slug === 'demo')) {
    storeId = -1;
  }

  if (!storeId) return res.status(404).json({ error: "Store not found" });

  if (storeId === -1) {
    // Return demo products
    return res.json([
      { id: 1, name: "Örnek Ürün 1", price: 100, currency: "TRY", barcode: "123", description: "Açıklama 1" },
      { id: 2, name: "Örnek Ürün 2", price: 200, currency: "TRY", barcode: "456", description: "Açıklama 2" },
      { id: 3, name: "Örnek Ürün 3", price: 300, currency: "TRY", barcode: "789", description: "Açıklama 3" }
    ]);
  }

  const productsRes = await pool.query("SELECT * FROM products WHERE store_id = $1 ORDER BY name ASC", [storeId]);
  res.json(productsRes.rows);
});

// Public: Create Sale (Customer Basket)
router.post("/sales", async (req, res) => {
  const { storeId, items, total, currency, customerName, customerPhone, customerAddress, notes, paymentMethod } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const saleRes = await client.query(
      "INSERT INTO sales (store_id, total_amount, currency, customer_name, customer_phone, customer_address, notes, payment_method, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING id",
      [storeId, total || 0, currency || 'TRY', customerName || 'Müşteri', customerPhone || '', customerAddress || '', notes || '', paymentMethod || 'credit_card']
    );
    const saleId = saleRes.rows[0].id;

    if (!items || !Array.isArray(items)) {
      throw new Error("Sipariş içeriği geçersiz.");
    }

    for (const item of items) {
      await client.query(
        "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [saleId, item.productId || item.id, item.name || 'Bilinmeyen Ürün', item.barcode || '', item.quantity || 1, item.price || 0, (item.price || 0) * (item.quantity || 1), currency || 'TRY']
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, saleId });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Public: Registration Request
router.post("/register-request", async (req, res) => {
  const { 
    storeName, username, password, companyTitle, 
    address, phone, country, language, currency, plan, 
    uploadMethod, excelData, mapping 
  } = req.body;
  
  try {
    await pool.query(
      `INSERT INTO registration_requests 
      (store_name, username, password, company_title, address, phone, country, language, currency, plan, upload_method, excel_data, mapping) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [storeName, username, password, companyTitle, address, phone, country || 'TR', language, currency, plan, uploadMethod, JSON.stringify(excelData || []), JSON.stringify(mapping || {})]
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Public Sales Status
router.get("/sales/:id/status", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT status FROM sales WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Sale not found" });
    res.json({ status: result.rows[0].status });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// Public Quotation View
router.get("/quotations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT q.*, s.name as store_name, s.logo_url, s.address as store_address, s.phone as store_phone, s.email as store_email FROM quotations q JOIN stores s ON q.store_id = s.id WHERE q.id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Quotation not found" });
    }
    
    const quotation = result.rows[0];
    const itemsResult = await pool.query("SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id ASC", [id]);
    quotation.items = itemsResult.rows;
    
    res.json(quotation);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Public Quotation Action (Approve/Reject)
router.post("/quotations/:id/action", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { action, notes: customerNotes, paymentMethod: bodyPaymentMethod, dueDate: bodyDueDate } = req.body; // action: 'approve' or 'reject'
    
    if (action !== 'approve') {
      const result = await pool.query(
        "UPDATE quotations SET status = 'cancelled', notes = COALESCE(notes, '') || '\nCustomer Note (Reject): ' || $1 WHERE id = $2 AND status = 'pending' RETURNING id",
        [customerNotes || '', id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Quotation not found or already processed" });
      }
      return res.json({ success: true });
    }

    // Approval logic (similar to store admin approval)
    await client.query("BEGIN");
    
    const qResult = await client.query(
      "SELECT * FROM quotations WHERE id = $1 FOR UPDATE",
      [id]
    );
    
    if (qResult.rows.length === 0) {
      throw new Error("Quotation not found");
    }
    
    const quotation = qResult.rows[0];
    const storeId = quotation.store_id;
    
    if (quotation.status === 'approved' || quotation.is_sale) {
      throw new Error("Quotation already approved or converted to sale");
    }
    
    const paymentMethod = bodyPaymentMethod || quotation.payment_method || 'cash';
    const dueDate = (bodyDueDate || quotation.due_date) || null;

    if (!quotation.company_id && paymentMethod === 'term') {
      throw new Error("Quotation must be linked to a company for 'Term' payment");
    }

    // Create Sale
    const saleRes = await client.query(
      "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, payment_method, due_date, quotation_id, notes, company_id) VALUES ($1, $2, $3, 'completed', $4, $5, $6, $7, $8, $9) RETURNING id",
      [storeId, quotation.total_amount, quotation.currency, quotation.customer_name, paymentMethod, dueDate, quotation.id, (quotation.notes || '') + (customerNotes ? `\nCustomer Note: ${customerNotes}` : ''), quotation.company_id]
    );
    const saleId = saleRes.rows[0].id;

    // Items and Stock
    const itemsRes = await client.query("SELECT * FROM quotation_items WHERE quotation_id = $1", [quotation.id]);
    for (const item of itemsRes.rows) {
      await client.query(
        "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [saleId, item.product_id, item.product_name, item.barcode, item.quantity, item.unit_price, item.total_price]
      );
      
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
          [item.quantity, item.product_id]
        );

        await client.query(
          "INSERT INTO stock_movements (store_id, product_id, type, quantity, description) VALUES ($1, $2, 'out', $3, $4)",
          [storeId, item.product_id, item.quantity, `Müşteri Onaylı Satış #${saleId} (Teklif #${quotation.id})`]
        );
      }
    }

    // Current Account Transactions
    if (quotation.company_id) {
      await client.query(
        "INSERT INTO current_account_transactions (store_id, company_id, quotation_id, sale_id, type, amount, description, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [storeId, quotation.company_id, quotation.id, saleId, 'debt', quotation.total_amount, `Müşteri Onaylı Satış #${quotation.id} (${paymentMethod})`, paymentMethod]
      );

      if (paymentMethod !== 'term') {
        await client.query(
          "INSERT INTO current_account_transactions (store_id, company_id, quotation_id, sale_id, type, amount, description, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [storeId, quotation.company_id, quotation.id, saleId, 'credit', quotation.total_amount, `Teklif #${quotation.id} Ödemesi (${paymentMethod})`, paymentMethod]
        );
      }
    }

    if (paymentMethod !== 'term') {
      await client.query(
        "INSERT INTO sale_payments (sale_id, payment_method, amount) VALUES ($1, $2, $3)",
        [saleId, paymentMethod, quotation.total_amount]
      );
    }

    // Update Quotation Status
    await client.query(
      "UPDATE quotations SET status = 'approved', is_sale = TRUE, payment_method = $1, due_date = $2, notes = COALESCE(notes, '') || $3 WHERE id = $4",
      [paymentMethod, dueDate, customerNotes ? `\nCustomer Note: ${customerNotes}` : '', quotation.id]
    );

    await client.query("COMMIT");
    res.json({ success: true, saleId });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.get("/schema-check", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='current_account_transactions'
    `);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
