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
  
  const payloads = [
    {
      eDocumentType: "IRSALIYE", profile: "TEMELIRSALIYE", despatchAdviceType: "SEVK",
      tenantIdentifierNumber: "50944171540",
      deliveryAccount: { vknTckn: "11111111111", identifierNumber: "11111111111", accountName: "Test" },
      despatchAdviceAccount: { vknTckn: "11111111111", identifierNumber: "11111111111", accountName: "Test" },
      despatchAdviceDetail: [ { qty: 1, productName: "Test", unitCode: "C62", id: "1", lineIndex: 1 } ],
      shipment: { driverName: "a", driverSurname: "b", plateNumber: "34AAA", actualDeliveryDate: "2024-05-01" },
      docDate: "2024-05-01", docTime: "12:00:00", ettn: "12345678-1234-1234-1234-123456789012", docNo: "GAP2024000000001",
      pkAlias: "urn:mail:faturapk@serdarerdekli.com"
    }
  ];

  for (let i = 0; i < payloads.length; i++) {
     try {
        const res = await axios.post(targetUrl, payloads[i], { headers: { Authorization: `Bearer ${token}` } });
        console.log(`Test ${i}:`, res.data.message);
     } catch (e) { console.log(`Error ${i}:`, e.response?.data || e.message); }
  }
}
run();
