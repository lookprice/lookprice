import axios from 'axios';

async function run() {
  const username = "serdar@gapbilisim.net";
  const password = "Yapk@1489@";
  const baseUrl = "https://edocumentapi.mysoft.com.tr/api";

  try {
    console.log("Authenticating...");
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    params.append('grant_type', 'password');

    const authRes = await axios.post(`${baseUrl.replace('/api', '')}/oauth/token`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });

    const token = authRes.data.access_token;
    console.log("Authenticated!");

    const testVkn = "8970435823";

    const controllers = ["Common", "Contact", "Taxpayer", "Invoice", "InvoiceOutbox", "InvoiceInbox"];
    const actions = [
      "GetContactByVkn", "getContactByVkn",
      "GetTaxpayer", "getTaxpayer",
      "IsTaxpayer", "isTaxpayer",
      "GetAlias", "getAlias",
      "GetReceiverAlias", "getReceiverAlias",
      "GetContact", "getContact",
      "GetTaxpayerByVkn", "getTaxpayerByVkn",
      "GetContactByVknTckn", "getContactByVknTckn",
      "GetTaxpayerByVknTckn", "getTaxpayerByVknTckn",
      "GetTaxpayerList", "getTaxpayerList",
      "IsEInvoiceUser", "isEInvoiceUser"
    ];

    const headers: any = {
      Authorization: `Bearer ${token}`,
      'TenantId': '5770',
      'ApplicationId': '5770',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    console.log("Starting scan of endpoints...");
    
    for (const controller of controllers) {
      for (const action of actions) {
        const path = `${controller}/${action}`;
        const url_v1 = `${baseUrl}/${path}`;
        
        // Try GET with vkn query
        try {
          const res = await axios.get(`${url_v1}?vkn=${testVkn}`, { headers, timeout: 1500 });
          console.log(`FOUND [GET]: ${path} -> Status: ${res.status}, Data: ${JSON.stringify(res.data).substring(0, 150)}`);
        } catch (err: any) {
          if (err.response?.status && err.response.status !== 404) {
            console.log(`EXISTENT ROUTE [GET]: ${path} -> Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data).substring(0, 150)}`);
          }
        }

        // Try POST with body
        try {
          const res = await axios.post(url_v1, { vkn: testVkn, vknTckn: testVkn, identifier: testVkn }, { headers, timeout: 1500 });
          console.log(`FOUND [POST]: ${path} -> Status: ${res.status}, Data: ${JSON.stringify(res.data).substring(0, 150)}`);
        } catch (err: any) {
          if (err.response?.status && err.response.status !== 404) {
            console.log(`EXISTENT ROUTE [POST]: ${path} -> Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data).substring(0, 150)}`);
          }
        }
      }
    }

    console.log("Scan complete.");

  } catch (error: any) {
    console.error("Scanning failed:", error.response?.data || error.message);
  }
}

run();
