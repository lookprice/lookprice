require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
pool.query('SELECT barcode, COUNT(*) FROM products GROUP BY barcode HAVING COUNT(*) > 1 ORDER BY COUNT(*) DESC LIMIT 5', (err, res) => {
  if(err) console.error(err);
  else console.log(res.rows);
  pool.end();
});
