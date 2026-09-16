const axios = require('axios');
async function run() {
  try {
    const res = await axios.post('http://localhost:3000/api/einvoice/send/506', {}, {
      headers: {
        'Authorization': 'Bearer test' // Wait, I don't have a valid token.
      }
    });
    console.log(res.data);
  } catch (err) {
    console.log(err.response ? err.response.data : err.message);
  }
}
// run();
