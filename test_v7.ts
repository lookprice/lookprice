import axios from "axios";

async function testPazarama401() {
    console.log("--- Pazarama 401 Debug ---");
    const settings = {
        apiKey: "16484faf89a3498ebfbc040b97be1d56",
        apiSecret: "42fceb9ed48d4f09bca903867ec9143b",
        merchantId: "b89e7cd8-7c87-43ca-ad42-1e9447ced10e"
    };

    const authHeader = `Basic ${Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64')}`;

    const url = "https://isortagimapi.pazarama.com/order/getOrdersForApi";

    console.log(`\nTesting POST ${url} with Basic Auth`);
    try {
        const res = await axios.post(url, { PageSize: 10, PageIndex: 1 }, {
            headers: { 
                'Authorization': authHeader, 
                'MerchantId': settings.merchantId, 
                'Content-Type': 'application/json' 
            }
        });
        console.log("Success POST:", res.status);
    } catch (e: any) {
        console.log("Fail POST:", e.response?.status, e.response?.data);
    }

    console.log(`\nTesting GET ${url} with query params`);
    try {
        const res = await axios.get(`${url}?PageSize=10&PageIndex=1`, {
            headers: { 
                'Authorization': authHeader, 
                'MerchantId': settings.merchantId
            }
        });
        console.log("Success GET:", res.status);
    } catch (e: any) {
        console.log("Fail GET:", e.response?.status, e.response?.data);
    }
}

testPazarama401().then(() => process.exit(0));
