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
      deliveryAccount: { vknTckn: "11111111111", identifierNumber: "11111111111", accountName: "Test" },
      despatchAdviceDetail: [ { qty: 1, productName: "Test" } ],
      tenantIdentifierNumber: ""
  };
  
  try {
     const res = await axios.post(targetUrl, basePayload, { headers: { Authorization: `Bearer ${token}` } });
     console.log(`Test Empty:`, res.data.message);
  } catch (e) { console.log(`Error Empty:`, e.response?.data || e.message); }

  basePayload.tenantIdentifierNumber = "1234567890";
  try {
     const res = await axios.post(targetUrl, basePayload, { headers: { Authorization: `Bearer ${token}` } });
     console.log(`Test Str:`, res.data.message);
  } catch (e) { console.log(`Error Str:`, e.response?.data || e.message); }
}
run();
