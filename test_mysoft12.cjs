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
  
  const basePayload = {
      eDocumentType: "IRSALIYE", profile: "TEMELIRSALIYE", despatchAdviceType: "SEVK",
      tenantIdentifierNumber: "11111111111",
      deliveryAccount: { vknTckn: "11111111111", identifierNumber: "11111111111", accountName: "Test" }
  };
  
  const tests = [
    { ...basePayload, despatchAdviceDetail: [ { qty: 1, productName: "Test" } ] },
    { ...basePayload, despatchSupplierAccount: { vknTckn: "1" } },
    { ...basePayload, despatchAdviceAccount: { vknTckn: "1" } },
    { ...basePayload, despatchDetail: [ { qty: 1, productName: "Test" } ] }
  ];

  for (let i = 0; i < tests.length; i++) {
     try {
        const res = await axios.post(targetUrl, tests[i], { headers: { Authorization: `Bearer ${token}` } });
        console.log(`Test ${i}:`, res.data.message);
     } catch (e) { console.log(`Test ${i} Error:`, e.response?.data || e.message); }
  }
}
run();
