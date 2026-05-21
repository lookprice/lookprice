import { pool } from "./models/db";
async function check() {
  try {
    const res = await pool.query("SELECT id, slug, einvoice_settings, meta_settings, google_merchant_settings FROM stores");
    res.rows.forEach(r => {
        console.log(`Store: ${r.slug} (id: ${r.id})`);
        console.log(`  E-Invoice: ${ !!r.einvoice_settings }`);
        console.log(`  Meta: ${ !!r.meta_settings }`);
        console.log(`  Google: ${ !!r.google_merchant_settings }`);
    });
  } catch (e) {
    console.error("Error", e);
  } finally {
    await pool.end();
  }
}
check();
