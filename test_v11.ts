import axios from "axios";

async function testFinalGuesses() {
    console.log("--- Final Guess Test ---");
    const pzSettings = {
        apiKey: "16484faf89a3498ebfbc040b97be1d56",
        apiSecret: "42fceb9ed48d4f09bca903867ec9143b",
        merchantId: "b89e7cd8-7c87-43ca-ad42-1e9447ced10e"
    };
    const n11Settings = {
        appKey: "66f4ae68-98e3-4dbe-890d-271d53346d0a",
        appSecret: "a4968434-6334-4b5b-8f55-668f49633633"
    };

    console.log("\n--- N11 SOAP Final Attempt ---");
    const n11Envelope = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/service/genel/OrderService">
         <soapenv:Header/>
         <soapenv:Body>
            <sch:DetailedOrderListRequest>
               <auth>
                  <appKey>${n11Settings.appKey}</appKey>
                  <appSecret>${n11Settings.appSecret}</appSecret>
               </auth>
               <searchData><status>New</status></searchData>
            </sch:DetailedOrderListRequest>
         </soapenv:Body>
      </soapenv:Envelope>
    `;
    try {
        const res = await axios.post("https://api.n11.com/ws/OrderService", n11Envelope, {
            headers: { 'Content-Type': 'text/xml;charset=UTF-8' },
            timeout: 5000
        });
        console.log("N11 Success!");
    } catch (e: any) {
        console.log("N11 Fail:", e.response?.status, e.message);
    }

    console.log("\n--- Pazarama Final Attempt ---");
    const pzHeader = `Basic ${Buffer.from(`${pzSettings.apiKey}:${pzSettings.apiSecret}`).toString('base64')}`;
    const pzUrls = [
        "https://isortagimapi.pazarama.com/order/api/getOrdersForApi",
        "https://isortagimapi.pazarama.com/order/getOrdersForApi",
        "https://isortagimapi.pazarama.com/api/v1/Order/GetOrders"
    ];

    for (const url of pzUrls) {
        console.log(`\nTesting POST ${url}`);
        try {
            const res = await axios.post(url, { PageSize: 1, PageIndex: 1 }, {
                headers: { 'Authorization': pzHeader, 'MerchantId': pzSettings.merchantId, 'Content-Type': 'application/json' }
            });
            console.log(`PZ Success: ${url}`);
        } catch (e: any) {
            console.log(`PZ Fail: ${url} -> ${e.response?.status}`);
        }
    }
}

testFinalGuesses().then(() => process.exit(0));
