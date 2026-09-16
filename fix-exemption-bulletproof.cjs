const fs = require('fs');
let code = fs.readFileSync('routes/einvoice.ts', 'utf8');

// 1. Force exemptionCode fallback if ISTISNA
code = code.replace(
  `    const exemptionCode = invoice.gi_exemption_reason_code;`,
  `    const exemptionCode = invoice.gi_exemption_reason_code || (giInvoiceType === 'ISTISNA' ? "301" : "");`
);

// 2. Unconditionally add exemption fields for line items when giInvoiceType === 'ISTISNA'
code = code.replace(
  `        ...(Number(taxRate) === 0 && giInvoiceType === 'ISTISNA' && exemptionCode ? {
          taxExemptionReasonCode: exemptionCode,
          taxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna"),
          taxCategory: {
             taxExemptionReasonCode: exemptionCode,
             taxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna")
          }
        } : {})`,
  `        ...(giInvoiceType === 'ISTISNA' ? {
          taxExemptionReasonCode: exemptionCode || "301",
          TaxExemptionReasonCode: exemptionCode || "301",
          taxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode || "301"] || "301-11/1-a Mal İhracatı",
          TaxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode || "301"] || "301-11/1-a Mal İhracatı",
          taxCategory: {
             taxExemptionReasonCode: exemptionCode || "301",
             TaxExemptionReasonCode: exemptionCode || "301",
             taxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode || "301"] || "301-11/1-a Mal İhracatı",
             TaxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode || "301"] || "301-11/1-a Mal İhracatı"
          }
        } : {})`
);

// 3. Unconditionally add exemption fields for taxSubTotal when giInvoiceType === 'ISTISNA'
code = code.replace(
  `               if (Number(rate) === 0 && giInvoiceType === 'ISTISNA' && exemptionCode) {
                  baseObj.taxExemptionReasonCode = exemptionCode;
                  baseObj.TaxExemptionReasonCode = exemptionCode;
                  baseObj.exemptionReasonCode = exemptionCode;
                  baseObj.taxExemptionReason = KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna");
                  baseObj.TaxExemptionReason = KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna");
                  baseObj.exemptionReason = KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna");
                  baseObj.taxCategory = {
                     taxExemptionReasonCode: exemptionCode,
                     taxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode] || (exemptionCode + "-İstisna")
                  };
               }`,
  `               if (giInvoiceType === 'ISTISNA') {
                  baseObj.taxExemptionReasonCode = exemptionCode || "301";
                  baseObj.TaxExemptionReasonCode = exemptionCode || "301";
                  baseObj.exemptionReasonCode = exemptionCode || "301";
                  baseObj.taxExemptionReason = KDV_EXEMPTION_MAP[exemptionCode || "301"] || "301-11/1-a Mal İhracatı";
                  baseObj.TaxExemptionReason = KDV_EXEMPTION_MAP[exemptionCode || "301"] || "301-11/1-a Mal İhracatı";
                  baseObj.exemptionReason = KDV_EXEMPTION_MAP[exemptionCode || "301"] || "301-11/1-a Mal İhracatı";
                  baseObj.taxCategory = {
                     taxExemptionReasonCode: exemptionCode || "301",
                     TaxExemptionReasonCode: exemptionCode || "301",
                     taxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode || "301"] || "301-11/1-a Mal İhracatı",
                     TaxExemptionReason: KDV_EXEMPTION_MAP[exemptionCode || "301"] || "301-11/1-a Mal İhracatı"
                  };
               }`
);

fs.writeFileSync('routes/einvoice.ts', code);
console.log("Bulletproof exemption patch applied successfully");
