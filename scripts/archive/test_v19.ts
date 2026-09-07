import axios from "axios";

async function testN11SOAPRaw() {
    console.log("--- N11 SOAP Raw Check ---");
    const appKey = "66f4ae68-98e3-4dbe-890d-271d53346d0a";
    const appSecret = "a4968434-6334-4b5b-8f55-668f49633633";

    const soapEnvelope = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="http://www.n11.com/ws/schemas/OrderService">
   <soapenv:Header/>
   <soapenv:Body>
      <sch:OrderListRequest>
         <auth>
            <appKey>${appKey}</appKey>
            <appSecret>${appSecret}</appSecret>
         </auth>
         <searchData>
            <productId></productId>
         </searchData>
      </sch:OrderListRequest>
   </soapenv:Body>
</soapenv:Envelope>`;

    try {
        const res = await axios.post("https://api.n11.com/ws/OrderService", soapEnvelope, {
            headers: {
                "Content-Type": "text/xml;charset=UTF-8",
                "SOAPAction": ""
            },
            timeout: 10000
        });
        console.log("SUCCESS!", res.data);
    } catch (e: any) {
        console.log(`FAIL! Status: ${e.response?.status}`);
        console.log("Error Body:", e.response?.data);
    }
}

testN11SOAPRaw().then(() => process.exit(0));
