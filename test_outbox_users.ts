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

    const authRes = await axios.post(`https://edocumentapi.mysoft.com.tr/oauth/token`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const token = authRes.data.access_token;
    console.log("Authenticated!");

    const testVkn = "8970435823";

    const headers: any = {
      Authorization: `Bearer ${token}`,
      'TenantId': '5770',
      'ApplicationId': '5770',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const controllers = ["InvoiceOutbox", "InvoiceInbox", "Invoice", "Common", "Contact"];
    const actions = [
      "getGibUserList", "GetGibUserList",
      "getGibUser", "GetGibUser",
      "getUserList", "GetUserList",
      "getUser", "GetUser",
      "getTaxpayerList", "GetTaxpayerList",
      "isEInvoiceUser", "IsEInvoiceUser",
      "isTaxIdEInvoiceUser", "IsTaxIdEInvoiceUser",
      "getTaxpayerByVkn", "GetTaxpayerByVkn",
      "getContactByVkn", "GetContactByVkn"
    ];

    for (const ctrl of controllers) {
      for (const act of actions) {
        const path = `${ctrl}/${act}`;
        // Try GET
        try {
          const url = `${baseUrl}/${path}?vkn=${testVkn}`;
          const res = await axios.get(url, { headers, timeout: 2000 });
          console.log(`FOUND [GET]: ${path} -> Status: ${res.status}, Data: ${JSON.stringify(res.data).substring(0, 150)}`);
        } catch (err: any) {
          if (err.response?.status && err.response.status !== 404) {
            console.log(`POTENTIAL [GET]: ${path} -> Status: ${err.response.status}. Msg: ${JSON.stringify(err.response.data)}`);
          }
        }

        // Try POST with body JSON { vkn: testVkn }
        try {
          const url = `${baseUrl}/${path}`;
          const res = await axios.post(url, { vkn: testVkn }, { headers, timeout: 2000 });
          console.log(`FOUND [POST]: ${path} -> Status: ${res.status}, Data: ${JSON.stringify(res.data).substring(0, 150)}`);
        } catch (err: any) {
          if (err.response?.status && err.response.status !== 404) {
            console.log(`POTENTIAL [POST]: ${path} -> Status: ${err.response.status}. Msg: ${JSON.stringify(err.response.data)}`);
          }
        }

        // Try POST with body JSON { vknTcknList: [testVkn] } or { identifierList: [testVkn] }
        try {
          const url = `${baseUrl}/${path}`;
          const res = await axios.post(url, { vknTcknList: [testVkn] }, { headers, timeout: 2000 });
          console.log(`FOUND [POST-LIST]: ${path} -> Status: ${res.status}, Data: ${JSON.stringify(res.data).substring(0, 150)}`);
        } catch (err: any) {
          if (err.response?.status && err.response.status !== 404) {
            console.log(`POTENTIAL [POST-LIST]: ${path} -> Status: ${err.response.status}. Msg: ${JSON.stringify(err.response.data)}`);
          }
        }
      }
    }
    console.log("Scan complete.");

  } catch (error: any) {
    console.error("Failed:", error.response?.data || error.message);
  }
}

run();
