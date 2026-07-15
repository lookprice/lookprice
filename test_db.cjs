require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT branding FROM stores WHERE id = 22").then(res => {
    let branding = res.rows[0].branding;
    if (typeof branding === 'string') branding = JSON.parse(branding);
    console.log('Store branding table_count:', branding?.page_layout_settings?.table_count);
}).catch(console.error).finally(() => pool.end());
