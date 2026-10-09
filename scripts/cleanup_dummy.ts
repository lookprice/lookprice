import { pool } from "../models/db";

async function cleanupDummyProducts() {
  const storeId = 2;

  // 1. Delete dummy products created with temporary barcodes 200552% or dummy names
  const deleteRes = await pool.query(`
    DELETE FROM products
    WHERE store_id = $1 AND (
      barcode LIKE '200552%' OR 
      name LIKE 'E-Mağaza Portföy%' OR 
      name LIKE 'HBCV%' OR 
      name LIKE 'BS400%' OR
      name LIKE 'HBV%'
    )
    RETURNING id, name, barcode
  `, [storeId]);

  console.log(`Deleted ${deleteRes.rows.length} dummy/phantom products from Store ${storeId}`);

  // 2. Make sure real store products have clean active states
  const countRes = await pool.query("SELECT COUNT(*) FROM products WHERE store_id = $1", [storeId]);
  const activeRes = await pool.query("SELECT COUNT(*) FROM products WHERE store_id = $1 AND is_hepsiburada_active = true", [storeId]);

  console.log(`Store ${storeId} total real products remaining:`, countRes.rows[0].count);
  console.log(`Store ${storeId} active HB products remaining:`, activeRes.rows[0].count);

  process.exit(0);
}

cleanupDummyProducts();
