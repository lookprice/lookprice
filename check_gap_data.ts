import { pool } from "./models/db";
async function check() {
  try {
    const storeId = 2; // GAP
    
    console.log("Testing products...");
    const productsRes = await pool.query("SELECT * FROM products WHERE store_id = $1", [storeId]);
    console.log("Products found:", productsRes.rows.length);

    console.log("Testing vehicles...");
    const vehiclesRes = await pool.query("SELECT * FROM vehicles WHERE store_id = $1", [storeId]);
    console.log("Vehicles found:", vehiclesRes.rows.length);

    console.log("Testing realEstate...");
    const realEstateRes = await pool.query("SELECT * FROM real_estate WHERE store_id = $1", [storeId]);
    console.log("RealEstate found:", realEstateRes.rows.length);

  } catch (e) {
    console.error("Query failed", e);
  } finally {
    await pool.end();
  }
}
check();
