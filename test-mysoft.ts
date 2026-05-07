import { getEInvoiceService } from './src/services/backend/einvoiceFactory.ts';
import pool from './models/db.ts';

async function test() {
  try {
    const res = await pool.query("SELECT * FROM e_invoice_configs LIMIT 1");
    if (res.rows.length === 0) {
      console.log("No config found");
      return;
    }
    const storeId = res.rows[0].store_id;
    const service = await getEInvoiceService(storeId);
    
    // Last 3 days
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const startDate = threeDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    console.log("Fetching for", startDate, endDate);
    if (!service.getIncomingEInvoices) {
      console.log("Not implemented");
      return;
    }
    const invoices = await service.getIncomingEInvoices(startDate, endDate);
    console.log("Length:", invoices.length);
    if (invoices.length > 0) {
      console.log("First invoice raw:", JSON.stringify(invoices[0].raw, null, 2));
    }
  } catch (err) {
    console.error("Test failed", err.message);
  } finally {
    await pool.end();
  }
}
test();
