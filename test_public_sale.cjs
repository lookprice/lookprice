const http = require('http');
const data = JSON.stringify({
  storeId: 22,
  items: [{ productId: 1, price: 100, quantity: 1, name: 'Test' }],
  total: 100,
  tableNumber: '1',
  status: 'pending'
});
const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/public/pos/sale',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});
req.on('error', e => console.error(e));
req.write(data);
req.end();
