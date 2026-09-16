import { Pool } from 'pg';
import axios from 'axios';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  // Let's get the store_id and create a session or check how session works in server.ts
  const invRes = await pool.query("SELECT store_id FROM sales_invoices WHERE id = 506");
  const storeId = invRes.rows[0].store_id;
  
  // Let's check session store or cookies, or we can temporarily add a test endpoint or inspect server.ts session handling.
  console.log("Store ID for invoice 506:", storeId);
  process.exit(0);
}
run();
