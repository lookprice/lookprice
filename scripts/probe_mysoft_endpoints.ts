import axios from 'axios';

async function run() {
  const username = "serdar@gapbilisim.net";
  const password = "Yapk@1489@";
  const tenant_id = "210";
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
    console.log("Authenticated! Token acquired.");

    const headers = { 
      Authorization: `Bearer ${token}`,
      'TenantId': tenant_id,
      'ApplicationId': tenant_id,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const targetVkn = "2910114005"; // Denge Bilgisayar
    console.log(`\nProbing endpoints for VKN: ${targetVkn}`);

    const paths = [
      "Contact/GetContactByVkn",
      "Contact/GetTaxpayerByVkn",
      "Common/GetTaxpayer",
      "Common/GetTaxpayerByVkn",
      "Common/GetContactByVkn"
    ];

    for (const path of paths) {
      const url = `${baseUrl}/${path}`;
      console.log(`Checking ${url}?vkn=${targetVkn}`);
      
      try {
        const res = await axios.get(`${url}?vkn=${targetVkn}`, { headers, timeout: 5000 });
        console.log(`-> SUCCESS: ${res.status}`);
      } catch (err: any) {
        console.log(`-> FAILED: ${err.message}. Response: ${JSON.stringify(err.response?.data || {})}`);
      }
    }

  } catch (error: any) {
    console.error("Probing failed:", error.message);
  }
}

run();
