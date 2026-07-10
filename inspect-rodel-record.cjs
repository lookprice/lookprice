const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query("SELECT * FROM stores WHERE id = 16");
    const row = res.rows[0];
    console.log("Store: id=16, name:", row.name, "slug:", row.slug);
    console.log("custom_domain:", row.custom_domain);
    console.log("status:", row.status, "is_approved:", row.is_approved);
    console.log("branding:", JSON.stringify(row.branding).slice(0, 1000));
    console.log("\npage_layout:", JSON.stringify(row.page_layout));
  } catch (e) {
    console.error("Failed:", e.message);
  } finally {
    await pool.end();
  }
}

run();
