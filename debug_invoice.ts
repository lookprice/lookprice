
import { pool } from "./models/db";

async function debug() {
  const invoiceId = 315;
  console.log(`Searching for invoice ID: ${invoiceId}`);
  
  let res = await pool.query("SELECT * FROM sales_invoices WHERE id = $1", [invoiceId]);
  
  if (res.rows.length === 0) {
    console.log(`Invoice ID ${invoiceId} not found in sales_invoices. Trying purchase_invoices...`);
    res = await pool.query("SELECT * FROM purchase_invoices WHERE id = $1", [invoiceId]);
  }
  
  if (res.rows.length === 0) {
    console.log(`Invoice ID ${invoiceId} not found in either table.`);
    return;
  }
  
  const invoice = res.rows[0];
  console.log("Invoice Details:", JSON.stringify(invoice, null, 2));
  
  const storeId = invoice.store_id;
  const storeRes = await pool.query("SELECT einvoice_settings FROM stores WHERE id = $1", [storeId]);
  
  if (storeRes.rows.length > 0) {
    const settings = storeRes.rows[0].einvoice_settings;
    console.log("Store E-Invoice Settings:", JSON.stringify(settings, null, 2));
    
    if (settings.provider === 'mysoft') {
      const { MySoftService } = await import("./src/services/backend/mysoftService");
      const service = new MySoftService(settings);
      console.log("Attempting to fetch HTML via service...");
      try {
        const html = await service.getInvoiceHtml(invoice.ettn, invoice.document_number);
        console.log("HTML FETCH SUCCESS! Length:", html.length);
      } catch (e) {
        console.log("HTML FETCH FAILED:", e.message);
      }
    }
  } else {
    console.log("Store not found.");
  }
  
  process.exit(0);
}

debug().catch(err => {
  console.error(err);
  process.exit(1);
});
