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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const token = authRes.data.access_token;
    console.log("Authenticated!");

    // Decode JWT token
    const parts = token.split('.');
    let detectedTenantId = "";
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload.iuser) {
          const iuserObj = JSON.parse(payload.iuser);
          detectedTenantId = String(iuserObj.DefaultTenantId || iuserObj.Tenant?.Id || "");
        }
      } catch (err: any) {
        console.error("JWT parse err:", err.message);
      }
    }

    console.log("Detected Tenant ID:", detectedTenantId);
    if (!detectedTenantId) {
      detectedTenantId = "210"; // fallback
    }

    const config = {
      headers: { 
        Authorization: `Bearer ${token}`,
        'TenantId': detectedTenantId,
        'ApplicationId': detectedTenantId
      }
    };

    const targetVkns = ["8970435823", "2910114005", "50944171540"];

    for (const targetVkn of targetVkns) {
      console.log(`\n=================== Testing VKN: ${targetVkn} ===================`);
      const variations = [
        `${baseUrl}/Contact/GetContactByVkn?vkn=${targetVkn}`,
        `${baseUrl}/Contact/GetTaxpayerByVkn?vkn=${targetVkn}`,
        `${baseUrl}/Common/GetTaxpayer?vkn=${targetVkn}`
      ];

      for (const url of variations) {
        try {
          console.log(`Querying url: ${url}`);
          const res = await axios.get(url, config);
          console.log("-> SUCCESS! Status:", res.status);
          console.log("-> Data snippet:", JSON.stringify(res.data).substring(0, 500));
        } catch (err: any) {
          console.log(`-> FAIL: ${url} -> ${err.response?.status || err.message}: ${JSON.stringify(err.response?.data || {})}`);
        }
      }
    }
  } catch (error: any) {
    console.error("Failed:", error.response?.data || error.message);
  }
}

run();
