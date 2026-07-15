const fs = require('fs');
let content = fs.readFileSync('routes/store.ts', 'utf8');
content = content.replace("const { items, total, paymentMethod, customerName, notes, currency, exchangeRate, status } = req.body;", "const { items, total, paymentMethod, customerName, notes, currency, exchangeRate, status, tableNumber } = req.body;");
fs.writeFileSync('routes/store.ts', content);
