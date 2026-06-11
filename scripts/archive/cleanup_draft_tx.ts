
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function cleanup() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    
    // Find transactions linked to DRAFT invoices
    const draftInvoicesRes = await client.query("SELECT id FROM sales_invoices WHERE status = 'draft'");
    const draftIds = draftInvoicesRes.rows.map(r => r.id);
    
    if (draftIds.length > 0) {
        console.log("Draft Invoice IDs:", draftIds);
        const res = await client.query("DELETE FROM current_account_transactions WHERE sales_invoice_id = ANY($1)", [draftIds]);
        console.log("Deleted transactions for draft invoices:", res.rowCount);
    } else {
        console.log("No draft invoices found.");
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
cleanup();
