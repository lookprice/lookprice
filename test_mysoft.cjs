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
  
  const basePayload = {
      eDocumentType: "IRSALIYE",
      profile: "TEMELIRSALIYE",
      despatchAdviceType: "SEVK",
      docDate: "2024-05-01",
      docTime: "12:00:00",
      ettn: "12345678-1234-1234-1234-123456789012",
      docNo: "GAP2024000000001",
      currencyCode: "TRY",
      currencyRate: "1",
      tenantIdentifierNumber: "11111111111",
      despatchAdviceDetail: [
          {
             qty: 1,
             productName: "Test"
          }
      ],
      shipment: {
          plateNumber: "34ABC123"
      }
  };

  try {
     const res = await axios.post(targetUrl, basePayload, {
         headers: { Authorization: `Bearer ${token}` }
     });
     console.log("Success:", res.data);
  } catch (e) {
     console.log("Error 1:", e.response?.data || e.message);
  }
}
run();
