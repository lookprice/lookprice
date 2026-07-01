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
  
  const base = { deliveryAccount: { identifierNumber: "1", accountName: "A", vknTckn: "1" } };
  const payloads = [
    { ...base, despatchAdviceAccount: { identifierNumber: "1", accountName: "A" } },
    { ...base, shipment: {} },
    { ...base, shipment: { driverName: "A" } },
    { ...base, despatchAdviceDetail: [] },
    { ...base, despatchAdviceDetail: [ {} ] },
    { ...base, despatchAdviceDetail: [ { qty: 1 } ] },
    { ...base, despatchAdviceAccount: { identifierNumber: "1" }, despatchAdviceDetail: [ {qty:1} ], shipment: {} },
    { ...base, invoiceAccount: { identifierNumber: "1", accountName: "A", vknTckn: "1" } }
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
