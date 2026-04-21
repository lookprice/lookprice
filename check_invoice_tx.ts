
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    
    console.log("Invoice check:");
    const invRes = await client.query("SELECT * FROM sales_invoices WHERE invoice_number LIKE '%1776764067648%'");
    console.log(JSON.stringify(invRes.rows, null, 2));

    if (invRes.rows.length > 0) {
      const inv = invRes.rows[0];
      console.log("\nTransactions for this invoice/sale/quotation:");
      const txRes = await client.query(`
        SELECT * FROM current_account_transactions 
        WHERE sales_invoice_id = $1 
           OR sale_id = $2 
           OR quotation_id = $3
      `, [inv.id, inv.sale_id, inv.quotation_id]);
      console.log(JSON.stringify(txRes.rows, null, 2));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
check();
