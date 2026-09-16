const fs = require('fs');
let code = fs.readFileSync('routes/einvoice.ts', 'utf8');

code = code.replace(
  'baseObj.taxExemptionReasonCode = exemptionCode;',
  `baseObj.taxExemptionReasonCode = exemptionCode;
                  baseObj.TaxExemptionReasonCode = exemptionCode;
                  baseObj.exemptionReasonCode = exemptionCode;`
);

code = code.replace(
  'baseObj.taxExemptionReason = "İstisna";',
  `baseObj.taxExemptionReason = "İstisna";
                  baseObj.TaxExemptionReason = "İstisna";
                  baseObj.exemptionReason = "İstisna";`
);

fs.writeFileSync('routes/einvoice.ts', code);
console.log("Updated einvoice.ts");
