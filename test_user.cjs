require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT * FROM users WHERE email = 'lookprice.me@gmail.com'").then(res => {
    console.log('User:', res.rows[0]);
}).catch(console.error).finally(() => pool.end());
