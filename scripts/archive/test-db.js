import pg from 'pg';
import axios from 'axios';
import { config } from 'dotenv';
config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const cRes = await pool.query("SELECT einvoice_settings FROM stores WHERE einvoice_settings->>'username' IS NOT NULL LIMIT 1");
  if (cRes.rows.length === 0) { console.log("No store found"); return; }
  const settings = cRes.rows[0].einvoice_settings;
  console.log("Settings keys:", Object.keys(settings));
  let creds;
  if(settings.credentials) creds = settings.credentials;
  else if(settings.mysoft_credentials) creds = settings.mysoft_credentials;
  else if(settings.mysoft) creds = settings.mysoft;
  else creds = settings;
  console.log("Cred keys:", Object.keys(creds));
  
  // Authenticate
  const baseUrl = creds.api_url || "https://edocumentapi.mysoft.com.tr/api";
  const authUrl = baseUrl.includes('/api') ? baseUrl.split('/api')[0] + '/oauth/token' : baseUrl + '/oauth/token';
  
  const params = new URLSearchParams();
  params.append('username', creds.username || '');
  params.append('password', creds.password || '');
  params.append('grant_type', 'password');

  const authRes = await axios.post(authUrl, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  
  const token = authRes.data.access_token || authRes.data;
  console.log("Token:", typeof token, token.substring(0, 30));
  
  // Fetch
  const today = new Date();
  const threeDaysAgo = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
  const startDate = threeDaysAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];
  
  const tId = creds.tenant_id || "";
  const syncOptions = [
    { 
      url: `${baseUrl}/InvoiceInbox/getInvoiceInboxListForPeriod`, 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      data: { startDate: startDate + " 00:00:00", endDate: endDate + " 23:59:59", tenantIdentifierNumber: tId } 
    },
    { 
      url: `${baseUrl}/InvoiceInbox/getNewInvoiceInboxList`, 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      data: { afterValue: 0, limit: 10, tenantIdentifierNumber: tId } 
    },
    { 
      url: `${baseUrl}/InvoiceInbox/getNewInvoiceInboxList`, 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      data: { afterValue: 0, limit: 10 } 
    },
    { 
      url: `${baseUrl}/InvoiceInbox/getInvoiceInboxListForPeriod`, 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      data: { startDate: startDate + " 00:00:00", endDate: endDate + " 23:59:59" } 
    },
    { url: `${baseUrl}/InvoiceInbox/invoiceInbox`, method: 'GET', params: { startDate, endDate, tenantIdentifierNumber: tId } },
    { url: `${baseUrl}/Invoice/GetInboxInvoices`, method: 'GET', params: { StartDate: startDate, EndDate: endDate, tenantIdentifierNumber: tId } },
  ];

  for (const opt of syncOptions) {
    // ...
  }

  const uuids = [
    "2e9de10a-433e-4f70-8e1c-17b0dbdf493f",
    "eef3b6bc-9063-40d2-967f-2a8d294144dd"
  ];
  
  const detailEndpoints = [
    { url: `${baseUrl}/InvoiceInbox/GetUbl`, method: 'POST', data: { uuid: uuids[0] } },
    { url: `${baseUrl}/InvoiceInbox/ExportToXml`, method: 'POST', data: { uuids: [uuids[0]] } },
    { url: `${baseUrl}/InvoiceInbox/ExportToPdf`, method: 'POST', data: { uuids: [uuids[0]] } },
    { url: `${baseUrl}/EDocument/GetUbl`, method: 'POST', data: { uuid: uuids[0] } },
    { url: `${baseUrl}/Invoice/GetUbl`, method: 'POST', data: { uuid: uuids[0] } },
    { url: `${baseUrl}/InvoiceInbox/DownloadPdf`, method: 'POST', data: { uuid: uuids[0] } },
    { url: `${baseUrl}/InvoiceInbox/DownloadXml`, method: 'POST', data: { uuid: uuids[0] } },
    { url: `${baseUrl}/InvoiceInbox/GetInvoiceObject`, method: 'POST', data: { uuid: uuids[0] } },
  ];

  for (const opt of detailEndpoints) {
    try {
      console.log(`\nTesting Detail: ${opt.method} ${opt.url} with ${JSON.stringify(opt.data)}`);
      const res = await axios({ ...opt, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }});
      console.log("-> SUCCESS! Data keys:", Object.keys(res.data));
      if (res.data.data) {
        if (Array.isArray(res.data.data)) {
           console.log("-> Data is Array of length:", res.data.data.length);
           if (res.data.data.length > 0) console.log(Object.keys(res.data.data[0]));
        } else {
           console.log("-> Data keys:", Object.keys(res.data.data));
        }
      }
    } catch (e) {
      console.log("-> ERROR", e.message, e.response?.status);
    }
  }

  pool.end();
}

run();
