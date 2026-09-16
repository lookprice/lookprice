import { Pool } from 'pg';
import axios from 'axios';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    // Let's test calling the local api endpoint via supertest or http request if server is running, or invoke the logic directly.
    // Or let's test sending request to http://localhost:3000/api/einvoice/send/506
    console.log("Testing POST /api/einvoice/send/506...");
    const res = await axios.post('http://localhost:3000/api/einvoice/send/506', {}, {
      headers: {
        'Cookie': 'session=test' // or check auth if any
      }
    });
    console.log("Result:", res.data);
  } catch (err: any) {
    console.error("Error response:", err.response?.status, err.response?.data || err.message);
  }
  process.exit(0);
}
run();
