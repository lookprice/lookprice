import axios from 'axios';

async function run() {
  const host = "https://edocumentapi.mysoft.com.tr";
  const paths = [
    "/swagger/v1/swagger.json",
    "/swagger/swagger.json",
    "/api/swagger/v1/swagger.json",
    "/api/swagger.json",
    "/swagger.yaml",
    "/swagger/index.html",
    "/api/help",
    "/help"
  ];

  for (const p of paths) {
    const url = `${host}${p}`;
    console.log(`Checking metadata at: ${url}`);
    try {
      const res = await axios.get(url, { timeout: 3000 });
      console.log(`-> SUCCESS [${p}]: Status ${res.status}. Content length: ${JSON.stringify(res.data).length}`);
      if (res.status === 200) {
        console.log(`First 200 chars: ${JSON.stringify(res.data).substring(0, 500)}`);
      }
    } catch (err: any) {
      console.log(`-> FAILED [${p}]: Status ${err.response?.status}. Msg: ${err.message}`);
    }
  }
}
run();
