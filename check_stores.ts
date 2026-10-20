import { pool } from './models/db';
async function run() {
  const res = await pool.query("SELECT id, name FROM stores");
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
run();
