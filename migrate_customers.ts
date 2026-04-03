import { pool } from "./models/db";

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS surname TEXT;");
    await client.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS country TEXT;");
    await client.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS city TEXT;");
    await client.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS tc_id TEXT;");
    await client.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_corporate BOOLEAN DEFAULT false;");
    await client.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS marketing_email BOOLEAN DEFAULT false;");
    await client.query("ALTER TABLE customers ADD COLUMN IF NOT EXISTS marketing_sms BOOLEAN DEFAULT false;");
    console.log("Migration successful");
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
