import { pool } from './models/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  console.log("Connecting to pool...");
  const client = await pool.connect();
  console.log("Connected.");
  try {
    const res = await client.query("UPDATE stock_transfers SET status = 'accepted' WHERE id = 7 RETURNING *");
    console.log("Result:", res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
