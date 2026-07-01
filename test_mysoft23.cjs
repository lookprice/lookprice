const axios = require('axios');
const qs = require('qs');

async function run() {
  const authUrl = "https://edocumentapi.mysoft.com.tr/oauth/token";
  const authRes = await axios.post(authUrl, qs.stringify({
      grant_type: "password",
      username: "serdar@gapbilisim.net",
      password: "Yapk@1489@"
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  const token = authRes.data.access_token;
  const targetUrl = "https://edocumentapi.mysoft.com.tr/api/DespatchOutbox/despatchOutbox";
  
  const acct = { 
     vknTckn: "11111111111", identifierNumber: "11111111111", accountName: "Test"
  };
  
  const payloads = [
     { deliveryAccount: acct, despatchAdviceAccount: {} },
     { deliveryAccount: acct, despatchAdviceDetail: [{}] },
     { deliveryAccount: acct, shipment: {} },
     { deliveryAccount: acct, invoiceAccount: {} }
  ];

  for (let i = 0; i < payloads.length; i++) {
     try {
         const res = await axios.post(targetUrl, payloads[i], { headers: { Authorization: `Bearer ${token}` } });
         console.log(`Test ${i}:`, res.data.message);
     } catch (e) { console.log(`Error ${i}:`, e.response?.data || e.message); }
  }
}
run();
