require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const res = await pool.query("SELECT id, title, room_count, square_meters, sqm_gross, sector_data FROM real_estate_properties WHERE title ILIKE '%Dikmen%160m%'");
  console.log(JSON.stringify(res.rows, null, 2));
  pool.end();
}
run();
