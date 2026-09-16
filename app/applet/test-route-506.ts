import jwt from 'jsonwebtoken';
import axios from 'axios';

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

async function run() {
  const token = jwt.sign({ id: 1, store_id: 2, email: 'serdar@gapbilisim.net' }, JWT_SECRET);
  try {
    console.log("Testing POST /api/einvoice/send/506 with valid JWT...");
    const res = await axios.post('http://localhost:3000/api/einvoice/send/506', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log("Success result:", res.data);
  } catch (err: any) {
    console.error("Error response:", err.response?.status, err.response?.data || err.message);
  }
}
run();
