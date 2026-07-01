const axios = require('axios');
const qs = require('qs');

async function run() {
  const authUrl = "https://edocumentapi.mysoft.com.tr/oauth/token";
  const authRes = await axios.post(authUrl, qs.stringify({
      grant_type: "password",
      username: "serdar@gapbilisim.net",
      password: "Yapk@1489@"
  }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  const token = authRes.data.access_token;
  
  try {
      const res = await axios.post("https://edocumentapi.mysoft.com.tr/api/User/getUserAliases", {
          tenantIdentifierNumber: "50944171540",
          eDocumentType: "IRSALIYE"
      }, { headers: { Authorization: `Bearer ${token}` } });
      console.log(`Aliases:`, res.data);
  } catch (e) { console.log(`Error:`, e.response?.data || e.message); }
}
run();
