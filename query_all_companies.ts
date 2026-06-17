import { pool } from "./models/db";

async function run() {
  try {
    const res = await pool.query("SELECT * FROM companies LIMIT 100");
    console.log("All Companies:");
    console.log(JSON.stringify(res.rows, null, 2));
    
    const res2 = await pool.query("SELECT * FROM sales_customers LIMIT 100");
    console.log("\nAll Sales Customers:");
    console.log(JSON.stringify(res2.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
