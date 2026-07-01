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
  const targetUrl = "https://edocumentapi.mysoft.com.tr/api/InvoiceOutbox/invoiceOutbox";
  
  const payload = {
      eDocumentType: "EFATURA", profile: "TEMELFATURA",
      tenantIdentifierNumber: "50944171540",
      invoiceAccount: { vknTckn: "11111111111", identifierNumber: "11111111111", accountName: "Test" },
      invoiceDetail: [ { id: "1", productName: "A", qty: 1, unitCode: "C62", price: 1, amtTra: "1", unitPriceTra: "1", vatRate: "18", amtVatTra: "0.18", taxableAmtTra: "1" } ],
      docDate: "2024-05-01", docTime: "12:00:00", ettn: "12345678-1234-1234-1234-123456789012", docNo: "GAP2024000000001",
      currencyCode: "TRY", currencyRate: "1", pkAlias: "urn:mail:defaultpk"
  };

  try {
      const res = await axios.post(targetUrl, payload, { headers: { Authorization: `Bearer ${token}` } });
      console.log(`Test Invoice:`, res.data.message || res.data);
  } catch (e) { console.log(`Error Invoice:`, e.response?.data || e.message); }
}
run();
