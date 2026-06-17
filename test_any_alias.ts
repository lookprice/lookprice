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
       
       // ROOT VARIATIONS
       pkAlias: 'urn:mail:root_pkAlias',
       gibAlias: 'urn:mail:root_gibAlias',
       alias: 'urn:mail:root_alias',
       receiverAlias: 'urn:mail:root_receiverAlias',
       receiver_alias: 'urn:mail:root_receiver_alias',
       gib_alias: 'urn:mail:root_gib_alias',
       etiket: 'urn:mail:root_etiket',
       ReceiverAlias: 'urn:mail:root_ReceiverAlias',
       PkAlias: 'urn:mail:root_PkAlias',
       GibAlias: 'urn:mail:root_GibAlias',
       Alias: 'urn:mail:root_Alias',
       GibUserAlias: 'urn:mail:root_GibUserAlias',
       gibUserAlias: 'urn:mail:root_gibUserAlias',
       customerAlias: 'urn:mail:root_customerAlias',
       customer_alias: 'urn:mail:root_customer_alias',
       destinationAlias: 'urn:mail:root_destinationAlias',
       destination_alias: 'urn:mail:root_destination_alias',
       
       invoiceAccount: {
          vknTckn: testVkn,
          accountName: 'TEST ALICI LTD',
          taxOfficeName: 'Mecidiyeköy',
          email1: 'test@receiver.com',
          countryName: 'Türkiye',
          cityName: 'İSTANBUL',
          citySubdivision: 'ŞİŞLİ',
          streetName: 'Büyükdere cad No 12',
          
          // ACCOUNT VARIATIONS
          pkAlias: 'urn:mail:acc_pkAlias',
          gibAlias: 'urn:mail:acc_gibAlias',
          alias: 'urn:mail:acc_alias',
          receiverAlias: 'urn:mail:acc_receiverAlias',
          receiver_alias: 'urn:mail:acc_receiver_alias',
          gib_alias: 'urn:mail:acc_gib_alias',
          etiket: 'urn:mail:acc_etiket',
          ReceiverAlias: 'urn:mail:acc_ReceiverAlias',
          PkAlias: 'urn:mail:acc_PkAlias',
          GibAlias: 'urn:mail:acc_GibAlias',
          Alias: 'urn:mail:acc_Alias',
          customerAlias: 'urn:mail:acc_customerAlias',
          customer_alias: 'urn:mail:acc_customer_alias',
          destinationAlias: 'urn:mail:acc_destinationAlias',
          destination_alias: 'urn:mail:acc_destination_alias'
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
    const res = await axios.post(`${baseUrl}/InvoiceOutbox/invoiceOutbox`, ublData, { headers });
    console.log("SUCCESS:", res.data);

  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
  }
}

run();
