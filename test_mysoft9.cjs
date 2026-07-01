const axios = require('axios');
const qs = require('qs');

async function run() {
  const authUrl = "https://edocumentapi.mysoft.com.tr/oauth/token";
  const authRes = await axios.post(authUrl, qs.stringify({
      grant_type: "password",
      username: "serdar@gapbilisim.net",
      password: "Yapk@1489@"
  }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  const token = authRes.data.access_token;
  const targetUrl = "https://edocumentapi.mysoft.com.tr/api/DespatchOutbox/despatchOutbox";
  
  const payloads = [
    { deliveryAccount: {} },
    { deliveryAccount: { identifierNumber: "1" } },
    { deliveryAccount: { identifierNumber: "1", accountName: "A" } },
    { deliveryAccount: { identifierNumber: "1", accountName: "A" }, despatchAdviceAccount: {} },
    { deliveryAccount: { identifierNumber: "1", accountName: "A" }, despatchAdviceAccount: { identifierNumber: "1" } }
  ];

  for (let i = 0; i < payloads.length; i++) {
     try {
        const res = await axios.post(targetUrl, payloads[i], {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`Payload ${i}:`, res.data);
     } catch (e) {
        console.log(`Error ${i}:`, e.response?.data || e.message);
     }
  }
}
run();
