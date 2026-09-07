import axios from "axios";

async function testPazaramaTokenGetBody() {
    console.log("--- Pazarama Token GET Body Check ---");
    const settings = {
        apiKey: "e2c347b7-575e-49b4-b4a1-8d2647b74962",
        apiSecret: "59f64834-6334-47b2-9a3b-638f49633633"
    };

    const auth = Buffer.from(`${settings.apiKey}:${settings.apiSecret}`).toString('base64');
    const url = "https://isortagim.pazarama.com/auth/integration/token";

    try {
        const res = await axios.get(url, {
            headers: { 'Authorization': `Basic ${auth}` },
            timeout: 5000
        });
        console.log(`GET SUCCESS! Body:`, res.data);
    } catch (e: any) {
        console.log(`GET FAIL! Status: ${e.response?.status}`);
    }
}

testPazaramaTokenGetBody().then(() => process.exit(0));
