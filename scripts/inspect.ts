import { pool } from "../models/db";

async function inspectStoreProducts() {
  const storeId = 2;
  const dummyRes = await pool.query(`
    SELECT id, name, barcode, is_hepsiburada_active
    FROM products
    WHERE store_id = $1 AND (
      barcode LIKE '200552%' OR 
      name LIKE 'E-Mağaza Portföy%' OR 
      name LIKE 'HBCV%' OR 
      name LIKE 'BS400%' OR
      name LIKE 'HBV%'
    )
  `, [storeId]);

  console.log(`Found ${dummyRes.rows.length} dummy/auto-imported items in Store ${storeId}`);
  
  const totalProds = await pool.query("SELECT COUNT(*) FROM products WHERE store_id = $1", [storeId]);
  console.log(`Total products in store ${storeId}:`, totalProds.rows[0].count);

  const realActiveProds = await pool.query(`
    SELECT id, name, barcode, is_hepsiburada_active, hepsiburada_sku
    FROM products
    WHERE store_id = $1 
      AND barcode NOT LIKE '200552%' 
      AND name NOT LIKE 'HBCV%' 
      AND name NOT LIKE 'BS400%' 
      AND name NOT LIKE 'HBV%'
      AND name NOT LIKE 'E-Mağaza Portföy%'
  `, [storeId]);
  console.log(`Real store products count:`, realActiveProds.rows.length);
  realActiveProds.rows.forEach(r => {
    console.log(`  REAL -> ID: ${r.id} | Name: "${r.name}" | Barcode: ${r.barcode} | ActiveHB: ${r.is_hepsiburada_active} | HbSku: ${r.hepsiburada_sku}`);
  });

  process.exit(0);
}
inspectStoreProducts();
