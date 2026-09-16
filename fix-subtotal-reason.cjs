const fs = require('fs');
let code = fs.readFileSync('routes/einvoice.ts', 'utf8');

// Replace the hardcoded "İstisna" inside taxSubTotal generation
code = code.replace(
  `                  baseObj.taxExemptionReason = "İstisna";
                  baseObj.TaxExemptionReason = "İstisna";
                  baseObj.exemptionReason = "İstisna";`,
  `                  baseObj.taxExemptionReason = KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna");
                  baseObj.TaxExemptionReason = KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna");
                  baseObj.exemptionReason = KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna");
                  baseObj.taxCategory = {
                     taxExemptionReasonCode: exemptionCode,
                     taxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna")
                  };`
);

fs.writeFileSync('routes/einvoice.ts', code);
console.log("Successfully fixed taxSubTotal exemption reason mapping");
