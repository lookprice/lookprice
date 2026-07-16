require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const jwt = require('jsonwebtoken');
const http = require('http');

async function test() {
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
  const token = jwt.sign({ id: 1, email: 'test@example.com', role: 'superadmin' }, JWT_SECRET, { expiresIn: '1h' });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/store/restaurant-tables?storeId=22',
    method: 'GET',
    headers: {
      'Cookie': `auth_token=${token}`
    }
  };

  const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Status:', res.statusCode, '\nResponse:', data));
  });
  req.on('error', console.error);
  req.end();
}
test().catch(console.error);
