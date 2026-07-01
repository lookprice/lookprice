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
      tenantIdentifierNumber: "11111111111",
      deliveryAccount: {
         vknTckn: "11111111111",
         identifierNumber: "11111111111",
         accountName: "Test"
      },
      despatchSupplierAccount: {
         vknTckn: "11111111111",
         identifierNumber: "11111111111",
         accountName: "Test"
      },
      sellerAccount: {
         vknTckn: "11111111111",
         identifierNumber: "11111111111",
         accountName: "Test"
      },
      despatchAdviceAccount: {
         vknTckn: "11111111111",
         identifierNumber: "11111111111",
         accountName: "Test"
      },
      despatchDetail: [
         { qty: 1, productName: "Test" }
      ],
      despatchAdviceDetail: [
         { qty: 1, productName: "Test" }
      ],
      shipment: {
         driverName: "Test",
         driverSurname: "Test",
         driverVknTckn: "11111111111",
         plateNumber: "34AAA123"
      }
  };
  try {
     const res = await axios.post(targetUrl, basePayload, {
         headers: { Authorization: `Bearer ${token}` }
     });
     console.log("Success:", res.data);
  } catch (e) {
     console.log("Error:", e.response?.data || e.message);
  }
}
run();
