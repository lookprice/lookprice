const fs = require('fs');
let code = fs.readFileSync('routes/einvoice.ts', 'utf8');

code = code.replace(
  `      result = await service.sendInvoice(ublData);`,
  `      console.log("[INVOICE-SEND] Full UBL Payload JSON:", JSON.stringify(ublData, null, 2));
      result = await service.sendInvoice(ublData);`
);

fs.writeFileSync('routes/einvoice.ts', code);
console.log("Added log");
