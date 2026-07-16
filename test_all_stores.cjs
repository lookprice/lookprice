require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT id, name, branding FROM stores").then(res => {
    console.log('Stores:');
    for (let r of res.rows) {
      console.log(r.id, r.name, typeof r.branding);
    }
}).catch(console.error).finally(() => pool.end());
