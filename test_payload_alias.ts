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

    // Construct a minimal Outbox payload
    const ublData: any = {
       isCalculateByApi: false,
       isManuelCalculation: true,
       id: 0, 
       eDocumentType: 'EFATURA',
       profile: 'TICARIFATURA',
       invoiceType: 'SATIS',
       docDate: '2026-06-17',
       docTime: '2026-06-17 12:00:00',
       ettn: '99999999-9999-9999-9999-999999999999',
       docNo: 'GEF2026000000001',
       currencyCode: 'TRY',
       currencyRate: '1',
       tenantIdentifierNumber: '50944171540', // Gap Bilişim
       
       // Populate all variations with unique values
       pkAlias: 'urn:mail:test_pkAlias',
       gibAlias: 'urn:mail:test_gibAlias',
       alias: 'urn:mail:test_alias',
       receiverAlias: 'urn:mail:test_receiverAlias',
       receiver_alias: 'urn:mail:test_receiver_alias',
       gib_alias: 'urn:mail:test_gib_alias',
       
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

    console.log("Sending payload...");
    try {
      const res = await axios.post(`${baseUrl}/InvoiceOutbox/invoiceOutbox`, ublData, { headers });
      console.log("SUCCESS:", res.data);
    } catch (err: any) {
      console.log("FAILED WITH DATA ERROR:", err.response?.data);
    }

  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

run();
