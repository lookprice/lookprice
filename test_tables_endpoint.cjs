const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/store/restaurant-tables?storeId=22',
  method: 'GET',
  headers: {
    'Cookie': 'auth_token=superadmin' // Let's see if this bypasses
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, '\nResponse:', data.substring(0, 500)));
});
req.on('error', console.error);
req.end();
