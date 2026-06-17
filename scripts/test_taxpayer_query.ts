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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const token = authRes.data.access_token;
    console.log("Authenticated! Token acquired.");

    const config = {
      headers: { 
        Authorization: `Bearer ${token}`,
        'TenantId': tenant_id,
        'ApplicationId': tenant_id
      }
    };

    const targetVkns = ["8970435823", "2910114005"];

    for (const targetVkn of targetVkns) {
      console.log(`\n=================== Testing VKN: ${targetVkn} ===================`);
      const variations = [
        `${baseUrl}/Contact/GetContactByVkn?vkn=${targetVkn}`,
        `${baseUrl}/Contact/GetTaxpayerByVkn?vkn=${targetVkn}`,
        `${baseUrl}/Common/GetTaxpayer?vkn=${targetVkn}`,
        `${baseUrl}/Common/GetTaxpayerByVkn?vkn=${targetVkn}`,
        `${baseUrl}/Common/GetContactByVkn?vkn=${targetVkn}`,
        `${baseUrl}/Contact/GetTaxpayer?vkn=${targetVkn}`
      ];

      for (const url of variations) {
        try {
          console.log(`Querying url: ${url}`);
          const res = await axios.get(url, config);
          console.log("-> SUCCESS! Status:", res.status);
          console.log("-> Response KEYS:", Object.keys(res.data));
          console.log("-> Data:", JSON.stringify(res.data).substring(0, 500));
        } catch (err: any) {
          console.log(`-> FAIL: ${url} -> ${err.response?.status || err.message}: ${JSON.stringify(err.response?.data || {})}`);
        }
      }
    }
  } catch (error: any) {
    console.error("Auth failed:", error.response?.data || error.message);
  }
}

run();
