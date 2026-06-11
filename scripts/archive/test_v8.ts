import axios from "axios";

async function testPazaramaTokens() {
    console.log("--- Pazarama Token Variations ---");
    const settings = {
        apiKey: "16484faf89a3498ebfbc040b97be1d56",
        apiSecret: "42fceb9ed48d4f09bca903867ec9143b"
    };

    const tokenPaths = [
        "https://isortagimapi.pazarama.com/api/v1/Token",
        "https://isortagimapi.pazarama.com/auth/api/v1/Token",
        "https://isortagimapi.pazarama.com/auth/token",
        "https://isortagimapi.pazarama.com/api/token",
        "https://isortagimapi.pazarama.com/api/v1/auth/token"
    ];

    for (const url of tokenPaths) {
        console.log(`\nTesting ${url}`);
        try {
            const res = await axios.post(url, {
                UserName: settings.apiKey,
                Password: settings.apiSecret
            }, { timeout: 5000 });
            console.log(`SUCCESS! Status: ${res.status}`);
            console.log("Data:", JSON.stringify(res.data).substring(0, 100));
        } catch (e: any) {
            console.log(`FAIL! Status: ${e.response?.status}, Message: ${e.message}`);
        }
    }
}

testPazaramaTokens().then(() => process.exit(0));
