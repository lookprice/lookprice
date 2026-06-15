import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkData() {
  try {
    console.log("--- COMPANIES DATA (First 5) ---");
    const compRes = await pool.query("SELECT id, title, tax_number, tax_office, address FROM companies LIMIT 5");
    console.table(compRes.rows);

    console.log("\n--- CUSTOMERS DATA (First 5) ---");
    const custRes = await pool.query("SELECT id, name, full_name, tax_number, tax_office, address FROM customers LIMIT 5");
    console.table(custRes.rows);

    await pool.end();
  } catch (e) {
    console.error(e);
  }
}

checkData();
