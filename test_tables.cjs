const http = require('http');
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/store/restaurant-tables?storeId=22',
  method: 'GET',
  headers: {
    // Need a valid auth. I will write a script that bypasses auth to just check DB.
  }
});
