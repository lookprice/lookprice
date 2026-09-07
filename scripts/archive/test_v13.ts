import axios from "axios";

async function testN11RESTHeaders() {
    console.log("--- N11 REST Header Variations ---");
    const settings = {
        appKey: "66f4ae68-98e3-4dbe-890d-271d53346d0a",
        appSecret: "a4968434-6334-4b5b-8f55-668f49633633"
    };

    const url = "https://api.n11.com/rest/orders";
    
    // Var 1: Basic Auth (Already failed with 403, but let's re-verify)
    const auth = Buffer.from(`${settings.appKey}:${settings.appSecret}`).toString('base64');

    const headersList = [
        { 'Authorization': `Basic ${auth}` },
        { 'appKey': settings.appKey, 'appSecret': settings.appSecret },
        { 'x-n11-app-key': settings.appKey, 'x-n11-app-secret': settings.appSecret },
        { 'apiKey': settings.appKey, 'apiSecret': settings.appSecret }
    ];

    for (const h of headersList) {
        console.log(`\nTesting with headers: ${JSON.stringify(Object.keys(h))}`);
        try {
            const res = await axios.get(url, { headers: h, timeout: 5000 });
            console.log(`SUCCESS! Status: ${res.status}`);
        } catch (e: any) {
            console.log(`FAIL! Status: ${e.response?.status}, Message: ${e.message}`);
        }
    }
}

testN11RESTHeaders().then(() => process.exit(0));
