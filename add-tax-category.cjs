const fs = require('fs');
let code = fs.readFileSync('routes/einvoice.ts', 'utf8');

// Update line items
code = code.replace(
  `          taxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna")`,
  `          taxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna"),
          taxCategory: {
             taxExemptionReasonCode: exemptionCode,
             taxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna")
          }`
);

// Update document level taxSubTotal items
code = code.replace(
  `                  baseObj.taxExemptionReason = KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna");`,
  `                  baseObj.taxExemptionReason = KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna");
                  baseObj.taxCategory = {
                     taxExemptionReasonCode: exemptionCode,
                     taxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna")
                  };`
);

fs.writeFileSync('routes/einvoice.ts', code);
console.log("Added taxCategory object successfully");
