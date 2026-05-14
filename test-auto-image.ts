import axios from 'axios';

async function testAutoImage() {
  try {
    const res = await axios.post('http://localhost:3000/api/store/products/auto-image', {
      allMissing: true
    }, {
      headers: {
        'Authorization': 'Bearer ADMIN_TOKEN_OR_MOCK'
      }
    });
    console.log(res.data);
  } catch (err: any) {
    console.error(err.response?.data || err.message);
  }
}
testAutoImage();
