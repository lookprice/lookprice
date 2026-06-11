
import { MySoftService } from './src/services/backend/mysoftService';
import { pool } from './models/db';

async function run() {
  const storeRes = await pool.query("SELECT einvoice_settings FROM stores WHERE einvoice_settings->>'provider' = 'mysoft' LIMIT 1");
  if (storeRes.rows.length === 0) {
      console.log('No MySoft store found');
      return pool.end();
  }
  const settings = storeRes.rows[0].einvoice_settings;
  console.log('Using settings:', settings);
  
  const service = new MySoftService(settings);
  
  // Use a date range that includes the user's invoice date (06.05.2026)
  const invoices = await service.getIncomingInvoices('2026-05-01', '2026-05-07');
  console.log('Fetched Invoices:', JSON.stringify(invoices, null, 2));
  
  await pool.end();
}
run();
