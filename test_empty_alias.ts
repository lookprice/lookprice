import axios from 'axios';

async function run() {
  const username = "serdar@gapbilisim.net";
  const password = "Yapk@1489@";
  const baseUrl = "https://edocumentapi.mysoft.com.tr/api";

  try {
    console.log("Authenticating...");
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    params.append('grant_type', 'password');

    const authRes = await axios.post(`https://edocumentapi.mysoft.com.tr/oauth/token`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });

    const token = authRes.data.access_token;
    console.log("Authenticated!");

    const testVkn = "8970435823"; // Recipient VKN

    const headers: any = {
      Authorization: `Bearer ${token}`,
      'TenantId': '5770',
      'ApplicationId': '5770',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Payload 1: Omitting pkAlias completely
    const ublData1: any = {
       isCalculateByApi: false,
       isManuelCalculation: true,
       id: 0, 
       eDocumentType: 'EFATURA',
       profile: 'TICARIFATURA',
       invoiceType: 'SATIS',
       docDate: '2026-06-17',
       docTime: '2026-06-17 12:00:00',
       ettn: '11111111-2222-3333-4444-555555555551',
       docNo: 'GEF2026000000101',
       currencyCode: 'TRY',
       currencyRate: '1',
       tenantIdentifierNumber: '50944171540',
       
       invoiceAccount: {
          vknTckn: testVkn,
          accountName: 'TEST ALICI LTD',
          taxOfficeName: 'Mecidiyeköy',
          email1: 'test@receiver.com',
          countryName: 'Türkiye',
          cityName: 'İSTANBUL',
          citySubdivision: 'ŞİŞLİ',
          streetName: 'Büyükdere cad No 12'
       },

       tax: [{
          taxAmount: 10,
          taxSubTotal: [{
             taxableAmount: 100,
             taxAmount: 10,
             calculationSequenceNumeric: 0,
             percent: '10',
             taxName: 'Katma Değer Vergisi',
             taxTypeCode: '0015'
          }]
       }],

       invoiceDetail: [{
          productName: 'Test Urun',
          qty: '1',
          unitCode: 'C62',
          unitPriceTra: '100',
          amtTra: '100',
          vatRate: '10',
          amtVatTra: '10',
          taxableAmtTra: '100',
          taxTypeCode: '0015'
       }],

       invoiceCalculation: {
          lineExtensionAmount: 100,
          taxExclusiveAmount: 100,
          taxInclusiveAmount: 110,
          payableAmount: 110,
          allowanceTotalAmount: 0
       }
    };

    console.log("\n--- Testing with pkAlias OMITTED ---");
    try {
      const res = await axios.post(`${baseUrl}/InvoiceOutbox/invoiceOutbox`, ublData1, { headers });
      console.log("SUCCESS:", res.data);
    } catch (e: any) {
      console.log("-> FAIL (OMITTED):", JSON.stringify(e.response?.data || e.message));
    }

    // Payload 2: pkAlias as null
    console.log("\n--- Testing with pkAlias = null ---");
    const ublData2 = { ...ublData1, pkAlias: null, ettn: '11111111-2222-3333-4444-555555555552', docNo: 'GEF2026000000102' };
    try {
      const res = await axios.post(`${baseUrl}/InvoiceOutbox/invoiceOutbox`, ublData2, { headers });
      console.log("SUCCESS:", res.data);
    } catch (e: any) {
      console.log("-> FAIL (NULL):", JSON.stringify(e.response?.data || e.message));
    }

    // Payload 3: pkAlias as empty string ""
    console.log("\n--- Testing with pkAlias = '' ---");
    const ublData3 = { ...ublData1, pkAlias: "", ettn: '11111111-2222-3333-4444-555555555553', docNo: 'GEF2026000000103' };
    try {
      const res = await axios.post(`${baseUrl}/InvoiceOutbox/invoiceOutbox`, ublData3, { headers });
      console.log("SUCCESS:", res.data);
    } catch (e: any) {
      console.log("-> FAIL (EMPTY):", JSON.stringify(e.response?.data || e.message));
    }

  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

run();
