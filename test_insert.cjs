require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("INSERT INTO restaurant_tables (store_id, table_number, status) VALUES (22, '1', 'empty') RETURNING *")
.then(res => console.log('Insert OK:', res.rows))
.catch(console.error)
.finally(() => pool.end());
