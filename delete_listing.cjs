require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const res = await pool.query("SELECT id, title FROM real_estate_properties WHERE title ILIKE '%RENK TK%'");
  console.log('Found:', res.rows);
  const del = await pool.query("DELETE FROM real_estate_properties WHERE title ILIKE '%RENK TK%' RETURNING id");
  console.log('Deleted:', del.rows);
  pool.end();
}
run();
