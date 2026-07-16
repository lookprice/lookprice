require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const storeId = 22;
  const storeRes = await pool.query("SELECT branding FROM stores WHERE id = $1", [storeId]);
  let targetTableCount = 12; // Default
  if (storeRes.rows.length > 0) {
      let branding = storeRes.rows[0].branding;
      if (typeof branding === 'string') {
          try { branding = JSON.parse(branding); } catch (e) {}
      }
      const settings = branding?.page_layout_settings;
      if (settings && settings.table_count) {
          targetTableCount = parseInt(settings.table_count);
      }
  }
  console.log("targetTableCount:", targetTableCount);

  let result = await pool.query("SELECT * FROM restaurant_tables WHERE store_id = $1 ORDER BY id ASC", [storeId]);
  console.log("result.rows.length:", result.rows.length);

  if (result.rows.length !== targetTableCount) {
      if (result.rows.length < targetTableCount) {
          // Add missing tables
          for (let i = result.rows.length + 1; i <= targetTableCount; i++) {
              const tableNumber = `${i}`;
              const existing = result.rows.find((t) => t.table_number === tableNumber);
              if (!existing) {
                 console.log("Inserting table", tableNumber);
                 await pool.query("INSERT INTO restaurant_tables (store_id, table_number, status) VALUES ($1, $2, 'empty')", [storeId, tableNumber]);
              }
          }
      }
      result = await pool.query("SELECT * FROM restaurant_tables WHERE store_id = $1 ORDER BY id ASC", [storeId]);
  }
  console.log("final length:", result.rows.length);
}

run().catch(console.error).finally(() => pool.end());
