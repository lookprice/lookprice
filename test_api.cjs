const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/store/restaurant-tables?storeId=22',
  method: 'GET',
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data));
});
req.on('error', console.error);
req.end();
