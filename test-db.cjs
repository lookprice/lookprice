const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://root:root@localhost:5432/lookprice_db' });
pool.query(`
      SELECT r.*, s.name as branch_name, s.slug as branch_slug,
             c.name as consultant_name, c.phone as consultant_phone
      FROM real_estate_properties r 
      JOIN stores s ON r.store_id = s.id
      LEFT JOIN consultants c ON r.responsible_consultant_id = c.id
`).then(res => {
  const r = res.rows[0];
  console.log(r);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
