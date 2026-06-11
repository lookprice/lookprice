import axios from "axios";

async function testPazaramaNewEndpoint() {
    console.log("--- Pazarama New Endpoint Test ---");
    const settings = {
        apiKey: "16484faf89a3498ebfbc040b97be1d56",
        apiSecret: "42fceb9ed48d4f09bca903867ec9143b",
        merchantId: "b89e7cd8-7c87-43ca-ad42-1e9447ced10e"
    };

    // Pazarama often uses Token for most endpoints now
    async function getToken() {
        try {
            const res = await axios.post("https://isortagimapi.pazarama.com/api/v1/Token", {
                UserName: settings.apiKey,
                Password: settings.apiSecret
            }, { timeout: 10000 });
            return res.data?.data?.accessToken;
        } catch (e) {
            console.log("Token Fetch Error (expected if not using Oauth):", e.message);
            return null;
        }
    }

    const token = await getToken();
    const authHeader = token ? `Bearer ${token}` : `Basic ${Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64')}`;

    const endpoints = [
        "https://isortagimapi.pazarama.com/order/api/getOrdersForApi",
        "https://isortagimapi.pazarama.com/api/order/getOrdersForApi",
        "https://isortagimapi.pazarama.com/api/v1/Order/GetOrders"
    ];

    for (const url of endpoints) {
        console.log(`\nTesting: ${url}`);
        try {
            const res = await axios.post(url, {
                PageSize: 10, PageIndex: 1,
            }, {
                headers: { 
                    'Authorization': authHeader, 
                    'MerchantId': settings.merchantId, 
                    'Content-Type': 'application/json' 
                },
                timeout: 10000
            });
            console.log(`Success! URL: ${url}`);
            console.log("Data sample:", JSON.stringify(res.data).substring(0, 200));
        } catch (e: any) {
            console.log(`Fail: ${url} -> Status: ${e.response?.status}, Message: ${e.response?.data?.userMessage || e.response?.data?.message || e.message}`);
        }
    }
}

testPazaramaNewEndpoint().then(() => process.exit(0));
