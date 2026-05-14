import axios from "axios";

async function testPazaramaHeaders() {
    console.log("--- Pazarama Header Variations ---");
    const settings = {
        apiKey: "e2c347b7-575e-49b4-b4a1-8d2647b74962",
        apiSecret: "59f64834-6334-47b2-9a3b-638f49633633"
    };

    const url = "https://isortagimapi.pazarama.com/order/getOrdersForApi";
    
    const headersList = [
        { 'ApiKey': settings.apiKey, 'ApiSecret': settings.apiSecret },
        { 'X-Api-Key': settings.apiKey, 'X-Api-Secret': settings.apiSecret },
        { 'username': settings.apiKey, 'password': settings.apiSecret },
        { 'client_id': settings.apiKey, 'client_secret': settings.apiSecret }
    ];

    for (const h of headersList) {
        console.log(`\nTesting with headers: ${JSON.stringify(Object.keys(h))}`);
        try {
            const res = await axios.post(url, {}, { headers: h, timeout: 5000 });
            console.log(`SUCCESS! Status: ${res.status}`);
        } catch (e: any) {
            console.log(`FAIL! Status: ${e.response?.status}, Message: ${e.message}`);
        }
    }
}

testPazaramaHeaders().then(() => process.exit(0));
