import 'dotenv/config';
import jwt from 'jsonwebtoken';
import axios from 'axios';

async function testEndpoint() {
  try {
    const token = jwt.sign(
      { id: 2, role: 'store_admin', store_id: 2, is_partner: false, parent_id: null },
      process.env.JWT_SECRET || 'super-secret-key',
      { expiresIn: '1h' }
    );
    
    console.log("Token:", token);

    const res = await axios.post('http://localhost:3000/api/store/products/auto-image', {
      allMissing: true
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(JSON.stringify(res.data, null, 2));

  } catch (err: any) {
    if (err.response) {
      console.error("HTTP Error:", err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

testEndpoint();
