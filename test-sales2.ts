import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const storeId = 2; // let's assume 2 or 1
    const startDate = "2026-03-19";
    const endDate = "2026-04-18";
    
    let query = "SELECT * FROM sales WHERE store_id = $1";
    const params: any[] = [storeId];
    
    params.push(startDate);
    query += ` AND created_at >= $${params.length}`;
    
    params.push(endDate + ' 23:59:59');
    query += ` AND created_at <= $${params.length}`;
    
    console.log("Executing:", query, params);
    const res = await pool.query(query, params);
    console.log("Matches for store 2:", res.rows.length);
    
    // Check store 11
    params[0] = 11;
    const res11 = await pool.query(query, params);
    console.log("Matches for store 11:", res11.rows.length);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
