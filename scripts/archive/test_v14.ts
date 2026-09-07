import axios from "axios";

async function testPazaramaV14() {
    console.log("--- Pazarama REST v14 ---");
    const settings = {
        apiKey: "e2c347b7-575e-49b4-b4a1-8d2647b74962",
        apiSecret: "59f64834-6334-47b2-9a3b-638f49633633"
    };

    const auth = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
    
    // Testing the new URL pattern from notification
    const url = "https://isortagimapi.pazarama.com/order/api/getOrdersForApi";

    console.log(`Testing ${url} with Basic Auth`);
    try {
        const res = await axios.post(url, {}, {
            headers: { 'Authorization': `Basic ${auth}` },
            timeout: 5000
        });
        console.log(`SUCCESS! Status: ${res.status}`);
    } catch (e: any) {
        console.log(`FAIL! Status: ${e.response?.status}, Message: ${e.message}`);
    }

    // Try Token retrieval again with different endpoints
    const tokenUrls = [
        "https://isortagim.pazarama.com/auth/integration/token",
        "https://isortagimapi.pazarama.com/api/v1/Token",
        "https://isortagimapi.pazarama.com/auth/api/v1/Token",
        "https://isortagimapi.pazarama.com/Token"
    ];

    for(const tUrl of tokenUrls) {
        console.log(`\nTesting Token URL: ${tUrl}`);
        try {
            const res = await axios.post(tUrl, {}, {
                headers: { 'Authorization': `Basic ${auth}` },
                timeout: 5000
            });
            console.log(`TOKEN SUCCESS! Status: ${res.status}`);
        } catch (e: any) {
            console.log(`TOKEN FAIL! Status: ${e.response?.status}, Message: ${e.message}`);
        }
    }
}

testPazaramaV14().then(() => process.exit(0));
