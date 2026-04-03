import { pool } from "./models/db";

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS unit_price REAL;");
    await client.query("ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS customer_info TEXT;");
    console.log("Migration successful");
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
