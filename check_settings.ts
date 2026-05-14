import { pool } from "./models/db";

async function checkStore() {
    const res = await pool.query("SELECT n11_settings, hepsiburada_settings, trendyol_settings, pazarama_settings FROM stores WHERE id = 6");
    console.log(JSON.stringify(res.rows[0], null, 2));
}
checkStore().then(() => process.exit(0));
