import axios from "axios";

async function testPazaramaGetOrders() {
    console.log("--- Pazarama GET Orders Check ---");
    const settings = {
        apiKey: "e2c347b7-575e-49b4-b4a1-8d2647b74962",
        apiSecret: "59f64834-6334-47b2-9a3b-638f49633633"
    };

    const auth = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
    const url = "https://isortagimapi.pazarama.com/order/getOrdersForApi";
    const url2 = "https://isortagimapi.pazarama.com/order/api/getOrdersForApi";

    for(const u of [url, url2]) {
        console.log(`\nTesting GET ${u}`);
        try {
            const res = await axios.get(u, {
                headers: { 'Authorization': `Basic ${auth}` },
                timeout: 5000
            });
            console.log(`GET SUCCESS! Status: ${res.status}`);
        } catch (e: any) {
            console.log(`GET FAIL! Status: ${e.response?.status}, Message: ${e.message}`);
        }
    }
}

testPazaramaGetOrders().then(() => process.exit(0));
