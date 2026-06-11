import axios from "axios";

async function testPazaramaHeaders() {
    console.log("--- Pazarama Header Variations ---");
    const settings = {
        apiKey: "16484faf89a3498ebfbc040b97be1d56",
        apiSecret: "42fceb9ed48d4f09bca903867ec9143b",
        merchantId: "b89e7cd8-7c87-43ca-ad42-1e9447ced10e"
    };

    const url = "https://isortagimapi.pazarama.com/order/getOrdersForApi";

    const headerConfigs = [
        { name: "ApiKey/ApiSecret Headers", headers: { 'ApiKey': settings.apiKey, 'ApiSecret': settings.apiSecret, 'MerchantId': settings.merchantId } },
        { name: "x-api-key", headers: { 'x-api-key': settings.apiKey, 'MerchantId': settings.merchantId } },
        { name: "Basic Auth (Already tried)", headers: { 'Authorization': `Basic ${Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64')}`, 'MerchantId': settings.merchantId } },
        { name: "Body Credentials", headers: { 'MerchantId': settings.merchantId }, data: { UserName: settings.apiKey, Password: settings.apiSecret, PageSize: 1, PageIndex: 1 } },
    ];

    for (const config of headerConfigs) {
        console.log(`\nTesting ${config.name}`);
        try {
            const res = await axios.post(url, config.data || { PageSize: 1, PageIndex: 1 }, {
                headers: { ...config.headers, 'Content-Type': 'application/json' },
                timeout: 5000
            });
            console.log(`SUCCESS! Status: ${res.status}`);
            console.log("Data:", JSON.stringify(res.data).substring(0, 100));
        } catch (e: any) {
            console.log(`FAIL! Status: ${e.response?.status}, Message: ${e.message}`);
        }
    }
}

testPazaramaHeaders().then(() => process.exit(0));
