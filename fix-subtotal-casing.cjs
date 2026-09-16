const fs = require('fs');
let code = fs.readFileSync('routes/einvoice.ts', 'utf8');

// Replace taxSubTotal with both taxSubTotal and taxSubtotal
code = code.replace(
  `         taxSubTotal: (() => {`,
  `         taxSubTotal: (() => {`,
);

// Actually, let's also add taxSubtotal right next to taxSubTotal in the object inside tax: [{ ... }]
code = code.replace(
  `         taxSubTotal: (`,
  `         taxSubtotal: (`,
);

fs.writeFileSync('routes/einvoice.ts', code);
console.log("Updated taxSubtotal casing");
