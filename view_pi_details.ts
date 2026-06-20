import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const invoiceNumbers = [
    'AF02026003623450',
    'AF02026003623311',
    'DP12026000013869',
    'BML2026000012707',
    'DG12026000023835'
  ];

  try {
    const res = await pool.query(
      `SELECT id, store_id, invoice_number, ettn, company_id, total_amount, grand_total, created_at FROM purchase_invoices WHERE invoice_number = ANY($1)`,
      [invoiceNumbers]
    );
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}
main();
