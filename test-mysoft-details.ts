
import { MySoftService } from './src/services/backend/mysoftService';
import { pool } from './models/db';

async function run() {
  const storeRes = await pool.query("SELECT einvoice_settings FROM stores WHERE einvoice_settings->>'provider' = 'mysoft' LIMIT 1");
  const settings = storeRes.rows[0].einvoice_settings;
  const service = new MySoftService(settings);
  
  const ettn = '4add7c0f-ca2b-4ce2-9af2-0489d5735cd2';
  console.log('Testing details for:', ettn);
  const details = await service.getInvoiceDetailsByUuid(ettn);
  console.log('Details:', JSON.stringify(details, null, 2));

  console.log('Testing HTML for:', ettn);
  try {
     const html = await service.getInvoiceHtml(ettn);
     console.log('HTML length:', html?.length);
  } catch(e) {
     console.error('HTML Error:', e);
  }
  
  await pool.end();
}
run();
