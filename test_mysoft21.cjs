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
  const targetUrl = "https://edocumentapi.mysoft.com.tr/api/Despatch/sendDespatchAdvice";
  
  const acct = { 
     vknTckn: "11111111111", identifierNumber: "11111111111", accountName: "Test",
     countryName: "Türkiye", cityName: "ISTANBUL", streetName: "Merkez"
  };
  
  const payload = {
      eDocumentType: "IRSALIYE", profile: "TEMELIRSALIYE", despatchAdviceType: "SEVK",
      tenantIdentifierNumber: "50944171540",
      deliveryAccount: acct, despatchAdviceAccount: acct, 
      despatchDetail: [ { id: "1", productName: "A", quantity: 1, unitCode: "C62" } ],
      shipment: { plateNumber: "34AAA" },
      docDate: "2024-05-01", docTime: "12:00:00", uuid: "12345678-1234-1234-1234-123456789012", docNo: "GAP2024000000001",
      localDocumentId: "12345678"
  };

  try {
      const res = await axios.post(targetUrl, payload, { headers: { Authorization: `Bearer ${token}` } });
      console.log(`Test:`, res.data.message);
  } catch (e) { console.log(`Error:`, e.response?.data || e.message); }
}
run();
