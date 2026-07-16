const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/store/restaurant-tables?storeId=22',
  method: 'GET',
};

const req = http.request(options, res => {
  console.log('Status:', res.statusCode);
});
req.on('error', console.error);
req.end();
