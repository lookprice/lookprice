import axios from "axios";

async function testN11REST() {
    console.log("--- N11 REST Variations ---");
    const settings = {
        appKey: "66f4ae68-98e3-4dbe-890d-271d53346d0a",
        appSecret: "a4968434-6334-4b5b-8f55-668f49633633"
    };

    const auth = Buffer.from(`${settings.appKey}:${settings.appSecret}`).toString('base64');
    const urls = [
        "https://api.n11.com/orders",
        "https://api.n11.com/v1/orders",
        "https://api.n11.com/v2/orders",
        "https://api.n11.com/rest/orders",
        "https://api.n11.com/api/v1/orders"
    ];

    for (const url of urls) {
        console.log(`\nTesting ${url}`);
        try {
            const res = await axios.get(url, {
                headers: { 'Authorization': `Basic ${auth}` },
                timeout: 5000
            });
            console.log(`SUCCESS! Status: ${res.status}`);
        } catch (e: any) {
            console.log(`FAIL! Status: ${e.response?.status}, Message: ${e.message}`);
        }
    }
}

testN11REST().then(() => process.exit(0));
