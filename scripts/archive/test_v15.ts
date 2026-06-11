import axios from "axios";

async function testPazaramaToken() {
    console.log("--- Pazarama Token Method Check ---");
    const settings = {
        apiKey: "e2c347b7-575e-49b4-b4a1-8d2647b74962",
        apiSecret: "59f64834-6334-47b2-9a3b-638f49633633"
    };

    const auth = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
    const url = "https://isortagim.pazarama.com/auth/integration/token";

    console.log(`Testing GET ${url}`);
    try {
        const res = await axios.get(url, {
            headers: { 'Authorization': `Basic ${auth}` },
            timeout: 5000
        });
        console.log(`GET SUCCESS! Status: ${res.status}`);
    } catch (e: any) {
        console.log(`GET FAIL! Status: ${e.response?.status}, Message: ${e.message}`);
    }

    console.log(`\nTesting POST ${url} with Grant Type`);
    try {
        const res = await axios.post(url, "grant_type=client_credentials", {
            headers: { 
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 5000
        });
        console.log(`POST SUCCESS! Body:`, res.data);
    } catch (e: any) {
        console.log(`POST FAIL! Status: ${e.response?.status}, Message: ${e.message}`);
        if(e.response?.data) console.log("Response data:", e.response.data);
    }
}

testPazaramaToken().then(() => process.exit(0));
