import express from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { pool, logAction } from "../models/db.ts";
import { authenticate } from "../middleware/auth.ts";

const router = express.Router();
const upload = multer({ dest: path.join(process.cwd(), "uploads/") });

router.use(authenticate);

// --- HELPER FUNCTIONS ---
const PLAN_LIMITS: Record<string, number> = {
  'free': 50,
  'basic': 100,
  'pro': 500,
  'enterprise': 1000000000 // Unlimited
};

async function checkProductLimit(storeId: number, additionalCount: number = 1) {
  const storeRes = await pool.query("SELECT plan FROM stores WHERE id = $1", [storeId]);
  const plan = storeRes.rows[0]?.plan || 'free';
  const limit = PLAN_LIMITS[plan] || 50;
  
  const currentCountRes = await pool.query("SELECT COUNT(*)::INT as count FROM products WHERE store_id = $1", [storeId]);
  const currentCount = currentCountRes.rows[0].count;
  
  return currentCount + additionalCount <= limit;
}

async function addStockMovement(client: any, storeId: number, productId: number, type: 'in' | 'out', quantity: number, source: string, description: string, unitPrice: any = null, customerInfo: any = null) {
  const price = unitPrice !== null && unitPrice !== undefined ? Number(unitPrice) : null;
  const info = customerInfo !== null && customerInfo !== undefined ? String(customerInfo) : null;
  await client.query(
    "INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, customer_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [storeId, productId, type, quantity, source, description, price, info]
  );
}

function slugify(text: string) {
  const trMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
  };
  return text.split('').map(c => trMap[c] || c).join('')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

router.get("/products/:id/movements", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;
    
    const result = await pool.query(
      "SELECT * FROM stock_movements WHERE product_id = $1 AND store_id = $2 ORDER BY created_at DESC",
      [id, storeId]
    );
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/products/:id/movements/export", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;
    const lang = req.query.lang || 'tr';
    const isTr = lang === 'tr';
    
    const sourceTranslations: Record<string, Record<string, string>> = {
      tr: {
        quotation: "Teklif",
        purchase_invoice: "Alış Faturası",
        pos: "Satış (POS)",
        manual: "Manuel İşlem",
        sale_payment: "Satış Ödemesi",
        term_sale: "Vadeli Satış",
        collection: "Tahsilat",
        stock_transfer: "Stok Transferi",
        service: "Teknik Servis"
      },
      en: {
        quotation: "Quotation",
        purchase_invoice: "Purchase Invoice",
        pos: "Sale (POS)",
        manual: "Manual Entry",
        sale_payment: "Sale Payment",
        term_sale: "Term Sale",
        collection: "Collection",
        stock_transfer: "Stock Transfer",
        service: "Technical Service"
      },
      de: {
        quotation: "Angebot",
        purchase_invoice: "Eingangsrechnung",
        pos: "Verkauf (POS)",
        manual: "Manueller Eintrag",
        sale_payment: "Verkaufszahlung",
        term_sale: "Terminverkauf",
        collection: "Inkasso",
        stock_transfer: "Lagerumbuchung",
        service: "Technischer Service"
      }
    };

    const colNames: Record<string, any> = {
      tr: { date: "Tarih", type: "Tip", quantity: "Miktar", source: "Kaynak", description: "Açıklama", price: "Birim Fiyat", customer: "Müşteri/Tedarikçi" },
      en: { date: "Date", type: "Type", quantity: "Quantity", source: "Source", description: "Description", price: "Unit Price", customer: "Customer/Supplier" },
      de: { date: "Datum", type: "Typ", quantity: "Menge", source: "Quelle", description: "Beschreibung", price: "Einzelpreis", customer: "Kunde/Lieferant" }
    };
    const currentCols = colNames[lang as string] || colNames.tr;

    const productRes = await pool.query("SELECT name FROM products WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (productRes.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    const productName = productRes.rows[0].name;

    const result = await pool.query(
      "SELECT created_at, type, quantity, source, description, unit_price, customer_info FROM stock_movements WHERE product_id = $1 AND store_id = $2 ORDER BY created_at DESC",
      [id, storeId]
    );

    const movements = result.rows.map(m => ({
      [currentCols.date]: new Date(m.created_at).toLocaleString(isTr ? 'tr-TR' : 'en-US'),
      [currentCols.type]: m.type === 'in' ? (isTr ? 'Giriş' : (lang === 'de' ? 'Eingang' : 'In')) : (isTr ? 'Çıkış' : (lang === 'de' ? 'Ausgang' : 'Out')),
      [currentCols.quantity]: m.quantity,
      [currentCols.source]: (sourceTranslations[lang as string] || sourceTranslations.tr)[m.source] || m.source,
      [currentCols.description]: m.description,
      [currentCols.price]: m.unit_price,
      [currentCols.customer]: m.customer_info
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(movements);
    XLSX.utils.book_append_sheet(wb, ws, isTr ? "Hareketler" : (lang === 'de' ? "Bewegungen" : "Movements"));
    
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    const safeName = slugify(productName);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="hareketler_${safeName}.xlsx"`);
    res.send(buffer);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// StoreAdmin: Info & Branding
router.get("/info", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  const slug = req.query.slug;
  
  let storeRes;
  if (storeId !== undefined && storeId !== null && storeId !== "") {
    storeRes = await pool.query("SELECT * FROM stores WHERE id = $1", [storeId]);
  } else if (slug) {
    storeRes = await pool.query("SELECT * FROM stores WHERE slug = $1", [slug]);
  } else {
    return res.status(400).json({ error: "Store ID or Slug required" });
  }

  const store = storeRes.rows[0];
  if (!store) return res.status(404).json({ error: "Store not found" });

  if (typeof store.currency_rates === 'string') {
    try {
      store.currency_rates = JSON.parse(store.currency_rates);
    } catch (e) {
      store.currency_rates = { "USD": 1, "EUR": 1, "GBP": 1 };
    }
  } else if (!store.currency_rates) {
    store.currency_rates = { "USD": 1, "EUR": 1, "GBP": 1 };
  }

  if (store.parent_id) {
    const parentRes = await pool.query("SELECT name, slug FROM stores WHERE id = $1", [store.parent_id]);
    if (parentRes.rows[0]) {
      store.parent_slug = parentRes.rows[0].slug;
      store.parent_name = parentRes.rows[0].name;
    }
  }

  res.json(store);
});

router.post("/branding", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

  const { 
    name, logo_url, favicon_url, primary_color, default_currency, 
    background_image_url, language, fiscal_brand, fiscal_terminal_id, 
    fiscal_active, currency_rates, plan, country, phone, address,
    hero_title, hero_subtitle, hero_image_url, instagram_url, 
    facebook_url, twitter_url, whatsapp_number, about_text, default_tax_rate,
    category_tax_rules, faq, blog_posts, legal_pages, social_links
  } = req.body;
  await pool.query(
    `UPDATE stores SET 
      name = $1, logo_url = $2, favicon_url = $3, primary_color = $4, 
      default_currency = $5, background_image_url = $6, language = $7, 
      fiscal_brand = $8, fiscal_terminal_id = $9, fiscal_active = $10, 
      currency_rates = $11, plan = $12, country = $13, phone = $14, 
      address = $15, hero_title = $16, hero_subtitle = $17, 
      hero_image_url = $18, instagram_url = $19, facebook_url = $20, 
      twitter_url = $21, whatsapp_number = $22, about_text = $23, default_tax_rate = $24,
      category_tax_rules = $25, faq = $26, blog_posts = $27, legal_pages = $28,
      social_links = $29
    WHERE id = $30`, 
    [
      name, logo_url, favicon_url, primary_color, default_currency || 'TRY', 
      background_image_url, language || 'tr', fiscal_brand, fiscal_terminal_id, 
      fiscal_active, JSON.stringify(currency_rates || {"USD": 1, "EUR": 1, "GBP": 1}), 
      plan || 'free', country || 'TR', phone, address,
      hero_title, hero_subtitle, hero_image_url, instagram_url, 
      facebook_url, twitter_url, whatsapp_number, about_text, default_tax_rate || 20,
      JSON.stringify(category_tax_rules || []),
      JSON.stringify(faq || []),
      JSON.stringify(blog_posts || []),
      JSON.stringify(legal_pages || {}),
      JSON.stringify(social_links || {}),
      storeId
    ]
  );
  res.json({ success: true });
});

// StoreAdmin: Reports & Analytics
router.get("/reports/daily-sales", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { startDate, endDate } = req.query;
    
    let baseQuery = `
      -- Initial payments for sales (Cash, Card, Bank)
      SELECT sp.payment_method, sp.amount, sp.created_at, s.store_id, s.customer_name, s.id as sale_id, 'sale_payment' as source
      FROM sale_payments sp
      JOIN sales s ON sp.sale_id = s.id
      WHERE s.status = 'completed'
      
      UNION ALL
      
      -- Term sales (recorded as debt in current account)
      SELECT cat.payment_method, cat.amount, cat.transaction_date as created_at, cat.store_id, c.title as customer_name, cat.sale_id, 'term_sale' as source
      FROM current_account_transactions cat
      LEFT JOIN companies c ON cat.company_id = c.id
      WHERE cat.type = 'debt' 
      AND cat.payment_method = 'term'
      
      UNION ALL
      
      -- Direct payments to current accounts (Collections)
      SELECT cat.payment_method, cat.amount, cat.transaction_date as created_at, cat.store_id, c.title as customer_name, NULL as sale_id, 'collection' as source
      FROM current_account_transactions cat
      LEFT JOIN companies c ON cat.company_id = c.id
      WHERE cat.type = 'credit' 
      AND cat.payment_method IS NOT NULL
      AND cat.quotation_id IS NULL
    `;

    let summaryQuery = `
      SELECT 
        payment_method,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count
      FROM (${baseQuery}) combined
      WHERE store_id = $1
    `;

    let detailsQuery = `
      SELECT * FROM (${baseQuery}) combined
      WHERE store_id = $1
    `;

    const params: any[] = [storeId];
    let dateFilter = "";

    if (startDate) {
      params.push(startDate);
      dateFilter += ` AND created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(`${endDate} 23:59:59`);
      dateFilter += ` AND created_at <= $${params.length}`;
    }

    summaryQuery += dateFilter + " GROUP BY payment_method";
    detailsQuery += dateFilter + " ORDER BY created_at DESC";

    const summaryResult = await pool.query(summaryQuery, params);
    const detailsResult = await pool.query(detailsQuery, params);

    res.json({
      summary: summaryResult.rows,
      details: detailsResult.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/analytics", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

  try {
    const totalScans = (await pool.query("SELECT COUNT(*)::INT as count FROM scan_logs WHERE store_id = $1", [storeId])).rows[0].count;
    const totalProducts = (await pool.query("SELECT COUNT(*)::INT as count FROM products WHERE store_id = $1", [storeId])).rows[0].count;
    const lowStockCount = (await pool.query("SELECT COUNT(*)::INT as count FROM products WHERE store_id = $1 AND stock_quantity <= min_stock_level", [storeId])).rows[0].count;
    
    const totalSalesAmount = (await pool.query("SELECT SUM(total_amount)::FLOAT as amount FROM sales WHERE store_id = $1 AND status = 'completed'", [storeId])).rows[0].amount || 0;

    const dailyScans = await pool.query(`
      SELECT TO_CHAR(d.date, 'DD/MM') as date, COALESCE(s.count, 0)::INT as count FROM (
        SELECT (CURRENT_DATE - (n || ' days')::INTERVAL)::DATE as date
        FROM generate_series(0, 6) n
      ) d
      LEFT JOIN (
        SELECT DATE(created_at) as scan_date, COUNT(*)::INT as count 
        FROM scan_logs 
        WHERE store_id = $1 
        GROUP BY DATE(created_at)
      ) s ON d.date = s.scan_date
      ORDER BY d.date ASC
    `, [storeId]);

    const dailySales = await pool.query(`
      SELECT TO_CHAR(d.date, 'DD/MM') as date, COALESCE(s.amount, 0)::FLOAT as amount FROM (
        SELECT (CURRENT_DATE - (n || ' days')::INTERVAL)::DATE as date
        FROM generate_series(0, 6) n
      ) d
      LEFT JOIN (
        SELECT DATE(created_at) as sale_date, SUM(total_amount) as amount 
        FROM sales 
        WHERE store_id = $1 AND status = 'completed'
        GROUP BY DATE(created_at)
      ) s ON d.date = s.sale_date
      ORDER BY d.date ASC
    `, [storeId]);

    const topProducts = await pool.query(`
      SELECT p.name, p.barcode, COUNT(l.id)::INT as count 
      FROM scan_logs l 
      JOIN products p ON l.product_id = p.id 
      WHERE l.store_id = $1 
      GROUP BY l.product_id, p.name, p.barcode 
      ORDER BY count DESC 
      LIMIT 5
    `, [storeId]);

    const lowStockProducts = await pool.query(`
      SELECT name, barcode, stock_quantity, min_stock_level 
      FROM products 
      WHERE store_id = $1 AND stock_quantity <= min_stock_level
      ORDER BY stock_quantity ASC
      LIMIT 5
    `, [storeId]);

    const topCompanies = await pool.query(`
      SELECT c.id, c.title, 
             COALESCE(SUM(CASE WHEN t.type = 'debt' THEN t.amount ELSE -t.amount END), 0)::FLOAT as balance
      FROM companies c
      LEFT JOIN current_account_transactions t ON c.id = t.company_id
      WHERE c.store_id = $1
      GROUP BY c.id, c.title
      HAVING COALESCE(SUM(CASE WHEN t.type = 'debt' THEN t.amount ELSE -t.amount END), 0) > 0
      ORDER BY balance DESC
      LIMIT 5
    `, [storeId]);

    res.json({
      total_scans: totalScans,
      total_products: totalProducts,
      low_stock_count: lowStockCount,
      total_sales_amount: totalSalesAmount,
      daily_scans: dailyScans.rows,
      daily_sales: dailySales.rows,
      top_products: topProducts.rows,
      low_stock_products: lowStockProducts.rows,
      top_companies: topCompanies.rows
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// StoreAdmin: Users
router.get("/users", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

  const users = await pool.query("SELECT id, email, role FROM users WHERE store_id = $1", [storeId]);
  res.json(users.rows);
});

router.post("/users", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

  const { email, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    await pool.query("INSERT INTO users (store_id, email, password, role) VALUES ($1, $2, $3, $4)", [storeId, email, hashedPassword, role]);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
});

router.delete("/users/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    // Ensure user belongs to this store
    const userRes = await pool.query("SELECT * FROM users WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });

    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (e: any) {
    console.error("Delete user error:", e);
    res.status(500).json({ error: e.message });
  }
});

// StoreAdmin: Products
router.get("/products", async (req: any, res) => {
  const currentStoreId = req.user.store_id;
  const requestedStoreId = req.query.storeId || currentStoreId;
  const includeBranches = req.query.includeBranches === 'true';
  
  if (!requestedStoreId) return res.status(400).json({ error: "Store ID required" });

  try {
    const storeIdNum = Number(requestedStoreId);
    if (isNaN(storeIdNum)) return res.status(400).json({ error: "Invalid Store ID" });

    let storeIds = [storeIdNum];

    // Find parent_id to get the whole group for authorization and branch inclusion
    const storeRes = await pool.query("SELECT id, parent_id FROM stores WHERE id = $1", [storeIdNum]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Store not found" });
    
    const parentId = storeRes.rows[0].parent_id || storeIdNum;

    if (includeBranches) {
      const groupRes = await pool.query("SELECT id FROM stores WHERE id = $1 OR parent_id = $1", [parentId]);
      storeIds = groupRes.rows.map(r => r.id);
    }

    // Authorization check for non-superadmins
    if (req.user.role !== "superadmin") {
      const currentStoreRes = await pool.query("SELECT id, parent_id FROM stores WHERE id = $1", [currentStoreId]);
      if (currentStoreRes.rows.length === 0) return res.status(403).json({ error: "User store not found" });
      
      const userParentId = currentStoreRes.rows[0].parent_id || currentStoreId;
      console.log(`[DEBUG] GET /products: currentStoreId=${currentStoreId}, requestedStoreId=${requestedStoreId}, userParentId=${userParentId}, storeIds=${JSON.stringify(storeIds)}`);

      // Rule: Parent store can view any store in their group
      const unauthorizedIds = await pool.query(
        "SELECT id FROM stores WHERE id = ANY($1) AND id != $2 AND parent_id != $2",
        [storeIds, userParentId]
      );

      if (unauthorizedIds.rows.length > 0) {
        console.log(`[DEBUG] GET /products: Unauthorized IDs found: ${JSON.stringify(unauthorizedIds.rows.map(r => r.id))}`);
        return res.status(403).json({ error: "Unauthorized to view products from these stores" });
      }
    }

    const search = req.query.search as string;
    let query = `
      SELECT p.*, s.name as store_name 
      FROM products p 
      JOIN stores s ON p.store_id = s.id 
      WHERE p.store_id = ANY($1)
    `;
    const params: any[] = [storeIds];

    if (search) {
      query += ` AND (LOWER(p.name) LIKE LOWER($2) OR p.barcode LIKE $2)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY p.name ASC`;

    const productsRes = await pool.query(query, params);
    res.json(productsRes.rows);
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

  const { barcode, name, price, currency, cost_price, cost_currency, description, stock_quantity, min_stock_level, unit, category, sub_category, brand, author, labels, image_url } = req.body;
  if (!barcode || !name || !price) return res.status(400).json({ error: "Missing fields" });
  
  try {
    // Check if barcode already exists for this store
    const existing = await pool.query("SELECT id FROM products WHERE store_id = $1 AND barcode = $2", [storeId, String(barcode)]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Bu barkod ile ürün oluşturuldu!" });
    }

    // Check limit
    const canAdd = await checkProductLimit(storeId);
    if (!canAdd) {
      return res.status(400).json({ error: "Ürün limitine ulaşıldı. Lütfen planınızı yükseltin." });
    }

    const result = await pool.query(`
      INSERT INTO products (store_id, barcode, name, price, currency, cost_price, cost_currency, description, stock_quantity, min_stock_level, unit, category, sub_category, brand, author, labels, image_url, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      storeId, String(barcode), name, parseFloat(price), currency || 'TRY', 
      parseFloat(cost_price) || 0, cost_currency || 'TRY', description || '', 
      parseFloat(stock_quantity) || 0, parseFloat(min_stock_level) || 5, unit || 'Adet', 
      category || '', sub_category || '', brand || '', author || '', 
      JSON.stringify(labels || []), image_url || ''
    ]);
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// StoreAdmin: Bulk Update Price
router.put("/products/bulk-update-price", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  const { target, category, type, value, direction, rounding } = req.body;

  if (!value || isNaN(value) || value <= 0) {
    return res.status(400).json({ error: "Geçerli bir değer giriniz." });
  }

  let priceCalc = "price";
  const val = Number(value);

  if (type === 'amount') {
    if (direction === 'increase') priceCalc = `price + ${val}`;
    else priceCalc = `GREATEST(price - ${val}, 0)`;
  } else if (type === 'percentage') {
    const multiplier = direction === 'increase' ? (1 + val / 100) : (1 - val / 100);
    priceCalc = `price * ${multiplier}`;
  }

  if (rounding === 'round') {
    priceCalc = `ROUND(CAST(${priceCalc} AS numeric), 0)`;
  } else if (rounding === 'ceil') {
    priceCalc = `CEIL(${priceCalc})`;
  } else if (rounding === 'floor') {
    priceCalc = `FLOOR(${priceCalc})`;
  } else {
    priceCalc = `ROUND(CAST(${priceCalc} AS numeric), 2)`;
  }

  try {
    let query = `UPDATE products SET price = ${priceCalc}, updated_at = CURRENT_TIMESTAMP WHERE store_id = $1`;
    const params: any[] = [storeId];

    if (target === 'category' && category) {
      query += ` AND LOWER(TRIM(category)) = LOWER(TRIM($2))`;
      params.push(category);
    }

    const result = await pool.query(query, params);
    
    // Log the action
    await logAction(
      storeId, 
      req.user.id, 
      "bulk_price_update", 
      "product", 
      null, 
      `Toplu fiyat güncelleme: ${target === 'all' ? 'Tüm ürünler' : category + ' kategorisi'}, ${direction === 'increase' ? 'Artış' : 'Azalış'}, ${type === 'percentage' ? '%' + value : value + ' ₺'}, Yuvarlama: ${rounding}`,
      { target, category, type, value, direction, rounding },
      { count: result.rowCount }
    );

    res.json({ success: true, count: result.rowCount });
  } catch (e: any) {
    console.error("Bulk price update error:", e);
    res.status(500).json({ error: e.message });
  }
});

// StoreAdmin: Bulk Update Tax by Category
router.put("/products/bulk-update-tax", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  const { category, taxRate, includeBranches } = req.body;
  if (!category || taxRate === undefined) {
    return res.status(400).json({ error: "Category and taxRate are required" });
  }

  try {
    let storeIds = [storeId];
    if (includeBranches) {
      const branchesRes = await pool.query("SELECT id FROM stores WHERE parent_id = $1", [storeId]);
      storeIds = [storeId, ...branchesRes.rows.map(r => r.id)];
    }

    const result = await pool.query(
      "UPDATE products SET tax_rate = $1, updated_at = CURRENT_TIMESTAMP WHERE store_id = ANY($2) AND LOWER(TRIM(category)) = LOWER(TRIM($3))",
      [taxRate, storeIds, category]
    );

    // Log the action
    await logAction(
      storeId, 
      req.user.id, 
      "bulk_tax_update", 
      "product", 
      null, 
      `Toplu KDV güncelleme: ${category} kategorisi, Yeni KDV: %${taxRate}, Etkilenen Ürün: ${result.rowCount}`,
      { category, taxRate, affectedRows: result.rowCount },
      { category, newTaxRate: taxRate, count: result.rowCount }
    );

    res.json({ success: true, count: result.rowCount });
  } catch (e: any) {
    console.error("Bulk tax update error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.put("/products/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

  const { id } = req.params;
  const { barcode, name, price, currency, cost_price, cost_currency, description, stock_quantity, min_stock_level, unit, category, sub_category, brand, author, labels, image_url } = req.body;
  try {
    await pool.query(`
      UPDATE products SET 
        barcode = $1, name = $2, price = $3, currency = $4, 
        cost_price = $5, cost_currency = $6, description = $7, 
        stock_quantity = $8, min_stock_level = $9, unit = $10, 
        category = $11, sub_category = $12, brand = $13, author = $14, 
        labels = $15, image_url = $16, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $17 AND store_id = $18
    `, [
      String(barcode), name, parseFloat(price), currency || 'TRY', 
      parseFloat(cost_price) || 0, cost_currency || 'TRY', description || '', 
      parseFloat(stock_quantity) || 0, parseFloat(min_stock_level) || 5, unit || 'Adet', 
      category || '', sub_category || '', brand || '', author || '', 
      JSON.stringify(labels || []), image_url || '', id, storeId
    ]);
    
    // Log the action
    await logAction(
      storeId, 
      req.user.id, 
      "product_update", 
      "product", 
      parseInt(id), 
      `Ürün güncellendi: ${name} (${barcode})`,
      null,
      req.body
    );

    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/products/all", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    await pool.query("DELETE FROM products WHERE store_id = $1", [storeId]);

    // Log the action
    await logAction(
      storeId, 
      req.user.id, 
      "product_delete_all", 
      "product", 
      null, 
      `Tüm ürünler silindi`,
      null,
      null
    );

    res.json({ success: true });
  } catch (e: any) {
    console.error("Delete all products error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/products/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    const { id } = req.params;
    await pool.query("DELETE FROM products WHERE id = $1 AND store_id = $2", [id, storeId]);

    // Log the action
    await logAction(
      storeId, 
      req.user.id, 
      "product_delete", 
      "product", 
      parseInt(id), 
      `Ürün silindi (ID: ${id})`,
      null,
      null
    );

    res.json({ success: true });
  } catch (e: any) {
    console.error("Delete product error:", e);
    res.status(500).json({ error: e.message });
  }
});

// StoreAdmin: Audit Logs
router.get("/audit-logs", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const result = await pool.query(`
      SELECT a.*, u.email as user_email 
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.store_id = $1
      ORDER BY a.created_at DESC
      LIMIT 100
    `, [storeId]);
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// StoreAdmin: Import Data
router.post("/import", upload.single("file"), async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const convertCurrencyFlag = req.body.convertCurrency === 'true';

  let mapping;
  try {
    mapping = JSON.parse(req.body.mapping);
  } catch (e) {
    return res.status(400).json({ error: "Invalid mapping data" });
  }

  if (!mapping.barcode || !mapping.name || !mapping.price) {
    return res.status(400).json({ error: "Barcode, Name, and Price columns must be mapped" });
  }
  
  const client = await pool.connect();
  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', codepage: 65001 });
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) {
      client.release();
      return res.status(400).json({ error: "The uploaded file is empty" });
    }

    let successCount = 0;
    
    // Fetch store branding for currency rates if needed
    let currencyRates: any = { "USD": 1, "EUR": 1, "GBP": 1 };
    let defaultCurrency = 'TRY';
    if (convertCurrencyFlag) {
      const storeRes = await pool.query("SELECT currency_rates, default_currency FROM stores WHERE id = $1", [storeId]);
      if (storeRes.rows.length > 0) {
        currencyRates = storeRes.rows[0].currency_rates || currencyRates;
        defaultCurrency = storeRes.rows[0].default_currency || 'TRY';
      }
    }

    // Check limit for the whole batch
    const canAddBatch = await checkProductLimit(storeId, data.length);
    if (!canAddBatch) {
      // Find out how many more we can add
      const storeRes = await pool.query("SELECT plan FROM stores WHERE id = $1", [storeId]);
      const plan = storeRes.rows[0]?.plan || 'free';
      const limit = PLAN_LIMITS[plan] || 50;
      const currentCountRes = await pool.query("SELECT COUNT(*)::INT as count FROM products WHERE store_id = $1", [storeId]);
      const currentCount = currentCountRes.rows[0].count;
      const remaining = limit - currentCount;
      
      if (remaining <= 0) {
        throw new Error(`Ürün limitine ulaşıldı (${limit}). Lütfen planınızı yükseltin.`);
      }
      throw new Error(`Bu dosya ile toplam ürün sayınız limitinizi (${limit}) aşıyor. En fazla ${remaining} ürün daha ekleyebilirsiniz.`);
    }

    await client.query("BEGIN");
    const importLogs: any[] = [];
    for (const item of data as any[]) {
      const barcode = String(item[mapping.barcode] || "").trim();
      const name = String(item[mapping.name] || "").trim();
      const rawPrice = item[mapping.price];
      let price = 0;
      if (rawPrice !== undefined && rawPrice !== null) {
        let s = String(rawPrice).trim();
        // Remove currency symbols and other non-numeric chars except . and ,
        s = s.replace(/[^0-9.,]/g, "");
        
        if (s.includes('.') && s.includes(',')) {
          if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
            s = s.replace(/,/g, "");
          } else {
            s = s.replace(/\./g, "").replace(",", ".");
          }
        } else if (s.includes(',')) {
          // Check if it's a thousands separator (e.g. 1,200) or decimal (e.g. 195,00)
          // In Turkish context, comma is usually decimal.
          // If there's only one comma and it's followed by 2 digits at the end, it's decimal.
          if (s.match(/,\d{2}$/)) {
            s = s.replace(",", ".");
          } else if (s.match(/,\d{3}/)) {
            // Likely thousands separator
            s = s.replace(",", "");
          } else {
            // Default to decimal for single comma
            s = s.replace(",", ".");
          }
        }
        price = parseFloat(s) || 0;
      }

      if (importLogs.length < 20 || barcode === '9789750718533') {
        importLogs.push({ barcode, name, price, rawPrice: item[mapping.price] });
      }

      if (barcode && !isNaN(price)) {
        const existing = await client.query("SELECT id, stock_quantity FROM products WHERE store_id = $1 AND barcode = $2", [storeId, barcode]);

        let currency = item[mapping.currency] || mapping.currency || 'TRY';
        
        // Handle currency conversion if requested
        if (convertCurrencyFlag && currency !== defaultCurrency) {
          const rate = currencyRates[currency];
          const defaultRate = currencyRates[defaultCurrency];
          if (rate && defaultRate) {
            // Convert to base (USD usually has rate 1), then to default
            const priceInBase = price / rate;
            price = priceInBase * defaultRate;
            currency = defaultCurrency;
          }
        }

        const stockQuantityRaw = item[mapping.stock_quantity];
        const hasStockUpdate = stockQuantityRaw !== undefined && stockQuantityRaw !== null && String(stockQuantityRaw).trim() !== "";
        const stockQuantity = hasStockUpdate ? parseInt(String(stockQuantityRaw)) || 0 : 0;
        
        const minStockLevel = parseInt(String(item[mapping.min_stock_level] || "5")) || 5;
        const unit = (mapping.unit && item[mapping.unit] !== undefined && item[mapping.unit] !== null && String(item[mapping.unit]).trim() !== "") 
          ? String(item[mapping.unit]).trim() 
          : 'Adet';
        
        const categoryRaw = item[mapping.category];
        const hasCategoryUpdate = categoryRaw !== undefined && categoryRaw !== null && String(categoryRaw).trim() !== "";
        const category = hasCategoryUpdate ? String(categoryRaw).trim() : '';

        if (existing.rows.length > 0) {
          // Update existing product
          const existingId = existing.rows[0].id;
          
          let updateQuery = "UPDATE products SET updated_at = CURRENT_TIMESTAMP, price = $2";
          let updateParams: any[] = [existingId, price];
          let paramIdx = 3;

          if (name) {
            updateQuery += `, name = $${paramIdx}`;
            updateParams.push(name);
            paramIdx++;
          }

          if (hasStockUpdate) {
            updateQuery += `, stock_quantity = $${paramIdx}`;
            updateParams.push(stockQuantity);
            paramIdx++;
          }

          if (hasCategoryUpdate) {
            updateQuery += `, category = $${paramIdx}`;
            updateParams.push(category);
            paramIdx++;
          }

          if (mapping.sub_category && item[mapping.sub_category] !== undefined) {
            updateQuery += `, sub_category = $${paramIdx}`;
            updateParams.push(String(item[mapping.sub_category]).trim() || '');
            paramIdx++;
          }

          if (mapping.brand && item[mapping.brand] !== undefined) {
            updateQuery += `, brand = $${paramIdx}`;
            updateParams.push(String(item[mapping.brand]).trim() || '');
            paramIdx++;
          }

          if (mapping.author && item[mapping.author] !== undefined) {
            updateQuery += `, author = $${paramIdx}`;
            updateParams.push(String(item[mapping.author]).trim() || '');
            paramIdx++;
          }

          if (mapping.description && item[mapping.description] !== undefined) {
            updateQuery += `, description = $${paramIdx}`;
            updateParams.push(item[mapping.description] || '');
            paramIdx++;
          }

          if (mapping.unit && item[mapping.unit] !== undefined) {
            updateQuery += `, unit = $${paramIdx}`;
            updateParams.push(String(item[mapping.unit]).trim() || 'Adet');
            paramIdx++;
          }

          if (mapping.currency && item[mapping.currency] !== undefined) {
            updateQuery += `, currency = $${paramIdx}`;
            updateParams.push(item[mapping.currency] || 'TRY');
            paramIdx++;
          }

          if (mapping.min_stock_level && item[mapping.min_stock_level] !== undefined) {
            updateQuery += `, min_stock_level = $${paramIdx}`;
            updateParams.push(parseInt(String(item[mapping.min_stock_level])) || 5);
            paramIdx++;
          }

          updateQuery += ` WHERE id = $1`;
          await client.query(updateQuery, updateParams);
          successCount++;
        } else {
          // Insert new product
          await client.query(`
            INSERT INTO products (store_id, barcode, name, price, currency, description, stock_quantity, min_stock_level, unit, category, sub_category, brand, author, updated_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
          `, [
            storeId,
            barcode,
            name || 'İsimsiz Ürün',
            price,
            currency,
            item[mapping.description] || '',
            stockQuantity,
            minStockLevel,
            unit,
            category,
            item[mapping.sub_category] || '',
            item[mapping.brand] || '',
            item[mapping.author] || ''
          ]);
          successCount++;
        }
      }
    }
    await client.query("COMMIT");
    
    try {
      // Log the import process for debugging - use a safer path
      const logPath = path.join(process.cwd(), 'import_log.json');
      fs.writeFileSync(logPath, JSON.stringify(importLogs, null, 2));
      console.log(`Import log written to ${logPath}`);
    } catch (logError) {
      console.error("Failed to write import log:", logError);
    }

    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.json({ success: true, count: successCount, total: data.length });
  } catch (e: any) {
    console.error("Import error:", e);
    if (client) await client.query("ROLLBACK");
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// StoreAdmin: Customers
router.get("/customers", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query("SELECT id, email, name, full_name, phone, address, tax_number, tax_office, created_at FROM customers WHERE store_id = $1 ORDER BY created_at DESC", [storeId]);
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/customers", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { name, email, phone, address, tax_number, tax_office } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO customers (store_id, name, full_name, email, password, phone, address, tax_number, tax_office) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [storeId, name, name, email || `cust_${Date.now()}@example.com`, 'nopass', phone || '', address || '', tax_number || '', tax_office || '']
    );
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/customers/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { name, email, phone, address, tax_number, tax_office } = req.body;
  try {
    const result = await pool.query(
      "UPDATE customers SET name = $1, full_name = $2, email = $3, phone = $4, address = $5, tax_number = $6, tax_office = $7 WHERE id = $8 AND store_id = $9 RETURNING *",
      [name, name, email, phone, address, tax_number, tax_office, req.params.id, storeId]
    );
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// StoreAdmin: Returns
router.get("/returns", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query(`
      SELECT r.*, s.customer_name, s.total_amount, s.currency 
      FROM return_requests r 
      JOIN sales s ON r.sale_id = s.id 
      WHERE r.store_id = $1 
      ORDER BY r.created_at DESC
    `, [storeId]);
    res.json(result.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/returns/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;
  const { status, admin_notes } = req.body;
  try {
    const result = await pool.query(
      "UPDATE return_requests SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND store_id = $4 RETURNING *",
      [status, admin_notes, id, storeId]
    );
    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// StoreAdmin: Branding (already updated above, but ensuring it handles all new fields)
router.get("/quotations", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    if (!storeId) return res.status(400).json({ error: "Store ID required" });
    
    const { search, status, startDate, endDate } = req.query;
    let query = "SELECT * FROM quotations WHERE store_id = $1";
    let params: any[] = [storeId];
    
    if (search) {
      query += ` AND (customer_name ILIKE $${params.length + 1} OR customer_title ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
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

router.get("/quotations/:id", async (req: any, res) => {
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

router.post("/quotations", async (req: any, res) => {
  const client = await pool.connect();
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const { customer_name, customer_title, total_amount, currency, notes, items, company_id, expiry_date, payment_method, due_date } = req.body;
    
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
      "INSERT INTO quotations (store_id, customer_name, customer_title, total_amount, currency, notes, company_id, expiry_date, payment_method, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id",
      [storeId, customer_name, customer_title, total_amount, currency, notes, finalCompanyId || null, expiry_date || null, payment_method || 'cash', due_date || null]
    );
    const quotationId = quotRes.rows[0].id;
    
    for (const item of items) {
      await client.query(
        "INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [quotationId, item.product_id || null, item.product_name, item.barcode || null, item.quantity, item.unit_price, item.total_price]
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

router.put("/quotations/:id", async (req: any, res) => {
  const client = await pool.connect();
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
    const { id } = req.params;
    const { customer_name, customer_title, total_amount, currency, notes, items, company_id, expiry_date, payment_method, due_date } = req.body;
    
    await client.query("BEGIN");
    
    const quotRes = await client.query(
      "UPDATE quotations SET customer_name = $1, customer_title = $2, total_amount = $3, currency = $4, notes = $5, company_id = $6, expiry_date = $7, payment_method = $8, due_date = $9 WHERE id = $10 AND store_id = $11 RETURNING id",
      [customer_name, customer_title, total_amount, currency, notes, company_id || null, expiry_date || null, payment_method || 'cash', due_date || null, id, storeId]
    );
    
    if (quotRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Quotation not found" });
    }
    
    await client.query("DELETE FROM quotation_items WHERE quotation_id = $1", [id]);
    
    for (const item of items) {
      await client.query(
        "INSERT INTO quotation_items (quotation_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [id, item.product_id || null, item.product_name, item.barcode || null, item.quantity, item.unit_price, item.total_price]
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

router.delete("/quotations/:id", async (req: any, res) => {
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

router.post("/quotations/:id/approve", async (req: any, res) => {
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

      const saleRes = await client.query(
        "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, payment_method, due_date, quotation_id, notes, company_id) VALUES ($1, $2, $3, 'completed', $4, $5, $6, $7, $8, $9) RETURNING id",
        [storeId, quotation.total_amount, quotation.currency, quotation.customer_name, paymentMethod, dueDate, quotation.id, notes || quotation.notes, quotation.company_id]
      );
      const saleId = saleRes.rows[0].id;

      const itemsRes = await client.query(
        "SELECT qi.*, p.stock_quantity FROM quotation_items qi LEFT JOIN products p ON qi.product_id = p.id WHERE qi.quotation_id = $1", 
        [quotation.id]
      );
      for (const item of itemsRes.rows) {
        await client.query(
          "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
          [saleId, item.product_id, item.product_name, item.barcode, item.quantity, item.unit_price, item.total_price]
        );
        
        if (item.product_id) {
          const stockNeeded = item.quantity;
          const currentStock = item.stock_quantity || 0;

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

          await addStockMovement(client, storeId, item.product_id, 'out', item.quantity, 'quotation', `Satış #${saleId} (Teklif #${quotation.id})`, item.unit_price, quotation.customer_name);
        }
      }

      if (quotation.company_id) {
        await client.query(
          "INSERT INTO current_account_transactions (store_id, company_id, quotation_id, sale_id, type, amount, description, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [storeId, quotation.company_id, quotation.id, saleId, 'debt', quotation.total_amount, `Satışa Dönüşen Teklif #${quotation.id} (${paymentMethod})`, paymentMethod]
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

      await client.query(
        "UPDATE quotations SET status = 'approved', is_sale = TRUE, payment_method = $1, due_date = $2 WHERE id = $3",
        [paymentMethod, dueDate, quotation.id]
      );

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

router.post("/quotations/:id/cancel", async (req: any, res) => {
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

    // If it was approved, we must reverse everything
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

router.get("/schema-check", async (req: any, res) => {
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

// StoreAdmin: Companies
router.get("/companies", async (req: any, res) => {
  try {
    let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
    
    const result = await pool.query(
      `SELECT 
        c.*,
        COALESCE(SUM(CASE WHEN t.type = 'debt' THEN t.amount ELSE -t.amount END), 0) as balance
      FROM companies c
      LEFT JOIN current_account_transactions t ON c.id = t.company_id
      WHERE c.store_id = $1
      GROUP BY c.id
      ORDER BY c.title ASC`,
      [storeId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/companies", async (req: any, res) => {
  const { tax_office, tax_number, address, phone, email, contact_person, representative } = req.body;
  const title = String(req.body.title || "").trim();
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const existing = await pool.query("SELECT * FROM companies WHERE store_id = $1 AND LOWER(TRIM(title)) = LOWER($2)", [storeId, title]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Bu isimde bir cari hesap zaten mevcut." });
    }

    const result = await pool.query(
      "INSERT INTO companies (store_id, title, tax_office, tax_number, address, phone, email, contact_person, representative) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [storeId, title, tax_office, tax_number, address, phone, email, contact_person, representative]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/companies/:id", async (req: any, res) => {
  const { title, tax_office, tax_number, address, phone, email, contact_person, representative } = req.body;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  try {
    const existing = await pool.query("SELECT id FROM companies WHERE store_id = $1 AND LOWER(title) = LOWER($2) AND id != $3", [storeId, title, req.params.id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Bu isimde bir cari hesap zaten mevcut." });
    }

    const result = await pool.query(
      "UPDATE companies SET title = $1, tax_office = $2, tax_number = $3, address = $4, phone = $5, email = $6, contact_person = $7, representative = $8 WHERE id = $9 AND store_id = $10 RETURNING *",
      [title, tax_office, tax_number, address, phone, email, contact_person, representative, req.params.id, storeId]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/companies/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    await pool.query("DELETE FROM companies WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/companies/:id/transactions", async (req: any, res) => {
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  
  const { startDate, endDate } = req.query;
  
  try {
    let query = `
      SELECT 
        c.*, 
        s.due_date,
        s.id as sale_id,
        pi.id as purchase_invoice_id,
        pi.invoice_number as purchase_invoice_number
      FROM current_account_transactions c
      LEFT JOIN sales s ON c.sale_id = s.id
      LEFT JOIN purchase_invoices pi ON c.purchase_invoice_id = pi.id
      WHERE c.company_id = $1 AND c.store_id = $2
    `;
    
    const params: any[] = [req.params.id, storeId];
    
    if (startDate) {
      params.push(startDate);
      query += ` AND c.transaction_date >= $${params.length}`;
    }
    
    if (endDate) {
      params.push(`${endDate} 23:59:59`);
      query += ` AND c.transaction_date <= $${params.length}`;
    }
    
    query += " ORDER BY c.transaction_date ASC, c.id ASC";
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/companies/:id/transactions", async (req: any, res) => {
  const { type, amount, description, transaction_date, payment_method } = req.body;
  let storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  if (storeId === "undefined" || storeId === "null") storeId = req.user.store_id;
  
  try {
    let finalDate = new Date();
    if (transaction_date) {
      const providedDate = new Date(transaction_date);
      const now = new Date();
      if (providedDate.toDateString() === now.toDateString()) {
        finalDate = now;
      } else {
        providedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        finalDate = providedDate;
      }
    }

    const result = await pool.query(
      "INSERT INTO current_account_transactions (store_id, company_id, type, amount, description, transaction_date, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [storeId, req.params.id, type, amount, description, finalDate, payment_method]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/companies/:companyId/transactions/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    await pool.query(
      "DELETE FROM current_account_transactions WHERE id = $1 AND company_id = $2 AND store_id = $3",
      [req.params.id, req.params.companyId, storeId]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// StoreAdmin: Sales (POS)
router.get("/sales", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  const status = req.query.status;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  let query = "SELECT * FROM sales WHERE store_id = $1";
  const params: any[] = [storeId];

  if (status && status !== 'all') {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  if (startDate) {
    params.push(startDate);
    query += ` AND created_at >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate + ' 23:59:59');
    query += ` AND created_at <= $${params.length}`;
  }

  query += " ORDER BY created_at DESC";

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

// StoreAdmin: Fast POS Sale
router.post("/pos/sale", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  const { items, total, paymentMethod, customerName, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // 1. Create Sale
    const saleRes = await client.query(
      "INSERT INTO sales (store_id, total_amount, currency, status, customer_name, payment_method, notes) VALUES ($1, $2, 'TRY', 'completed', $3, $4, $5) RETURNING id",
      [storeId, total || 0, customerName || 'Hızlı Satış', paymentMethod || 'cash', notes || 'Hızlı POS Satışı']
    );
    const saleId = saleRes.rows[0].id;

    // 2. Add Items and Update Stock
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.price);
      await client.query(
        "INSERT INTO sale_items (sale_id, product_id, product_name, barcode, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [saleId, item.id || null, item.name, item.barcode || '', item.quantity, item.price, itemTotal]
      );

      if (item.id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
          [item.quantity, item.id]
        );
        await addStockMovement(client, storeId, item.id, 'out', item.quantity, 'pos', `Hızlı POS Satışı #${saleId}`, item.price, customerName || 'Hızlı Satış');
      }
    }

    // 3. Fiscal Simulation
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
      
      const fiscalNote = `\n[FISCAL] Receipt: ${fiscalResult.receiptNo}, Z-No: ${fiscalResult.zNo}, Brand: ${branding.fiscal_brand}`;
      await client.query("UPDATE sales SET notes = COALESCE(notes, '') || $1 WHERE id = $2", [fiscalNote, saleId]);
    }

    await client.query("COMMIT");

    // Log the action
    await logAction(
      storeId, 
      req.user.id, 
      "pos_sale", 
      "sale", 
      saleId, 
      `Hızlı POS Satışı: ${total} ₺, Ödeme: ${paymentMethod}`,
      null,
      { saleId, total, itemsCount: items.length, fiscal: fiscalResult }
    );

    res.json({ success: true, saleId, fiscal: fiscalResult });
  } catch (e: any) {
    await client.query("ROLLBACK");
    console.error("Fast POS sale error:", e);
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.post("/sales/:id/complete", async (req: any, res) => {
  const { id } = req.params;
  const { paymentMethod, payments, companyId, dueDate } = req.body;
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Check if sale exists and is pending
    const saleRes = await client.query("SELECT * FROM sales WHERE id = $1 AND store_id = $2 FOR UPDATE", [id, storeId]);
    if (saleRes.rows.length === 0) {
      throw new Error("Sale not found");
    }
    const sale = saleRes.rows[0];
    if (sale.status !== 'pending') {
      throw new Error("Sale is not in pending status");
    }

    // 0. Update items if provided
    if (req.body.items && Array.isArray(req.body.items)) {
      // Delete existing items
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
      
      // Update sale total
      await client.query("UPDATE sales SET total_amount = $1 WHERE id = $2", [newTotal, id]);
      sale.total_amount = newTotal; // Update local variable for later use
    }

    const itemsRes = await client.query("SELECT * FROM sale_items WHERE sale_id = $1", [id]);
    
    // 1. Update Stock and Stock Movements
    for (const item of itemsRes.rows) {
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
          [item.quantity, item.product_id]
        );
        await addStockMovement(client, storeId, item.product_id, 'out', item.quantity, 'pos', `Kasa Satışı #${id}`, item.unit_price, sale.customer_name);
      }
    }

    const primaryMethod = payments && payments.length > 0 ? (payments.length > 1 ? 'multiple' : payments[0].method) : (paymentMethod || 'cash');
    
    // 2. Update Sale Status and Info
    await client.query(
      "UPDATE sales SET status = 'completed', payment_method = $1 WHERE id = $2",
      [primaryMethod, id]
    );

    // 3. Handle Payments and Current Account
    // We no longer link to company in POS completion as per user request
    const finalCompanyId = sale.company_id; 
    
    if (payments && payments.length > 0) {
      for (const p of payments) {
        await client.query(
          "INSERT INTO sale_payments (sale_id, payment_method, amount) VALUES ($1, $2, $3)",
          [id, p.method, p.amount]
        );
        
        if (finalCompanyId) {
          // Record as credit in current account for each payment
          await client.query(
            "INSERT INTO current_account_transactions (store_id, company_id, sale_id, type, amount, description, payment_method) VALUES ($1, $2, $3, 'credit', $4, $5, $6)",
            [storeId, finalCompanyId, id, p.amount, `Satış #${id} Ödemesi (${p.method})`, p.method]
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
        // Record debt
        await client.query(
          "INSERT INTO current_account_transactions (store_id, company_id, sale_id, type, amount, description, payment_method) VALUES ($1, $2, $3, 'debt', $4, $5, $6)",
          [storeId, finalCompanyId, id, total, `Satış #${id} (${paymentMethod || 'cash'})`, paymentMethod || 'cash']
        );
        
        if (paymentMethod !== 'term') {
          // Record credit if not term
          await client.query(
            "INSERT INTO current_account_transactions (store_id, company_id, sale_id, type, amount, description, payment_method) VALUES ($1, $2, $3, 'credit', $4, $5, $6)",
            [storeId, finalCompanyId, id, total, `Satış #${id} Ödemesi (${paymentMethod || 'cash'})`, paymentMethod || 'cash']
          );
        }
      }
    }

    // 4. Fiscal Simulation
    const storeBrandingRes = await client.query("SELECT fiscal_active, fiscal_brand, fiscal_terminal_id FROM stores WHERE id = $1", [storeId]);
    const branding = storeBrandingRes.rows[0];
    let fiscalResult = null;
    
    if (branding && branding.fiscal_active) {
      // Simulate fiscal device communication
      fiscalResult = {
        success: true,
        receiptNo: `F-${Math.floor(Math.random() * 1000000)}`,
        zNo: `Z-${Math.floor(Math.random() * 10000)}`,
        brand: branding.fiscal_brand,
        terminal: branding.fiscal_terminal_id,
        timestamp: new Date().toISOString()
      };
      
      // Store fiscal info in sale notes or a new column if we had one. For now, notes.
      const fiscalNote = `\n[FISCAL] Receipt: ${fiscalResult.receiptNo}, Z-No: ${fiscalResult.zNo}, Brand: ${fiscalResult.brand}`;
      await client.query("UPDATE sales SET notes = COALESCE(notes, '') || $1 WHERE id = $2", [fiscalNote, id]);
    }

    await client.query("COMMIT");

    // Log the action
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

router.post("/sales/:id/cancel", async (req: any, res) => {
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

    // Reverse stock
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

    // Reverse Current Account and Payments
    await client.query("DELETE FROM current_account_transactions WHERE sale_id = $1", [sale.id]);
    await client.query("DELETE FROM sale_payments WHERE sale_id = $1", [sale.id]);

    // Update status
    await client.query("UPDATE sales SET status = 'cancelled' WHERE id = $1", [req.params.id]);

    // If linked to quotation, update quotation too
    if (sale.quotation_id) {
      await client.query("UPDATE quotations SET status = 'cancelled', is_sale = FALSE WHERE id = $1", [sale.quotation_id]);
    }

    await client.query("COMMIT");

    // Log the action
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

router.delete("/sales/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Check if sale belongs to store
    const saleRes = await client.query("SELECT * FROM sales WHERE id = $1 AND store_id = $2 FOR UPDATE", [req.params.id, storeId]);
    if (saleRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Sale not found" });
    }

    const sale = saleRes.rows[0];

    // If it was completed, reverse stock before deleting
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

    // Delete related records
    await client.query("DELETE FROM procurements WHERE sale_id = $1", [sale.id]);
    await client.query("DELETE FROM current_account_transactions WHERE sale_id = $1", [sale.id]);
    await client.query("DELETE FROM sale_items WHERE sale_id = $1", [sale.id]);
    await client.query("DELETE FROM sale_payments WHERE sale_id = $1", [sale.id]);
    await client.query("DELETE FROM sales WHERE id = $1 AND store_id = $2", [sale.id, storeId]);
    
    // If linked to quotation, reset quotation status
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

// --- Sales Invoices ---

router.get("/sales-invoices", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const { startDate, endDate, status } = req.query;

    let query = `
      SELECT si.*, 
             c.title as company_name,
             cust.full_name as customer_name,
             s.customer_name as sale_customer_name
      FROM sales_invoices si 
      LEFT JOIN companies c ON si.company_id = c.id 
      LEFT JOIN customers cust ON si.customer_id = cust.id
      LEFT JOIN sales s ON si.sale_id = s.id
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

    query += " ORDER BY si.invoice_date DESC, si.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/sales-invoices/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const invoiceResult = await pool.query(
      `SELECT si.*, 
              c.title as company_name,
              cust.full_name as customer_name
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
    
    res.json(invoice);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/sales-invoices", async (req: any, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { 
      storeId: bodyStoreId, 
      sale_id,
      company_id, 
      customer_id, 
      invoice_number, 
      waybill_number,
      invoice_date, 
      items, 
      notes, 
      currency, 
      invoice_type,
      status
    } = req.body;
    
    let storeId = req.user.store_id;
    if (req.user.role === "superadmin" && bodyStoreId) {
      storeId = bodyStoreId;
    }

    if (!storeId) throw new Error("Store ID is required");
    
    // Calculate totals
    let total_amount = 0;
    let tax_amount = 0;
    let grand_total = 0;
    
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      const itemTax = itemTotal * (Number(item.tax_rate) / 100);
      total_amount += itemTotal;
      tax_amount += itemTax;
      grand_total += (itemTotal + itemTax);
    }
    
    // Insert invoice
    const invoiceResult = await client.query(
      `INSERT INTO sales_invoices 
        (store_id, sale_id, company_id, customer_id, invoice_number, waybill_number, invoice_date, total_amount, tax_amount, grand_total, currency, notes, invoice_type, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
      [storeId, sale_id || null, company_id || null, customer_id || null, invoice_number, waybill_number || null, invoice_date || new Date(), total_amount, tax_amount, grand_total, currency || 'TRY', notes, invoice_type || 'manual', status || 'draft']
    );
    
    const invoiceId = invoiceResult.rows[0].id;
    
    // Get display name for logs
    let displayName = 'Müşteri';
    if (company_id) {
      const companyRes = await client.query("SELECT title FROM companies WHERE id = $1", [company_id]);
      if (companyRes.rows.length > 0) displayName = companyRes.rows[0].title;
    } else if (customer_id) {
      const custRes = await client.query("SELECT full_name FROM customers WHERE id = $1", [customer_id]);
      if (custRes.rows.length > 0) displayName = custRes.rows[0].full_name;
    }

    // Insert items and update stock
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      const itemTax = itemTotal * (Number(item.tax_rate) / 100);
      
      await client.query(
        `INSERT INTO sales_invoice_items 
          (sales_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [invoiceId, item.product_id || null, item.product_name, item.barcode || '', item.quantity, item.unit_price, item.tax_rate, itemTax, itemTotal]
      );
      
      // Update stock if product_id is provided
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, storeId]
        );
        
        // Log stock movement
        await addStockMovement(client, storeId, item.product_id, 'out', item.quantity, 'sales_invoice', `Satış Faturası: ${invoice_number}`, item.unit_price, displayName);
      }
    }
    
    // Add transaction to current account if company_id is provided
    if (company_id) {
      await client.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, sales_invoice_id, type, amount, description) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [storeId, company_id, invoiceId, 'debt', grand_total, `Satış Faturası: ${invoice_number}`]
      );

      // If payment method is provided, add a credit transaction to offset the debt
      if (payment_method && payment_method !== 'term') {
        await client.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, sales_invoice_id, type, amount, description, payment_method) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [storeId, company_id, invoiceId, 'credit', grand_total, `Satış Faturası Tahsilatı: ${invoice_number} (${payment_method})`, payment_method]
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

router.put("/sales-invoices/:id", async (req: any, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
    const { company_id, customer_id, invoice_number, waybill_number, invoice_date, notes, items, payment_method, currency, invoice_type, status } = req.body;

    // 1. Get old invoice and items to revert stock
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
    
    // Get display name for logs
    let displayName = 'Müşteri';
    if (company_id) {
      const companyRes = await client.query("SELECT title FROM companies WHERE id = $1", [company_id]);
      if (companyRes.rows.length > 0) displayName = companyRes.rows[0].title;
    } else if (customer_id) {
      const custRes = await client.query("SELECT full_name FROM customers WHERE id = $1", [customer_id]);
      if (custRes.rows.length > 0) displayName = custRes.rows[0].full_name;
    }

    // 2. Revert old stock
    for (const item of oldItemsResult.rows) {
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, storeId]
        );
        await addStockMovement(client, storeId, item.product_id, 'in', item.quantity, 'sales_invoice', `Satış Faturası Revizyonu (Eski): ${oldInvoice.invoice_number}`, item.unit_price, displayName);
      }
    }
    
    // 3. Delete old items and transactions
    await client.query("DELETE FROM sales_invoice_items WHERE sales_invoice_id = $1", [req.params.id]);
    await client.query("DELETE FROM current_account_transactions WHERE sales_invoice_id = $1", [req.params.id]);

    // 4. Calculate new totals
    let total_amount = 0;
    let tax_amount = 0;
    let grand_total = 0;
    
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      const itemTax = itemTotal * (Number(item.tax_rate) / 100);
      total_amount += itemTotal;
      tax_amount += itemTax;
      grand_total += (itemTotal + itemTax);
    }

    // 5. Update invoice
    await client.query(
      `UPDATE sales_invoices 
       SET company_id = $1, customer_id = $2, invoice_number = $3, waybill_number = $4, invoice_date = $5, total_amount = $6, tax_amount = $7, grand_total = $8, currency = $9, notes = $10, payment_method = $11, invoice_type = $12, status = $13
       WHERE id = $14 AND store_id = $15`,
      [company_id || null, customer_id || null, invoice_number, waybill_number || null, invoice_date, total_amount, tax_amount, grand_total, currency || 'TRY', notes, payment_method, invoice_type, status, req.params.id, storeId]
    );

    // 6. Insert new items and update stock
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      const itemTax = itemTotal * (Number(item.tax_rate) / 100);
      
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
        await addStockMovement(client, storeId, item.product_id, 'out', item.quantity, 'sales_invoice', `Satış Faturası Revizyonu (Yeni): ${invoice_number}`, item.unit_price, displayName);
      }
    }

    // 7. Add new transactions if company_id is provided
    if (company_id) {
      await client.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, sales_invoice_id, type, amount, description) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [storeId, company_id, req.params.id, 'debt', grand_total, `Satış Faturası Revizyonu: ${invoice_number}`]
      );

      if (payment_method && payment_method !== 'term') {
        await client.query(
          `INSERT INTO current_account_transactions 
            (store_id, company_id, sales_invoice_id, type, amount, description, payment_method) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [storeId, company_id, req.params.id, 'credit', grand_total, `Satış Faturası Tahsilatı Revizyonu: ${invoice_number} (${payment_method})`, payment_method]
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

router.delete("/sales-invoices/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  try {
    await pool.query("DELETE FROM sales_invoices WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/sales/:id/create-invoice", async (req: any, res) => {
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
      let taxRate = 20; // Default
      if (item.product_id) {
        const prodRes = await client.query("SELECT tax_rate FROM products WHERE id = $1", [item.product_id]);
        if (prodRes.rows.length > 0) taxRate = Number(prodRes.rows[0].tax_rate || 20);
      }

      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      const itemTax = itemTotal * (taxRate / 100);
      
      total_amount += itemTotal;
      tax_amount += itemTax;
      grand_total += (itemTotal + itemTax);

      invoiceItems.push({
        product_id: item.product_id,
        product_name: item.product_name,
        barcode: item.barcode,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: taxRate,
        tax_amount: itemTax,
        total_price: itemTotal
      });
    }

    const invoiceResult = await client.query(
      `INSERT INTO sales_invoices 
        (store_id, sale_id, company_id, customer_id, invoice_number, invoice_date, total_amount, tax_amount, grand_total, currency, notes, invoice_type, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
      [storeId, id, sale.company_id || null, sale.customer_id || null, `INV-${Date.now()}`, new Date(), total_amount, tax_amount, grand_total, sale.currency || 'TRY', `Satış #${id} üzerinden oluşturuldu.`, 'manual', 'draft']
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

router.get("/purchase-invoices", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const result = await pool.query(
      `SELECT pi.*, c.title as company_name 
       FROM purchase_invoices pi 
       JOIN companies c ON pi.company_id = c.id 
       WHERE pi.store_id = $1 
       ORDER BY pi.created_at DESC`,
      [storeId]
    );
    res.json(result.rows);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/purchase-invoices/:id", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
    const invoiceResult = await pool.query(
      `SELECT pi.*, c.title as company_name 
       FROM purchase_invoices pi 
       JOIN companies c ON pi.company_id = c.id 
       WHERE pi.id = $1 AND pi.store_id = $2`,
      [req.params.id, storeId]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    
    const itemsResult = await pool.query(
      "SELECT * FROM purchase_invoice_items WHERE purchase_invoice_id = $1",
      [req.params.id]
    );
    
    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;
    
    res.json(invoice);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

router.post("/purchase-invoices", async (req: any, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const { storeId: bodyStoreId, company_id, invoice_number, waybill_number, invoice_date, items, notes, currency, payment_method } = req.body;
    
    // For superadmins, prioritize bodyStoreId. If not provided, fallback to req.user.store_id.
    // If both are null/undefined, storeId will be null/undefined.
    let storeId = req.user.store_id;
    if (req.user.role === "superadmin") {
      if (bodyStoreId) {
        storeId = bodyStoreId;
      }
    }

    if (!storeId) {
      throw new Error("Store ID is required");
    }
    
    // Calculate totals
    let total_amount = 0;
    let tax_amount = 0;
    let grand_total = 0;
    
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      const itemTax = itemTotal * (Number(item.tax_rate) / 100);
      
      total_amount += itemTotal;
      tax_amount += itemTax;
      grand_total += (itemTotal + itemTax);
    }
    
    // Insert invoice
    const invoiceResult = await client.query(
      `INSERT INTO purchase_invoices 
        (store_id, company_id, invoice_number, waybill_number, invoice_date, total_amount, tax_amount, grand_total, currency, notes, payment_method) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
      [storeId, company_id, invoice_number, waybill_number || null, invoice_date, total_amount, tax_amount, grand_total, currency || 'TRY', notes, payment_method]
    );
    
    const invoiceId = invoiceResult.rows[0].id;
    
    // Fetch company name for customer_info
    const companyRes = await client.query("SELECT title FROM companies WHERE id = $1", [company_id]);
    const companyName = companyRes.rows.length > 0 ? companyRes.rows[0].title : 'Tedarikçi';

    // Insert items and update stock
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      const itemTax = itemTotal * (Number(item.tax_rate) / 100);
      
      await client.query(
        `INSERT INTO purchase_invoice_items 
          (purchase_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [invoiceId, item.product_id, item.product_name, item.barcode, item.quantity, item.unit_price, item.tax_rate, itemTax, itemTotal]
      );
      
      // Update stock and cost if product_id is provided
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2, cost_currency = $3 WHERE id = $4 AND store_id = $5",
          [item.quantity, item.unit_price, currency || 'TRY', item.product_id, storeId]
        );
        
        // Log stock movement
        await addStockMovement(client, storeId, item.product_id, 'in', item.quantity, 'purchase_invoice', `Alış Faturası: ${invoice_number}`, item.unit_price, companyName);
      }
    }
    
    // Add transaction to current account (Supplier credit)
    await client.query(
      `INSERT INTO current_account_transactions 
        (store_id, company_id, purchase_invoice_id, type, amount, description) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [storeId, company_id, invoiceId, 'credit', grand_total, `Alış Faturası: ${invoice_number}`]
    );

    // If payment method is provided, add a debt transaction to offset the credit
    if (payment_method && payment_method !== 'term') {
      await client.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, purchase_invoice_id, type, amount, description, payment_method) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [storeId, company_id, invoiceId, 'debt', grand_total, `Alış Faturası Ödemesi: ${invoice_number} (${payment_method})`, payment_method]
      );
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

router.put("/purchase-invoices/:id", async (req: any, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const storeId = req.user.role === "superadmin" ? (req.body.storeId || req.user.store_id) : req.user.store_id;
    const { company_id, invoice_number, waybill_number, invoice_date, notes, items, payment_method, currency } = req.body;

    // 1. Get old invoice and items to revert stock
    const oldInvoiceResult = await client.query(
      "SELECT * FROM purchase_invoices WHERE id = $1 AND store_id = $2",
      [req.params.id, storeId]
    );
    
    if (oldInvoiceResult.rows.length === 0) {
      throw new Error("Invoice not found");
    }
    
    const oldInvoice = oldInvoiceResult.rows[0];
    const oldItemsResult = await client.query(
      "SELECT * FROM purchase_invoice_items WHERE purchase_invoice_id = $1",
      [req.params.id]
    );
    
    // Fetch company name for customer_info
    const companyRes = await client.query("SELECT title FROM companies WHERE id = $1", [company_id]);
    const companyName = companyRes.rows.length > 0 ? companyRes.rows[0].title : 'Tedarikçi';

    // 2. Revert old stock
    for (const item of oldItemsResult.rows) {
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, storeId]
        );
        
        // Log stock movement (out)
        await addStockMovement(client, storeId, item.product_id, 'out', item.quantity, 'purchase_invoice', `Alış Faturası Revizyonu (Eski): ${oldInvoice.invoice_number}`, item.unit_price, companyName);
      }
    }
    
    // 3. Delete old items and transactions
    await client.query("DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = $1", [req.params.id]);
    await client.query("DELETE FROM current_account_transactions WHERE purchase_invoice_id = $1", [req.params.id]);

    // 4. Calculate new totals
    let total_amount = 0;
    let tax_amount = 0;
    let grand_total = 0;
    
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      const itemTax = itemTotal * (Number(item.tax_rate) / 100);
      
      total_amount += itemTotal;
      tax_amount += itemTax;
      grand_total += (itemTotal + itemTax);
    }

    // 5. Update invoice
    await client.query(
      `UPDATE purchase_invoices 
       SET company_id = $1, invoice_number = $2, waybill_number = $3, invoice_date = $4, total_amount = $5, tax_amount = $6, grand_total = $7, currency = $8, notes = $9, payment_method = $10
       WHERE id = $11 AND store_id = $12`,
      [company_id, invoice_number, waybill_number || null, invoice_date, total_amount, tax_amount, grand_total, currency || 'TRY', notes, payment_method, req.params.id, storeId]
    );

    // 6. Insert new items and update stock
    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.unit_price);
      const itemTax = itemTotal * (Number(item.tax_rate) / 100);
      
      await client.query(
        `INSERT INTO purchase_invoice_items 
          (purchase_invoice_id, product_id, product_name, barcode, quantity, unit_price, tax_rate, tax_amount, total_price) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [req.params.id, item.product_id, item.product_name, item.barcode, item.quantity, item.unit_price, item.tax_rate, itemTax, itemTotal]
      );
      
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2, cost_currency = $3 WHERE id = $4 AND store_id = $5",
          [item.quantity, item.unit_price, currency || 'TRY', item.product_id, storeId]
        );
        
        // Log stock movement (in)
        await addStockMovement(client, storeId, item.product_id, 'in', item.quantity, 'purchase_invoice', `Alış Faturası Revizyonu (Yeni): ${invoice_number}`, item.unit_price, companyName);
      }
    }

    // 7. Add new transactions
    await client.query(
      `INSERT INTO current_account_transactions 
        (store_id, company_id, purchase_invoice_id, type, amount, description) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [storeId, company_id, req.params.id, 'credit', grand_total, `Alış Faturası Revizyonu: ${invoice_number}`]
    );

    if (payment_method && payment_method !== 'term') {
      await client.query(
        `INSERT INTO current_account_transactions 
          (store_id, company_id, purchase_invoice_id, type, amount, description, payment_method) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [storeId, company_id, req.params.id, 'debt', grand_total, `Alış Faturası Ödemesi Revizyonu: ${invoice_number} (${payment_method})`, payment_method]
      );
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

router.delete("/purchase-invoices/:id", async (req: any, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;

    const invoiceResult = await client.query(
      "SELECT * FROM purchase_invoices WHERE id = $1 AND store_id = $2",
      [req.params.id, storeId]
    );
    
    if (invoiceResult.rows.length === 0) {
      throw new Error("Invoice not found");
    }
    
    const invoiceNumber = invoiceResult.rows[0].invoice_number;
    
    // Get invoice items to revert stock
    const itemsResult = await client.query(
      "SELECT * FROM purchase_invoice_items WHERE purchase_invoice_id = $1",
      [req.params.id]
    );
    
    // Fetch company name for customer_info
    const companyRes = await client.query("SELECT title FROM companies WHERE id = $1", [invoiceResult.rows[0].company_id]);
    const companyName = companyRes.rows.length > 0 ? companyRes.rows[0].title : 'Tedarikçi';

    // Revert stock
    for (const item of itemsResult.rows) {
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, storeId]
        );
        
        // Log stock movement
        await addStockMovement(client, storeId, item.product_id, 'out', item.quantity, 'purchase_invoice', `Alış Faturası İptali: ${invoiceNumber}`, item.unit_price, companyName);
      }
    }
    
    // Delete invoice (cascades to items and transactions)
    await client.query("DELETE FROM current_account_transactions WHERE purchase_invoice_id = $1", [req.params.id]);
    await client.query("DELETE FROM purchase_invoices WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});


router.delete("/sales-invoices/:id", async (req: any, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;

    const invoiceResult = await client.query(
      "SELECT * FROM sales_invoices WHERE id = $1 AND store_id = $2",
      [req.params.id, storeId]
    );
    
    if (invoiceResult.rows.length === 0) {
      throw new Error("Invoice not found");
    }
    
    const invoiceNumber = invoiceResult.rows[0].invoice_number;
    
    // Get invoice items to revert stock
    const itemsResult = await client.query(
      "SELECT * FROM sales_invoice_items WHERE sales_invoice_id = $1",
      [req.params.id]
    );
    
    // Get display name for logs
    let displayName = 'Müşteri';
    if (invoiceResult.rows[0].company_id) {
      const companyRes = await client.query("SELECT title FROM companies WHERE id = $1", [invoiceResult.rows[0].company_id]);
      if (companyRes.rows.length > 0) displayName = companyRes.rows[0].title;
    } else if (invoiceResult.rows[0].customer_id) {
      const custRes = await client.query("SELECT full_name FROM customers WHERE id = $1", [invoiceResult.rows[0].customer_id]);
      if (custRes.rows.length > 0) displayName = custRes.rows[0].full_name;
    }

    // Revert stock
    for (const item of itemsResult.rows) {
      if (item.product_id) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, storeId]
        );
        
        // Log stock movement
        await addStockMovement(client, storeId, item.product_id, 'in', item.quantity, 'sales_invoice', `Satış Faturası İptali: ${invoiceNumber}`, item.unit_price, displayName);
      }
    }
    
    // Delete invoice (cascades to items and transactions)
    await client.query("DELETE FROM current_account_transactions WHERE sales_invoice_id = $1", [req.params.id]);
    await client.query("DELETE FROM sales_invoices WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
    
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// StoreAdmin: Supplier APIs
router.get("/supplier-apis", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });
  const apis = await pool.query("SELECT * FROM supplier_apis WHERE store_id = $1", [storeId]);
  res.json(apis.rows);
});

router.post("/supplier-apis", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  const { name, api_url, api_key } = req.body;
  await pool.query("INSERT INTO supplier_apis (store_id, name, api_url, api_key) VALUES ($1, $2, $3, $4)", [storeId, name, api_url, api_key]);
  res.json({ success: true });
});

router.put("/supplier-apis/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  const { id } = req.params;
  const { name, api_url, api_key } = req.body;
  await pool.query("UPDATE supplier_apis SET name = $1, api_url = $2, api_key = $3 WHERE id = $4 AND store_id = $5", [name, api_url, api_key, id, storeId]);
  res.json({ success: true });
});

router.delete("/supplier-apis/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  await pool.query("DELETE FROM supplier_apis WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
  res.json({ success: true });
});

// StoreAdmin: Procurements
router.get("/procurements", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  const procurements = await pool.query(`
    SELECT pr.*, s.customer_name as sale_customer_name 
    FROM procurements pr 
    LEFT JOIN sales s ON pr.sale_id = s.id 
    WHERE pr.store_id = $1 
    ORDER BY pr.created_at DESC
  `, [storeId]);
  res.json(procurements.rows);
});

router.put("/procurements/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  const { id } = req.params;
  const { status, supplier_id, supplier_stock, supplier_price } = req.body;
  await pool.query(`
    UPDATE procurements 
    SET status = $1, supplier_id = $2, supplier_stock = $3, supplier_price = $4 
    WHERE id = $5 AND store_id = $6
  `, [status, supplier_id, supplier_stock, supplier_price, id, storeId]);
  res.json({ success: true });
});

router.delete("/procurements/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  await pool.query("DELETE FROM procurements WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
  res.json({ success: true });
});

router.post("/procurements/:id/query", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  const { id } = req.params;
  
  try {
    const procRes = await pool.query("SELECT * FROM procurements WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (procRes.rows.length === 0) return res.status(404).json({ error: "Procurement not found" });
    const procurement = procRes.rows[0];
    
    const apisRes = await pool.query("SELECT * FROM supplier_apis WHERE store_id = $1", [storeId]);
    const apis = apisRes.rows;
    
    const results = [];
    for (const api of apis) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${api.api_url}?barcode=${procurement.barcode}`, {
          headers: api.api_key ? { 'Authorization': `Bearer ${api.api_key}` } : {},
          signal: controller.signal
        });
        clearTimeout(timeout);
        
        if (response.ok) {
          const data = await response.json();
          results.push({
            supplier_id: api.id,
            supplier_name: api.name,
            stock: data.stock,
            price: data.price
          });
        }
      } catch (err) {
        console.error(`Error querying API ${api.name}:`, err);
      }
    }
    
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Technical Service ---

router.get("/service-records", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  const result = await pool.query("SELECT * FROM service_records WHERE store_id = $1 ORDER BY created_at DESC", [storeId]);
  res.json(result.rows);
});

router.get("/service-records/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  const { id } = req.params;
  const recordRes = await pool.query("SELECT * FROM service_records WHERE id = $1 AND store_id = $2", [id, storeId]);
  if (recordRes.rows.length === 0) return res.status(404).json({ error: "Service record not found" });
  const itemsRes = await pool.query("SELECT * FROM service_items WHERE service_id = $1", [id]);
  res.json({ ...recordRes.rows[0], items: itemsRes.rows });
});

router.post("/service-records", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  const { customer_name, customer_phone, device_model, device_serial, issue_description, notes, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const recordRes = await client.query(
      "INSERT INTO service_records (store_id, customer_name, customer_phone, device_model, device_serial, issue_description, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [storeId, customer_name, customer_phone, device_model, device_serial, issue_description, notes]
    );
    const serviceId = recordRes.rows[0].id;
    let totalAmount = 0;
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await client.query(
          "INSERT INTO service_items (service_id, product_id, item_name, quantity, unit_price, tax_rate, total_price, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [serviceId, item.product_id, item.item_name, item.quantity, item.unit_price, item.tax_rate, item.total_price, item.type]
        );
        totalAmount += Number(item.total_price);
      }
    }
    await client.query("UPDATE service_records SET total_amount = $1 WHERE id = $2", [totalAmount, serviceId]);
    await client.query("COMMIT");
    res.json({ success: true, id: serviceId });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.put("/service-records/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  const { id } = req.params;
  const { customer_name, customer_phone, device_model, device_serial, issue_description, notes, status, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE service_records SET customer_name = $1, customer_phone = $2, device_model = $3, device_serial = $4, issue_description = $5, notes = $6, status = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 AND store_id = $9",
      [customer_name, customer_phone, device_model, device_serial, issue_description, notes, status, id, storeId]
    );
    let totalAmount = 0;
    if (items && Array.isArray(items)) {
      await client.query("DELETE FROM service_items WHERE service_id = $1", [id]);
      for (const item of items) {
        await client.query(
          "INSERT INTO service_items (service_id, product_id, item_name, quantity, unit_price, tax_rate, total_price, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          [id, item.product_id, item.item_name, item.quantity, item.unit_price, item.tax_rate, item.total_price, item.type]
        );
        totalAmount += Number(item.total_price);
      }
    }
    await client.query("UPDATE service_records SET total_amount = $1 WHERE id = $2", [totalAmount, id]);
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (e: any) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

router.delete("/service-records/:id", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
  await pool.query("DELETE FROM service_records WHERE id = $1 AND store_id = $2", [req.params.id, storeId]);
  res.json({ success: true });
});

// --- BRANCHES & STOCK TRANSFERS ---

// Get all branches (siblings and parent)
router.get("/branches", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    // Find parent_id of current store
    const currentStoreRes = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
    const parentId = currentStoreRes.rows[0]?.parent_id || storeId;
    console.log(`[DEBUG] GET /branches: storeId=${storeId}, parentId=${parentId}`);

    // Get all stores with same parent_id or the parent itself
    const branchesRes = await pool.query(
      "SELECT id, name, slug, address, phone FROM stores WHERE (id = $1 OR parent_id = $1) AND id != $2",
      [parentId, storeId]
    );
    console.log(`[DEBUG] GET /branches: Found ${branchesRes.rows.length} branches`);
    
    // Filter out current store
    const branches = branchesRes.rows.filter(b => b.id !== storeId);
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch branches" });
  }
});

// Check stock in other branches
router.get("/branches/stock/:barcode", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { barcode } = req.params;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const currentStoreRes = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
    const parentId = currentStoreRes.rows[0]?.parent_id || storeId;

    const stockRes = await pool.query(
      `SELECT s.name as store_name, p.stock_quantity, p.price, p.currency
       FROM products p
       JOIN stores s ON p.store_id = s.id
       WHERE p.barcode = $1 AND (s.id = $2 OR s.parent_id = $2) AND s.id != $3`,
      [barcode, parentId, storeId]
    );
    
    res.json(stockRes.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch branch stock" });
  }
});

// Get stock transfers
router.get("/stock-transfers", async (req: any, res) => {
  const requestedStoreId = req.query.storeId || req.user.store_id;
  const currentStoreId = req.user.store_id;
  const includeBranches = req.query.includeBranches === 'true';
  
  console.log(`[DEBUG] GET /stock-transfers: requestedStoreId=${requestedStoreId}, currentStoreId=${currentStoreId}, includeBranches=${includeBranches}`);

  if (!requestedStoreId) return res.status(400).json({ error: "Store ID required" });

  try {
    const storeIdNum = Number(requestedStoreId);
    if (isNaN(storeIdNum)) return res.status(400).json({ error: "Invalid Store ID" });

    let storeIds = [storeIdNum];

    // Find parent_id for authorization and group view
    const storeRes = await pool.query("SELECT id, parent_id FROM stores WHERE id = $1", [storeIdNum]);
    if (storeRes.rows.length === 0) {
      console.log(`[DEBUG] Store ${storeIdNum} not found`);
      return res.status(404).json({ error: "Store not found" });
    }
    
    const parentId = storeRes.rows[0].parent_id || storeIdNum;

    if (includeBranches) {
      const groupRes = await pool.query("SELECT id FROM stores WHERE id = $1 OR parent_id = $1", [parentId]);
      storeIds = groupRes.rows.map(r => r.id);
    }

    console.log(`[DEBUG] Final storeIds for query: ${JSON.stringify(storeIds)}`);

    // Authorization check for non-superadmins
    if (req.user.role !== "superadmin") {
      const currentStoreRes = await pool.query("SELECT id, parent_id FROM stores WHERE id = $1", [currentStoreId]);
      if (currentStoreRes.rows.length === 0) return res.status(403).json({ error: "User store not found" });
      
      const userParentId = currentStoreRes.rows[0].parent_id || currentStoreId;

      // Verify requested store belongs to the same group
      const unauthorizedIds = await pool.query(
        "SELECT id FROM stores WHERE id = ANY($1) AND id != $2 AND parent_id != $2",
        [storeIds, userParentId]
      );

      if (unauthorizedIds.rows.length > 0) {
        console.log(`[DEBUG] Auth failed: Unauthorized store IDs ${JSON.stringify(unauthorizedIds.rows.map(r => r.id))}`);
        return res.status(403).json({ error: "Unauthorized to view transfers for these stores" });
      }
    }

    const transfersRes = await pool.query(
      `SELECT st.*, 
              fs.name as from_store_name, 
              ts.name as to_store_name,
              u.email as created_by_email,
              up.email as prepared_by_email,
              us.email as shipped_by_email
       FROM stock_transfers st
       JOIN stores fs ON st.from_store_id = fs.id
       JOIN stores ts ON st.to_store_id = ts.id
       LEFT JOIN users u ON st.created_by = u.id
       LEFT JOIN users up ON st.prepared_by = up.id
       LEFT JOIN users us ON st.shipped_by = us.id
       WHERE st.from_store_id = ANY($1) OR st.to_store_id = ANY($1)
       ORDER BY st.created_at DESC`,
      [storeIds]
    );

    console.log(`[DEBUG] Found ${transfersRes.rows.length} transfers`);

    // Fetch items for each transfer
    const transfers = await Promise.all(transfersRes.rows.map(async (t) => {
      const itemsRes = await pool.query(
        `SELECT sti.*, COALESCE(sti.product_name, p.name) as product_name, COALESCE(sti.barcode, p.barcode) as barcode
         FROM stock_transfer_items sti
         LEFT JOIN products p ON sti.product_id = p.id
         WHERE sti.transfer_id = $1`,
        [t.id]
      );
      return { ...t, items: itemsRes.rows };
    }));

    res.json(transfers);
  } catch (error) {
    console.error("Error fetching stock transfers:", error);
    res.status(500).json({ error: "Failed to fetch stock transfers" });
  }
});

// Create stock transfer
router.post("/stock-transfers", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  const userId = req.user.id;
  const { from_store_id, to_store_id, notes, items } = req.body;

  console.log(`[DEBUG] POST /stock-transfers: storeId=${storeId}, from=${from_store_id}, to=${to_store_id}, itemsCount=${items?.length}`);

  if (!from_store_id || !to_store_id || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Authorization check: User must belong to either from_store or to_store
  if (req.user.role !== 'superadmin' && Number(from_store_id) !== Number(storeId) && Number(to_store_id) !== Number(storeId)) {
    console.log(`[DEBUG] Auth failed for creation: User store ${storeId} not in [${from_store_id}, ${to_store_id}]`);
    return res.status(403).json({ error: "Unauthorized to create this transfer" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const transferRes = await client.query(
      `INSERT INTO stock_transfers (from_store_id, to_store_id, notes, created_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [from_store_id, to_store_id, notes, userId]
    );
    const transferId = transferRes.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO stock_transfer_items (transfer_id, product_id, quantity, barcode, product_name)
         VALUES ($1, $2, $3, $4, $5)`,
        [transferId, item.product_id, item.quantity, item.barcode, item.product_name || item.name]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true, transferId });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Failed to create stock transfer" });
  } finally {
    client.release();
  }
});

// Update transfer status
router.put("/stock-transfers/:id/status", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId || req.user.store_id) : req.user.store_id;
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  const lang = req.query.lang || 'tr';

  console.log(`[DEBUG] PUT /stock-transfers/${id}/status - storeId: ${storeId}, status: ${status}, userId: ${userId}, role: ${req.user.role}`);

  if (!['pending', 'accepted', 'preparing', 'shipped', 'completed', 'cancelled'].includes(status)) {
    console.log(`[DEBUG] Invalid status: ${status}`);
    return res.status(400).json({ error: "Invalid status" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const transferRes = await client.query(
      "SELECT * FROM stock_transfers WHERE id = $1",
      [id]
    );
    const transfer = transferRes.rows[0];

    if (!transfer) {
      console.log(`[DEBUG] Transfer not found: ${id}`);
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Transfer not found" });
    }

    if (transfer.status === 'completed' || transfer.status === 'cancelled') {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cannot change status of a completed or cancelled transfer" });
    }

    // Fetch items for stock operations
    const itemsRes = await client.query(
      "SELECT * FROM stock_transfer_items WHERE transfer_id = $1",
      [id]
    );
    const items = itemsRes.rows;

    // Authorization check
    if (req.user.role !== 'superadmin' && transfer.from_store_id !== storeId && transfer.to_store_id !== storeId) {
      console.log(`[DEBUG] Unauthorized: role=${req.user.role}, from=${transfer.from_store_id}, to=${transfer.to_store_id}, storeId=${storeId}`);
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Unauthorized" });
    }

    // --- Stock Logic ---

    // 1. Shipped: Deduct from sender
    if (status === 'shipped' && transfer.status !== 'shipped') {
      // Check stock availability first
      for (const item of items) {
        const productRes = await client.query(
          "SELECT stock_quantity, name FROM products WHERE id = $1 AND store_id = $2",
          [item.product_id, transfer.from_store_id]
        );
        const product = productRes.rows[0];
        if (!product || product.stock_quantity < item.quantity) {
          await client.query("ROLLBACK");
          return res.status(400).json({ 
            error: lang === 'tr' 
              ? `Yetersiz stok: ${product?.name || 'Ürün bulunamadı'} (Mevcut: ${product?.stock_quantity || 0}, Talep: ${item.quantity})` 
              : `Insufficient stock: ${product?.name || 'Product not found'} (Available: ${product?.stock_quantity || 0}, Requested: ${item.quantity})` 
          });
        }
      }

      // Deduct stock
      for (const item of items) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, transfer.from_store_id]
        );
        await addStockMovement(client, transfer.from_store_id, item.product_id, 'out', item.quantity, 'transfer', `Transfer Sevk Edildi (ID: ${id}) - Alıcı Mağaza ID: ${transfer.to_store_id}`);
      }
    }

    // 2. Completed: Add to receiver
    if (status === 'completed' && transfer.status !== 'completed') {
      // If it wasn't shipped yet, we should probably deduct from sender now (though workflow usually goes through shipped)
      // But if it was shipped, deduction already happened.
      const wasShipped = transfer.status === 'shipped';
      
      for (const item of items) {
        if (!wasShipped) {
          // Deduct from sender if not already done
          await client.query(
            "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
            [item.quantity, item.product_id, transfer.from_store_id]
          );
          await addStockMovement(client, transfer.from_store_id, item.product_id, 'out', item.quantity, 'transfer', `Transfer Tamamlandı (ID: ${id}) - Alıcı Mağaza ID: ${transfer.to_store_id}`);
        }

        // Increase at receiver (find or create product by barcode)
        const receiverProductRes = await client.query(
          "SELECT id FROM products WHERE store_id = $1 AND barcode = $2",
          [transfer.to_store_id, item.barcode]
        );

        let receiverProductId;
        if (receiverProductRes.rows.length > 0) {
          receiverProductId = receiverProductRes.rows[0].id;
          await client.query(
            "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2",
            [item.quantity, receiverProductId]
          );
        } else {
          // Create new product for receiver branch
          const senderProductRes = await client.query("SELECT * FROM products WHERE id = $1", [item.product_id]);
          const sp = senderProductRes.rows[0];
          const newProductRes = await client.query(
            `INSERT INTO products (store_id, barcode, name, price, currency, cost_price, cost_currency, tax_rate, description, stock_quantity, unit, category)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
            [transfer.to_store_id, sp.barcode, sp.name, sp.price, sp.currency, sp.cost_price, sp.cost_currency, sp.tax_rate, sp.description, item.quantity, sp.unit, sp.category]
          );
          receiverProductId = newProductRes.rows[0].id;
        }

        await addStockMovement(client, transfer.to_store_id, receiverProductId, 'in', item.quantity, 'transfer', `Transfer Tamamlandı (ID: ${id}) - Gönderen Mağaza ID: ${transfer.from_store_id}`);
      }
    }

    // 3. Cancelled: Return to sender if it was already shipped
    if (status === 'cancelled' && transfer.status === 'shipped') {
      for (const item of items) {
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 AND store_id = $3",
          [item.quantity, item.product_id, transfer.from_store_id]
        );
        await addStockMovement(client, transfer.from_store_id, item.product_id, 'in', item.quantity, 'transfer', `Transfer İptal Edildi (ID: ${id}) - Stok İade Edildi`);
      }
    }

    // Update status and tracking fields
    let updateQuery = "UPDATE stock_transfers SET status = $1, updated_at = CURRENT_TIMESTAMP";
    const params: any[] = [status, id];

    if (status === 'preparing') {
      updateQuery += ", prepared_by = $3";
      params.push(userId);
    } else if (status === 'shipped') {
      updateQuery += ", shipped_by = $3";
      params.push(userId);
    }

    updateQuery += " WHERE id = $2";
    console.log(`[DEBUG] Executing update query: ${updateQuery} with params:`, params);
    await client.query(updateQuery, params);

    await client.query("COMMIT");
    console.log(`[DEBUG] Transfer ${id} status updated to ${status} successfully`);
    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Update transfer status error:", error);
    res.status(500).json({ error: "Failed to update transfer status" });
  } finally {
    client.release();
  }
});

// Delete stock transfer
router.delete("/stock-transfers/:id", async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.user.store_id;

  try {
    const transferRes = await pool.query(
      "SELECT * FROM stock_transfers WHERE id = $1",
      [id]
    );
    const transfer = transferRes.rows[0];

    if (!transfer) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    if (req.user.role !== 'superadmin' && transfer.from_store_id !== storeId && transfer.to_store_id !== storeId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await pool.query("DELETE FROM stock_transfers WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete transfer" });
  }
});

// Get notifications/alerts counts
router.get("/notifications", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    // 1. New Stock Transfers
    // - Incoming (to_store_id) and status is 'shipped' (needs to be received)
    // - Outgoing (from_store_id) and status is 'pending', 'accepted', or 'preparing' (needs action)
    const transfersCount = await pool.query(
      `SELECT COUNT(*) FROM stock_transfers 
       WHERE (to_store_id = $1 AND status = 'shipped')
          OR (from_store_id = $1 AND status IN ('pending', 'accepted', 'preparing'))`,
      [storeId]
    );

    // 2. New Technical Service (status is received)
    const serviceCount = await pool.query(
      "SELECT COUNT(*) FROM service_records WHERE store_id = $1 AND status = 'received'",
      [storeId]
    );

    // 3. New Quotations (status is pending)
    const quotationsCount = await pool.query(
      "SELECT COUNT(*) FROM quotations WHERE store_id = $1 AND status = 'pending'",
      [storeId]
    );

    // 4. New Sales (status is pending)
    const salesCount = await pool.query(
      "SELECT COUNT(*) FROM sales WHERE store_id = $1 AND status = 'pending'",
      [storeId]
    );

    // 5. Fleet Alerts (Expiring documents and upcoming maintenance)
    // - Documents expiring in 30 days
    const expiringDocsCount = await pool.query(
      `SELECT COUNT(*) FROM vehicle_documents vd
       JOIN vehicles v ON vd.vehicle_id = v.id
       WHERE v.store_id = $1 AND vd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND vd.expiry_date >= CURRENT_DATE`,
      [storeId]
    );

    // - Maintenance due in 30 days or next_maintenance_mileage is close
    const maintenanceDueCount = await pool.query(
      `SELECT COUNT(*) FROM vehicle_maintenance vm
       JOIN vehicles v ON vm.vehicle_id = v.id
       WHERE v.store_id = $1 
       AND vm.status = 'scheduled'
       AND (vm.next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days' OR (v.current_mileage >= vm.next_maintenance_mileage - 1000 AND vm.next_maintenance_mileage > 0))`,
      [storeId]
    );

    res.json({
      transfers: parseInt(transfersCount.rows[0].count),
      service: parseInt(serviceCount.rows[0].count),
      quotations: parseInt(quotationsCount.rows[0].count),
      sales: parseInt(salesCount.rows[0].count),
      fleet: parseInt(expiringDocsCount.rows[0].count) + parseInt(maintenanceDueCount.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Public: Get product stock across all branches of a store group
router.get("/public/store/:slug/products/:barcode/stock", async (req, res) => {
  const { slug, barcode } = req.params;
  try {
    // 1. Find the store by slug to get its parent_id
    const storeRes = await pool.query("SELECT id, parent_id FROM stores WHERE slug = $1", [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: "Mağaza bulunamadı" });
    
    const { id, parent_id } = storeRes.rows[0];
    const parentId = parent_id || id;

    // 2. Get stock from all stores in the same group (parent + siblings)
    const stockRes = await pool.query(`
      SELECT s.name as store_name, COALESCE(p.stock_quantity, 0) as stock_quantity
      FROM stores s
      LEFT JOIN products p ON p.store_id = s.id AND p.barcode = $1
      WHERE s.id = $2 OR s.parent_id = $2
      ORDER BY (s.parent_id IS NULL) DESC, s.name ASC
    `, [barcode, parentId]);

    res.json(stockRes.rows);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Stok bilgisi alınamadı" });
  }
});

export default router;
