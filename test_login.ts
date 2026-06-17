import axios from 'axios';

async function run() {
  const username = "serdar@gapbilisim.net";
  const password = "Yapk@1489@";
  const baseUrl = "https://edocumentapi.mysoft.com.tr/api";

  try {
    console.log("Authenticating...");
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    params.append('grant_type', 'password');

    const authRes = await axios.post(`${baseUrl.replace('/api', '')}/oauth/token`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });

    console.log("Authentication Response Keys:", Object.keys(authRes.data));
    console.log("Authentication Response:", JSON.stringify(authRes.data, null, 2));

  } catch (error: any) {
    console.error("Authentication failed:", error.response?.data || error.message);
  }
}

run();
