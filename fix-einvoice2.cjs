const fs = require('fs');
let code = fs.readFileSync('routes/einvoice.ts', 'utf8');

code = code.replace(
  'taxAmount: Number(totalTax.toFixed(2)),',
  `taxAmount: Number(totalTax.toFixed(2)),
         ...(giInvoiceType === 'ISTISNA' && exemptionCode ? {
            taxExemptionReasonCode: exemptionCode,
            taxExemptionReason: "İstisna",
            TaxExemptionReasonCode: exemptionCode,
            TaxExemptionReason: "İstisna"
         } : {}),`
);

fs.writeFileSync('routes/einvoice.ts', code);
console.log("Updated einvoice.ts tax array");
