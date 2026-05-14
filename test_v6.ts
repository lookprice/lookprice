import axios from "axios";

async function testPazaramaVariations() {
    console.log("--- Pazarama Variations Test ---");
    const settings = {
        apiKey: "16484faf89a3498ebfbc040b97be1d56",
        apiSecret: "42fceb9ed48d4f09bca903867ec9143b",
        merchantId: "b89e7cd8-7c87-43ca-ad42-1e9447ced10e"
    };

    const authHeader = `Basic ${Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64')}`;

    const variations = [
        { url: "https://isortagimapi.pazarama.com/order/getOrdersForApi", method: "post" },
        { url: "https://isortagimapi.pazarama.com/api/order/getOrdersForApi", method: "post" },
        { url: "https://isortagimapi.pazarama.com/order/api/getOrdersForApi", method: "post" },
        { url: "https://isortagimapi.pazarama.com/api/v1/Token", method: "post" },
        { url: "https://api.pazarama.com/order/getOrdersForApi", method: "post" },
        { url: "https://api.pazarama.com/api/order/getOrdersForApi", method: "post" },
    ];

    for (const v of variations) {
        console.log(`\nTesting ${v.method.toUpperCase()} ${v.url}`);
        try {
            const config = {
                headers: { 
                    'Authorization': authHeader, 
                    'MerchantId': settings.merchantId, 
                    'Content-Type': 'application/json' 
                },
                timeout: 5000
            };
            const res = v.method === "post" ? 
                await axios.post(v.url, { PageSize: 1, PageIndex: 1 }, config) : 
                await axios.get(v.url, config);
            
            console.log(`SUCCESS! Status: ${res.status}`);
            console.log("Response:", JSON.stringify(res.data).substring(0, 100));
        } catch (e: any) {
            console.log(`FAIL! Status: ${e.response?.status}, Message: ${e.message}`);
        }
    }
}

testPazaramaVariations().then(() => process.exit(0));
