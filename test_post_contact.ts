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

    const targets = [
      { url: `${baseUrl}/Contact/GetContactByVkn`, method: 'POST', body: { vkn: testVkn } },
      { url: `${baseUrl}/Contact/GetContactByVknList`, method: 'POST', body: [testVkn] },
      { url: `${baseUrl}/Contact/GetTaxpayerByVkn`, method: 'POST', body: { vkn: testVkn } },
      { url: `${baseUrl}/Contact/GetTaxpayerByVknList`, method: 'POST', body: [testVkn] },
      { url: `${baseUrl}/Contact/GetContact`, method: 'GET', query: `?vkn=${testVkn}` },
      { url: `${baseUrl}/Contact/GetContact`, method: 'POST', body: { vkn: testVkn } },
      { url: `${baseUrl}/Contact/IsTaxpayer`, method: 'GET', query: `?vkn=${testVkn}` },
      { url: `${baseUrl}/Contact/IsTaxpayer`, method: 'POST', body: { vkn: testVkn } }
    ];

    for (const target of targets) {
      try {
        const fullUrl = target.url + (target.query || "");
        console.log(`\nChecking ${target.method} ${fullUrl}`);
        let res;
        if (target.method === 'POST') {
          res = await axios.post(fullUrl, target.body, { headers });
        } else {
          res = await axios.get(fullUrl, { headers });
        }
        console.log(`-> SUCCESS: ${res.status}`);
        console.log(`-> Data:`, JSON.stringify(res.data).substring(0, 300));
      } catch (err: any) {
        console.log(`-> FAIL: ${err.response?.status || err.message}: ${JSON.stringify(err.response?.data || {})}`);
      }
    }

  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

run();
