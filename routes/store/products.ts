import express from "express";
import { pool, logAction } from "../../models/db";
import { getAuthorizedStoreId, getTurkishSearchSnippet, normalizeTurkishParam, checkProductLimit } from "./utils";
import XLSX from "xlsx";

const router = express.Router();

// GET /products
router.get("/", async (req: any, res) => {
  const currentStoreId = req.user.store_id;
  const requestedStoreId = req.query.storeId || currentStoreId;
  const includeBranches = req.query.includeBranches === 'true';
  const sellableOnly = req.query.sellableOnly === 'true';
  
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

      // Rule: Parent store can view any store in their group
      const unauthorizedIds = await pool.query(
        "SELECT id FROM stores WHERE id = ANY($1) AND id != $2 AND parent_id != $2",
        [storeIds, userParentId]
      );

      if (unauthorizedIds.rows.length > 0) {
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
    
    if (sellableOnly) {
      query += ` AND p.is_sellable = true`;
    }

    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean);
      searchTerms.forEach(term => {
        const pIdx = params.length + 1;
        query += ` AND (\${getTurkishSearchSnippet('p.name', pIdx)} OR \${getTurkishSearchSnippet('p.barcode', pIdx)})`;
        params.push(normalizeTurkishParam(term));
      });
    }

    query += ` ORDER BY COALESCE(p.updated_at, p.created_at) DESC, p.id DESC`;

    const productsRes = await pool.query(query, params);
    res.json(productsRes.rows);
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products
router.post("/", async (req: any, res) => {
  const requestedId = req.query.storeId || req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  const { barcode, name, price, currency, cost_price, cost_currency, description, stock_quantity, min_stock_level, unit, category, sub_category, brand, author, labels, image_url, is_web_sale, is_bestseller, product_type, price_2, price_2_currency, tax_rate, volume_ml } = req.body;
  if (!barcode || !name || !price) return res.status(400).json({ error: "Missing fields" });
  
  try {
    const existing = await pool.query("SELECT id FROM products WHERE store_id = $1 AND barcode = $2", [storeId, String(barcode)]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Bu barkod ile ürün oluşturuldu!" });
    }

    const canAdd = await checkProductLimit(storeId);
    if (!canAdd) {
      return res.status(400).json({ error: "Ürün limitine ulaşıldı. Lütfen planınızı yükseltin." });
    }

    const storeRes = await pool.query("SELECT default_tax_rate FROM stores WHERE id = $1", [storeId]);
    const defaultTaxRate = storeRes.rows[0]?.default_tax_rate ?? 20;

    const isWebSaleVal = is_web_sale === true || is_web_sale === 'true' || is_web_sale === 'on';
    const isBestsellerVal = is_bestseller === true || is_bestseller === 'true' || is_bestseller === 'on';

    const result = await pool.query(`
      INSERT INTO products (store_id, barcode, name, price, currency, cost_price, cost_currency, description, stock_quantity, min_stock_level, unit, category, sub_category, brand, author, labels, image_url, is_web_sale, is_bestseller, product_type, price_2, price_2_currency, tax_rate, shipping_profile_id, volume_ml, is_sellable, updated_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, CURRENT_TIMESTAMP)
      RETURNING *
    `, [
      storeId, String(barcode), name, parseFloat(price), currency || 'TRY', 
      parseFloat(cost_price) || 0, cost_currency || 'TRY', description || '', 
      parseFloat(stock_quantity) || 0, parseFloat(min_stock_level) || 5, unit || 'Adet', 
      category || '', sub_category || '', brand || '', author || '', 
      JSON.stringify(labels || []), image_url || '', 
      isWebSaleVal,
      isBestsellerVal,
      product_type || 'product',
      parseFloat(price_2) || 0,
      price_2_currency || 'TRY',
      (tax_rate !== undefined && tax_rate !== null && tax_rate !== "") ? parseFloat(tax_rate) : defaultTaxRate,
      req.body.shipping_profile_id || null,
      parseFloat(volume_ml) || 0,
      req.body.is_sellable !== undefined ? req.body.is_sellable : true
    ]);

    if (req.body.sync_group && barcode) {
      const storeResq = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
      const parentId = storeResq.rows[0]?.parent_id || storeId;

      const allStoresRes = await pool.query("SELECT id FROM stores WHERE id = $1 OR parent_id = $1", [parentId]);
      const branchIds = allStoresRes.rows.map(r => r.id);

      for (const bId of branchIds) {
        if (bId === storeId) continue;

        const existsRes = await pool.query("SELECT id FROM products WHERE store_id = $1 AND barcode = $2", [bId, String(barcode)]);
        
        if (existsRes.rows.length === 0) {
          await pool.query(`
            INSERT INTO products (store_id, barcode, name, price, currency, description, unit, category, sub_category, brand, author, image_url, labels, product_type, tax_rate, stock_quantity, is_web_sale, is_sellable, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0, false, $16, CURRENT_TIMESTAMP)
          `, [
            bId, String(barcode), name, parseFloat(price), currency || 'TRY', 
            description || '', unit || 'Adet', category || '', 
            sub_category || '', brand || '', author || '', 
            image_url || '', JSON.stringify(labels || []), product_type || 'product', 
            (tax_rate !== undefined && tax_rate !== null && tax_rate !== "") ? parseFloat(tax_rate) : defaultTaxRate,
            req.body.is_sellable !== undefined ? req.body.is_sellable : true
          ]);
        }
      }
    }

    res.json(result.rows[0]);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Bulk Update Price
router.put("/bulk-update-price", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  const { target, category, type, value, direction, rounding } = req.body;

  if (!value || isNaN(value) || value <= 0) {
    return res.status(400).json({ error: "Geçerli bir değer giriniz." });
  }

  let priceCalc = "price";
  const val = Number(value);

  if (type === 'amount') {
    if (direction === 'increase') priceCalc = `price + \${val}`;
    else priceCalc = `GREATEST(price - \${val}, 0)`;
  } else if (type === 'percentage') {
    const multiplier = direction === 'increase' ? (1 + val / 100) : (1 - val / 100);
    priceCalc = `price * \${multiplier}`;
  }

  if (rounding === 'round') {
    priceCalc = `ROUND(CAST(\${priceCalc} AS numeric), 0)`;
  } else if (rounding === 'ceil') {
    priceCalc = `CEIL(\${priceCalc})`;
  } else if (rounding === 'floor') {
    priceCalc = `FLOOR(\${priceCalc})`;
  } else {
    priceCalc = `ROUND(CAST(\${priceCalc} AS numeric), 2)`;
  }

  try {
    let query = `
      UPDATE products p 
      SET price = \${priceCalc}, 
          price_2 = \${priceCalc} / (1 + COALESCE(p.tax_rate, s.default_tax_rate, 20) / 100.0), 
          price_2_currency = p.currency, 
          updated_at = CURRENT_TIMESTAMP 
      FROM stores s 
      WHERE p.store_id = s.id AND p.store_id = $1`;
    const params: any[] = [storeId];

    if (target === 'category' && category) {
      query += ` AND LOWER(TRIM(category)) = LOWER(TRIM($2))`;
      params.push(category);
    }

    const result = await pool.query(query, params);
    
    await logAction(
      storeId, 
      req.user.id, 
      "bulk_price_update", 
      "product", 
      null, 
      `Toplu fiyat güncelleme: \${target === 'all' ? 'Tüm ürünler' : category + ' kategorisi'}, \${direction === 'increase' ? 'Artış' : 'Azalış'}, \${type === 'percentage' ? '%' + value : value + ' ₺'}, Yuvarlama: \${rounding}`,
      { target, category, type, value, direction, rounding },
      { count: result.rowCount }
    );

    res.json({ success: true, count: result.rowCount });
  } catch (e: any) {
    console.error("Bulk price update error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Bulk Update Tax
router.put("/bulk-update-tax", async (req: any, res) => {
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

    await logAction(
      storeId, 
      req.user.id, 
      "bulk_tax_update", 
      "product", 
      null, 
      `Toplu KDV güncelleme: \${category} kategorisi, Yeni KDV: %\${taxRate}, Etkilenen Ürün: \${result.rowCount}`,
      { category, taxRate, affectedRows: result.rowCount },
      { category, newTaxRate: taxRate, count: result.rowCount }
    );

    res.json({ success: true, count: result.rowCount });
  } catch (e: any) {
    console.error("Bulk tax update error:", e);
    res.status(500).json({ error: e.message });
  }
});

// Bulk Recalculate Price 2
router.put("/bulk-recalculate-price2", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.body.storeId) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const result = await pool.query(
      `UPDATE products p 
       SET price_2 = p.price / (1 + COALESCE(p.tax_rate, s.default_tax_rate, 20) / 100.0), 
           price_2_currency = p.currency, 
           updated_at = CURRENT_TIMESTAMP 
       FROM stores s 
       WHERE p.store_id = s.id AND p.store_id = $1`,
      [storeId]
    );

    await logAction(
      storeId, 
      req.user.id, 
      "bulk_price2_recalculate", 
      "product", 
      null, 
      `Tüm ürünlerin 2. fiyatları (KDV Hariç) KDV oranlarına göre yeniden hesaplandı.`,
      { affectedRows: result.rowCount },
      { count: result.rowCount }
    );

    res.json({ success: true, count: result.rowCount });
  } catch (e: any) {
    console.error("Bulk price2 recalculate error:", e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /products/:id
router.put("/:id", async (req: any, res) => {
  const requestedId = req.query.storeId || req.body.storeId;
  const storeId = await getAuthorizedStoreId(req, requestedId);
  if (storeId === null) return res.status(403).json({ error: "Store ID unauthorized" });

  const { id } = req.params;
  const { barcode, name, price, currency, cost_price, cost_currency, description, stock_quantity, min_stock_level, unit, category, sub_category, brand, author, labels, image_url, is_web_sale, is_bestseller, product_type, price_2, price_2_currency, tax_rate, shipping_profile_id, sync_group, volume_ml, is_sellable } = req.body;
  try {
    const existingProductRes = await pool.query("SELECT labels, barcode, is_sellable, is_bestseller FROM products WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (existingProductRes.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    let existingLabels = existingProductRes.rows[0]?.labels || [];
    let existingIsSellable = existingProductRes.rows[0]?.is_sellable;
    if (existingIsSellable === undefined || existingIsSellable === null) existingIsSellable = true;
    let existingIsBestseller = existingProductRes.rows[0]?.is_bestseller || false;

    if (!Array.isArray(existingLabels)) existingLabels = [];
    
    let updatedLabels = labels !== undefined ? labels : existingLabels;
    if (Array.isArray(updatedLabels)) {
       updatedLabels = updatedLabels.filter((l: string) => l !== "yeni_fatura_urunu");
    }

    const finalIsSellable = is_sellable !== undefined ? is_sellable : existingIsSellable;
    const finalIsWebSale = is_web_sale !== undefined ? (is_web_sale === true || is_web_sale === 'true' || is_web_sale === 'on') : true;
    const finalIsBestseller = is_bestseller !== undefined ? (is_bestseller === true || is_bestseller === 'true' || is_bestseller === 'on') : existingIsBestseller;

    await pool.query(`
      UPDATE products SET 
        barcode = $1, name = $2, price = $3, currency = $4, 
        cost_price = $5, cost_currency = $6, description = $7, 
        stock_quantity = $8, min_stock_level = $9, unit = $10, 
        category = $11, sub_category = $12, brand = $13, author = $14, 
        labels = $15, image_url = $16, is_web_sale = $17, is_bestseller = $18, product_type = $19,
        price_2 = $20, price_2_currency = $21, tax_rate = $22, shipping_profile_id = $23, volume_ml = $24, is_sellable = $25, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $26 AND store_id = $27
    `, [
      String(barcode), name, parseFloat(price), currency || 'TRY', 
      parseFloat(cost_price) || 0, cost_currency || 'TRY', description || '', 
      parseFloat(stock_quantity) || 0, parseFloat(min_stock_level) || 5, unit || 'Adet', 
      category || '', sub_category || '', brand || '', author || '', 
      JSON.stringify(updatedLabels), image_url || '',
      finalIsWebSale,
      finalIsBestseller,
      product_type || 'product',
      parseFloat(price_2) || 0,
      price_2_currency || 'TRY',
      parseFloat(tax_rate) || 0,
      shipping_profile_id || null,
      parseFloat(volume_ml) || 0,
      finalIsSellable,
      id, storeId
    ]);

    if (sync_group && barcode) {
      const storeRes = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
      const parentId = storeRes.rows[0]?.parent_id || storeId;

      const allStoresRes = await pool.query("SELECT id FROM stores WHERE id = $1 OR parent_id = $1", [parentId]);
      const branchIds = allStoresRes.rows.map(r => r.id);

      for (const bId of branchIds) {
        if (bId === storeId) continue;

        const existsRes = await pool.query("SELECT id FROM products WHERE store_id = $1 AND barcode = $2", [bId, String(barcode)]);
        
        if (existsRes.rows.length > 0) {
          await pool.query(`
            UPDATE products SET 
              name = $1, price = $2, currency = $3, 
              description = $4, unit = $5, category = $6, 
              sub_category = $7, brand = $8, author = $9, 
              image_url = $10, labels = $11, product_type = $12, 
              tax_rate = $13, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $14
          `, [
            name, parseFloat(price), currency || 'TRY', 
            description || '', unit || 'Adet', category || '', 
            sub_category || '', brand || '', author || '', 
            image_url || '', JSON.stringify(updatedLabels), product_type || 'product', 
            parseFloat(tax_rate) || 0, existsRes.rows[0].id
          ]);
        } else {
          await pool.query(`
            INSERT INTO products (store_id, barcode, name, price, currency, description, unit, category, sub_category, brand, author, image_url, labels, product_type, tax_rate, stock_quantity, is_web_sale, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0, false, CURRENT_TIMESTAMP)
          `, [
            bId, String(barcode), name, parseFloat(price), currency || 'TRY', 
            description || '', unit || 'Adet', category || '', 
            sub_category || '', brand || '', author || '', 
            image_url || '', JSON.stringify(updatedLabels), product_type || 'product', 
            parseFloat(tax_rate) || 0
          ]);
        }
      }
    }
    
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

// Toggle Bestseller
router.put("/:id/toggle-bestseller", async (req: any, res) => {
  const storeId = req.user.store_id;
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE products SET is_bestseller = NOT is_bestseller WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Recipe Routes
router.get("/:id/recipe", async (req: any, res) => {
  const productId = parseInt(req.params.id);
  const storeId = req.user.store_id;

  try {
    const recipeRes = await pool.query(
      `SELECT r.*, p.name as ingredient_name, p.unit as ingredient_unit, p.stock_quantity as ingredient_stock 
       FROM product_recipes r
       JOIN products p ON r.ingredient_id = p.id
       WHERE r.product_id = $1 AND r.store_id = $2`,
      [productId, storeId]
    );
    res.json({ success: true, items: recipeRes.rows });
  } catch (error: any) {
    console.error("Get recipe error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/recipe", async (req: any, res) => {
  const productId = parseInt(req.params.id);
  const storeId = req.user.store_id;
  const { items } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "DELETE FROM product_recipes WHERE product_id = $1 AND store_id = $2",
      [productId, storeId]
    );

    if (Array.isArray(items)) {
      for (const item of items) {
        if (!item.ingredient_id || !item.amount) continue;
        await client.query(
          "INSERT INTO product_recipes (store_id, product_id, ingredient_id, amount, unit) VALUES ($1, $2, $3, $4, $5)",
          [storeId, productId, item.ingredient_id, item.amount, item.unit || 'Adet']
        );
      }
    }

    await client.query("COMMIT");
    res.json({ success: true, message: "Reçete başarıyla kaydedildi." });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Save recipe error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Delete Routes
router.delete("/all", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    await pool.query("DELETE FROM products WHERE store_id = $1", [storeId]);
    await logAction(storeId, req.user.id, "product_delete_all", "product", null, `Tüm ürünler silindi`, null, null);
    res.json({ success: true });
  } catch (e: any) {
    console.error("Delete all products error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/bulk-delete", async (req: any, res) => {
  try {
    const storeId = req.user.role === "superadmin" ? req.query.storeId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "No IDs provided" });

    await pool.query("DELETE FROM products WHERE store_id = $1 AND id = ANY($2::int[])", [storeId, ids]);
    await logAction(storeId, req.user.id, "product_bulk_delete", "product", null, `\${ids.length} adet ürün toplu olarak silindi`, null, null);
    res.json({ success: true, message: `\${ids.length} products deleted.` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/bulk-add", async (req: any, res) => {
  try {
    const requestedStoreId = req.query.storeId || req.body.storeId;
    const storeId = req.user.role === "superadmin" ? requestedStoreId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) return res.status(400).json({ error: "No products provided" });

    const canAddBatch = await checkProductLimit(storeId, products.length);
    if (!canAddBatch) return res.status(400).json({ error: "Ürün limitine ulaşıldı. Lütfen planınızı yükseltin." });

    const insertedIds = [];
    for (const p of products) {
      const barcode = p.barcode || `B-\${Date.now()}-\${Math.floor(Math.random() * 1000)}`;
      const name = p.name;
      const price = p.price || 0;
      if (!name) continue;

      const result = await pool.query(
        `INSERT INTO products (store_id, barcode, name, price, currency, cost_price, cost_currency, description, stock_quantity, min_stock_level, unit, category, sub_category, brand, author, labels, image_url, is_web_sale, product_type, price_2, price_2_currency, tax_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22) RETURNING id`,
        [storeId, String(barcode), name, price, p.currency || 'TRY', p.cost_price || 0, p.cost_currency || 'TRY', p.description || '', p.stock_quantity || 0, p.min_stock_level || 0, p.unit || 'Adet', p.category || '', p.sub_category || '', p.brand || '', p.author || '', p.labels || '', p.image_url || '', p.is_web_sale !== false, p.product_type || 'standard', p.price_2 || 0, p.price_2_currency || 'TRY', p.tax_rate ?? 20]
      );
      insertedIds.push(result.rows[0].id);
    }

    await logAction(storeId, req.user.id, "product_bulk_add", "product", null, `\${products.length} adet ürün toplu olarak eklendi`, null, null);
    res.json({ success: true, message: `\${products.length} products added.`, insertedIds });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/bulk-rename", async (req: any, res) => {
  try {
    const requestedStoreId = req.query.storeId || req.body.storeId;
    const storeId = req.user.role === "superadmin" ? requestedStoreId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    const { renames } = req.body;
    if (!Array.isArray(renames) || renames.length === 0) return res.status(400).json({ error: "No renames provided" });

    for (const item of renames) {
      if (!item.id || !item.name) continue;
      await pool.query("UPDATE products SET name = $1 WHERE store_id = $2 AND id = $3", [item.name, storeId, item.id]);
    }

    await logAction(storeId, req.user.id, "product_bulk_rename", "product", null, `\${renames.length} adet ürün toplu olarak yeniden adlandırıldı`, null, null);
    res.json({ success: true, message: `\${renames.length} products renamed.` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", async (req: any, res) => {
  try {
    const requestedStoreId = req.query.storeId || req.user.store_id;
    const storeId = req.user.role === "superadmin" ? requestedStoreId : req.user.store_id;
    if (storeId === undefined || storeId === null || storeId === "") return res.status(400).json({ error: "Store ID required" });

    const { id } = req.params;
    let result;
    if (req.user.role === "superadmin") {
      result = await pool.query("DELETE FROM products WHERE id = $1 RETURNING *", [id]);
    } else {
      result = await pool.query("DELETE FROM products WHERE id = $1 AND (store_id = $2 OR store_id IN (SELECT id FROM stores WHERE parent_id = $2)) RETURNING *", [id, storeId]);
    }

    if (result.rowCount === 0) return res.status(404).json({ error: "Product not found or unauthorized" });
    await logAction(storeId, req.user.id, "product_delete", "product", parseInt(id), `Ürün silindi (ID: ${id})`, null, null);
    res.json({ success: true });
  } catch (e: any) {
    console.error("Delete product error:", e);
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id/movements", async (req: any, res) => {
  try {
    const { id } = req.params;
    const requestedStoreId = req.query.storeId || req.user.store_id;
    const storeId = req.user.role === "superadmin" ? requestedStoreId : req.user.store_id;

    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    // Verify product belongs to the store or its parent/branches group
    const prodRes = await pool.query("SELECT store_id FROM products WHERE id = $1", [id]);
    if (prodRes.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    const productStoreId = prodRes.rows[0].store_id;

    const storeRes = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
    const parentId = storeRes.rows[0]?.parent_id || storeId;

    const groupRes = await pool.query("SELECT id FROM stores WHERE id = $1 OR parent_id = $1", [parentId]);
    const allowedStoreIds = groupRes.rows.map(r => r.id);

    if (!allowedStoreIds.includes(productStoreId) && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Unauthorized to view this product's movements" });
    }

    const movementsRes = await pool.query(
      "SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY created_at DESC",
      [id]
    );

    res.json(movementsRes.rows);
  } catch (error: any) {
    console.error("Fetch product movements error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id/movements/export", async (req: any, res) => {
  try {
    const { id } = req.params;
    const requestedStoreId = req.query.storeId || req.user.store_id;
    const storeId = req.user.role === "superadmin" ? requestedStoreId : req.user.store_id;
    const lang = req.query.lang || "tr";

    if (!storeId) return res.status(400).json({ error: "Store ID required" });

    // Verify product
    const prodRes = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
    if (prodRes.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    const product = prodRes.rows[0];

    const storeRes = await pool.query("SELECT parent_id FROM stores WHERE id = $1", [storeId]);
    const parentId = storeRes.rows[0]?.parent_id || storeId;
    const groupRes = await pool.query("SELECT id FROM stores WHERE id = $1 OR parent_id = $1", [parentId]);
    const allowedStoreIds = groupRes.rows.map(r => r.id);

    if (!allowedStoreIds.includes(product.store_id) && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const movementsRes = await pool.query(
      "SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY created_at DESC",
      [id]
    );

    const data = movementsRes.rows.map((m: any) => ({
      [lang === "tr" ? "Tarih" : "Date"]: new Date(m.created_at).toLocaleString(lang === "tr" ? "tr-TR" : "en-US"),
      [lang === "tr" ? "Tür" : "Type"]: m.type === "in" ? (lang === "tr" ? "Giriş" : "In") : (lang === "tr" ? "Çıkış" : "Out"),
      [lang === "tr" ? "Miktar" : "Quantity"]: m.quantity,
      [lang === "tr" ? "Kaynak" : "Source"]: m.source,
      [lang === "tr" ? "Açıklama" : "Description"]: m.description || "",
      [lang === "tr" ? "Birim Fiyat" : "Unit Price"]: m.unit_price ? Number(m.unit_price) : "",
      [lang === "tr" ? "Müşteri/Tedarikçi" : "Customer/Supplier"]: m.customer_info || "",
      [lang === "tr" ? "Para Birimi" : "Currency"]: m.currency || "TRY"
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, lang === "tr" ? "Hareketler" : "Movements");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${encodeURIComponent(product.name)}_movements.xlsx`
    );
    res.send(buffer);
  } catch (error: any) {
    console.error("Export movements error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle Bestseller
router.put("/:id/toggle-bestseller", async (req: any, res) => {
  const storeId = req.user.store_id;
  const { id } = req.params;
  try {
    await pool.query(
      "UPDATE products SET is_bestseller = NOT is_bestseller WHERE id = $1 AND store_id = $2",
      [id, storeId]
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
